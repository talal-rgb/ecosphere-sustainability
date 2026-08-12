import crypto from 'node:crypto';
import { assertUuid, withPlatformContext } from './database.js';
import { upsertSearchDocument } from './searchService.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const PROJECT_MODULES = new Set(['carbon', 'esg', 'energy', 'training', 'quiz', 'intelligence', 'cross_platform']);
const PROJECT_STATUSES = new Set(['draft', 'active', 'in_review', 'approved', 'archived']);
const HIERARCHY_TABLES = new Set(['business_units', 'sites', 'facilities']);

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
    const membershipResult = await client.query(
        `SELECT role_code, status FROM platform.organization_memberships
         WHERE organization_id = $1 AND user_id = $2`,
        [context.organizationId, context.userId]
      );
    const permissionResult = await client.query(
        `SELECT permission.code
         FROM platform.organization_memberships membership
         JOIN platform.role_permissions grant_row ON grant_row.role_code = membership.role_code
         JOIN platform.permissions permission ON permission.code = grant_row.permission_code
         WHERE membership.organization_id = $1 AND membership.user_id = $2 AND membership.status = 'active'
         ORDER BY permission.code`,
        [context.organizationId, context.userId]
      );
    const featureResult = await client.query(
        `SELECT subscription.plan_code, feature.feature_code, feature.enabled, feature.limit_value, feature.configuration
         FROM platform.subscriptions subscription
         JOIN platform.plan_features feature ON feature.plan_code = subscription.plan_code
         WHERE subscription.organization_id = $1
         ORDER BY feature.feature_code`,
        [context.organizationId]
      );
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

export async function getOrganizationProfile(databasePool, context) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'organization.read');
    const organizationResult = await client.query(
        `SELECT organization.id, organization.slug, organization.name, organization.logo_url,
                organization.industry_code, organization.country_code, organization.data_region,
                organization.status, organization.settings, organization.created_at,
                subscription.plan_code, subscription.status AS subscription_status,
                subscription.current_period_ends_at, subscription.trial_ends_at
         FROM platform.organizations organization
         LEFT JOIN platform.subscriptions subscription ON subscription.organization_id = organization.id
         WHERE organization.id = $1`,
        [context.organizationId]
      );
    const usageResult = await client.query(
        `SELECT
           (SELECT count(*)::integer FROM platform.organization_memberships WHERE organization_id = $1 AND status = 'active') AS members,
           (SELECT count(*)::integer FROM platform.business_units WHERE organization_id = $1 AND status = 'active') AS business_units,
           (SELECT count(*)::integer FROM platform.sites WHERE organization_id = $1 AND status = 'active') AS sites,
           (SELECT count(*)::integer FROM platform.facilities WHERE organization_id = $1 AND status = 'active') AS facilities,
           (SELECT count(*)::integer FROM platform.projects WHERE organization_id = $1 AND status <> 'archived') AS active_projects,
           (SELECT count(*)::integer FROM platform.evidence_documents WHERE organization_id = $1 AND deleted_at IS NULL) AS evidence_documents`,
        [context.organizationId]
      );
    const organization = organizationResult.rows[0];
    if (!organization) throw notFoundError('Organization was not found.');
    return {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      logoUrl: organization.logo_url,
      industryCode: organization.industry_code,
      countryCode: organization.country_code,
      dataRegion: organization.data_region,
      status: organization.status,
      settings: organization.settings,
      createdAt: organization.created_at,
      subscription: organization.plan_code ? {
        planCode: organization.plan_code,
        status: organization.subscription_status,
        currentPeriodEnd: organization.current_period_ends_at,
        trialEndsAt: organization.trial_ends_at
      } : null,
      usage: camelizeUsage(usageResult.rows[0])
    };
  });
}

export async function listOrganizationMembers(databasePool, context, options = {}) {
  const pagination = normalizePagination(options);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'member.read');
    const itemsResult = await client.query(
        `SELECT membership.user_id, membership.role_code, role.name AS role_name,
                membership.status, membership.invited_at, membership.joined_at,
                user_account.email, user_account.display_name, user_account.avatar_url,
                user_account.last_active_at
         FROM platform.organization_memberships membership
         JOIN platform.app_users user_account ON user_account.id = membership.user_id
         JOIN platform.role_definitions role ON role.code = membership.role_code
         WHERE membership.organization_id = $1
         ORDER BY lower(user_account.display_name), membership.user_id
         LIMIT $2 OFFSET $3`,
        [context.organizationId, pagination.pageSize, pagination.offset]
      );
    const countResult = await client.query(
        'SELECT count(*)::integer AS total FROM platform.organization_memberships WHERE organization_id = $1',
        [context.organizationId]
      );
    return paginatedResult(itemsResult.rows.map((row) => ({
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      role: { code: row.role_code, name: row.role_name },
      status: row.status,
      invitedAt: row.invited_at,
      joinedAt: row.joined_at,
      lastActiveAt: row.last_active_at
    })), countResult.rows[0].total, pagination);
  });
}

export async function listProjects(databasePool, context, options = {}) {
  const pagination = normalizePagination(options);
  const status = optionalEnum(options.status, 'status', PROJECT_STATUSES);
  const productModule = optionalEnum(options.productModule, 'productModule', PROJECT_MODULES);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'project.read');
    const parameters = [context.organizationId];
    const predicates = ['project.organization_id = $1'];
    if (status) {
      parameters.push(status);
      predicates.push(`project.status = $${parameters.length}`);
    }
    if (productModule) {
      parameters.push(productModule);
      predicates.push(`project.product_module = $${parameters.length}`);
    }
    const where = predicates.join(' AND ');
    const countResult = await client.query(`SELECT count(*)::integer AS total FROM platform.projects project WHERE ${where}`, parameters);
    parameters.push(pagination.pageSize, pagination.offset);
    const itemsResult = await client.query(
      `SELECT project.id, project.code, project.name, project.description, project.product_module,
              project.project_type, project.status, project.reporting_period_start,
              project.reporting_period_end, project.business_unit_id, project.site_id,
              project.facility_id, project.owner_user_id, project.metadata,
              project.created_at, project.updated_at
       FROM platform.projects project
       WHERE ${where}
       ORDER BY project.updated_at DESC, project.id
       LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`,
      parameters
    );
    return paginatedResult(itemsResult.rows.map(projectResource), countResult.rows[0].total, pagination);
  });
}

export async function listBusinessUnits(databasePool, context, options = {}) {
  return listHierarchyResources(databasePool, context, options, {
    table: 'business_units',
    columns: 'id, parent_id, code, name, description, status, created_at, updated_at',
    mapper: (row) => ({
      id: row.id, parentId: row.parent_id, code: row.code, name: row.name,
      description: row.description, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
    })
  });
}

export async function listSites(databasePool, context, options = {}) {
  return listHierarchyResources(databasePool, context, options, {
    table: 'sites',
    columns: 'id, business_unit_id, code, name, country_code, address, latitude, longitude, status, created_at, updated_at',
    mapper: (row) => ({
      id: row.id, businessUnitId: row.business_unit_id, code: row.code, name: row.name,
      countryCode: row.country_code, address: row.address,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
    })
  });
}

export async function listFacilities(databasePool, context, options = {}) {
  const siteId = options.siteId ? nullableUuid(options.siteId, 'siteId') : null;
  return listHierarchyResources(databasePool, context, options, {
    table: 'facilities',
    columns: 'id, site_id, code, name, facility_type, floor_area_m2, status, metadata, created_at, updated_at',
    extraPredicate: siteId ? 'site_id = $2' : null,
    extraParameters: siteId ? [siteId] : [],
    mapper: (row) => ({
      id: row.id, siteId: row.site_id, code: row.code, name: row.name,
      facilityType: row.facility_type,
      floorAreaM2: row.floor_area_m2 === null ? null : Number(row.floor_area_m2),
      status: row.status, metadata: row.metadata, createdAt: row.created_at, updatedAt: row.updated_at
    })
  });
}

export async function createBusinessUnit(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'organization.update');
    const id = input.id || crypto.randomUUID();
    assertUuid(id, 'businessUnitId');
    const parentId = nullableUuid(input.parentId, 'parentId');
    if (parentId === id) throw validationError('A business unit cannot be its own parent.');
    const name = requiredText(input.name, 'name', 200);
    await requireAvailableCapacity(client, context.organizationId, 'business_units.total', 'business_units');
    const result = await client.query(
      `INSERT INTO platform.business_units (id, organization_id, parent_id, code, name, description)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, parent_id, code, name, description, status, created_at, updated_at`,
      [id, context.organizationId, parentId, optionalText(input.code, 80),
        name, optionalText(input.description, 2000)]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'business_unit.created', entityType: 'business_unit', entityId: id,
      payload: { name: input.name, parentId: input.parentId || null }
    });
    const row = result.rows[0];
    return { id: row.id, parentId: row.parent_id, code: row.code, name: row.name, description: row.description,
      status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
  });
}

export async function createSite(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'organization.update');
    const id = input.id || crypto.randomUUID();
    assertUuid(id, 'siteId');
    const name = requiredText(input.name, 'name', 200);
    const latitude = optionalCoordinate(input.latitude, 'latitude', -90, 90);
    const longitude = optionalCoordinate(input.longitude, 'longitude', -180, 180);
    await requireAvailableCapacity(client, context.organizationId, 'sites.total', 'sites');
    const result = await client.query(
      `INSERT INTO platform.sites (id, organization_id, business_unit_id, code, name, country_code, address, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, business_unit_id, code, name, country_code, address, latitude, longitude, status, created_at, updated_at`,
      [id, context.organizationId, nullableUuid(input.businessUnitId, 'businessUnitId'), optionalText(input.code, 80),
        name, normalizeCountryCode(input.countryCode), objectValue(input.address), latitude, longitude]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'site.created', entityType: 'site', entityId: id,
      payload: { name: input.name, businessUnitId: input.businessUnitId || null }
    });
    const row = result.rows[0];
    return { id: row.id, businessUnitId: row.business_unit_id, code: row.code, name: row.name,
      countryCode: row.country_code, address: row.address,
      latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude),
      status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
  });
}

export async function createFacility(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'organization.update');
    const id = input.id || crypto.randomUUID();
    assertUuid(id, 'facilityId');
    assertUuid(input.siteId, 'siteId');
    const name = requiredText(input.name, 'name', 200);
    const floorAreaM2 = optionalNonNegativeNumber(input.floorAreaM2, 'floorAreaM2');
    await requireAvailableCapacity(client, context.organizationId, 'facilities.total', 'facilities');
    const result = await client.query(
      `INSERT INTO platform.facilities (id, organization_id, site_id, code, name, facility_type, floor_area_m2, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, site_id, code, name, facility_type, floor_area_m2, status, metadata, created_at, updated_at`,
      [id, context.organizationId, input.siteId, optionalText(input.code, 80), name,
        optionalText(input.facilityType, 100), floorAreaM2, objectValue(input.metadata)]
    );
    await appendAuditEvent(client, {
      organizationId: context.organizationId, actorUserId: context.userId,
      action: 'facility.created', entityType: 'facility', entityId: id,
      payload: { name: input.name, siteId: input.siteId, facilityType: input.facilityType || null }
    });
    const row = result.rows[0];
    return { id: row.id, siteId: row.site_id, code: row.code, name: row.name, facilityType: row.facility_type,
      floorAreaM2: row.floor_area_m2 === null ? null : Number(row.floor_area_m2), status: row.status,
      metadata: row.metadata, createdAt: row.created_at, updatedAt: row.updated_at };
  });
}

export async function createProject(databasePool, context, input) {
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'project.create');
    const projectEntitlement = await requireFeature(client, 'projects.total');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.organizationId}:projects.total`]);
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
       RETURNING id, code, name, description, product_module, project_type, status,
                 reporting_period_start, reporting_period_end, business_unit_id, site_id,
                 facility_id, owner_user_id, metadata, created_at, updated_at`,
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
        requiredEnum(input.productModule, 'productModule', PROJECT_MODULES),
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
    const project = projectResource(result.rows[0]);
    await upsertSearchDocument(client, context, {
      entityType: 'project', entityId: projectId, projectId, sourceVersion: String(project.updatedAt),
      title: project.name, body: project.description || '',
      keywords: [project.productModule, project.projectType, project.status],
      actionUrl: `/portal/projects/${projectId}`, metadata: { productModule: project.productModule, status: project.status }
    });
    return project;
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
    await upsertSearchDocument(client, context, {
      entityType: 'evidence', entityId: evidenceId, projectId: input.projectId, sourceVersion: '1',
      title: input.displayName, body: input.originalFileName,
      keywords: [input.documentType], actionUrl: `/portal/evidence/${evidenceId}`,
      metadata: { documentType: input.documentType, classificationStatus: 'pending' }
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

function requiredEnum(value, fieldName, acceptedValues) {
  const normalized = requiredText(value, fieldName, 100);
  if (!acceptedValues.has(normalized)) throw validationError(`${fieldName} is not supported.`);
  return normalized;
}

function optionalEnum(value, fieldName, acceptedValues) {
  if (value === null || value === undefined || value === '') return null;
  return requiredEnum(value, fieldName, acceptedValues);
}

function normalizePagination(options) {
  const page = Number(options.page ?? 1);
  const pageSize = Number(options.pageSize ?? 25);
  if (!Number.isSafeInteger(page) || page < 1) throw validationError('page must be a positive integer.');
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw validationError('pageSize must be an integer between 1 and 100.');
  }
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) throw validationError('page is too large.');
  return { page, pageSize, offset };
}

async function listHierarchyResources(databasePool, context, options, definition) {
  if (!HIERARCHY_TABLES.has(definition.table)) throw new TypeError('Unsupported hierarchy resource.');
  const pagination = normalizePagination(options);
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'organization.read');
    const parameters = [context.organizationId, ...(definition.extraParameters || [])];
    const where = ['organization_id = $1', definition.extraPredicate].filter(Boolean).join(' AND ');
    const countResult = await client.query(`SELECT count(*)::integer AS total FROM platform.${definition.table} WHERE ${where}`, parameters);
    parameters.push(pagination.pageSize, pagination.offset);
    const itemsResult = await client.query(
      `SELECT ${definition.columns} FROM platform.${definition.table}
       WHERE ${where} ORDER BY lower(name), id
       LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`,
      parameters
    );
    return paginatedResult(itemsResult.rows.map(definition.mapper), countResult.rows[0].total, pagination);
  });
}

async function requireAvailableCapacity(client, organizationId, featureCode, tableName) {
  if (!HIERARCHY_TABLES.has(tableName)) throw new TypeError('Unsupported capacity resource.');
  const entitlement = await requireFeature(client, featureCode);
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${organizationId}:${featureCode}`]);
  if (entitlement.limit === null) return;
  const usage = await client.query(`SELECT count(*)::integer AS total FROM platform.${tableName} WHERE organization_id = $1`, [organizationId]);
  if (usage.rows[0].total >= entitlement.limit) throw entitlementError(`Limit reached for ${featureCode}.`);
}

function optionalCoordinate(value, fieldName, minimum, maximum) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw validationError(`${fieldName} must be between ${minimum} and ${maximum}.`);
  }
  return number;
}

function optionalNonNegativeNumber(value, fieldName) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw validationError(`${fieldName} must be a non-negative number.`);
  return number;
}

function paginatedResult(items, total, pagination) {
  return {
    items,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / pagination.pageSize)
    }
  };
}

function projectResource(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    productModule: row.product_module,
    projectType: row.project_type,
    status: row.status,
    reportingPeriodStart: row.reporting_period_start,
    reportingPeriodEnd: row.reporting_period_end,
    businessUnitId: row.business_unit_id,
    siteId: row.site_id,
    facilityId: row.facility_id,
    ownerUserId: row.owner_user_id,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function camelizeUsage(row) {
  return {
    members: Number(row.members),
    businessUnits: Number(row.business_units),
    sites: Number(row.sites),
    facilities: Number(row.facilities),
    activeProjects: Number(row.active_projects),
    evidenceDocuments: Number(row.evidence_documents)
  };
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

function notFoundError(message) {
  const error = new Error(message);
  error.code = 'not_found';
  error.status = 404;
  return error;
}
