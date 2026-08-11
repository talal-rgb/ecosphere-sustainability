import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { appendAuditEvent, requireFeature, requirePermission } from './platformService.js';

const DECISIONS = new Set(['accepted', 'corrected', 'rejected']);
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
const MACHINE_CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const MAX_REVIEW_ITEMS = 100;
const MAX_CORRECTED_VALUE_BYTES = 64 * 1024;

export async function getEvidenceReview(databasePool, context, evidenceId) {
  assertUuid(evidenceId, 'evidenceId');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.read');
    await requireFeature(client, 'document_intelligence.review');
    return loadReviewResource(client, context.organizationId, evidenceId);
  });
}

export async function submitEvidenceReview(databasePool, context, evidenceId, input = {}) {
  assertUuid(evidenceId, 'evidenceId');
  assertUuid(input.versionId, 'versionId');
  const fieldReviews = validateFieldReviews(input.fields);
  const classificationReview = input.classification === undefined || input.classification === null
    ? null : validateClassificationReview(input.classification);
  if (fieldReviews.length === 0 && !classificationReview) throw validationError('At least one field or classification review is required.');

  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.update');
    await requireFeature(client, 'document_intelligence.review');
    const documentResult = await client.query(
      `SELECT document.id, document.current_version, version.id AS version_id
       FROM platform.evidence_documents document
       JOIN platform.evidence_versions version
         ON version.organization_id = document.organization_id
        AND version.evidence_document_id = document.id
        AND version.version_number = document.current_version
       WHERE document.organization_id = $1 AND document.id = $2
       FOR UPDATE OF document`,
      [context.organizationId, evidenceId]
    );
    const document = documentResult.rows[0];
    if (!document) throw notFoundError('Evidence document was not found.');
    if (document.version_id !== input.versionId) throw conflictError('The evidence version changed; reload the review before saving.');

    const reviewEvents = [];
    for (const review of fieldReviews) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`document-field-review:${context.organizationId}:${review.fieldId}`]);
      const fieldResult = await client.query(
        `SELECT id FROM platform.document_extracted_fields
         WHERE organization_id = $1 AND evidence_version_id = $2 AND id = $3`,
        [context.organizationId, input.versionId, review.fieldId]
      );
      if (!fieldResult.rows[0]) throw notFoundError('An extracted field was not found in this evidence version.');
      const revision = await nextRevision(client, 'document_field_reviews', 'extracted_field_id', review.fieldId, review.expectedRevision);
      const reviewId = crypto.randomUUID();
      await client.query(
        `INSERT INTO platform.document_field_reviews (
           id, organization_id, extracted_field_id, revision, decision, corrected_value,
           corrected_unit, reason_code, comment, reviewed_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [reviewId, context.organizationId, review.fieldId, revision, review.decision,
          review.correctedValue === null ? null : JSON.stringify(review.correctedValue), review.correctedUnit,
          review.reasonCode, review.comment, context.userId]
      );
      reviewEvents.push({ type: 'field', targetId: review.fieldId, reviewId, revision, decision: review.decision });
    }

    if (classificationReview) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`document-classification-review:${context.organizationId}:${classificationReview.proposalId}`]);
      const proposalResult = await client.query(
        `SELECT id FROM platform.document_classification_proposals
         WHERE organization_id = $1 AND evidence_version_id = $2 AND id = $3`,
        [context.organizationId, input.versionId, classificationReview.proposalId]
      );
      if (!proposalResult.rows[0]) throw notFoundError('The classification proposal was not found in this evidence version.');
      const revision = await nextRevision(
        client, 'document_classification_reviews', 'classification_proposal_id',
        classificationReview.proposalId, classificationReview.expectedRevision
      );
      const reviewId = crypto.randomUUID();
      await client.query(
        `INSERT INTO platform.document_classification_reviews (
           id, organization_id, classification_proposal_id, revision, decision,
           corrected_document_type, corrected_activity_type, corrected_ghg_scope,
           corrected_scope_3_category, reason_code, comment, reviewed_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [reviewId, context.organizationId, classificationReview.proposalId, revision,
          classificationReview.decision, classificationReview.documentType,
          classificationReview.activityType, classificationReview.ghgScope,
          classificationReview.scope3Category, classificationReview.reasonCode,
          classificationReview.comment, context.userId]
      );
      reviewEvents.push({ type: 'classification', targetId: classificationReview.proposalId, reviewId, revision, decision: classificationReview.decision });
    }

    const state = await calculateReviewState(client, context.organizationId, input.versionId);
    await client.query(
      `UPDATE platform.evidence_versions SET extraction_status = $1
       WHERE organization_id = $2 AND id = $3`,
      [state.resolved ? 'complete' : 'review_required', context.organizationId, input.versionId]
    );
    await client.query(
      `UPDATE platform.evidence_documents SET classification_status = $1
       WHERE organization_id = $2 AND id = $3`,
      [state.classificationRejected ? 'rejected' : state.resolved ? 'approved' : 'review_required', context.organizationId, evidenceId]
    );
    if (state.resolved && !state.classificationRejected) {
      await client.query(
        `INSERT INTO platform.document_processing_jobs (organization_id, evidence_version_id, stage, status)
         VALUES ($1,$2,'link','queued') ON CONFLICT (organization_id, evidence_version_id, stage) DO NOTHING`,
        [context.organizationId, input.versionId]
      );
    }
    await appendAuditEvent(client, {
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: 'document_intelligence.reviewed',
      entityType: 'evidence_document',
      entityId: evidenceId,
      payload: { versionId: input.versionId, reviews: reviewEvents, resolved: state.resolved }
    });
    return loadReviewResource(client, context.organizationId, evidenceId);
  });
}

async function loadReviewResource(client, organizationId, evidenceId) {
  const documentResult = await client.query(
    `SELECT document.id, document.project_id, document.display_name, document.document_type,
            document.classification_status, document.current_version, version.id AS version_id,
            version.extraction_status, version.extraction_confidence, version.extraction_model,
            run.id AS extraction_run_id, run.provider AS extraction_provider, run.schema_version,
            classification.id AS proposal_id, classification.document_type AS proposed_document_type,
            classification.activity_type, classification.ghg_scope, classification.scope_3_category,
            classification.confidence AS classification_confidence,
            classification.requires_review AS classification_requires_review,
            classification_review.revision AS classification_review_revision,
            classification_review.decision AS classification_review_decision,
            classification_review.corrected_document_type,
            classification_review.corrected_activity_type,
            classification_review.corrected_ghg_scope,
            classification_review.corrected_scope_3_category,
            classification_review.reviewed_by AS classification_reviewed_by,
            classification_review.reviewed_at AS classification_reviewed_at
     FROM platform.evidence_documents document
     JOIN platform.evidence_versions version
       ON version.organization_id = document.organization_id
      AND version.evidence_document_id = document.id
      AND version.version_number = document.current_version
     LEFT JOIN platform.document_extraction_runs run
       ON run.organization_id = version.organization_id AND run.evidence_version_id = version.id
     LEFT JOIN platform.document_classification_proposals classification
       ON classification.organization_id = version.organization_id AND classification.evidence_version_id = version.id
     LEFT JOIN LATERAL (
       SELECT review.* FROM platform.document_classification_reviews review
       WHERE review.organization_id = classification.organization_id
         AND review.classification_proposal_id = classification.id
       ORDER BY review.revision DESC LIMIT 1
     ) classification_review ON true
     WHERE document.organization_id = $1 AND document.id = $2`,
    [organizationId, evidenceId]
  );
  const document = documentResult.rows[0];
  if (!document) throw notFoundError('Evidence document was not found.');
  const fieldsResult = await client.query(
    `SELECT field.id, field.field_code, field.value, field.unit, field.confidence,
            field.requires_review, field.source_locator,
            review.revision, review.decision, review.corrected_value, review.corrected_unit,
            review.reason_code, review.comment, review.reviewed_by, review.reviewed_at
     FROM platform.document_extracted_fields field
     LEFT JOIN LATERAL (
       SELECT item.* FROM platform.document_field_reviews item
       WHERE item.organization_id = field.organization_id AND item.extracted_field_id = field.id
       ORDER BY item.revision DESC LIMIT 1
     ) review ON true
     WHERE field.organization_id = $1 AND field.evidence_version_id = $2
     ORDER BY field.field_code`,
    [organizationId, document.version_id]
  );
  return reviewResource(document, fieldsResult.rows);
}

async function nextRevision(client, table, foreignKey, targetId, expectedRevision) {
  const allowedTables = new Set(['document_field_reviews', 'document_classification_reviews']);
  const allowedKeys = new Set(['extracted_field_id', 'classification_proposal_id']);
  if (!allowedTables.has(table) || !allowedKeys.has(foreignKey)) throw new TypeError('Unsupported review target.');
  const result = await client.query(
    `SELECT COALESCE(max(revision), 0)::integer AS revision FROM platform.${table}
     WHERE organization_id = platform.current_organization_id() AND ${foreignKey} = $1`,
    [targetId]
  );
  const currentRevision = Number(result.rows[0].revision);
  if (currentRevision !== expectedRevision) throw conflictError('The review changed; reload before saving corrections.');
  return currentRevision + 1;
}

async function calculateReviewState(client, organizationId, versionId) {
  const result = await client.query(
    `SELECT
       EXISTS (
         SELECT 1 FROM platform.document_extracted_fields field
         WHERE field.organization_id = $1 AND field.evidence_version_id = $2
           AND field.requires_review
           AND NOT EXISTS (
             SELECT 1 FROM platform.document_field_reviews review
             WHERE review.organization_id = field.organization_id AND review.extracted_field_id = field.id
           )
       ) AS unresolved_field,
       (classification.requires_review AND classification_review.id IS NULL)
         OR (classification_review.decision = 'accepted' AND (
           classification.activity_type IS NULL OR classification.ghg_scope IS NULL
           OR classification.ghg_scope = 'undetermined'
         ))
         OR (classification_review.decision = 'corrected' AND (
           classification_review.corrected_activity_type IS NULL
           OR classification_review.corrected_ghg_scope IS NULL
           OR classification_review.corrected_ghg_scope = 'undetermined'
         )) AS unresolved_classification,
       classification_review.decision = 'rejected' AS classification_rejected
     FROM platform.document_classification_proposals classification
     LEFT JOIN LATERAL (
       SELECT review.id, review.decision, review.corrected_activity_type, review.corrected_ghg_scope
       FROM platform.document_classification_reviews review
       WHERE review.organization_id = classification.organization_id
         AND review.classification_proposal_id = classification.id
       ORDER BY review.revision DESC LIMIT 1
     ) classification_review ON true
     WHERE classification.organization_id = $1 AND classification.evidence_version_id = $2`,
    [organizationId, versionId]
  );
  if (!result.rows[0]) throw conflictError('Document classification is not ready for review.');
  return {
    resolved: result.rows[0].unresolved_field !== true && result.rows[0].unresolved_classification !== true,
    classificationRejected: result.rows[0].classification_rejected === true
  };
}

function validateFieldReviews(values) {
  if (values === undefined || values === null) return [];
  if (!Array.isArray(values) || values.length > MAX_REVIEW_ITEMS) throw validationError(`fields must contain at most ${MAX_REVIEW_ITEMS} reviews.`);
  const ids = new Set();
  return values.map((value) => {
    const input = objectValue(value, 'field review');
    assertUuid(input.fieldId, 'fieldId');
    if (ids.has(input.fieldId)) throw validationError('Each field can be reviewed only once per request.');
    ids.add(input.fieldId);
    const decision = enumValue(input.decision, 'decision', DECISIONS);
    const correctedValue = decision === 'corrected' ? boundedJsonValue(input.correctedValue, 'correctedValue') : null;
    return {
      fieldId: input.fieldId,
      expectedRevision: nonNegativeInteger(input.expectedRevision, 'expectedRevision'),
      decision,
      correctedValue,
      correctedUnit: decision === 'corrected' ? optionalText(input.correctedUnit, 50) : null,
      reasonCode: optionalMachineCode(input.reasonCode),
      comment: optionalText(input.comment, 1000)
    };
  });
}

function validateClassificationReview(value) {
  const input = objectValue(value, 'classification');
  assertUuid(input.proposalId, 'proposalId');
  const decision = enumValue(input.decision, 'classification.decision', DECISIONS);
  const corrected = decision === 'corrected';
  const ghgScope = corrected ? enumValue(input.ghgScope, 'classification.ghgScope', GHG_SCOPES) : null;
  const scope3Category = corrected && input.scope3Category !== null && input.scope3Category !== undefined
    ? integerBetween(input.scope3Category, 'classification.scope3Category', 1, 15) : null;
  if (ghgScope !== 'scope_3' && scope3Category !== null) throw validationError('scope3Category requires scope_3.');
  return {
    proposalId: input.proposalId,
    expectedRevision: nonNegativeInteger(input.expectedRevision, 'classification.expectedRevision'),
    decision,
    documentType: corrected ? enumValue(input.documentType, 'classification.documentType', DOCUMENT_TYPES) : null,
    activityType: corrected ? nullableEnum(input.activityType, 'classification.activityType', ACTIVITY_TYPES) : null,
    ghgScope,
    scope3Category,
    reasonCode: optionalMachineCode(input.reasonCode),
    comment: optionalText(input.comment, 1000)
  };
}

function reviewResource(document, fields) {
  const classificationReview = document.classification_review_revision === null ? null : {
    revision: Number(document.classification_review_revision),
    decision: document.classification_review_decision,
    corrected: document.classification_review_decision === 'corrected' ? {
      documentType: document.corrected_document_type,
      activityType: document.corrected_activity_type,
      ghgScope: document.corrected_ghg_scope,
      scope3Category: document.corrected_scope_3_category
    } : null,
    reviewedBy: document.classification_reviewed_by,
    reviewedAt: document.classification_reviewed_at
  };
  return {
    evidenceId: document.id,
    projectId: document.project_id,
    displayName: document.display_name,
    status: document.classification_status,
    version: {
      id: document.version_id,
      number: document.current_version,
      extractionStatus: document.extraction_status,
      confidence: document.extraction_confidence === null ? null : Number(document.extraction_confidence),
      model: document.extraction_model,
      runId: document.extraction_run_id,
      provider: document.extraction_provider,
      schemaVersion: document.schema_version
    },
    classification: document.proposal_id ? {
      proposalId: document.proposal_id,
      proposed: {
        documentType: document.proposed_document_type,
        activityType: document.activity_type,
        ghgScope: document.ghg_scope,
        scope3Category: document.scope_3_category
      },
      confidence: Number(document.classification_confidence),
      requiresReview: document.classification_requires_review,
      review: classificationReview
    } : null,
    fields: fields.map((field) => ({
      fieldId: field.id,
      code: field.field_code,
      proposedValue: field.value,
      proposedUnit: field.unit,
      confidence: Number(field.confidence),
      requiresReview: field.requires_review,
      source: field.source_locator,
      review: field.revision === null ? null : {
        revision: Number(field.revision), decision: field.decision,
        correctedValue: field.corrected_value, correctedUnit: field.corrected_unit,
        reasonCode: field.reason_code, comment: field.comment,
        reviewedBy: field.reviewed_by, reviewedAt: field.reviewed_at
      }
    }))
  };
}

function objectValue(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw validationError(`${name} must be an object.`);
  return value;
}

function boundedJsonValue(value, name) {
  if (value === undefined) throw validationError(`${name} is required for a correction.`);
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_CORRECTED_VALUE_BYTES) throw validationError(`${name} is too large.`);
  return value;
}

function optionalText(value, maximum) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  if (text.length > maximum) throw validationError(`Value must be at most ${maximum} characters.`);
  return text || null;
}

function enumValue(value, name, accepted) {
  const normalized = String(value || '').trim();
  if (!accepted.has(normalized)) throw validationError(`${name} is not supported.`);
  return normalized;
}

function nullableEnum(value, name, accepted) {
  if (value === undefined || value === null || value === '') return null;
  return enumValue(value, name, accepted);
}

function optionalMachineCode(value) {
  if (value === undefined || value === null || value === '') return null;
  const code = String(value).trim();
  if (!MACHINE_CODE_PATTERN.test(code) || code.length > 100) throw validationError('reasonCode must be a sanitized machine code.');
  return code;
}

function integerBetween(value, name, minimum, maximum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw validationError(`${name} must be between ${minimum} and ${maximum}.`);
  return number;
}

function nonNegativeInteger(value, name) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw validationError(`${name} must be a non-negative integer.`);
  return number;
}

function validationError(message) {
  const error = new Error(message);
  error.code = 'validation_error';
  error.status = 400;
  return error;
}

function notFoundError(message) {
  const error = new Error(message);
  error.code = 'not_found';
  error.status = 404;
  return error;
}

function conflictError(message) {
  const error = new Error(message);
  error.code = 'review_conflict';
  error.status = 409;
  return error;
}
