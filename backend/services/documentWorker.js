import { assertUuid } from './database.js';
import { appendAuditEvent } from './platformService.js';

const STAGES = new Set(['malware_scan', 'extract', 'classify', 'validate', 'link', 'insights']);
const NEXT_STAGE = {
  malware_scan: 'extract',
  extract: 'classify',
  classify: 'validate',
  validate: 'link',
  link: 'insights',
  insights: null
};
const WORKER_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/;
const ERROR_CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const FIELD_CODE_PATTERN = /^[a-z][a-z0-9_]{0,99}$/;
const DOCUMENT_TYPES = new Set([
  'fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report',
  'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report',
  'sustainability_report', 'governance_document', 'erp_export', 'other'
]);
const ACTIVITY_TYPES = new Set([
  'stationary_combustion', 'mobile_combustion', 'fugitive_emissions', 'purchased_electricity',
  'purchased_heat_steam_cooling', 'business_travel', 'employee_commuting', 'waste',
  'transport_distribution', 'purchased_goods_services', 'capital_goods', 'other'
]);
const GHG_SCOPES = new Set(['scope_1', 'scope_2', 'scope_3', 'undetermined']);
const MAX_EXTRACTED_DATA_BYTES = 2 * 1024 * 1024;
const MAX_EXTRACTED_FIELDS = 1000;

export async function claimDocumentJob(databasePool, input) {
  const workerId = validateWorkerId(input.workerId);
  const stages = validateStages(input.stages);
  const leaseSeconds = integerBetween(input.leaseSeconds ?? 300, 'leaseSeconds', 30, 1800);
  return withWorkerTransaction(databasePool, async (client) => {
    const result = await client.query(
      `WITH candidate AS (
         SELECT id FROM platform.document_processing_jobs
         WHERE stage = ANY($1::text[])
           AND attempt_count < max_attempts
           AND (
             (status IN ('queued','retry') AND available_at <= now())
             OR (status = 'processing' AND locked_at < now() - make_interval(secs => $2))
           )
         ORDER BY available_at, created_at, id
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       ), claimed AS (
         UPDATE platform.document_processing_jobs job
         SET status = 'processing', locked_at = now(), locked_by = $3,
             attempt_count = job.attempt_count + 1
         FROM candidate
         WHERE job.id = candidate.id
         RETURNING job.*
       )
       SELECT claimed.*, version.storage_provider, version.storage_bucket, version.object_key,
              version.media_type, version.byte_size, version.sha256, version.processing_profile,
              version.review_threshold
       FROM claimed
       JOIN platform.evidence_versions version
         ON version.organization_id = claimed.organization_id AND version.id = claimed.evidence_version_id`,
      [stages, leaseSeconds, workerId]
    );
    return result.rows[0] ? jobResource(result.rows[0]) : null;
  });
}

export async function completeDocumentJob(databasePool, input) {
  const workerId = validateWorkerId(input.workerId);
  assertUuid(input.jobId, 'jobId');
  const result = objectValue(input.result, 'result');
  return withWorkerTransaction(databasePool, async (client) => {
    const job = await lockOwnedJob(client, input.jobId, workerId);
    const stageOutcome = await applyStageResult(client, job, result);
    await client.query(
      `UPDATE platform.document_processing_jobs
       SET status = 'complete', result = $1, completed_at = now(), locked_at = NULL, locked_by = NULL
       WHERE id = $2`,
      [result, job.id]
    );
    const nextStage = NEXT_STAGE[job.stage];
    const effectiveNextStage = stageOutcome?.advance === false || (job.stage === 'malware_scan'
      && (result.outcome !== 'clean' || job.processing_profile !== 'document_intelligence')) ? null : nextStage;
    if (job.stage === 'malware_scan' && result.outcome === 'clean' && !effectiveNextStage) {
      await client.query(
        `UPDATE platform.evidence_versions SET extraction_status = 'not_applicable'
         WHERE organization_id = $1 AND id = $2`,
        [job.organization_id, job.evidence_version_id]
      );
    }
    if (effectiveNextStage) {
      await client.query(
        `INSERT INTO platform.document_processing_jobs (organization_id, evidence_version_id, stage, status)
         VALUES ($1,$2,$3,'queued') ON CONFLICT (organization_id, evidence_version_id, stage) DO NOTHING`,
        [job.organization_id, job.evidence_version_id, effectiveNextStage]
      );
    }
    await appendAuditEvent(client, {
      organizationId: job.organization_id,
      action: 'document_processing.completed', entityType: 'evidence_version', entityId: job.evidence_version_id,
      payload: { jobId: job.id, stage: job.stage, nextStage: effectiveNextStage, outcome: result.outcome || null }
    });
    return { jobId: job.id, status: 'complete', stage: job.stage, nextStage: effectiveNextStage };
  });
}

export async function failDocumentJob(databasePool, input) {
  const workerId = validateWorkerId(input.workerId);
  assertUuid(input.jobId, 'jobId');
  const errorCode = String(input.errorCode || '').trim();
  if (!ERROR_CODE_PATTERN.test(errorCode) || errorCode.length > 100) throw validationError('errorCode must be a sanitized machine code.');
  return withWorkerTransaction(databasePool, async (client) => {
    const job = await lockOwnedJob(client, input.jobId, workerId);
    const retryable = input.retryable !== false && job.attempt_count < job.max_attempts;
    if (retryable) {
      const delaySeconds = Math.min(3600, 30 * (2 ** Math.max(0, job.attempt_count - 1)));
      await client.query(
        `UPDATE platform.document_processing_jobs
         SET status = 'retry', error_code = $1, available_at = now() + make_interval(secs => $2),
             locked_at = NULL, locked_by = NULL
         WHERE id = $3`,
        [errorCode, delaySeconds, job.id]
      );
      return { jobId: job.id, status: 'retry', retryInSeconds: delaySeconds, attemptCount: job.attempt_count };
    }
    await client.query(
      `UPDATE platform.document_processing_jobs
       SET status = 'failed', error_code = $1, completed_at = now(), locked_at = NULL, locked_by = NULL
       WHERE id = $2`,
      [errorCode, job.id]
    );
    if (job.stage === 'malware_scan') {
      await client.query("UPDATE platform.evidence_versions SET malware_scan_status = 'failed', extraction_status = 'not_applicable' WHERE organization_id = $1 AND id = $2", [job.organization_id, job.evidence_version_id]);
    } else {
      await client.query("UPDATE platform.evidence_versions SET extraction_status = 'failed' WHERE organization_id = $1 AND id = $2", [job.organization_id, job.evidence_version_id]);
    }
    await appendAuditEvent(client, {
      organizationId: job.organization_id,
      action: 'document_processing.failed', entityType: 'evidence_version', entityId: job.evidence_version_id,
      payload: { jobId: job.id, stage: job.stage, errorCode, attemptCount: job.attempt_count }
    });
    return { jobId: job.id, status: 'failed', attemptCount: job.attempt_count };
  });
}

async function applyStageResult(client, job, result) {
  if (job.stage === 'malware_scan') {
    if (!['clean', 'infected'].includes(result.outcome)) throw validationError('Malware scan outcome must be clean or infected.');
    await client.query(
      `UPDATE platform.evidence_versions
       SET malware_scan_status = $1, extraction_status = CASE WHEN $1 = 'infected' THEN 'not_applicable' ELSE extraction_status END
       WHERE organization_id = $2 AND id = $3`,
      [result.outcome, job.organization_id, job.evidence_version_id]
    );
    return;
  }
  if (job.stage === 'extract') {
    const confidence = result.confidence === null || result.confidence === undefined ? null : Number(result.confidence);
    if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) throw validationError('Extraction confidence must be between 0 and 1.');
    const data = boundedObject(result.data, 'result.data', MAX_EXTRACTED_DATA_BYTES);
    const fields = validateExtractedFields(result.fields, job.review_threshold);
    const provider = requiredText(result.provider, 'result.provider', 100);
    const model = optionalText(result.model, 200);
    const schemaVersion = requiredText(result.schemaVersion, 'result.schemaVersion', 50);
    await client.query(
      `UPDATE platform.evidence_versions
       SET extraction_status = 'processing', extracted_data = $1, extraction_confidence = $2, extraction_model = $3
       WHERE organization_id = $4 AND id = $5`,
      [data, confidence, model, job.organization_id, job.evidence_version_id]
    );
    const runResult = await client.query(
      `INSERT INTO platform.document_extraction_runs (
         organization_id, evidence_version_id, provider, model, schema_version,
         review_threshold, overall_confidence
       ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [job.organization_id, job.evidence_version_id, provider, model, schemaVersion,
        job.review_threshold, confidence]
    );
    for (const field of fields) {
      await client.query(
        `INSERT INTO platform.document_extracted_fields (
           organization_id, extraction_run_id, evidence_version_id, field_code, value,
           unit, confidence, requires_review, source_locator
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [job.organization_id, runResult.rows[0].id, job.evidence_version_id, field.code,
          JSON.stringify(field.value), field.unit, field.confidence, field.requiresReview, field.source]
      );
    }
    return;
  }
  if (job.stage === 'classify') {
    const classification = validateClassification(result, job.review_threshold);
    await client.query(
      `INSERT INTO platform.document_classification_proposals (
         organization_id, evidence_version_id, document_type, activity_type, ghg_scope,
         scope_3_category, confidence, requires_review, provider, model, rationale_code
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [job.organization_id, job.evidence_version_id, classification.documentType,
        classification.activityType, classification.ghgScope, classification.scope3Category,
        classification.confidence, classification.requiresReview, classification.provider,
        classification.model, classification.rationaleCode]
    );
    return;
  }
  if (job.stage === 'validate') {
    const validation = await client.query(
      `SELECT version.evidence_document_id,
              EXISTS (
                SELECT 1 FROM platform.document_extracted_fields field
                WHERE field.organization_id = version.organization_id
                  AND field.evidence_version_id = version.id AND field.requires_review
              ) AS field_review_required,
              classification.requires_review AS classification_review_required
       FROM platform.evidence_versions version
       LEFT JOIN platform.document_classification_proposals classification
         ON classification.organization_id = version.organization_id
        AND classification.evidence_version_id = version.id
       WHERE version.organization_id = $1 AND version.id = $2`,
      [job.organization_id, job.evidence_version_id]
    );
    if (!validation.rows[0] || validation.rows[0].classification_review_required === null) {
      throw validationError('Validation requires completed extraction and classification proposals.');
    }
    const reviewRequired = validation.rows[0].field_review_required === true
      || validation.rows[0].classification_review_required === true;
    await client.query(
      `UPDATE platform.evidence_versions SET extraction_status = $1
       WHERE organization_id = $2 AND id = $3`,
      [reviewRequired ? 'review_required' : 'complete', job.organization_id, job.evidence_version_id]
    );
    await client.query(
      `UPDATE platform.evidence_documents SET classification_status = $1
       WHERE organization_id = $2 AND id = $3`,
      [reviewRequired ? 'review_required' : 'classified', job.organization_id, validation.rows[0].evidence_document_id]
    );
    return { advance: !reviewRequired };
  }
}

function validateExtractedFields(values, reviewThreshold) {
  if (!Array.isArray(values) || values.length > MAX_EXTRACTED_FIELDS) {
    throw validationError(`result.fields must be an array with at most ${MAX_EXTRACTED_FIELDS} fields.`);
  }
  if (Buffer.byteLength(JSON.stringify(values), 'utf8') > MAX_EXTRACTED_DATA_BYTES) {
    throw validationError('result.fields is too large.');
  }
  const seen = new Set();
  return values.map((field, index) => {
    const input = objectValue(field, `result.fields[${index}]`);
    const code = String(input.code || '').trim();
    if (!FIELD_CODE_PATTERN.test(code) || seen.has(code)) throw validationError('Extracted field codes must be unique snake_case identifiers.');
    seen.add(code);
    if (input.value === undefined) throw validationError(`Extracted field ${code} requires a value.`);
    const confidence = confidenceValue(input.confidence, `result.fields[${index}].confidence`);
    return {
      code,
      value: input.value,
      unit: optionalText(input.unit, 50),
      confidence,
      requiresReview: input.requiresReview === true || confidence < reviewThreshold,
      source: validateSourceLocator(input.source, index)
    };
  });
}

function validateSourceLocator(value, index) {
  const source = objectValue(value, `result.fields[${index}].source`);
  const allowed = new Set(['page', 'row', 'sheet', 'cell', 'boundingBox']);
  if (Object.keys(source).some((key) => !allowed.has(key))) throw validationError('Source locator contains unsupported properties.');
  const normalized = {};
  if (source.page !== undefined) normalized.page = integerBetween(source.page, 'source.page', 1, 100000);
  if (source.row !== undefined) normalized.row = integerBetween(source.row, 'source.row', 1, 10000000);
  if (source.sheet !== undefined) normalized.sheet = requiredText(source.sheet, 'source.sheet', 100);
  if (source.cell !== undefined) {
    const cell = String(source.cell).trim().toUpperCase();
    if (!/^[A-Z]{1,3}[1-9][0-9]{0,6}$/.test(cell)) throw validationError('source.cell is invalid.');
    normalized.cell = cell;
  }
  if (source.boundingBox !== undefined && (!Array.isArray(source.boundingBox)
      || source.boundingBox.length !== 4 || source.boundingBox.some((number) => !Number.isFinite(Number(number))))) {
    throw validationError('source.boundingBox must contain four numbers.');
  }
  if (source.boundingBox !== undefined) normalized.boundingBox = source.boundingBox.map(Number);
  if (Object.keys(normalized).length === 0) throw validationError('Each extracted field requires a page, row, or cell source locator.');
  return normalized;
}

function validateClassification(result, reviewThreshold) {
  const documentType = enumValue(result.documentType, 'result.documentType', DOCUMENT_TYPES);
  const activityType = nullableEnum(result.activityType, 'result.activityType', ACTIVITY_TYPES);
  const ghgScope = nullableEnum(result.ghgScope, 'result.ghgScope', GHG_SCOPES);
  const scope3Category = result.scope3Category === null || result.scope3Category === undefined
    ? null : integerBetween(result.scope3Category, 'result.scope3Category', 1, 15);
  if (ghgScope !== 'scope_3' && scope3Category !== null) throw validationError('scope3Category requires ghgScope scope_3.');
  const confidence = confidenceValue(result.confidence, 'result.confidence');
  return {
    documentType, activityType, ghgScope, scope3Category, confidence,
    requiresReview: result.requiresReview === true || confidence < reviewThreshold
      || !activityType || !ghgScope || ghgScope === 'undetermined',
    provider: requiredText(result.provider, 'result.provider', 100),
    model: optionalText(result.model, 200),
    rationaleCode: optionalMachineCode(result.rationaleCode, 'result.rationaleCode')
  };
}

async function lockOwnedJob(client, jobId, workerId) {
  const result = await client.query(
    `SELECT job.*, version.processing_profile, version.review_threshold
     FROM platform.document_processing_jobs job
     JOIN platform.evidence_versions version
       ON version.organization_id = job.organization_id AND version.id = job.evidence_version_id
     WHERE job.id = $1 AND job.status = 'processing' AND job.locked_by = $2
     FOR UPDATE OF job`,
    [jobId, workerId]
  );
  if (!result.rows[0]) {
    const error = new Error('Document job lease is missing or owned by another worker.');
    error.code = 'document_job_lease_conflict';
    error.status = 409;
    throw error;
  }
  return result.rows[0];
}

async function withWorkerTransaction(databasePool, operation) {
  const client = await databasePool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function jobResource(row) {
  return {
    id: row.id, organizationId: row.organization_id, evidenceVersionId: row.evidence_version_id,
    stage: row.stage, attemptCount: row.attempt_count, maxAttempts: row.max_attempts,
    lease: { lockedAt: row.locked_at, lockedBy: row.locked_by },
    object: {
      provider: row.storage_provider, bucket: row.storage_bucket, key: row.object_key,
      mediaType: row.media_type, byteSize: Number(row.byte_size), sha256: row.sha256,
      processingProfile: row.processing_profile, reviewThreshold: row.review_threshold === null ? null : Number(row.review_threshold)
    }
  };
}

function validateStages(values) {
  if (!Array.isArray(values) || values.length < 1 || values.length > STAGES.size) throw validationError('stages must be a non-empty array.');
  const stages = [...new Set(values.map(String))];
  if (stages.some((stage) => !STAGES.has(stage))) throw validationError('stages contains an unsupported processing stage.');
  return stages;
}

function validateWorkerId(value) {
  const workerId = String(value || '').trim();
  if (!WORKER_ID_PATTERN.test(workerId)) throw validationError('workerId is invalid.');
  return workerId;
}

function integerBetween(value, name, minimum, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) throw validationError(`${name} must be between ${minimum} and ${maximum}.`);
  return number;
}

function objectValue(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw validationError(`${name} must be an object.`);
  return value;
}

function optionalText(value, maximum) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (text.length > maximum) throw validationError(`Value must be at most ${maximum} characters.`);
  return text || null;
}

function requiredText(value, name, maximum) {
  const text = String(value || '').trim();
  if (!text || text.length > maximum) throw validationError(`${name} is required and must be at most ${maximum} characters.`);
  return text;
}

function boundedObject(value, name, maximumBytes) {
  const object = objectValue(value, name);
  if (Buffer.byteLength(JSON.stringify(object), 'utf8') > maximumBytes) throw validationError(`${name} is too large.`);
  return object;
}

function confidenceValue(value, name) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw validationError(`${name} must be between 0 and 1.`);
  return confidence;
}

function enumValue(value, name, accepted) {
  const normalized = String(value || '').trim();
  if (!accepted.has(normalized)) throw validationError(`${name} is not supported.`);
  return normalized;
}

function nullableEnum(value, name, accepted) {
  if (value === null || value === undefined || value === '') return null;
  return enumValue(value, name, accepted);
}

function optionalMachineCode(value, name) {
  if (value === null || value === undefined || value === '') return null;
  const code = String(value).trim();
  if (!ERROR_CODE_PATTERN.test(code) || code.length > 100) throw validationError(`${name} must be a sanitized machine code.`);
  return code;
}

function validationError(message) {
  const error = new Error(message);
  error.code = 'validation_error';
  error.status = 400;
  return error;
}
