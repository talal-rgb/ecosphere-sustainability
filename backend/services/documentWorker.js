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
              version.media_type, version.byte_size, version.sha256
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
    await applyStageResult(client, job, result);
    await client.query(
      `UPDATE platform.document_processing_jobs
       SET status = 'complete', result = $1, completed_at = now(), locked_at = NULL, locked_by = NULL
       WHERE id = $2`,
      [result, job.id]
    );
    const nextStage = NEXT_STAGE[job.stage];
    const effectiveNextStage = job.stage === 'malware_scan' && result.outcome !== 'clean' ? null : nextStage;
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
    await client.query(
      `UPDATE platform.evidence_versions
       SET extraction_status = 'processing', extracted_data = $1, extraction_confidence = $2, extraction_model = $3
       WHERE organization_id = $4 AND id = $5`,
      [objectValue(result.data, 'result.data'), confidence, optionalText(result.model, 200), job.organization_id, job.evidence_version_id]
    );
    return;
  }
  if (job.stage === 'validate') {
    await client.query(
      `UPDATE platform.evidence_versions SET extraction_status = $1
       WHERE organization_id = $2 AND id = $3`,
      [result.reviewRequired === true ? 'review_required' : 'complete', job.organization_id, job.evidence_version_id]
    );
  }
}

async function lockOwnedJob(client, jobId, workerId) {
  const result = await client.query(
    `SELECT * FROM platform.document_processing_jobs
     WHERE id = $1 AND status = 'processing' AND locked_by = $2 FOR UPDATE`,
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
      mediaType: row.media_type, byteSize: Number(row.byte_size), sha256: row.sha256
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

function validationError(message) {
  const error = new Error(message);
  error.code = 'validation_error';
  error.status = 400;
  return error;
}
