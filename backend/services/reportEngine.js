import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';
import { appendAuditEvent, canonicalJson, requireFeature, requirePermission } from './platformService.js';
import { consumeUsage } from './usageMetering.js';
import { upsertSearchDocument } from './searchService.js';

const FORMATS = new Set(['pdf', 'xlsx', 'docx', 'pptx', 'dashboard']);
const STATUSES = new Set(['draft', 'generated', 'in_review', 'approved', 'published', 'archived']);
const PROFESSIONAL_FORMATS = new Set(['docx', 'pptx', 'dashboard']);

export async function listReportTemplates(databasePool, context) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.read');
    const result = await client.query(
      `SELECT code, name, report_type, audience, schema_version, supported_formats, template_spec
       FROM platform.report_template_definitions WHERE is_active = true ORDER BY report_type, code`
    );
    return result.rows.map((row) => ({ code: row.code, name: row.name, reportType: row.report_type,
      audience: row.audience, schemaVersion: row.schema_version, supportedFormats: row.supported_formats,
      templateSpec: row.template_spec }));
  });
}

export async function createReport(databasePool, context, input = {}) {
  assertUuid(input.projectId, 'projectId');
  const reportId = input.id || crypto.randomUUID();
  assertUuid(reportId, 'reportId');
  const title = requiredText(input.title, 'title', 250);
  const templateCode = requiredText(input.templateCode, 'templateCode', 100);
  const content = objectValue(input.content, 'content');
  const contentSha256 = digest(content);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.create');
    const templateResult = await client.query(
      `SELECT code, report_type, audience FROM platform.report_template_definitions
       WHERE code = $1 AND is_active = true`, [templateCode]
    );
    const template = templateResult.rows[0];
    if (!template) throw notFoundError('Report template was not found.');
    await requireReportFeature(client, template.report_type);
    await client.query(
      `INSERT INTO platform.reports (
         id, organization_id, project_id, report_type, template_code, title, audience,
         locale, reporting_standard, parameters, current_content_version, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,$11)`,
      [reportId, context.organizationId, input.projectId, template.report_type, template.code, title,
        optionalText(input.audience, 200) || template.audience, localeValue(input.locale),
        optionalText(input.reportingStandard, 120), objectValue(input.parameters, 'parameters'), context.userId]
    );
    await client.query(
      `INSERT INTO platform.report_content_versions (
         organization_id, report_id, version, content, content_sha256, source_manifest, created_by
       ) VALUES ($1,$2,1,$3,$4,$5,$6)`,
      [context.organizationId, reportId, content, contentSha256,
        objectValue(input.sourceManifest, 'sourceManifest'), context.userId]
    );
    await linkSources(client, context, reportId, input.calculationIds, input.evidenceIds);
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'report.created', entityType: 'report', entityId: reportId,
      payload: { projectId: input.projectId, templateCode, reportType: template.report_type, contentSha256 } });
    await upsertSearchDocument(client, context, {
      entityType: 'report', entityId: reportId, projectId: input.projectId, sourceVersion: contentSha256,
      title, body: [template.report_type, input.reportingStandard].filter(Boolean).join(' '),
      keywords: [template.report_type, templateCode], actionUrl: `/portal/reports/${reportId}`,
      metadata: { reportType: template.report_type, templateCode, status: 'draft' }
    });
    return { id: reportId, projectId: input.projectId, title, reportType: template.report_type,
      templateCode, status: 'draft', currentContentVersion: 1, contentSha256 };
  });
}

export async function addReportContentVersion(databasePool, context, reportId, input = {}) {
  assertUuid(reportId, 'reportId');
  const content = objectValue(input.content, 'content');
  const contentSha256 = digest(content);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.create');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:report:${reportId}`]);
    const reportResult = await client.query(
      `SELECT current_content_version, status, project_id, title, report_type, template_code, reporting_standard FROM platform.reports
       WHERE organization_id = $1 AND id = $2 FOR UPDATE`, [context.organizationId, reportId]
    );
    const report = reportResult.rows[0];
    if (!report) throw notFoundError('Report was not found.');
    if (!['draft', 'generated'].includes(report.status)) throw conflictError('Only draft or generated reports can receive new content.');
    const version = report.current_content_version + 1;
    await client.query(
      `INSERT INTO platform.report_content_versions (
         organization_id, report_id, version, content, content_sha256, source_manifest, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [context.organizationId, reportId, version, content, contentSha256,
        objectValue(input.sourceManifest, 'sourceManifest'), context.userId]
    );
    await client.query(
      `UPDATE platform.reports SET current_content_version = $1, status = 'draft'
       WHERE organization_id = $2 AND id = $3`, [version, context.organizationId, reportId]
    );
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'report.content_version_created', entityType: 'report', entityId: reportId,
      payload: { version, contentSha256 } });
    await upsertSearchDocument(client, context, {
      entityType: 'report', entityId: reportId, projectId: report.project_id, sourceVersion: contentSha256,
      title: report.title, body: [report.report_type, report.reporting_standard].filter(Boolean).join(' '),
      keywords: [report.report_type, report.template_code], actionUrl: `/portal/reports/${reportId}`,
      metadata: { reportType: report.report_type, templateCode: report.template_code, status: 'draft' }
    });
    return { reportId, version, contentSha256, status: 'draft' };
  });
}

export async function queueReportGeneration(databasePool, context, reportId, input = {}) {
  assertUuid(reportId, 'reportId');
  const outputFormat = requiredEnum(input.outputFormat, FORMATS, 'outputFormat');
  const rendererVersion = requiredText(input.rendererVersion || 'terrnix-report-v1', 'rendererVersion', 100);
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey', 200);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.create');
    const reportResult = await client.query(
      `SELECT report.id, report.report_type, report.current_content_version, template.supported_formats
       FROM platform.reports report
       JOIN platform.report_template_definitions template ON template.code = report.template_code
       WHERE report.organization_id = $1 AND report.id = $2`, [context.organizationId, reportId]
    );
    const report = reportResult.rows[0];
    if (!report) throw notFoundError('Report was not found.');
    if (!report.supported_formats.includes(outputFormat)) throw validationError('The selected template does not support this output format.');
    const featureCode = await requireReportFeature(client, report.report_type, outputFormat);
    const existing = await client.query(
      `SELECT id, status, content_version, output_format FROM platform.report_generation_jobs
       WHERE organization_id = $1 AND idempotency_key = $2`, [context.organizationId, idempotencyKey]
    );
    if (existing.rows[0]) return { ...jobResource(existing.rows[0]), duplicate: true };
    if (featureCode === 'reports.basic') await consumeUsage(client, context, { featureCode, quantity: 1,
      idempotencyKey: `report-generation:${idempotencyKey}`, sourceType: 'report', sourceRef: reportId,
      metadata: { outputFormat, reportType: report.report_type } });
    const jobId = crypto.randomUUID();
    const result = await client.query(
      `INSERT INTO platform.report_generation_jobs (
         id, organization_id, report_id, content_version, output_format, renderer_version,
         idempotency_key, priority, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, status, content_version, output_format, renderer_version, queued_at`,
      [jobId, context.organizationId, reportId, report.current_content_version, outputFormat,
        rendererVersion, idempotencyKey, integerBetween(input.priority ?? 100, 1, 1000), context.userId]
    );
    await appendAuditEvent(client, { organizationId: context.organizationId, actorUserId: context.userId,
      action: 'report.generation_queued', entityType: 'report', entityId: reportId,
      payload: { jobId, contentVersion: report.current_content_version, outputFormat, rendererVersion } });
    return { ...jobResource(result.rows[0]), duplicate: false };
  });
}

export async function listReports(databasePool, context, options = {}) {
  const { page, pageSize, offset } = pagination(options);
  const status = options.status ? requiredEnum(options.status, STATUSES, 'status') : null;
  if (options.projectId) assertUuid(options.projectId, 'projectId');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.read');
    const parameters = [context.organizationId];
    const predicates = ['organization_id = $1'];
    if (options.projectId) { parameters.push(options.projectId); predicates.push(`project_id = $${parameters.length}`); }
    if (status) { parameters.push(status); predicates.push(`status = $${parameters.length}`); }
    const where = predicates.join(' AND ');
    const count = await client.query(`SELECT count(*)::integer AS total FROM platform.reports WHERE ${where}`, parameters);
    parameters.push(pageSize, offset);
    const result = await client.query(
      `SELECT id, project_id, template_code, report_type, title, audience, locale, reporting_standard,
              status, current_content_version, approved_by, approved_at, published_at, created_at, updated_at
       FROM platform.reports WHERE ${where} ORDER BY updated_at DESC, id
       LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`, parameters
    );
    return { items: result.rows.map(reportResource), pagination: { page, pageSize, total: count.rows[0].total,
      totalPages: Math.ceil(count.rows[0].total / pageSize) } };
  });
}

export async function getReport(databasePool, context, reportId) {
  assertUuid(reportId, 'reportId');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'report.read');
    const report = await client.query('SELECT * FROM platform.reports WHERE organization_id = $1 AND id = $2', [context.organizationId, reportId]);
    if (!report.rows[0]) throw notFoundError('Report was not found.');
    const versions = await client.query(`SELECT version, content_sha256, source_manifest, created_by, created_at
      FROM platform.report_content_versions WHERE organization_id = $1 AND report_id = $2 ORDER BY version DESC`, [context.organizationId, reportId]);
    const jobs = await client.query(`SELECT id, content_version, output_format, renderer_version, status, attempts, queued_at, completed_at, last_error_code
      FROM platform.report_generation_jobs WHERE organization_id = $1 AND report_id = $2 ORDER BY created_at DESC`, [context.organizationId, reportId]);
    const artifacts = await client.query(`SELECT id, content_version, output_format, media_type, byte_size, sha256, renderer_version, created_at
      FROM platform.report_artifacts WHERE organization_id = $1 AND report_id = $2 ORDER BY created_at DESC`, [context.organizationId, reportId]);
    return { ...reportResource(report.rows[0]), contentVersions: versions.rows.map((row) => ({ version: row.version,
      contentSha256: row.content_sha256, sourceManifest: row.source_manifest, createdBy: row.created_by, createdAt: row.created_at })),
      generationJobs: jobs.rows.map(jobResource), artifacts: artifacts.rows.map((row) => ({ id: row.id,
        contentVersion: row.content_version, outputFormat: row.output_format, mediaType: row.media_type,
        byteSize: Number(row.byte_size), sha256: row.sha256, rendererVersion: row.renderer_version, createdAt: row.created_at })) };
  });
}

async function linkSources(client, context, reportId, calculationIds = [], evidenceIds = []) {
  for (const calculationId of [...new Set(calculationIds || [])]) {
    assertUuid(calculationId, 'calculationId');
    await client.query(`INSERT INTO platform.report_calculations (organization_id, report_id, calculation_id)
      VALUES ($1,$2,$3)`, [context.organizationId, reportId, calculationId]);
  }
  for (const evidenceId of [...new Set(evidenceIds || [])]) {
    assertUuid(evidenceId, 'evidenceId');
    await client.query(`INSERT INTO platform.report_evidence (organization_id, report_id, evidence_document_id, linked_by)
      VALUES ($1,$2,$3,$4)`, [context.organizationId, reportId, evidenceId, context.userId]);
  }
}

async function requireReportFeature(client, reportType, outputFormat = null) {
  const requiresProfessional = reportType !== 'executive' || PROFESSIONAL_FORMATS.has(outputFormat);
  if (requiresProfessional) { await requireFeature(client, 'reports.professional'); return 'reports.professional'; }
  const result = await client.query(
    `SELECT feature.feature_code FROM platform.subscriptions subscription
     JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
     WHERE subscription.organization_id = platform.current_organization_id()
       AND feature.enabled = true AND feature.feature_code IN ('reports.professional','reports.basic')
     ORDER BY CASE feature.feature_code WHEN 'reports.professional' THEN 1 ELSE 2 END LIMIT 1`
  );
  if (!result.rows[0]) { const error = new Error('Report generation is not enabled for the current plan.');
    error.code = 'plan_upgrade_required'; error.status = 402; throw error; }
  return result.rows[0].feature_code;
}

function reportResource(row) { return { id: row.id, projectId: row.project_id, templateCode: row.template_code,
  reportType: row.report_type, title: row.title, audience: row.audience, locale: row.locale,
  reportingStandard: row.reporting_standard, status: row.status, currentContentVersion: row.current_content_version,
  approvedBy: row.approved_by, approvedAt: row.approved_at, publishedAt: row.published_at,
  createdAt: row.created_at, updatedAt: row.updated_at }; }
function jobResource(row) { return { id: row.id, status: row.status, contentVersion: row.content_version,
  outputFormat: row.output_format, rendererVersion: row.renderer_version, attempts: row.attempts,
  queuedAt: row.queued_at, completedAt: row.completed_at, lastErrorCode: row.last_error_code }; }
function digest(value) { return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex'); }
function localeValue(value) { const locale = value || 'en'; if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale)) throw validationError('locale is invalid.'); return locale; }
function requiredText(value, field, max) { const text = String(value || '').trim(); if (!text || text.length > max) throw validationError(`${field} is invalid.`); return text; }
function optionalText(value, max) { if (value === undefined || value === null || value === '') return null; const text = String(value).trim(); if (text.length > max) throw validationError('Value is too long.'); return text || null; }
function objectValue(value, field) { if (value === undefined || value === null) return {}; if (typeof value !== 'object' || Array.isArray(value)) throw validationError(`${field} must be an object.`); return value; }
function requiredEnum(value, values, field) { if (!values.has(value)) throw validationError(`${field} is invalid.`); return value; }
function integerBetween(value, min, max) { const number = Number(value); if (!Number.isSafeInteger(number) || number < min || number > max) throw validationError('Integer value is out of range.'); return number; }
function pagination(options) { const page = integerBetween(options.page ?? 1, 1, 10_000); const pageSize = integerBetween(options.pageSize ?? 25, 1, 100); return { page, pageSize, offset: (page - 1) * pageSize }; }
function validationError(message) { return domainError('validation_error', 400, message); }
function notFoundError(message) { return domainError('report_not_found', 404, message); }
function conflictError(message) { return domainError('report_state_conflict', 409, message); }
function domainError(code, status, message) { const error = new Error(message); error.code = code; error.status = status; return error; }
