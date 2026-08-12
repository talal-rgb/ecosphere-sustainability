import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { createEvidenceCalculation, getCalculationLedger } from '../services/calculationLedger.js';
import { withPlatformContext } from '../services/database.js';
import { getEvidenceReview, submitEvidenceReview } from '../services/documentIntelligence.js';
import { claimDocumentJob, completeDocumentJob } from '../services/documentWorker.js';
import { finalizeEvidenceUpload, initiateEvidenceUpload } from '../services/evidenceIntake.js';
import { getEvidence } from '../services/evidenceRepository.js';
import { createReport, getReport } from '../services/reportEngine.js';
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
  const workerPassword = 'e2e-document-worker-password';
  const workerUrl = new URL(adminUrl);
  workerUrl.username = 'terrnix_document_worker_e2e';
  workerUrl.password = workerPassword;
  const documentWorker = new Pool({ connectionString: workerUrl.toString(), max: 1 });
  try {
    await admin.query(`CREATE ROLE terrnix_app_e2e LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`);
    await admin.query(`CREATE ROLE terrnix_document_worker_e2e LOGIN PASSWORD '${workerPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS`);
    const migrationDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
    const migrations = (await fs.readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
    for (const migration of migrations) {
      await admin.query(await fs.readFile(path.join(migrationDirectory, migration), 'utf8'));
    }
    await admin.query(`
      GRANT USAGE ON SCHEMA platform TO terrnix_app_e2e;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO terrnix_app_e2e;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO terrnix_app_e2e;
      GRANT USAGE ON SCHEMA platform TO terrnix_document_worker_e2e;
      GRANT SELECT, INSERT, UPDATE ON platform.document_processing_jobs TO terrnix_document_worker_e2e;
      GRANT SELECT, UPDATE ON platform.evidence_versions TO terrnix_document_worker_e2e;
      GRANT SELECT, UPDATE ON platform.evidence_documents TO terrnix_document_worker_e2e;
      GRANT SELECT, INSERT ON platform.document_extraction_runs TO terrnix_document_worker_e2e;
      GRANT SELECT, INSERT ON platform.document_extracted_fields TO terrnix_document_worker_e2e;
      GRANT SELECT, INSERT ON platform.document_classification_proposals TO terrnix_document_worker_e2e;
      GRANT SELECT, INSERT ON platform.audit_events TO terrnix_document_worker_e2e;
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

    const scanJob = await claimDocumentJob(documentWorker, {
      workerId: 'scanner:postgres-e2e', stages: ['malware_scan']
    });
    await completeDocumentJob(documentWorker, {
      workerId: 'scanner:postgres-e2e', jobId: scanJob.id, result: { outcome: 'clean', engine: 'e2e-scanner' }
    });
    const extractJob = await claimDocumentJob(documentWorker, {
      workerId: 'extractor:postgres-e2e', stages: ['extract']
    });
    await completeDocumentJob(documentWorker, {
      workerId: 'extractor:postgres-e2e', jobId: extractJob.id,
      result: {
        provider: 'e2e-parser', model: 'utility-v1', schemaVersion: 'carbon-activity-v1',
        confidence: 0.76, data: { consumption: 1250 },
        fields: [{
          code: 'activity_quantity', value: 1250, unit: 'kWh', confidence: 0.62,
          source: { page: 2, boundingBox: [0.1, 0.2, 0.3, 0.4] }
        }]
      }
    });
    const classifyJob = await claimDocumentJob(documentWorker, {
      workerId: 'classifier:postgres-e2e', stages: ['classify']
    });
    await completeDocumentJob(documentWorker, {
      workerId: 'classifier:postgres-e2e', jobId: classifyJob.id,
      result: {
        provider: 'e2e-classifier', model: 'carbon-v1', documentType: 'electricity_bill',
        activityType: 'purchased_electricity', ghgScope: 'scope_2', confidence: 0.74,
        rationaleCode: 'utility.electricity'
      }
    });
    const validateJob = await claimDocumentJob(documentWorker, {
      workerId: 'validator:postgres-e2e', stages: ['validate']
    });
    const validation = await completeDocumentJob(documentWorker, {
      workerId: 'validator:postgres-e2e', jobId: validateJob.id, result: {}
    });
    assert.equal(validation.nextStage, null);

    const pendingReview = await getEvidenceReview(app, contextA, upload.evidenceId);
    assert.equal(pendingReview.status, 'review_required');
    const quantity = pendingReview.fields.find((field) => field.code === 'activity_quantity');
    const approvedReview = await submitEvidenceReview(app, contextA, upload.evidenceId, {
      versionId: upload.versionId,
      classification: {
        proposalId: pendingReview.classification.proposalId, expectedRevision: 0,
        decision: 'accepted', reasonCode: 'utility.bill_confirmed'
      },
      fields: [{
        fieldId: quantity.fieldId, expectedRevision: 0, decision: 'corrected',
        correctedValue: 1.2, correctedUnit: 'MWh', reasonCode: 'invoice.total_verified',
        comment: 'Verified against the uploaded electricity bill.'
      }]
    });
    assert.equal(approvedReview.status, 'approved');

    const calculation = await createEvidenceCalculation(app, contextA, upload.evidenceId, {
      versionId: upload.versionId, quantityFieldId: quantity.fieldId, siteId: site.id,
      factorGroup: 'electricity_location_based', factorKey: 'uk_2026',
      idempotencyKey: 'postgres-e2e:electricity:2026-01', mappingReason: 'reviewed_location_based_factor'
    });
    assert.equal(calculation.result.emissionsKgCo2e, 157.152);
    assert.equal(calculation.provenance.fieldReviewId !== null, true);
    assert.equal(calculation.inputSha256.length, 64);

    const report = await createReport(app, contextA, {
      projectId: project.id, templateCode: 'executive-standard', title: '2026 Carbon Inventory',
      reportingStandard: 'GHG Protocol', calculationIds: [calculation.id], evidenceIds: [upload.evidenceId],
      content: {
        methodology: 'Activity data multiplied by a versioned emission factor.',
        scope2: { kgCo2e: calculation.result.emissionsKgCo2e },
        reviewStatus: 'review-ready'
      },
      sourceManifest: { calculationIds: [calculation.id], evidenceIds: [upload.evidenceId] }
    });
    const persistedReport = await getReport(app, contextA, report.id);
    assert.equal(persistedReport.status, 'draft');
    assert.equal(persistedReport.contentVersions[0].sourceManifest.calculationIds[0], calculation.id);

    await assert.rejects(
      getEvidence(app, contextB, upload.evidenceId),
      (error) => error.code === 'not_found'
    );
    await assert.rejects(
      getCalculationLedger(app, contextB, calculation.id),
      (error) => error.code === 'not_found'
    );
    await assert.rejects(
      getReport(app, contextB, report.id),
      (error) => error.code === 'report_not_found'
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
      'SELECT action FROM platform.audit_events WHERE organization_id = $1 ORDER BY created_at, id', [ids.orgA]
    ));
    const auditB = await withPlatformContext(app, contextB, (client) => client.query(
      'SELECT action FROM platform.audit_events WHERE organization_id = $1', [ids.orgA]
    ));
    const auditActions = new Set(auditA.rows.map((row) => row.action));
    for (const action of [
      'organization.created', 'project.created', 'evidence.upload_initiated',
      'evidence.upload_finalized', 'document_processing.completed',
      'document_intelligence.reviewed', 'calculation.created_from_evidence', 'report.created'
    ]) {
      assert.ok(auditActions.has(action), `Expected audit action ${action}`);
    }
    assert.equal(auditB.rows.length, 0);
  } finally {
    await documentWorker.end().catch(() => {});
    await app.end().catch(() => {});
    await admin.end().catch(() => {});
  }
});
