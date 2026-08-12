import crypto from 'node:crypto';

import { assertUuid, withPlatformContext } from './database.js';

const ENTITY_TYPES = new Set(['organization', 'project', 'evidence', 'calculation', 'report', 'training', 'regulation', 'recommendation']);

export async function indexSearchDocument(databasePool, context, input) {
  return withPlatformContext(databasePool, context, (client) => upsertSearchDocument(client, context, input));
}

export async function upsertSearchDocument(client, context, input = {}) {
  assertUuid(context.organizationId, 'organizationId');
  assertUuid(input.entityId, 'entityId');
  if (input.projectId) assertUuid(input.projectId, 'projectId');
  const entityType = enumValue(input.entityType, ENTITY_TYPES, 'entityType');
  const title = text(input.title, 'title', 300);
  const body = optionalText(input.body, 100_000) || '';
  const keywords = arrayOfText(input.keywords, 40, 100);
  const sourceVersion = text(input.sourceVersion, 'sourceVersion', 120);
  const actionUrl = actionUrlValue(input.actionUrl);
  const metadata = objectValue(input.metadata);
  const contentSha256 = crypto.createHash('sha256').update(JSON.stringify({ title, body, keywords, metadata })).digest('hex');
  const result = await client.query(
    `INSERT INTO platform.search_documents (
       organization_id, project_id, entity_type, entity_id, source_version, title, body,
       keywords, action_url, content_sha256, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (organization_id, entity_type, entity_id) DO UPDATE SET
       project_id = EXCLUDED.project_id, source_version = EXCLUDED.source_version,
       title = EXCLUDED.title, body = EXCLUDED.body, keywords = EXCLUDED.keywords,
       action_url = EXCLUDED.action_url, content_sha256 = EXCLUDED.content_sha256,
       metadata = EXCLUDED.metadata, indexed_at = now(), stale_at = NULL, deleted_at = NULL
     WHERE platform.search_documents.source_version IS DISTINCT FROM EXCLUDED.source_version
        OR platform.search_documents.content_sha256 IS DISTINCT FROM EXCLUDED.content_sha256
     RETURNING id, indexed_at`,
    [context.organizationId, input.projectId || null, entityType, input.entityId, sourceVersion,
      title, body, keywords, actionUrl, contentSha256, metadata]
  );
  return { entityType, entityId: input.entityId, contentSha256,
    changed: Boolean(result.rows[0]), indexedAt: result.rows[0]?.indexed_at || null };
}

export async function searchPlatform(databasePool, context, options = {}) {
  const query = text(options.query, 'query', 300);
  if (query.length < 2) throw validationError('query must contain at least two characters.');
  const types = normalizeTypes(options.types);
  if (options.projectId) assertUuid(options.projectId, 'projectId');
  const page = integer(options.page ?? 1, 1, 10_000, 'page');
  const pageSize = integer(options.pageSize ?? 20, 1, 50, 'pageSize');
  return withPlatformContext(databasePool, context, async (client) => {
    const permission = await client.query("SELECT platform.has_permission('search.read') AS allowed");
    if (permission.rows[0]?.allowed !== true) throw forbiddenError();
    const parameters = [context.organizationId, query];
    const predicates = [
      'document.organization_id = $1', 'document.deleted_at IS NULL',
      '(document.stale_at IS NULL OR document.stale_at > now())',
      `(document.search_vector @@ websearch_to_tsquery('simple', $2)
        OR document.title ILIKE '%' || $2 || '%'
        OR EXISTS (SELECT 1 FROM unnest(document.keywords) keyword WHERE keyword ILIKE '%' || $2 || '%'))`
    ];
    if (types.length) { parameters.push(types); predicates.push(`document.entity_type = ANY($${parameters.length}::text[])`); }
    if (options.projectId) { parameters.push(options.projectId); predicates.push(`document.project_id = $${parameters.length}`); }
    const where = predicates.join(' AND ');
    const count = await client.query(`SELECT count(*)::integer AS total FROM platform.search_documents document WHERE ${where}`, parameters);
    const facets = await client.query(`SELECT entity_type, count(*)::integer AS total FROM platform.search_documents document
      WHERE ${where} GROUP BY entity_type ORDER BY entity_type`, parameters);
    parameters.push(pageSize, (page - 1) * pageSize);
    const result = await client.query(
      `SELECT document.id, document.entity_type, document.entity_id, document.project_id,
              document.title, document.body, document.keywords, document.action_url,
              document.metadata, document.source_version, document.indexed_at,
              ts_rank_cd(document.search_vector, websearch_to_tsquery('simple', $2)) AS rank
       FROM platform.search_documents document WHERE ${where}
       ORDER BY rank DESC, document.indexed_at DESC, document.id
       LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`, parameters
    );
    return { query, items: result.rows.map((row) => ({ id: row.id, entityType: row.entity_type,
      entityId: row.entity_id, projectId: row.project_id, title: row.title,
      excerpt: excerpt(row.body, query), keywords: row.keywords, actionUrl: row.action_url,
      metadata: row.metadata, sourceVersion: row.source_version, rank: Number(row.rank), indexedAt: row.indexed_at })),
      facets: Object.fromEntries(facets.rows.map((row) => [row.entity_type, row.total])),
      pagination: { page, pageSize, total: count.rows[0].total, totalPages: Math.ceil(count.rows[0].total / pageSize) } };
  });
}

export async function removeSearchDocument(client, context, entityTypeInput, entityId) {
  assertUuid(entityId, 'entityId');
  const entityType = enumValue(entityTypeInput, ENTITY_TYPES, 'entityType');
  const result = await client.query(
    `UPDATE platform.search_documents SET deleted_at = now()
     WHERE organization_id = $1 AND entity_type = $2 AND entity_id = $3 AND deleted_at IS NULL RETURNING id`,
    [context.organizationId, entityType, entityId]
  );
  return { removed: Boolean(result.rows[0]) };
}

function normalizeTypes(value) { if (value === undefined || value === null || value === '') return [];
  const values = Array.isArray(value) ? value : String(value).split(','); return [...new Set(values.map((item) => enumValue(item.trim(), ENTITY_TYPES, 'types')))]; }
function excerpt(body, query) { if (!body) return ''; const lower = body.toLowerCase(); const at = lower.indexOf(query.toLowerCase());
  const start = Math.max(0, at < 0 ? 0 : at - 80); const textValue = body.slice(start, start + 240).trim(); return `${start > 0 ? '…' : ''}${textValue}${start + 240 < body.length ? '…' : ''}`; }
function enumValue(value, accepted, field) { if (!accepted.has(value)) throw validationError(`${field} is invalid.`); return value; }
function text(value, field, max) { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw validationError(`${field} is invalid.`); return value.trim(); }
function optionalText(value, max) { if (value === undefined || value === null || value === '') return null; const result = String(value).trim(); if (result.length > max) throw validationError('Value is too long.'); return result; }
function arrayOfText(value, maxItems, maxLength) { if (value === undefined || value === null) return []; if (!Array.isArray(value) || value.length > maxItems) throw validationError('keywords is invalid.');
  return [...new Set(value.map((item) => text(item, 'keyword', maxLength).toLowerCase()))]; }
function actionUrlValue(value) { const result = optionalText(value, 500); if (result && (!result.startsWith('/') || result.startsWith('//'))) throw validationError('actionUrl must be a local relative path.'); return result; }
function objectValue(value) { if (value === undefined || value === null) return {}; if (typeof value !== 'object' || Array.isArray(value)) throw validationError('metadata must be an object.'); return value; }
function integer(value, min, max, field) { const result = Number(value); if (!Number.isSafeInteger(result) || result < min || result > max) throw validationError(`${field} is invalid.`); return result; }
function validationError(message) { const error = new Error(message); error.code = 'validation_error'; error.status = 400; return error; }
function forbiddenError() { const error = new Error('Search permission is required.'); error.code = 'forbidden'; error.status = 403; return error; }
