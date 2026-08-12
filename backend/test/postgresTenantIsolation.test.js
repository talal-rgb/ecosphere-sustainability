import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { withPlatformContext } from '../services/database.js';
import { finalizeEvidenceUpload, initiateEvidenceUpload } from '../services/evidenceIntake.js';
import { getEvidence } from '../services/evidenceRepository.js';
import {
  bootstrapOrganization,
  createBusinessUnit,
  createFacility,
  createProject,
  createSite
} from '../services/platformService.js';

const { Pool } = pg;
const adminUrl = process.env.STAGING_TEST_DATABASE_URL;
const enabled = process.env.STAGING_E2E_CONFIRM === 'ephemeral-only' && Boolean(adminUrl);
const ids = {
  userA: '11111111-1111-4111-8111-111111111111',
  orgA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  userB: '22222222-2222-4222-8222-222222222222',
  orgB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
};

test('real PostgreSQL enforces organization isolation through hierarchy and private evidence', { skip: !enabled }, async () => {
  const parsedAdminUrl = new URL(adminUrl);
  if (!parsedAdminUrl.pathname.endsWith('_e2e')) {
    throw new Error('Refusing to run destructive staging integration setup outside an *_e2e database.');
  }
  const admin = new Pool({ connectionString: adminUrl, max: 1 });
  const appPassword = 'e2e-app-role-password';
  const appUrl = new URL(adminUrl);
  appUrl.username = 'terrnix_app_e2e';
  appUrl.password = appPassword;
  const app = new Pool({ connectionString: appUrl.toString(), max: 2 });
  try {
    await admin.query(`CREATE ROLE terrnix_app_e2e LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`);
    const migrationDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
    const migrations = (await fs.readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
    for (const migration of migrations) {
      await admin.query(await fs.readFile(path.join(migrationDirectory, migration), 'utf8'));
    }
    await admin.query(`
      GRANT USAGE ON SCHEMA platform TO terrnix_app_e2e;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO terrnix_app_e2e;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO terrnix_app_e2e;
    `);

    await bootstrapOrganization(app, {
      userId: ids.userA, organizationId: ids.orgA, authSubject: `auth:${ids.userA}`,
      email: 'owner-a@example.test', displayName: 'Owner A',
      organizationSlug: 'organization-alpha', organizationName: 'Organization Alpha'
    });
    await bootstrapOrganization(app, {
      userId: ids.userB, organizationId: ids.orgB, authSubject: `auth:${ids.userB}`,
      email: 'owner-b@example.test', displayName: 'Owner B',
      organizationSlug: 'organization-beta', organizationName: 'Organization Beta'
    });
    await admin.query(
      `UPDATE platform.subscriptions SET plan_code = 'professional', status = 'active'
       WHERE organization_id IN ($1, $2)`,
      [ids.orgA, ids.orgB]
    );

    const contextA = { userId: ids.userA, organizationId: ids.orgA };
    const contextB = { userId: ids.userB, organizationId: ids.orgB };
    const businessUnit = await createBusinessUnit(app, contextA, { name: 'Operations' });
    const site = await createSite(app, contextA, { name: 'Paris site', businessUnitId: businessUnit.id, countryCode: 'FR' });
    const facility = await createFacility(app, contextA, { name: 'Main facility', siteId: site.id, facilityType: 'office' });
    const project = await createProject(app, contextA, {
      name: '2026 inventory', productModule: 'carbon', projectType: 'annual_inventory',
      businessUnitId: businessUnit.id, siteId: site.id, facilityId: facility.id
    });
    const storage = {
      provider: 's3',
      bucket: 'terrnix-staging-private',
      async createUploadIntent() {
        return {
          method: 'PUT', url: 'https://private-storage.example.test/signed-upload',
          expiresInSeconds: 600, requiredHeaders: { 'x-amz-server-side-encryption': 'AES256' }
        };
      },
      async verifyObject() {}
    };
    const upload = await initiateEvidenceUpload(app, contextA, storage, {
      projectId: project.id, displayName: 'January electricity bill', documentType: 'electricity_bill',
      originalFileName: 'electricity-january.pdf', mediaType: 'application/pdf',
      byteSize: 4096, sha256: 'a'.repeat(64)
    });
    await finalizeEvidenceUpload(app, contextA, storage, upload.uploadId);

    await assert.rejects(
      getEvidence(app, contextB, upload.evidenceId),
      (error) => error.code === 'not_found'
    );
    const crossTenantRead = await withPlatformContext(app, contextB, (client) => client.query(
      'SELECT id FROM platform.evidence_documents WHERE id = $1', [upload.evidenceId]
    ));
    assert.equal(crossTenantRead.rows.length, 0);
    await assert.rejects(
      withPlatformContext(app, contextB, (client) => client.query(
        `INSERT INTO platform.projects (organization_id, name, product_module, project_type, owner_user_id)
         VALUES ($1, 'Forbidden cross-tenant project', 'carbon', 'annual_inventory', $2)`,
        [ids.orgA, ids.userB]
      )),
      /row-level security/
    );
    const auditA = await withPlatformContext(app, contextA, (client) => client.query(
      'SELECT count(*)::integer AS total FROM platform.audit_events WHERE organization_id = $1', [ids.orgA]
    ));
    const auditB = await withPlatformContext(app, contextB, (client) => client.query(
      'SELECT count(*)::integer AS total FROM platform.audit_events WHERE organization_id = $1', [ids.orgA]
    ));
    assert.ok(auditA.rows[0].total >= 6);
    assert.equal(auditB.rows[0].total, 0);
  } finally {
    await app.end().catch(() => {});
    await admin.end().catch(() => {});
  }
});
