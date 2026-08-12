import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { appendAuditEvent, requireFeature, requirePermission } from './platformService.js';

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
  const evidenceId = crypto.randomUUID();
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
    const intent = await storage.createUploadIntent({ objectKey, ...normalized });
    const expiresAt = new Date(Date.now() + intent.expiresInSeconds * 1000);
    await client.query(
      `INSERT INTO platform.evidence_upload_sessions (
         id, organization_id, project_id, planned_evidence_document_id, planned_version_id,
         display_name, document_type, original_file_name, media_type, byte_size, sha256,
         storage_provider, storage_bucket, object_key, expires_at, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [uploadId, context.organizationId, normalized.projectId, evidenceId, versionId,
        normalized.displayName, normalized.documentType, normalized.originalFileName,
        normalized.mediaType, normalized.byteSize, normalized.sha256,
        storage.provider, storage.bucket, objectKey, expiresAt, context.userId]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.upload_initiated', entityType: 'evidence_upload', entityId: uploadId,
      payload: { projectId: normalized.projectId, mediaType: normalized.mediaType, byteSize: normalized.byteSize }
    });
    return {
      uploadId, evidenceId, versionId, status: 'initiated', expiresAt,
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
    await client.query(
      `INSERT INTO platform.evidence_documents (
         id, organization_id, project_id, current_version, display_name, document_type,
         classification_status, created_by
       ) VALUES ($1,$2,$3,1,$4,$5,'pending',$6)`,
      [current.planned_evidence_document_id, context.organizationId, current.project_id,
        current.display_name, current.document_type, context.userId]
    );
    await client.query(
      `INSERT INTO platform.evidence_versions (
         id, organization_id, evidence_document_id, version_number, original_file_name,
         media_type, byte_size, sha256, storage_provider, storage_bucket, object_key, uploaded_by
       ) VALUES ($1,$2,$3,1,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [current.planned_version_id, context.organizationId, current.planned_evidence_document_id,
        current.original_file_name, current.media_type, current.byte_size, current.sha256,
        current.storage_provider, current.storage_bucket, current.object_key, context.userId]
    );
    await client.query(
      `INSERT INTO platform.document_processing_jobs (
         organization_id, evidence_version_id, stage, status
       ) VALUES ($1,$2,'malware_scan','queued')`,
      [context.organizationId, current.planned_version_id]
    );
    const finalizedAt = new Date();
    await client.query(
      `UPDATE platform.evidence_upload_sessions
       SET status = 'finalized', verified_at = $1, finalized_at = $1 WHERE id = $2`,
      [finalizedAt, uploadId]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.upload_finalized', entityType: 'evidence_document',
      entityId: current.planned_evidence_document_id,
      payload: { uploadId, versionId: current.planned_version_id, sha256: current.sha256, nextStage: 'malware_scan' }
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
