import { assertUuid, withPlatformContext } from './database.js';
import { appendAuditEvent, requirePermission } from './platformService.js';

const DOCUMENT_TYPES = new Set([
  'fuel_invoice', 'electricity_bill', 'gas_bill', 'travel_invoice', 'waste_report',
  'supplier_declaration', 'meter_reading', 'certificate', 'policy', 'annual_report',
  'sustainability_report', 'governance_document', 'erp_export', 'other'
]);
const CLASSIFICATION_STATUSES = new Set(['pending', 'classified', 'review_required', 'approved', 'rejected']);
const EXTRACTION_STATUSES = new Set(['pending', 'processing', 'review_required', 'complete', 'failed', 'not_applicable']);
const MALWARE_STATUSES = new Set(['pending', 'clean', 'infected', 'failed']);
const TAG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export async function listEvidence(databasePool, context, options = {}) {
  const pagination = normalizePagination(options);
  const filters = normalizeFilters(options);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.read');
    if (filters.includeDeleted) await requirePermission(client, 'evidence.delete');
    const parameters = [context.organizationId];
    const predicates = ['document.organization_id = $1'];
    addFilter(parameters, predicates, filters.projectId, 'document.project_id');
    addFilter(parameters, predicates, filters.documentType, 'document.document_type');
    addFilter(parameters, predicates, filters.classificationStatus, 'document.classification_status');
    addFilter(parameters, predicates, filters.extractionStatus, 'version.extraction_status');
    addFilter(parameters, predicates, filters.malwareScanStatus, 'version.malware_scan_status');
    if (!filters.includeDeleted) predicates.push('document.deleted_at IS NULL');
    if (filters.tag) {
      parameters.push(filters.tag);
      predicates.push(`EXISTS (
        SELECT 1 FROM platform.evidence_tags filter_tag
        WHERE filter_tag.organization_id = document.organization_id
          AND filter_tag.evidence_document_id = document.id AND filter_tag.tag = $${parameters.length}
      )`);
    }
    if (filters.query) {
      parameters.push(filters.query);
      const index = parameters.length;
      predicates.push(`(
        document.search_vector @@ websearch_to_tsquery('simple', $${index})
        OR document.display_name ILIKE '%' || $${index} || '%'
        OR EXISTS (
          SELECT 1 FROM platform.evidence_tags search_tag
          WHERE search_tag.organization_id = document.organization_id
            AND search_tag.evidence_document_id = document.id
            AND search_tag.tag ILIKE '%' || lower($${index}) || '%'
        )
      )`);
    }
    const where = predicates.join(' AND ');
    const countResult = await client.query(
      `SELECT count(*)::integer AS total
       FROM platform.evidence_documents document
       LEFT JOIN platform.evidence_versions version
         ON version.organization_id = document.organization_id
        AND version.evidence_document_id = document.id
        AND version.version_number = document.current_version
       WHERE ${where}`,
      parameters
    );
    parameters.push(pagination.pageSize, pagination.offset);
    const rows = await client.query(
      `SELECT document.id, document.project_id, project.name AS project_name,
              document.display_name, document.document_type, document.classification_status,
              document.current_version, document.retention_policy, document.retention_until,
              document.legal_hold, document.created_at, document.updated_at, document.deleted_at,
              creator.id AS uploader_id, creator.display_name AS uploader_name,
              version.id AS version_id, version.media_type, version.byte_size, version.sha256,
              version.malware_scan_status, version.extraction_status, version.extraction_confidence,
              version.uploaded_at,
              COALESCE((SELECT jsonb_agg(tag.tag ORDER BY tag.tag)
                        FROM platform.evidence_tags tag
                        WHERE tag.organization_id = document.organization_id
                          AND tag.evidence_document_id = document.id), '[]'::jsonb) AS tags
       FROM platform.evidence_documents document
       JOIN platform.projects project ON project.organization_id = document.organization_id AND project.id = document.project_id
       JOIN platform.app_users creator ON creator.id = document.created_by
       LEFT JOIN platform.evidence_versions version
         ON version.organization_id = document.organization_id
        AND version.evidence_document_id = document.id
        AND version.version_number = document.current_version
       WHERE ${where}
       ORDER BY document.updated_at DESC, document.id
       LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`,
      parameters
    );
    return paginated(rows.rows.map(evidenceSummary), countResult.rows[0].total, pagination);
  });
}

export async function getEvidence(databasePool, context, evidenceId) {
  validUuid(evidenceId, 'evidenceId');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.read');
    const documentResult = await client.query(
      `SELECT document.*, project.name AS project_name,
              creator.display_name AS created_by_name,
              deleted_user.display_name AS deleted_by_name,
              restored_user.display_name AS restored_by_name
       FROM platform.evidence_documents document
       JOIN platform.projects project ON project.organization_id = document.organization_id AND project.id = document.project_id
       JOIN platform.app_users creator ON creator.id = document.created_by
       LEFT JOIN platform.app_users deleted_user ON deleted_user.id = document.deleted_by
       LEFT JOIN platform.app_users restored_user ON restored_user.id = document.restored_by
       WHERE document.organization_id = $1 AND document.id = $2`,
      [context.organizationId, evidenceId]
    );
    if (!documentResult.rows[0]) throw domainError('not_found', 404, 'Evidence document was not found.');
    if (documentResult.rows[0].deleted_at) await requirePermission(client, 'evidence.delete');
    const versions = await client.query(
        `SELECT version.id, version.version_number, version.original_file_name, version.media_type,
                version.byte_size, version.sha256, version.malware_scan_status,
                version.extraction_status, version.extraction_confidence, version.extraction_model,
                version.uploaded_at, uploader.id AS uploaded_by, uploader.display_name AS uploaded_by_name
         FROM platform.evidence_versions version
         JOIN platform.app_users uploader ON uploader.id = version.uploaded_by
         WHERE version.organization_id = $1 AND version.evidence_document_id = $2
         ORDER BY version.version_number DESC`,
        [context.organizationId, evidenceId]
      );
    const tags = await client.query('SELECT tag, created_at FROM platform.evidence_tags WHERE organization_id = $1 AND evidence_document_id = $2 ORDER BY tag', [context.organizationId, evidenceId]);
    const calculations = await client.query(
        `SELECT calculation.id, calculation.calculation_type, calculation.status, link.purpose, link.linked_at
         FROM platform.calculation_evidence link
         JOIN platform.calculations calculation ON calculation.organization_id = link.organization_id AND calculation.id = link.calculation_id
         WHERE link.organization_id = $1 AND link.evidence_document_id = $2 ORDER BY link.linked_at DESC`,
        [context.organizationId, evidenceId]
      );
    const reports = await client.query(
        `SELECT DISTINCT report.id, report.title, report.report_type, report.status
         FROM platform.calculation_evidence evidence_link
         JOIN platform.report_calculations report_link
           ON report_link.organization_id = evidence_link.organization_id AND report_link.calculation_id = evidence_link.calculation_id
         JOIN platform.reports report ON report.organization_id = report_link.organization_id AND report.id = report_link.report_id
         WHERE evidence_link.organization_id = $1 AND evidence_link.evidence_document_id = $2
         ORDER BY report.title, report.id`,
        [context.organizationId, evidenceId]
      );
    const row = documentResult.rows[0];
    return {
      id: row.id, project: { id: row.project_id, name: row.project_name },
      displayName: row.display_name, documentType: row.document_type,
      classificationStatus: row.classification_status, currentVersion: row.current_version,
      retention: { policy: row.retention_policy, until: row.retention_until, legalHold: row.legal_hold },
      createdBy: { id: row.created_by, name: row.created_by_name }, createdAt: row.created_at, updatedAt: row.updated_at,
      deletion: row.deleted_at ? { deletedAt: row.deleted_at, deletedBy: { id: row.deleted_by, name: row.deleted_by_name }, reason: row.deletion_reason } : null,
      restoration: row.restored_at ? { restoredAt: row.restored_at, restoredBy: { id: row.restored_by, name: row.restored_by_name } } : null,
      tags: tags.rows.map((tag) => ({ value: tag.tag, createdAt: tag.created_at })),
      versions: versions.rows.map(versionResource),
      linkedCalculations: calculations.rows.map((item) => ({ id: item.id, type: item.calculation_type, status: item.status, purpose: item.purpose, linkedAt: item.linked_at })),
      linkedReports: reports.rows.map((item) => ({ id: item.id, title: item.title, type: item.report_type, status: item.status }))
    };
  });
}

export async function addEvidenceTag(databasePool, context, evidenceId, input) {
  validUuid(evidenceId, 'evidenceId');
  const tag = normalizeTag(input?.tag);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.update');
    const document = await client.query(
      'SELECT id FROM platform.evidence_documents WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL',
      [context.organizationId, evidenceId]
    );
    if (!document.rows[0]) throw domainError('not_found', 404, 'Active evidence document was not found.');
    const result = await client.query(
      `INSERT INTO platform.evidence_tags (organization_id, evidence_document_id, tag, created_by)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING tag, created_at`,
      [context.organizationId, evidenceId, tag, context.userId]
    );
    if (!result.rows[0]) {
      const exists = await client.query('SELECT tag, created_at FROM platform.evidence_tags WHERE organization_id = $1 AND evidence_document_id = $2 AND tag = $3', [context.organizationId, evidenceId, tag]);
      return { value: exists.rows[0].tag, createdAt: exists.rows[0].created_at, created: false };
    }
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.tag_added', entityType: 'evidence_document', entityId: evidenceId, payload: { tag } });
    return { value: result.rows[0].tag, createdAt: result.rows[0].created_at, created: true };
  });
}

export async function removeEvidenceTag(databasePool, context, evidenceId, tagValue) {
  validUuid(evidenceId, 'evidenceId');
  const tag = normalizeTag(tagValue);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.update');
    const result = await client.query(
      'DELETE FROM platform.evidence_tags WHERE organization_id = $1 AND evidence_document_id = $2 AND tag = $3 RETURNING tag',
      [context.organizationId, evidenceId, tag]
    );
    if (!result.rows[0]) throw domainError('not_found', 404, 'Evidence tag was not found.');
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.tag_removed', entityType: 'evidence_document', entityId: evidenceId, payload: { tag } });
    return { removed: true, value: tag };
  });
}

export async function softDeleteEvidence(databasePool, context, evidenceId, input = {}) {
  validUuid(evidenceId, 'evidenceId');
  const reason = requiredText(input.reason, 'reason', 500);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.delete');
    const result = await client.query(
      `SELECT id, legal_hold, retention_until, deleted_at FROM platform.evidence_documents
       WHERE organization_id = $1 AND id = $2 FOR UPDATE`,
      [context.organizationId, evidenceId]
    );
    const document = result.rows[0];
    if (!document) throw domainError('not_found', 404, 'Evidence document was not found.');
    if (document.deleted_at) return { id: evidenceId, deletedAt: document.deleted_at, alreadyDeleted: true };
    if (document.legal_hold) throw domainError('legal_hold_active', 409, 'Evidence under legal hold cannot be deleted.');
    if (document.retention_until && new Date(document.retention_until) > startOfToday()) {
      throw domainError('retention_period_active', 409, 'Evidence cannot be deleted before its retention date.');
    }
    const deletedAt = new Date();
    await client.query(
      `UPDATE platform.evidence_documents
       SET deleted_at = $1, deleted_by = $2, deletion_reason = $3, restored_at = NULL, restored_by = NULL
       WHERE organization_id = $4 AND id = $5`,
      [deletedAt, context.userId, reason, context.organizationId, evidenceId]
    );
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.soft_deleted', entityType: 'evidence_document', entityId: evidenceId, payload: { reason } });
    return { id: evidenceId, deletedAt, alreadyDeleted: false };
  });
}

export async function restoreEvidence(databasePool, context, evidenceId) {
  validUuid(evidenceId, 'evidenceId');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.delete');
    const result = await client.query(
      `UPDATE platform.evidence_documents
       SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL,
           restored_at = now(), restored_by = $1
       WHERE organization_id = $2 AND id = $3 AND deleted_at IS NOT NULL
       RETURNING restored_at`,
      [context.userId, context.organizationId, evidenceId]
    );
    if (!result.rows[0]) throw domainError('not_found', 404, 'Deleted evidence document was not found.');
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'evidence.restored', entityType: 'evidence_document', entityId: evidenceId, payload: {} });
    return { id: evidenceId, restoredAt: result.rows[0].restored_at };
  });
}

function evidenceSummary(row) {
  return {
    id: row.id, project: { id: row.project_id, name: row.project_name }, displayName: row.display_name,
    documentType: row.document_type, classificationStatus: row.classification_status,
    currentVersion: row.current_version, retention: { policy: row.retention_policy, until: row.retention_until, legalHold: row.legal_hold },
    uploader: { id: row.uploader_id, name: row.uploader_name }, tags: row.tags,
    version: row.version_id ? { id: row.version_id, mediaType: row.media_type, byteSize: Number(row.byte_size), sha256: row.sha256,
      malwareScanStatus: row.malware_scan_status, extractionStatus: row.extraction_status,
      extractionConfidence: row.extraction_confidence === null ? null : Number(row.extraction_confidence), uploadedAt: row.uploaded_at } : null,
    createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at
  };
}

function versionResource(row) {
  return {
    id: row.id, number: row.version_number, originalFileName: row.original_file_name,
    mediaType: row.media_type, byteSize: Number(row.byte_size), sha256: row.sha256,
    malwareScanStatus: row.malware_scan_status, extractionStatus: row.extraction_status,
    extractionConfidence: row.extraction_confidence === null ? null : Number(row.extraction_confidence),
    extractionModel: row.extraction_model, uploadedBy: { id: row.uploaded_by, name: row.uploaded_by_name }, uploadedAt: row.uploaded_at
  };
}

function normalizeFilters(options) {
  return {
    projectId: options.projectId ? validUuid(options.projectId, 'projectId') : null,
    documentType: optionalEnum(options.documentType, DOCUMENT_TYPES, 'documentType'),
    classificationStatus: optionalEnum(options.classificationStatus, CLASSIFICATION_STATUSES, 'classificationStatus'),
    extractionStatus: optionalEnum(options.extractionStatus, EXTRACTION_STATUSES, 'extractionStatus'),
    malwareScanStatus: optionalEnum(options.malwareScanStatus, MALWARE_STATUSES, 'malwareScanStatus'),
    tag: options.tag ? normalizeTag(options.tag) : null,
    query: options.query ? requiredText(options.query, 'query', 200) : null,
    includeDeleted: options.includeDeleted === true || options.includeDeleted === 'true'
  };
}

function normalizePagination(options) {
  const page = Number(options.page ?? 1);
  const pageSize = Number(options.pageSize ?? 25);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw domainError('validation_error', 400, 'Invalid pagination.');
  }
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) throw domainError('validation_error', 400, 'page is too large.');
  return { page, pageSize, offset };
}

function paginated(items, total, pagination) {
  return { items, pagination: { page: pagination.page, pageSize: pagination.pageSize, total: Number(total), totalPages: Math.ceil(Number(total) / pagination.pageSize) } };
}

function addFilter(parameters, predicates, value, column) {
  if (!value) return;
  parameters.push(value);
  predicates.push(`${column} = $${parameters.length}`);
}

function normalizeTag(value) {
  const tag = requiredText(value, 'tag', 80).toLowerCase();
  if (!TAG_PATTERN.test(tag)) throw domainError('validation_error', 400, 'tag must contain lowercase words separated by hyphens or underscores.');
  return tag;
}

function optionalEnum(value, accepted, name) {
  if (!value) return null;
  const normalized = String(value);
  if (!accepted.has(normalized)) throw domainError('validation_error', 400, `${name} is not supported.`);
  return normalized;
}

function validUuid(value, name) {
  try { assertUuid(value, name); } catch { throw domainError('validation_error', 400, `${name} must be a valid UUID.`); }
  return value;
}

function requiredText(value, name, maximum) {
  const text = String(value || '').trim();
  if (!text || text.length > maximum) throw domainError('validation_error', 400, `${name} is required and must be at most ${maximum} characters.`);
  return text;
}

function startOfToday() {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

function domainError(code, status, message) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}
