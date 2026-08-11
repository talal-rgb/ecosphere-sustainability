import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

import { withPlatformContext } from '../services/database.js';
import { ingestBillingEvent } from '../services/billingEvents.js';
import { getBillingOverview, listBillingInvoices } from '../services/billingPortal.js';
import { getEvidenceReview, submitEvidenceReview } from '../services/documentIntelligence.js';
import { claimDocumentJob, completeDocumentJob, failDocumentJob } from '../services/documentWorker.js';
import { finalizeEvidenceUpload, initiateEvidenceUpload } from '../services/evidenceIntake.js';
import {
  addEvidenceTag,
  getEvidence,
  listEvidence,
  restoreEvidence,
  softDeleteEvidence
} from '../services/evidenceRepository.js';
import { getUsageSnapshot, recordUsage } from '../services/usageMetering.js';
import {
  bootstrapOrganization,
  canonicalJson,
  createBusinessUnit,
  createEvidenceDocument,
  createFacility,
  createProject,
  createSite,
  getAccessSnapshot,
  getOrganizationProfile,
  listBusinessUnits,
  listFacilities,
  listOrganizationMembers,
  listProjects,
  listSites,
  requireFeature
} from '../services/platformService.js';

const migrationUrls = [
  new URL('../db/migrations/001_platform_foundation.sql', import.meta.url),
  new URL('../db/migrations/003_organization_hierarchy_entitlements.sql', import.meta.url),
  new URL('../db/migrations/004_evidence_intake.sql', import.meta.url),
  new URL('../db/migrations/005_evidence_repository.sql', import.meta.url),
  new URL('../db/migrations/006_evidence_versions.sql', import.meta.url),
  new URL('../db/migrations/007_billing_control_plane.sql', import.meta.url),
  new URL('../db/migrations/008_document_intelligence_review.sql', import.meta.url)
];
const ids = {
  userA: '11111111-1111-4111-8111-111111111111',
  orgA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  userB: '22222222-2222-4222-8222-222222222222',
  orgB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  reviewerA: '33333333-3333-4333-8333-333333333333'
};

async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE terrnix_migrator;
    GRANT CREATE ON DATABASE postgres TO terrnix_migrator;
    SET ROLE terrnix_migrator;
  `);
  for (const migrationUrl of migrationUrls) await db.exec(await fs.readFile(migrationUrl, 'utf8'));
  await db.exec(`
    RESET ROLE;
    CREATE ROLE terrnix_app_test;
    GRANT USAGE ON SCHEMA platform TO terrnix_app_test;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO terrnix_app_test;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO terrnix_app_test;
    SET ROLE terrnix_app_test;
  `);
  return db;
}

function asPool(db) {
  return {
    async connect() {
      return { query: db.query.bind(db), release() {} };
    }
  };
}

async function setContext(db, organizationId, userId) {
  await db.query("SELECT set_config('app.current_organization_id', $1, false)", [organizationId]);
  await db.query("SELECT set_config('app.current_user_id', $1, false)", [userId]);
}

async function bootstrap(db, { organizationId, userId, slug, email }) {
  await setContext(db, organizationId, userId);
  await db.query(
    'SELECT platform.bootstrap_organization($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [userId, organizationId, `auth:${userId}`, email, slug, slug, slug, null, null]
  );
  await setPlan(db, organizationId, 'starter');
}

async function setPlan(db, organizationId, planCode) {
  await db.exec('RESET ROLE');
  await db.query(
    "UPDATE platform.subscriptions SET plan_code = $1, status = CASE WHEN $1 = 'free' THEN 'free' ELSE 'active' END WHERE organization_id = $2",
    [planCode, organizationId]
  );
  await db.exec('SET ROLE terrnix_app_test');
}

test('platform migration creates the shared SaaS domain and commercial plan matrix', async () => {
  const db = await createTestDatabase();
  try {
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'platform'");
    assert.ok(tables.rows.length >= 23);
    const plans = await db.query('SELECT code FROM platform.plans ORDER BY display_order');
    assert.deepEqual(plans.rows.map((row) => row.code), ['free', 'starter', 'professional', 'business', 'enterprise']);
    const enterprise = await db.query("SELECT enabled FROM platform.plan_features WHERE plan_code = 'enterprise' AND feature_code = 'sso.saml'");
    assert.equal(enterprise.rows[0].enabled, true);
    const starterSites = await db.query("SELECT enabled, limit_value FROM platform.plan_features WHERE plan_code = 'starter' AND feature_code = 'sites.total'");
    assert.deepEqual(starterSites.rows[0], { enabled: true, limit_value: 3 });
  } finally {
    await db.close();
  }
});

test('row-level security blocks cross-organization reads and writes', async () => {
  const db = await createTestDatabase();
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    await db.query(
      `INSERT INTO platform.projects (id, organization_id, name, product_module, project_type)
       VALUES ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', $1, 'Alpha inventory', 'carbon', 'annual_inventory')`,
      [ids.orgA]
    );
    await bootstrap(db, { organizationId: ids.orgB, userId: ids.userB, slug: 'org-beta', email: 'beta@example.com' });
    await db.query(
      `INSERT INTO platform.projects (id, organization_id, name, product_module, project_type)
       VALUES ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb', $1, 'Beta inventory', 'carbon', 'annual_inventory')`,
      [ids.orgB]
    );

    const betaView = await db.query('SELECT organization_id, name FROM platform.projects ORDER BY name');
    assert.deepEqual(betaView.rows, [{ organization_id: ids.orgB, name: 'Beta inventory' }]);
    await assert.rejects(
      db.query(
        `INSERT INTO platform.projects (id, organization_id, name, product_module, project_type)
         VALUES ('cccccccc-1111-4111-8111-cccccccccccc', $1, 'Cross tenant', 'carbon', 'annual_inventory')`,
        [ids.orgA]
      ),
      /row-level security policy/
    );
  } finally {
    await db.close();
  }
});

test('organization bootstrap cannot add an unauthenticated owner to an existing tenant', async () => {
  const db = await createTestDatabase();
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    await setContext(db, ids.orgA, ids.userB);
    await db.query(
      `INSERT INTO platform.app_users (id, auth_subject, email, display_name, status)
       VALUES ($1, $2, 'attacker@example.com', 'Attacker', 'active')`,
      [ids.userB, `auth:${ids.userB}`]
    );
    await assert.rejects(
      db.query(
        `INSERT INTO platform.organization_memberships (organization_id, user_id, role_code, status, joined_at)
         VALUES ($1, $2, 'owner', 'active', now())`,
        [ids.orgA, ids.userB]
      ),
      /row-level security policy/
    );
  } finally {
    await db.close();
  }
});

test('granular roles deny reviewer writes while allowing review access', async () => {
  const db = await createTestDatabase();
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    await db.query("SELECT set_config('app.current_user_id', $1, false)", [ids.reviewerA]);
    await db.query(
      `INSERT INTO platform.app_users (id, auth_subject, email, display_name, status)
       VALUES ($1, 'auth:reviewer', 'reviewer@example.com', 'Reviewer', 'active')`,
      [ids.reviewerA]
    );
    await db.query("SELECT set_config('app.current_user_id', $1, false)", [ids.userA]);
    await db.query(
      `INSERT INTO platform.organization_memberships (organization_id, user_id, role_code, status, invited_by, joined_at)
       VALUES ($1, $2, 'reviewer', 'active', $3, now())`,
      [ids.orgA, ids.reviewerA, ids.userA]
    );
    await setContext(db, ids.orgA, ids.reviewerA);
    assert.equal((await db.query("SELECT platform.has_permission('calculation.approve') AS allowed")).rows[0].allowed, true);
    assert.equal((await db.query("SELECT platform.has_permission('project.create') AS allowed")).rows[0].allowed, false);
    await assert.rejects(
      db.query(
        `INSERT INTO platform.projects (id, organization_id, name, product_module, project_type)
         VALUES ('dddddddd-1111-4111-8111-dddddddddddd', $1, 'Forbidden project', 'carbon', 'annual_inventory')`,
        [ids.orgA]
      ),
      /row-level security policy/
    );
  } finally {
    await db.close();
  }
});

test('evidence versions preserve file identity while permitting extraction review metadata', async () => {
  const db = await createTestDatabase();
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    const projectId = 'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa';
    const evidenceId = 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
    const versionId = 'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
    await db.query(
      `INSERT INTO platform.projects (id, organization_id, name, product_module, project_type)
       VALUES ($1, $2, 'Inventory', 'carbon', 'annual_inventory')`,
      [projectId, ids.orgA]
    );
    await db.query(
      `INSERT INTO platform.evidence_documents (
         id, organization_id, project_id, current_version, display_name, document_type, created_by
       ) VALUES ($1,$2,$3,1,'Electricity bill','electricity_bill',$4)`,
      [evidenceId, ids.orgA, projectId, ids.userA]
    );
    await db.query(
      `INSERT INTO platform.evidence_versions (
         id, organization_id, evidence_document_id, version_number, original_file_name,
         media_type, byte_size, sha256, storage_provider, storage_bucket, object_key, uploaded_by
       ) VALUES ($1,$2,$3,1,'bill.pdf','application/pdf',1000,$4,'s3','evidence',$5,$6)`,
      [versionId, ids.orgA, evidenceId, 'a'.repeat(64), `${ids.orgA}/evidence/bill.pdf`, ids.userA]
    );
    await db.query(
      `UPDATE platform.evidence_versions
       SET extraction_status = 'review_required', extracted_data = '{"consumption": 1200}', extraction_confidence = 0.91
       WHERE id = $1`,
      [versionId]
    );
    await assert.rejects(
      db.query("UPDATE platform.evidence_versions SET object_key = $1 WHERE id = $2", [`${ids.orgA}/evidence/tampered.pdf`, versionId]),
      /storage metadata are immutable/
    );
    const deleteAttempt = await db.query('DELETE FROM platform.evidence_versions WHERE id = $1', [versionId]);
    assert.equal(deleteAttempt.affectedRows, 0);
    assert.equal((await db.query('SELECT count(*)::integer AS count FROM platform.evidence_versions WHERE id = $1', [versionId])).rows[0].count, 1);
  } finally {
    await db.close();
  }
});

test('platform service bootstraps free tenancy, gates features, and appends chained audit events', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  try {
    await bootstrapOrganization(pool, {
      userId: ids.userA,
      organizationId: ids.orgA,
      authSubject: 'better-auth:user-a',
      email: 'OWNER@EXAMPLE.COM',
      displayName: 'Owner',
      organizationName: 'Organization Alpha',
      organizationSlug: 'organization-alpha',
      countryCode: 'fr'
    });
    const context = { userId: ids.userA, organizationId: ids.orgA };
    const freeAccess = await getAccessSnapshot(pool, context);
    assert.equal(freeAccess.planCode, 'free');
    assert.equal(freeAccess.features['projects.total'].enabled, false);
    const selfUpgradeAttempt = await withPlatformContext(pool, context, (client) => client.query(
      "UPDATE platform.subscriptions SET plan_code = 'enterprise', status = 'active' WHERE organization_id = $1",
      [ids.orgA]
    ));
    assert.equal(selfUpgradeAttempt.rowCount ?? selfUpgradeAttempt.affectedRows, 0);
    await assert.rejects(
      createProject(pool, context, { name: '2026 Inventory', productModule: 'carbon', projectType: 'annual_inventory' }),
      (error) => error.code === 'plan_upgrade_required' && error.status === 402
    );

    await setPlan(db, ids.orgA, 'starter');
    const project = await createProject(pool, context, {
      name: '2026 Inventory',
      code: 'CARBON-2026',
      productModule: 'carbon',
      projectType: 'annual_inventory',
      reportingPeriodStart: '2026-01-01',
      reportingPeriodEnd: '2026-12-31'
    });
    assert.equal(project.status, 'draft');
    const evidence = await createEvidenceDocument(pool, context, {
      projectId: project.id,
      displayName: 'January electricity bill',
      documentType: 'electricity_bill',
      originalFileName: 'electricity-january.pdf',
      mediaType: 'application/pdf',
      byteSize: 2048,
      sha256: 'b'.repeat(64),
      storageProvider: 's3',
      storageBucket: 'terrnix-evidence',
      objectKey: `${ids.orgA}/evidence/electricity-january.pdf`
    });
    assert.equal(evidence.version, 1);

    const events = await withPlatformContext(pool, context, (client) => client.query(
      'SELECT action, previous_event_hash, event_hash FROM platform.audit_events ORDER BY created_at, id'
    ));
    assert.equal(events.rows.length, 3);
    assert.equal(events.rows[0].previous_event_hash, null);
    assert.equal(events.rows[1].previous_event_hash, events.rows[0].event_hash);
    assert.equal(events.rows[2].previous_event_hash, events.rows[1].event_hash);
    const updateAttempt = await withPlatformContext(pool, context, (client) => client.query(
      "UPDATE platform.audit_events SET action = 'tampered'"
    ));
    assert.equal(updateAttempt.rowCount ?? updateAttempt.affectedRows, 0);
    const unchangedEvents = await withPlatformContext(pool, context, (client) => client.query(
      "SELECT count(*)::integer AS count FROM platform.audit_events WHERE action = 'tampered'"
    ));
    assert.equal(unchangedEvents.rows[0].count, 0);
  } finally {
    await db.close();
  }
});

test('canonical audit serialization is stable across object key ordering', () => {
  assert.equal(canonicalJson({ b: 2, a: { d: 4, c: 3 } }), canonicalJson({ a: { c: 3, d: 4 }, b: 2 }));
});

test('organization workspace services return tenant-scoped profile, members, and filtered projects', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    const context = { userId: ids.userA, organizationId: ids.orgA };
    await createProject(pool, context, {
      name: '2026 Carbon Inventory',
      productModule: 'carbon',
      projectType: 'annual_inventory'
    });
    await createProject(pool, context, {
      name: 'Energy Audit',
      productModule: 'energy',
      projectType: 'facility_audit'
    });

    const organization = await getOrganizationProfile(pool, context);
    assert.equal(organization.id, ids.orgA);
    assert.equal(organization.subscription.planCode, 'starter');
    assert.equal(organization.usage.members, 1);
    assert.equal(organization.usage.activeProjects, 2);

    const members = await listOrganizationMembers(pool, context, { page: 1, pageSize: 10 });
    assert.equal(members.pagination.total, 1);
    assert.equal(members.items[0].role.code, 'owner');

    const projects = await listProjects(pool, context, { productModule: 'energy', pageSize: 1 });
    assert.equal(projects.pagination.total, 1);
    assert.equal(projects.items[0].name, 'Energy Audit');
    assert.equal(projects.items[0].productModule, 'energy');
    await assert.rejects(
      listProjects(pool, context, { productModule: 'unsupported' }),
      (error) => error.code === 'validation_error'
    );
  } finally {
    await db.close();
  }
});

test('organization hierarchy is reusable, audited, and constrained by plan entitlements', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    const context = { userId: ids.userA, organizationId: ids.orgA };
    const businessUnit = await createBusinessUnit(pool, context, { name: 'France Operations', code: 'FR' });
    await assert.rejects(
      createBusinessUnit(pool, context, { id: 'aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa', parentId: 'aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa', name: 'Invalid Unit' }),
      (error) => error.code === 'validation_error'
    );
    await assert.rejects(
      createBusinessUnit(pool, context, { name: 'Second Unit' }),
      (error) => error.code === 'plan_upgrade_required'
    );
    const site = await createSite(pool, context, {
      businessUnitId: businessUnit.id,
      name: 'Paris Site',
      countryCode: 'fr',
      latitude: 48.8566,
      longitude: 2.3522,
      address: { city: 'Paris' }
    });
    const facility = await createFacility(pool, context, {
      siteId: site.id,
      name: 'Head Office',
      facilityType: 'office',
      floorAreaM2: 1250.5
    });

    assert.equal((await listBusinessUnits(pool, context)).items[0].name, 'France Operations');
    assert.equal((await listSites(pool, context)).items[0].countryCode, 'FR');
    const facilities = await listFacilities(pool, context, { siteId: site.id });
    assert.equal(facilities.items[0].id, facility.id);
    assert.equal(facilities.items[0].floorAreaM2, 1250.5);

    const events = await withPlatformContext(pool, context, (client) => client.query(
      "SELECT action FROM platform.audit_events WHERE action IN ('business_unit.created','site.created','facility.created') ORDER BY created_at, id"
    ));
    assert.deepEqual(events.rows.map((row) => row.action), ['business_unit.created', 'site.created', 'facility.created']);
  } finally {
    await db.close();
  }
});

test('evidence intake issues server-owned uploads and queues verified documents for malware scanning', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  const storageCalls = [];
  const storage = {
    provider: 's3',
    bucket: 'private-evidence',
    async createUploadIntent(input) {
      storageCalls.push(['create', input]);
      return { method: 'PUT', url: 'https://storage.example/upload', expiresInSeconds: 600, requiredHeaders: { 'if-none-match': '*' } };
    },
    async verifyObject(input) {
      storageCalls.push(['verify', input]);
      return { checksumSha256: Buffer.from(input.sha256, 'hex').toString('base64') };
    }
  };
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    await setPlan(db, ids.orgA, 'professional');
    const context = { userId: ids.userA, organizationId: ids.orgA };
    const project = await createProject(pool, context, { name: 'Evidence Project', productModule: 'carbon', projectType: 'annual_inventory' });
    const upload = await initiateEvidenceUpload(pool, context, storage, {
      projectId: project.id,
      displayName: 'January electricity bill',
      documentType: 'electricity_bill',
      originalFileName: 'january.pdf',
      mediaType: 'application/pdf',
      byteSize: 4096,
      sha256: 'c'.repeat(64)
    });
    assert.equal(upload.upload.method, 'PUT');
    assert.equal(upload.objectKey, undefined);
    assert.match(storageCalls[0][1].objectKey, new RegExp(`^${ids.orgA}/quarantine/`));

    const finalized = await finalizeEvidenceUpload(pool, context, storage, upload.uploadId);
    assert.equal(finalized.evidenceId, upload.evidenceId);
    assert.equal(finalized.processingStage, 'malware_scan');
    const persisted = await withPlatformContext(pool, context, async (client) => {
      const version = await client.query('SELECT malware_scan_status, extraction_status FROM platform.evidence_versions WHERE id = $1', [upload.versionId]);
      const job = await client.query('SELECT stage, status FROM platform.document_processing_jobs WHERE evidence_version_id = $1', [upload.versionId]);
      return { version: version.rows[0], job: job.rows[0] };
    });
    assert.deepEqual(persisted.version, { malware_scan_status: 'pending', extraction_status: 'pending' });
    assert.deepEqual(persisted.job, { stage: 'malware_scan', status: 'queued' });
    await assert.rejects(
      withPlatformContext(pool, context, (client) => client.query(
        "UPDATE platform.evidence_upload_sessions SET object_key = $1 WHERE id = $2",
        [`${ids.orgA}/quarantine/tampered`, upload.uploadId]
      )),
      /identity and storage metadata are immutable/
    );
    const repeated = await finalizeEvidenceUpload(pool, context, storage, upload.uploadId);
    assert.equal(repeated.status, 'finalized');
    assert.equal(storageCalls.filter(([operation]) => operation === 'verify').length, 1);

    const secondUpload = await initiateEvidenceUpload(pool, context, storage, {
      evidenceId: upload.evidenceId,
      projectId: project.id,
      displayName: 'January electricity bill — corrected',
      documentType: 'electricity_bill',
      originalFileName: 'january-corrected.pdf',
      mediaType: 'application/pdf',
      byteSize: 4608,
      sha256: 'd'.repeat(64)
    });
    assert.equal(secondUpload.versionNumber, 2);
    await finalizeEvidenceUpload(pool, context, storage, secondUpload.uploadId);

    const tag = await addEvidenceTag(pool, context, upload.evidenceId, { tag: 'Electricity-Bill' });
    assert.equal(tag.value, 'electricity-bill');
    const search = await listEvidence(pool, context, { query: 'January electricity', tag: 'electricity-bill' });
    assert.equal(search.pagination.total, 1);
    assert.equal(search.items[0].id, upload.evidenceId);
    const detail = await getEvidence(pool, context, upload.evidenceId);
    assert.equal(detail.currentVersion, 2);
    assert.equal(detail.versions.length, 2);
    assert.equal(detail.versions[0].number, 2);
    assert.equal(detail.tags[0].value, 'electricity-bill');
    const evidenceUsage = await getUsageSnapshot(pool, context);
    assert.equal(evidenceUsage.find((item) => item.code === 'document_uploads.monthly').used, 2);
    assert.equal(evidenceUsage.find((item) => item.code === 'storage.bytes').used, 8704);

    await withPlatformContext(pool, context, (client) => client.query(
      'UPDATE platform.evidence_documents SET legal_hold = true WHERE id = $1', [upload.evidenceId]
    ));
    await assert.rejects(
      softDeleteEvidence(pool, context, upload.evidenceId, { reason: 'Duplicate source' }),
      (error) => error.code === 'legal_hold_active'
    );
    await withPlatformContext(pool, context, (client) => client.query(
      "UPDATE platform.evidence_documents SET legal_hold = false, retention_until = current_date + 30 WHERE id = $1", [upload.evidenceId]
    ));
    await assert.rejects(
      softDeleteEvidence(pool, context, upload.evidenceId, { reason: 'Duplicate source' }),
      (error) => error.code === 'retention_period_active'
    );
    await withPlatformContext(pool, context, (client) => client.query(
      "UPDATE platform.evidence_documents SET retention_until = current_date - 1 WHERE id = $1", [upload.evidenceId]
    ));
    await softDeleteEvidence(pool, context, upload.evidenceId, { reason: 'Duplicate source' });
    assert.equal((await listEvidence(pool, context)).pagination.total, 0);
    assert.equal((await listEvidence(pool, context, { includeDeleted: true })).pagination.total, 1);
    await restoreEvidence(pool, context, upload.evidenceId);
    assert.equal((await listEvidence(pool, context)).pagination.total, 1);

    await db.exec('RESET ROLE');
    const malwareJob = await claimDocumentJob(pool, { workerId: 'scanner:test-1', stages: ['malware_scan'], leaseSeconds: 60 });
    assert.equal(malwareJob.stage, 'malware_scan');
    assert.equal(malwareJob.object.sha256, 'c'.repeat(64));
    const scanCompletion = await completeDocumentJob(pool, {
      workerId: 'scanner:test-1', jobId: malwareJob.id, result: { outcome: 'clean', engine: 'test-scanner' }
    });
    assert.equal(scanCompletion.nextStage, 'extract');
    const extractionJob = await claimDocumentJob(pool, { workerId: 'extractor:test-1', stages: ['extract'] });
    const retry = await failDocumentJob(pool, {
      workerId: 'extractor:test-1', jobId: extractionJob.id, errorCode: 'provider.timeout', retryable: true
    });
    assert.equal(retry.status, 'retry');
    await db.query("UPDATE platform.document_processing_jobs SET available_at = now() WHERE id = $1", [extractionJob.id]);
    const retriedJob = await claimDocumentJob(pool, { workerId: 'extractor:test-2', stages: ['extract'] });
    const terminalFailure = await failDocumentJob(pool, {
      workerId: 'extractor:test-2', jobId: retriedJob.id, errorCode: 'parser.unsupported', retryable: false
    });
    assert.equal(terminalFailure.status, 'failed');
    assert.equal((await db.query('SELECT extraction_status FROM platform.evidence_versions WHERE id = $1', [upload.versionId])).rows[0].extraction_status, 'failed');
  } finally {
    await db.close();
  }
});

test('document intelligence preserves source provenance and requires versioned human correction before linking', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  const storage = {
    provider: 's3',
    bucket: 'private-evidence',
    async createUploadIntent() {
      return { method: 'PUT', url: 'https://storage.example/upload', expiresInSeconds: 600, requiredHeaders: {} };
    },
    async verifyObject() {}
  };
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    await setPlan(db, ids.orgA, 'professional');
    const context = { userId: ids.userA, organizationId: ids.orgA };
    const project = await createProject(pool, context, {
      name: 'Professional Inventory', productModule: 'carbon', projectType: 'annual_inventory'
    });
    const upload = await initiateEvidenceUpload(pool, context, storage, {
      projectId: project.id,
      displayName: 'Electricity bill',
      documentType: 'electricity_bill',
      originalFileName: 'electricity.pdf',
      mediaType: 'application/pdf',
      byteSize: 2048,
      sha256: 'd'.repeat(64)
    });
    await finalizeEvidenceUpload(pool, context, storage, upload.uploadId);

    await db.exec('RESET ROLE');
    const scanJob = await claimDocumentJob(pool, { workerId: 'scanner:review-1', stages: ['malware_scan'] });
    assert.equal((await completeDocumentJob(pool, {
      workerId: 'scanner:review-1', jobId: scanJob.id, result: { outcome: 'clean' }
    })).nextStage, 'extract');
    const extractJob = await claimDocumentJob(pool, { workerId: 'extractor:review-1', stages: ['extract'] });
    await completeDocumentJob(pool, {
      workerId: 'extractor:review-1',
      jobId: extractJob.id,
      result: {
        provider: 'test-parser',
        model: 'invoice-v1',
        schemaVersion: 'carbon-activity-v1',
        confidence: 0.78,
        data: { invoiceNumber: 'INV-100', consumption: 1250 },
        fields: [
          { code: 'invoice_number', value: 'INV-100', confidence: 0.98, source: { page: 1 } },
          { code: 'activity_quantity', value: 1250, unit: 'kWh', confidence: 0.62, source: { page: 2, boundingBox: [0.1, 0.2, 0.3, 0.4] } }
        ]
      }
    });
    const classificationJob = await claimDocumentJob(pool, { workerId: 'classifier:review-1', stages: ['classify'] });
    await completeDocumentJob(pool, {
      workerId: 'classifier:review-1',
      jobId: classificationJob.id,
      result: {
        provider: 'test-classifier', model: 'carbon-v1', documentType: 'electricity_bill',
        activityType: 'purchased_electricity', ghgScope: 'scope_2', confidence: 0.74,
        rationaleCode: 'utility.electricity'
      }
    });
    const validationJob = await claimDocumentJob(pool, { workerId: 'validator:review-1', stages: ['validate'] });
    const validation = await completeDocumentJob(pool, {
      workerId: 'validator:review-1', jobId: validationJob.id, result: {}
    });
    assert.equal(validation.nextStage, null);

    await db.exec('SET ROLE terrnix_app_test');
    const pending = await getEvidenceReview(pool, context, upload.evidenceId);
    assert.equal(pending.status, 'review_required');
    assert.equal(pending.classification.proposed.ghgScope, 'scope_2');
    const quantity = pending.fields.find((field) => field.code === 'activity_quantity');
    assert.equal(quantity.requiresReview, true);
    assert.deepEqual(quantity.source, { page: 2, boundingBox: [0.1, 0.2, 0.3, 0.4] });

    const reviewed = await submitEvidenceReview(pool, context, upload.evidenceId, {
      versionId: upload.versionId,
      classification: {
        proposalId: pending.classification.proposalId,
        expectedRevision: 0,
        decision: 'accepted',
        reasonCode: 'utility.bill_confirmed'
      },
      fields: [{
        fieldId: quantity.fieldId,
        expectedRevision: 0,
        decision: 'corrected',
        correctedValue: 1200,
        correctedUnit: 'kWh',
        reasonCode: 'invoice.total_verified',
        comment: 'Verified against the invoice total.'
      }]
    });
    assert.equal(reviewed.status, 'approved');
    assert.equal(reviewed.classification.review.revision, 1);
    assert.equal(reviewed.fields.find((field) => field.code === 'activity_quantity').review.revision, 1);
    const linkJob = await withPlatformContext(pool, context, (client) => client.query(
      "SELECT status FROM platform.document_processing_jobs WHERE evidence_version_id = $1 AND stage = 'link'",
      [upload.versionId]
    ));
    assert.equal(linkJob.rows[0].status, 'queued');
    await assert.rejects(
      submitEvidenceReview(pool, context, upload.evidenceId, {
        versionId: upload.versionId,
        fields: [{ fieldId: quantity.fieldId, expectedRevision: 0, decision: 'accepted' }]
      }),
      (error) => error.code === 'review_conflict'
    );
    const mutationAttempt = await withPlatformContext(pool, context, (client) => client.query(
      "UPDATE platform.document_field_reviews SET decision = 'accepted' WHERE extracted_field_id = $1",
      [quantity.fieldId]
    ));
    assert.equal(mutationAttempt.rowCount ?? mutationAttempt.affectedRows, 0);
    const preservedReview = await withPlatformContext(pool, context, (client) => client.query(
      'SELECT decision FROM platform.document_field_reviews WHERE extracted_field_id = $1',
      [quantity.fieldId]
    ));
    assert.equal(preservedReview.rows[0].decision, 'corrected');
    const audit = await withPlatformContext(pool, context, (client) => client.query(
      "SELECT payload FROM platform.audit_events WHERE action = 'document_intelligence.reviewed'"
    ));
    assert.equal(audit.rows[0].payload.reviews[0].decision, 'corrected');
    assert.equal(audit.rows[0].payload.reviews[0].revision, 1);

    await bootstrap(db, { organizationId: ids.orgB, userId: ids.userB, slug: 'org-beta', email: 'beta@example.com' });
    await setPlan(db, ids.orgB, 'professional');
    await assert.rejects(
      getEvidenceReview(pool, { userId: ids.userB, organizationId: ids.orgB }, upload.evidenceId),
      (error) => error.code === 'not_found'
    );
  } finally {
    await db.close();
  }
});

test('document review is gated independently from basic evidence upload', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  const storage = {
    provider: 's3', bucket: 'private-evidence',
    async createUploadIntent() { return { method: 'PUT', url: 'https://storage.example/upload', expiresInSeconds: 600, requiredHeaders: {} }; },
    async verifyObject() {}
  };
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    const context = { userId: ids.userA, organizationId: ids.orgA };
    const project = await createProject(pool, context, {
      name: 'Starter evidence', productModule: 'carbon', projectType: 'annual_inventory'
    });
    const upload = await initiateEvidenceUpload(pool, context, storage, {
      projectId: project.id, displayName: 'Starter bill', documentType: 'electricity_bill',
      originalFileName: 'starter.pdf', mediaType: 'application/pdf', byteSize: 1000, sha256: 'e'.repeat(64)
    });
    await finalizeEvidenceUpload(pool, context, storage, upload.uploadId);
    await db.exec('RESET ROLE');
    const scanJob = await claimDocumentJob(pool, { workerId: 'scanner:starter-1', stages: ['malware_scan'] });
    assert.equal(scanJob.object.processingProfile, 'storage_only');
    const completion = await completeDocumentJob(pool, {
      workerId: 'scanner:starter-1', jobId: scanJob.id, result: { outcome: 'clean' }
    });
    assert.equal(completion.nextStage, null);
    assert.equal((await db.query(
      'SELECT extraction_status FROM platform.evidence_versions WHERE id = $1', [upload.versionId]
    )).rows[0].extraction_status, 'not_applicable');
    assert.equal((await db.query(
      "SELECT count(*)::integer AS total FROM platform.document_processing_jobs WHERE evidence_version_id = $1 AND stage = 'extract'",
      [upload.versionId]
    )).rows[0].total, 0);
    await db.exec('SET ROLE terrnix_app_test');
    await assert.rejects(
      getEvidenceReview(pool, context, upload.evidenceId),
      (error) => error.code === 'plan_upgrade_required'
    );
  } finally {
    await db.close();
  }
});

test('feature checks return limits from the active organization subscription', async () => {
  const db = await createTestDatabase();
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    const entitlement = await requireFeature(db, 'projects.total');
    assert.deepEqual(entitlement, { enabled: true, limit: 5, configuration: {} });
    await assert.rejects(requireFeature(db, 'sso.saml'), (error) => error.code === 'plan_upgrade_required');
  } finally {
    await db.close();
  }
});

test('usage metering and trusted billing events drive canonical subscription and invoice state', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  try {
    await bootstrap(db, { organizationId: ids.orgA, userId: ids.userA, slug: 'org-alpha', email: 'alpha@example.com' });
    const context = { userId: ids.userA, organizationId: ids.orgA };
    const usage = await recordUsage(pool, context, {
      featureCode: 'calculations.monthly', quantity: 2, idempotencyKey: 'calculation:batch-1', sourceType: 'calculation'
    });
    assert.equal(usage.used, 2);
    assert.equal((await recordUsage(pool, context, {
      featureCode: 'calculations.monthly', quantity: 2, idempotencyKey: 'calculation:batch-1', sourceType: 'calculation'
    })).duplicate, true);
    assert.equal((await getUsageSnapshot(pool, context)).find((item) => item.code === 'calculations.monthly').used, 2);

    await db.exec('RESET ROLE');
    await db.query(
      `INSERT INTO platform.billing_prices (
         provider, plan_code, billing_interval, currency, unit_amount_minor,
         provider_product_ref, provider_price_ref
       ) VALUES ('stripe','professional','monthly','EUR',9900,'prod_professional','price_professional_monthly')`
    );
    const subscriptionEvent = {
      provider: 'stripe', providerEventRef: 'evt_subscription_1', eventType: 'customer.subscription.updated',
      apiVersion: '2026-08-01', livemode: false, occurredAt: new Date(), kind: 'subscription',
      organizationId: ids.orgA, customerRef: 'cus_alpha', subscriptionRef: 'sub_alpha',
      priceRef: 'price_professional_monthly', status: 'active', billingInterval: 'month',
      cancelAtPeriodEnd: false, trialEndsAt: null, currentPeriodStartsAt: new Date(), currentPeriodEndsAt: new Date(Date.now() + 30 * 86400000)
    };
    assert.equal((await ingestBillingEvent(pool, subscriptionEvent, 'e'.repeat(64))).status, 'processed');
    assert.equal((await ingestBillingEvent(pool, subscriptionEvent, 'e'.repeat(64))).status, 'duplicate');
    const invoiceEvent = {
      provider: 'stripe', providerEventRef: 'evt_invoice_1', eventType: 'invoice.paid',
      apiVersion: '2026-08-01', livemode: false, occurredAt: new Date(), kind: 'invoice',
      organizationId: ids.orgA, customerRef: 'cus_alpha', subscriptionRef: 'sub_alpha',
      invoiceRef: 'in_alpha_1', invoiceNumber: 'TNX-0001', status: 'paid', currency: 'EUR',
      subtotalMinor: 9900, discountMinor: 0, taxMinor: 1980, totalMinor: 11880,
      amountPaidMinor: 11880, amountDueMinor: 0, periodStartsAt: new Date(),
      periodEndsAt: new Date(Date.now() + 30 * 86400000), dueAt: null, paidAt: new Date(),
      hostedInvoiceUrl: 'https://billing.example/invoice', invoicePdfUrl: 'https://billing.example/invoice.pdf'
    };
    assert.equal((await ingestBillingEvent(pool, invoiceEvent, 'f'.repeat(64))).status, 'processed');

    await db.exec('SET ROLE terrnix_app_test');
    await setContext(db, ids.orgA, ids.userA);
    const overview = await getBillingOverview(pool, context);
    assert.equal(overview.subscription.planCode, 'professional');
    assert.equal(overview.subscription.provider, 'stripe');
    assert.equal(overview.history[0].changeType, 'upgraded');
    const invoices = await listBillingInvoices(pool, context);
    assert.equal(invoices.items[0].number, 'TNX-0001');
    assert.equal(invoices.items[0].taxMinor, 1980);
  } finally {
    await db.close();
  }
});
