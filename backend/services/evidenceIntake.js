import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { appendAuditEvent, requireFeature, requirePermission } from './platformService.js';
import { consumeUsage } from './usageMetering.js';

const DOCUMENT_TYPES = new Set([
  'fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report',
  'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report',
  'sustainability_report', 'governance_document', 'erp_export', 'other'
]);
const MEDIA_TYPES = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'text/csv',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const MAX_BYTES = 50 * 1024 * 1024;

export async function initiateEvidenceUpload(databasePool, context, storage, input) {
  assertStorage(storage);
  const uploadId = crypto.randomUUID();
  const requestedEvidenceId = input?.evidenceId || null;
  if (requestedEvidenceId) assertUuid(requestedEvidenceId, 'evidenceId');
  const evidenceId = requestedEvidenceId || crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const normalized = validateUploadInput(input);
  const objectKey = `${context.organizationId}/quarantine/${uploadId}`;

  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.upload');
    const entitlement = await requireFeature(client, 'document_uploads.monthly');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:document_uploads.monthly`]);
    if (entitlement.limit !== null) {
      const usage = await client.query(
        `SELECT
           (SELECT count(*) FROM platform.evidence_versions WHERE organization_id = $1 AND uploaded_at >= date_trunc('month', now())) +
           (SELECT count(*) FROM platform.evidence_upload_sessions WHERE organization_id = $1 AND status = 'initiated' AND expires_at > now()) AS total`,
        [context.organizationId]
      );
      if (Number(usage.rows[0].total) >= entitlement.limit) throw domainError('plan_upgrade_required', 402, 'Monthly document upload limit reached.');
    }
    let versionNumber = 1;
    if (requestedEvidenceId) {
      const existing = await client.query(
        `SELECT id, project_id, current_version, deleted_at
         FROM platform.evidence_documents WHERE organization_id = $1 AND id = $2 FOR UPDATE`,
        [context.organizationId, requestedEvidenceId]
      );
      const document = existing.rows[0];
      if (!document || document.deleted_at) throw domainError('not_found', 404, 'Active evidence document was not found.');
      if (document.project_id !== normalized.projectId) throw domainError('validation_error', 400, 'projectId must match the existing evidence document.');
      versionNumber = Number(document.current_version) + 1;
    }
    const intent = await storage.createUploadIntent({ objectKey, ...normalized });
    const expiresAt = new Date(Date.now() + intent.expiresInSeconds * 1000);
    await client.query(
      `INSERT INTO platform.evidence_upload_sessions (
         id, organization_id, project_id, planned_evidence_document_id, planned_version_id,
         version_number, display_name, document_type, original_file_name, media_type, byte_size, sha256,
         storage_provider, storage_bucket, object_key, expires_at, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [uploadId, context.organizationId, normalized.projectId, evidenceId, versionId,
        versionNumber, normalized.displayName, normalized.documentType, normalized.originalFileName,
        normalized.mediaType, normalized.byteSize, normalized.sha256,
        storage.provider, storage.bucket, objectKey, expiresAt, context.userId]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.upload_initiated', entityType: 'evidence_upload', entityId: uploadId,
      payload: { projectId: normalized.projectId, mediaType: normalized.mediaType, byteSize: normalized.byteSize }
    });
    return {
      uploadId, evidenceId, versionId, versionNumber, status: 'initiated', expiresAt,
      upload: { method: intent.method, url: intent.url, requiredHeaders: intent.requiredHeaders }
    };
  });
}

export async function finalizeEvidenceUpload(databasePool, context, storage, uploadId) {
  assertStorage(storage);
  assertUuid(uploadId, 'uploadId');
  const session = await withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.upload');
    const result = await client.query(
      `SELECT * FROM platform.evidence_upload_sessions
       WHERE organization_id = $1 AND id = $2 AND created_by = $3`,
      [context.organizationId, uploadId, context.userId]
    );
    if (!result.rows[0]) throw domainError('not_found', 404, 'Evidence upload session was not found.');
    return result.rows[0];
  });
  if (session.status === 'finalized') return finalizedResource(session);
  if (session.status !== 'initiated') throw domainError('invalid_upload_state', 409, `Upload cannot be finalized from ${session.status}.`);
  if (new Date(session.expires_at) <= new Date()) throw domainError('upload_expired', 410, 'Evidence upload session has expired.');

  await storage.verifyObject({
    objectKey: session.object_key,
    mediaType: session.media_type,
    byteSize: Number(session.byte_size),
    sha256: session.sha256
  });

  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.upload');
    const locked = await client.query(
      `SELECT * FROM platform.evidence_upload_sessions
       WHERE organization_id = $1 AND id = $2 AND created_by = $3 FOR UPDATE`,
      [context.organizationId, uploadId, context.userId]
    );
    const current = locked.rows[0];
    if (!current) throw domainError('not_found', 404, 'Evidence upload session was not found.');
    if (current.status === 'finalized') return finalizedResource(current);
    if (current.status !== 'initiated') throw domainError('invalid_upload_state', 409, 'Upload is no longer available for finalization.');
    if (new Date(current.expires_at) <= new Date()) throw domainError('upload_expired', 410, 'Evidence upload session has expired.');
    const intelligenceFeature = await client.query(
      `SELECT feature.enabled, feature.configuration
       FROM platform.subscriptions subscription
       JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
       WHERE subscription.organization_id = $1 AND feature.feature_code = 'document_intelligence.review'`,
      [context.organizationId]
    );
    const processingProfile = intelligenceFeature.rows[0]?.enabled === true ? 'document_intelligence' : 'storage_only';
    const configuredThreshold = Number(intelligenceFeature.rows[0]?.configuration?.minimum_confidence);
    const reviewThreshold = processingProfile === 'document_intelligence'
      ? (Number.isFinite(configuredThreshold) && configuredThreshold >= 0 && configuredThreshold <= 1 ? configuredThreshold : 0.85)
      : null;
    if (Number(current.version_number) === 1) {
      await client.query(
        `INSERT INTO platform.evidence_documents (
           id, organization_id, project_id, current_version, display_name, document_type,
           classification_status, created_by
         ) VALUES ($1,$2,$3,1,$4,$5,'pending',$6)`,
        [current.planned_evidence_document_id, context.organizationId, current.project_id,
          current.display_name, current.document_type, context.userId]
      );
    } else {
      const existing = await client.query(
        `SELECT current_version, deleted_at FROM platform.evidence_documents
         WHERE organization_id = $1 AND id = $2 FOR UPDATE`,
        [context.organizationId, current.planned_evidence_document_id]
      );
      if (!existing.rows[0] || existing.rows[0].deleted_at) throw domainError('not_found', 404, 'Active evidence document was not found.');
      if (Number(existing.rows[0].current_version) + 1 !== Number(current.version_number)) {
        throw domainError('version_conflict', 409, 'A newer evidence version already exists.');
      }
    }
    await client.query(
      `INSERT INTO platform.evidence_versions (
         id, organization_id, evidence_document_id, version_number, original_file_name,
         media_type, byte_size, sha256, storage_provider, storage_bucket, object_key,
         processing_profile, review_threshold, uploaded_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [current.planned_version_id, context.organizationId, current.planned_evidence_document_id,
        current.version_number, current.original_file_name, current.media_type, current.byte_size, current.sha256,
        current.storage_provider, current.storage_bucket, current.object_key, processingProfile,
        reviewThreshold, context.userId]
    );
    if (Number(current.version_number) > 1) {
      await client.query(
        `UPDATE platform.evidence_documents
         SET current_version = $1, classification_status = 'pending', display_name = $2, document_type = $3
         WHERE organization_id = $4 AND id = $5`,
        [current.version_number, current.display_name, current.document_type, context.organizationId, current.planned_evidence_document_id]
      );
    }
    await client.query(
      `INSERT INTO platform.document_processing_jobs (
         organization_id, evidence_version_id, stage, status
       ) VALUES ($1,$2,'malware_scan','queued')`,
      [context.organizationId, current.planned_version_id]
    );
    const finalizedAt = new Date();
    await consumeUsage(client, context, {
      featureCode: 'document_uploads.monthly', quantity: 1,
      idempotencyKey: `evidence-upload:${uploadId}`, sourceType: 'evidence_version',
      sourceRef: current.planned_version_id, occurredAt: finalizedAt,
      metadata: { documentType: current.document_type }
    });
    await consumeUsage(client, context, {
      featureCode: 'storage.bytes', quantity: Number(current.byte_size),
      idempotencyKey: `evidence-storage:${current.planned_version_id}`, sourceType: 'evidence_version',
      sourceRef: current.planned_version_id, occurredAt: finalizedAt,
      metadata: { mediaType: current.media_type }
    });
    await client.query(
      `UPDATE platform.evidence_upload_sessions
       SET status = 'finalized', verified_at = $1, finalized_at = $1 WHERE id = $2`,
      [finalizedAt, uploadId]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.upload_finalized', entityType: 'evidence_document',
      entityId: current.planned_evidence_document_id,
      payload: {
        uploadId, versionId: current.planned_version_id, versionNumber: Number(current.version_number),
        sha256: current.sha256, processingProfile, reviewThreshold, nextStage: 'malware_scan'
      }
    });
    return { ...finalizedResource(current), finalizedAt };
  });
}

function validateUploadInput(input = {}) {
  assertUuid(input.projectId, 'projectId');
  const documentType = requiredText(input.documentType, 'documentType', 80);
  if (!DOCUMENT_TYPES.has(documentType)) throw domainError('validation_error', 400, 'documentType is not supported.');
  const mediaType = requiredText(input.mediaType, 'mediaType', 150).toLowerCase();
  if (!MEDIA_TYPES.has(mediaType)) throw domainError('unsupported_file_type', 400, 'The file type is not supported for evidence intake.');
  const byteSize = Number(input.byteSize);
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > MAX_BYTES) {
    throw domainError('validation_error', 400, `byteSize must be between 1 and ${MAX_BYTES}.`);
  }
  if (!HASH_PATTERN.test(input.sha256 || '')) throw domainError('validation_error', 400, 'sha256 must be a lowercase hexadecimal digest.');
  return {
    projectId: input.projectId,
    displayName: requiredText(input.displayName, 'displayName', 300),
    documentType,
    originalFileName: requiredText(input.originalFileName, 'originalFileName', 300),
    mediaType,
    byteSize,
    sha256: input.sha256
  };
}

function finalizedResource(session) {
  return {
    uploadId: session.id,
    evidenceId: session.planned_evidence_document_id,
    versionId: session.planned_version_id,
    versionNumber: Number(session.version_number),
    status: 'finalized',
    processingStage: 'malware_scan'
  };
}

function assertStorage(storage) {
  if (!storage || typeof storage.createUploadIntent !== 'function' || typeof storage.verifyObject !== 'function') {
    throw new TypeError('Evidence storage adapter is required.');
  }
}

function requiredText(value, fieldName, maximum) {
  const text = String(value || '').trim();
  if (!text || text.length > maximum) throw domainError('validation_error', 400, `${fieldName} is required and must be at most ${maximum} characters.`);
  return text;
}

function domainError(code, status, message) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}
