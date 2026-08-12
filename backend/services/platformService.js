import crypto from 'node:crypto';
import { assertUuid, withPlatformContext } from './database.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

export async function bootstrapOrganization(databasePool, input) {
  assertUuid(input.userId, 'userId');
  assertUuid(input.organizationId, 'organizationId');
  const email = normalizeEmail(input.email);
  const displayName = requiredText(input.displayName, 'displayName', 200);
  const authSubject = requiredText(input.authSubject, 'authSubject', 255);
  const organizationName = requiredText(input.organizationName, 'organizationName', 200);
  const organizationSlug = requiredText(input.organizationSlug, 'organizationSlug', 80).toLowerCase();
  if (!SLUG_PATTERN.test(organizationSlug)) throw validationError('organizationSlug must be lowercase words separated by hyphens.');

  return withPlatformContext(databasePool, { userId: input.userId, organizationId: input.organizationId }, async (client) => {
    await client.query(
      'SELECT platform.bootstrap_organization($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [
        input.userId, input.organizationId, authSubject, email, displayName,
        organizationSlug, organizationName, optionalText(input.industryCode, 100), normalizeCountryCode(input.countryCode)
      ]
    );
    await appendAuditEvent(client, {
      organizationId: input.organizationId,
      actorUserId: input.userId,
      action: 'organization.created',
      entityType: 'organization',
      entityId: input.organizationId,
      payload: { slug: organizationSlug, planCode: 'free' }
    });
    return { organizationId: input.organizationId, userId: input.userId, role: 'owner', planCode: 'free' };
  });
}

export async function getAccessSnapshot(databasePool, context) {
  return withPlatformContext(databasePool, context, async (client) => {
    const [membershipResult, permissionResult, featureResult] = await Promise.all([
      client.query(
        `SELECT role_code, status FROM platform.organization_memberships
         WHERE organization_id = $1 AND user_id = $2`,
        [context.organizationId, context.userId]
      ),
      client.query(
        `SELECT permission.code
         FROM platform.organization_memberships membership
         JOIN platform.role_permissions grant_row ON grant_row.role_code = membership.role_code
         JOIN platform.permissions permission ON permission.code = grant_row.permission_code
         WHERE membership.organization_id = $1 AND membership.user_id = $2 AND membership.status = 'active'
         ORDER BY permission.code`,
        [context.organizationId, context.userId]
      ),
      client.query(
        `SELECT subscription.plan_code, feature.feature_code, feature.enabled, feature.limit_value, feature.configuration
         FROM platform.subscriptions subscription
         JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
         WHERE subscription.organization_id = $1
         ORDER BY feature.feature_code`,
        [context.organizationId]
      )
    ]);
    const membership = membershipResult.rows[0];
    if (!membership || membership.status !== 'active') throw forbiddenError('Active organization membership is required.');
    return {
      organizationId: context.organizationId,
      userId: context.userId,
      role: membership.role_code,
      permissions: permissionResult.rows.map((row) => row.code),
      planCode: featureResult.rows[0]?.plan_code || null,
      features: Object.fromEntries(featureResult.rows.map((row) => [row.feature_code, {
        enabled: row.enabled,
        limit: row.limit_value === null ? null : Number(row.limit_value),
        configuration: row.configuration
      }]))
    };
  });
}

export async function createProject(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'project.create');
    const projectEntitlement = await requireFeature(client, 'projects.total');
    if (projectEntitlement.limit !== null) {
      const usage = await client.query('SELECT count(*)::integer AS total FROM platform.projects WHERE organization_id = $1', [context.organizationId]);
      if (usage.rows[0].total >= projectEntitlement.limit) throw entitlementError('Project limit reached for the current plan.');
    }
    const projectId = input.id || crypto.randomUUID();
    assertUuid(projectId, 'projectId');
    const result = await client.query(
      `INSERT INTO platform.projects (
         id, organization_id, business_unit_id, site_id, facility_id, owner_user_id,
         code, name, description, product_module, project_type,
         reporting_period_start, reporting_period_end, status, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14)
       RETURNING id, organization_id, code, name, product_module, project_type, status, created_at`,
      [
        projectId,
        context.organizationId,
        nullableUuid(input.businessUnitId, 'businessUnitId'),
        nullableUuid(input.siteId, 'siteId'),
        nullableUuid(input.facilityId, 'facilityId'),
        context.userId,
        optionalText(input.code, 80),
        requiredText(input.name, 'name', 200),
        optionalText(input.description, 2000),
        requiredText(input.productModule, 'productModule', 50),
        requiredText(input.projectType, 'projectType', 100),
        input.reportingPeriodStart || null,
        input.reportingPeriodEnd || null,
        objectValue(input.metadata)
      ]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: 'project.created',
      entityType: 'project',
      entityId: projectId,
      payload: { name: input.name, productModule: input.productModule, projectType: input.projectType }
    });
    return result.rows[0];
  });
}

export async function createEvidenceDocument(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'evidence.upload');
    const uploadEntitlement = await requireFeature(client, 'document_uploads.monthly');
    if (uploadEntitlement.limit !== null) {
      const usage = await client.query(
        `SELECT count(*)::integer AS total FROM platform.evidence_versions
         WHERE organization_id = $1 AND uploaded_at >= date_trunc('month', now())`,
        [context.organizationId]
      );
      if (usage.rows[0].total >= uploadEntitlement.limit) throw entitlementError('Monthly document upload limit reached for the current plan.');
    }
    const evidenceId = input.id || crypto.randomUUID();
    const versionId = input.versionId || crypto.randomUUID();
    assertUuid(evidenceId, 'evidenceId');
    assertUuid(versionId, 'versionId');
    assertUuid(input.projectId, 'projectId');
    if (!HASH_PATTERN.test(input.sha256 || '')) throw validationError('sha256 must be a lowercase 64-character hexadecimal digest.');
    const objectKey = requiredText(input.objectKey, 'objectKey', 1024);
    if (!objectKey.startsWith(`${context.organizationId}/`)) throw validationError('objectKey must be prefixed with the organization UUID.');

    await client.query(
      `INSERT INTO platform.evidence_documents (
         id, organization_id, project_id, current_version, display_name, document_type,
         classification_status, retention_policy, retention_until, created_by
       ) VALUES ($1,$2,$3,1,$4,$5,'pending',$6,$7,$8)`,
      [
        evidenceId,
        context.organizationId,
        input.projectId,
        requiredText(input.displayName, 'displayName', 300),
        requiredText(input.documentType, 'documentType', 80),
        optionalText(input.retentionPolicy, 100) || 'organization_default',
        input.retentionUntil || null,
        context.userId
      ]
    );
    await client.query(
      `INSERT INTO platform.evidence_versions (
         id, organization_id, evidence_document_id, version_number, original_file_name,
         media_type, byte_size, sha256, storage_provider, storage_bucket, object_key, uploaded_by
       ) VALUES ($1,$2,$3,1,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        versionId,
        context.organizationId,
        evidenceId,
        requiredText(input.originalFileName, 'originalFileName', 300),
        requiredText(input.mediaType, 'mediaType', 150),
        positiveInteger(input.byteSize, 'byteSize'),
        input.sha256,
        requiredText(input.storageProvider, 'storageProvider', 50),
        requiredText(input.storageBucket, 'storageBucket', 200),
        objectKey,
        context.userId
      ]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: 'evidence.created',
      entityType: 'evidence_document',
      entityId: evidenceId,
      payload: { projectId: input.projectId, documentType: input.documentType, version: 1, sha256: input.sha256 }
    });
    return { evidenceId, versionId, version: 1, objectKey };
  });
}

export async function requirePermission(client, permissionCode) {
  const result = await client.query('SELECT platform.has_permission($1) AS allowed', [permissionCode]);
  if (result.rows[0]?.allowed !== true) throw forbiddenError(`Permission ${permissionCode} is required.`);
}

export async function requireFeature(client, featureCode) {
  const result = await client.query(
    `SELECT feature.enabled, feature.limit_value, feature.configuration
     FROM platform.subscriptions subscription
     JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
     WHERE subscription.organization_id = platform.current_organization_id()
       AND feature.feature_code = $1`,
    [featureCode]
  );
  const entitlement = result.rows[0];
  if (!entitlement?.enabled) throw entitlementError(`Feature ${featureCode} is not enabled for the current plan.`);
  return {
    enabled: true,
    limit: entitlement.limit_value === null ? null : Number(entitlement.limit_value),
    configuration: entitlement.configuration || {}
  };
}

export async function appendAuditEvent(client, input) {
  // Serialize each organization's hash chain inside the surrounding transaction.
  // Without this lock, simultaneous writes could legitimately reference the same
  // predecessor and create a forked audit history.
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [input.organizationId]);
  const previous = await client.query(
    `SELECT event_hash FROM platform.audit_events
     WHERE organization_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`,
    [input.organizationId]
  );
  const previousEventHash = previous.rows[0]?.event_hash || null;
  const eventId = input.id || crypto.randomUUID();
  const eventBody = {
    id: eventId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId || null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    requestId: input.requestId || null,
    previousEventHash,
    payload: input.payload || {}
  };
  const eventHash = crypto.createHash('sha256').update(canonicalJson(eventBody)).digest('hex');
  await client.query(
    `INSERT INTO platform.audit_events (
       id, organization_id, actor_user_id, action, entity_type, entity_id,
       request_id, previous_event_hash, event_hash, payload
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      eventId,
      input.organizationId,
      input.actorUserId || null,
      requiredText(input.action, 'action', 150),
      requiredText(input.entityType, 'entityType', 100),
      input.entityId || null,
      optionalText(input.requestId, 200),
      previousEventHash,
      eventHash,
      objectValue(input.payload)
    ]
  );
  return { id: eventId, previousEventHash, eventHash };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizeEmail(value) {
  const email = requiredText(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validationError('email must be valid.');
  return email;
}

function normalizeCountryCode(value) {
  if (!value) return null;
  const code = String(value).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw validationError('countryCode must be an ISO 3166-1 alpha-2 code.');
  return code;
}

function requiredText(value, fieldName, maxLength) {
  const text = String(value || '').trim();
  if (!text || text.length > maxLength) throw validationError(`${fieldName} is required and must be at most ${maxLength} characters.`);
  return text;
}

function optionalText(value, maxLength) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (text.length > maxLength) throw validationError(`Value must be at most ${maxLength} characters.`);
  return text || null;
}

function nullableUuid(value, fieldName) {
  if (!value) return null;
  assertUuid(value, fieldName);
  return value;
}

function positiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw validationError(`${fieldName} must be a positive integer.`);
  return number;
}

function objectValue(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw validationError('Metadata values must be objects.');
  return value;
}

function validationError(message) {
  const error = new Error(message);
  error.code = 'validation_error';
  error.status = 400;
  return error;
}

function forbiddenError(message) {
  const error = new Error(message);
  error.code = 'forbidden';
  error.status = 403;
  return error;
}

function entitlementError(message) {
  const error = new Error(message);
  error.code = 'plan_upgrade_required';
  error.status = 402;
  return error;
}
