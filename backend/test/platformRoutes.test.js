import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { createPlatformRouter } from '../routes/platform.js';

const context = {
  userId: '11111111-1111-4111-8111-111111111111',
  organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  role: 'owner'
};

function buildApp(services, evidenceStorageResolver) {
  const app = express();
  app.use(express.json());
  app.use('/api/platform', createPlatformRouter({
    requireSession(request, _response, next) {
      request.authContext = { userId: context.userId };
      next();
    },
    requireTenant(request, _response, next) {
      request.platformContext = context;
      next();
    },
    databasePoolResolver: () => ({ name: 'test-pool' }),
    evidenceStorageResolver,
    services
  }));
  app.use((error, _request, response, _next) => {
    response.status(error.status || 500).json({ error: error.code || 'internal_error' });
  });
  return app;
}

test('platform router exposes reusable organization, member, and project resources', async () => {
  const calls = [];
  const app = buildApp({
    async getOrganizationProfile(_pool, receivedContext) {
      calls.push(['organization', receivedContext]);
      return { id: context.organizationId, usage: { activeProjects: 1 } };
    },
    async listOrganizationMembers(_pool, _context, options) {
      calls.push(['members', options]);
      return { items: [{ userId: context.userId }], pagination: { total: 1 } };
    },
    async listProjects(_pool, _context, options) {
      calls.push(['projects', options]);
      return { items: [{ id: 'project-1' }], pagination: { total: 1 } };
    },
    async createProject(_pool, receivedContext, input) {
      calls.push(['create', receivedContext, input]);
      return { id: 'project-2', ...input };
    }
  });

  const organization = await request(app).get('/api/platform/organization');
  assert.equal(organization.status, 200);
  assert.equal(organization.body.organization.id, context.organizationId);

  const members = await request(app).get('/api/platform/members?page=2&pageSize=10');
  assert.equal(members.status, 200);
  assert.deepEqual(calls[1][1], { page: '2', pageSize: '10' });

  const projects = await request(app).get('/api/platform/projects?status=active&productModule=carbon');
  assert.equal(projects.status, 200);
  assert.equal(calls[2][1].productModule, 'carbon');

  const created = await request(app).post('/api/platform/projects').send({
    name: '2026 Inventory',
    productModule: 'carbon',
    projectType: 'annual_inventory'
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.project.name, '2026 Inventory');
});

test('platform router forwards domain errors to the API error boundary', async () => {
  const upgradeRequired = new Error('Upgrade required.');
  upgradeRequired.status = 402;
  upgradeRequired.code = 'plan_upgrade_required';
  const app = buildApp({
    async listProjects() { throw upgradeRequired; }
  });
  const response = await request(app).get('/api/platform/projects');
  assert.equal(response.status, 402);
  assert.equal(response.body.error, 'plan_upgrade_required');
});

test('platform router exposes hierarchy collections through the same tenant boundary', async () => {
  const app = buildApp({
    async listSites(_pool, receivedContext, options) {
      assert.equal(receivedContext.organizationId, context.organizationId);
      assert.equal(options.pageSize, '20');
      return { items: [{ id: 'site-1' }], pagination: { total: 1 } };
    },
    async createSite(_pool, receivedContext, input) {
      assert.equal(receivedContext.role, 'owner');
      return { id: 'site-2', ...input };
    }
  });
  const listed = await request(app).get('/api/platform/sites?pageSize=20');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.items[0].id, 'site-1');
  const created = await request(app).post('/api/platform/sites').send({ name: 'Paris' });
  assert.equal(created.status, 201);
  assert.equal(created.body.resource.name, 'Paris');
});

test('platform router delegates evidence initiation and finalization to the shared intake boundary', async () => {
  const storage = { createUploadIntent() {}, verifyObject() {} };
  const app = buildApp({
    async initiateEvidenceUpload(_pool, receivedContext, receivedStorage, input) {
      assert.equal(receivedContext.organizationId, context.organizationId);
      assert.equal(receivedStorage, storage);
      return { uploadId: 'upload-1', displayName: input.displayName };
    },
    async finalizeEvidenceUpload(_pool, _context, receivedStorage, uploadId) {
      assert.equal(receivedStorage, storage);
      return { uploadId, status: 'finalized' };
    }
  }, () => storage);
  const initiated = await request(app).post('/api/platform/evidence/uploads').send({ displayName: 'Bill' });
  assert.equal(initiated.status, 201);
  const finalized = await request(app).post('/api/platform/evidence/uploads/upload-1/finalize');
  assert.equal(finalized.status, 200);
  assert.equal(finalized.body.evidence.status, 'finalized');
});

test('platform router exposes evidence search, tags, soft deletion, and restoration', async () => {
  const app = buildApp({
    async listEvidence(_pool, _context, options) {
      assert.equal(options.query, 'electricity');
      return { items: [{ id: 'evidence-1' }], pagination: { total: 1 } };
    },
    async addEvidenceTag(_pool, _context, evidenceId, input) {
      return { evidenceId, value: input.tag, created: true };
    },
    async softDeleteEvidence(_pool, _context, evidenceId, input) {
      return { id: evidenceId, reason: input.reason };
    },
    async restoreEvidence(_pool, _context, evidenceId) {
      return { id: evidenceId };
    }
  });
  assert.equal((await request(app).get('/api/platform/evidence?query=electricity')).status, 200);
  assert.equal((await request(app).post('/api/platform/evidence/evidence-1/tags').send({ tag: 'bill' })).status, 201);
  assert.equal((await request(app).delete('/api/platform/evidence/evidence-1').send({ reason: 'duplicate' })).status, 200);
  assert.equal((await request(app).post('/api/platform/evidence/evidence-1/restore')).status, 200);
});

test('platform router exposes billing overview, invoices, and usage as read-only resources', async () => {
  const app = buildApp({
    async getBillingOverview() { return { subscription: { planCode: 'professional' }, usage: [] }; },
    async listBillingInvoices(_pool, _context, options) {
      assert.equal(options.pageSize, '10');
      return { items: [{ id: 'invoice-1' }], pagination: { total: 1 } };
    },
    async getUsageSnapshot() { return [{ code: 'ai.requests.monthly', used: 2 }]; }
  });
  assert.equal((await request(app).get('/api/platform/billing')).body.billing.subscription.planCode, 'professional');
  assert.equal((await request(app).get('/api/platform/billing/invoices?pageSize=10')).body.items[0].id, 'invoice-1');
  assert.equal((await request(app).get('/api/platform/billing/usage')).body.usage[0].used, 2);
});

test('platform router exposes the personal notification center and preferences', async () => {
  const app = buildApp({
    async listNotifications(_pool, _context, options) {
      assert.equal(options.unreadOnly, 'true');
      return { items: [{ id: 'notification-1' }], unread: 1, pagination: { total: 1 } };
    },
    async getNotificationPreferences() { return [{ category: 'risk', emailEnabled: false }]; },
    async updateNotificationPreference(_pool, _context, category, input) {
      return { category, emailEnabled: input.emailEnabled };
    },
    async markNotificationRead() { return { id: 'notification-1', readAt: 'now' }; },
    async markAllNotificationsRead() { return { updated: 3 }; },
    async archiveNotification() { return { id: 'notification-1' }; }
  });
  assert.equal((await request(app).get('/api/platform/notifications?unreadOnly=true')).body.unread, 1);
  assert.equal((await request(app).get('/api/platform/notifications/preferences')).body.preferences[0].category, 'risk');
  assert.equal((await request(app).put('/api/platform/notifications/preferences/risk').send({ emailEnabled: true })).body.preference.emailEnabled, true);
  assert.equal((await request(app).post('/api/platform/notifications/notification-1/read')).status, 200);
  assert.equal((await request(app).post('/api/platform/notifications/read-all')).body.updated, 3);
  assert.equal((await request(app).delete('/api/platform/notifications/notification-1')).status, 200);
});

test('platform router exposes shared report definitions, versions, and generation jobs', async () => {
  const app = buildApp({
    async listReportTemplates() { return [{ code: 'executive-standard' }]; },
    async listReports(_pool, _context, options) { assert.equal(options.status, 'draft'); return { items: [{ id: 'report-1' }], pagination: { total: 1 } }; },
    async createReport(_pool, _context, input) { return { id: 'report-2', title: input.title }; },
    async getReport() { return { id: 'report-1', contentVersions: [] }; },
    async addReportContentVersion() { return { reportId: 'report-1', version: 2 }; },
    async queueReportGeneration(_pool, _context, _id, input) { return { id: 'job-1', outputFormat: input.outputFormat, duplicate: false }; }
  });
  assert.equal((await request(app).get('/api/platform/report-templates')).body.templates[0].code, 'executive-standard');
  assert.equal((await request(app).get('/api/platform/reports?status=draft')).body.items[0].id, 'report-1');
  assert.equal((await request(app).post('/api/platform/reports').send({ title: 'Report' })).status, 201);
  assert.equal((await request(app).get('/api/platform/reports/report-1')).status, 200);
  assert.equal((await request(app).post('/api/platform/reports/report-1/versions').send({ content: {} })).status, 201);
  assert.equal((await request(app).post('/api/platform/reports/report-1/generations').send({ outputFormat: 'pdf' })).status, 202);
});

test('platform router exposes bounded unified search filters', async () => {
  const app = buildApp({
    async searchPlatform(_pool, _context, options) {
      assert.equal(options.query, 'climate');
      assert.equal(options.types, 'project,report');
      return { query: options.query, items: [{ entityType: 'project' }], facets: { project: 1 }, pagination: { total: 1 } };
    }
  });
  const response = await request(app).get('/api/platform/search?query=climate&types=project,report&pageSize=10');
  assert.equal(response.status, 200);
  assert.equal(response.body.items[0].entityType, 'project');
});

test('platform router exposes tenant-bound document review reads and corrections', async () => {
  const evidenceId = 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
  const app = buildApp({
    async getEvidenceReview(_pool, receivedContext, receivedEvidenceId) {
      assert.equal(receivedContext.organizationId, context.organizationId);
      assert.equal(receivedEvidenceId, evidenceId);
      return { evidenceId, status: 'review_required' };
    },
    async submitEvidenceReview(_pool, receivedContext, receivedEvidenceId, input) {
      assert.equal(receivedContext.userId, context.userId);
      assert.equal(receivedEvidenceId, evidenceId);
      return { evidenceId, status: 'approved', versionId: input.versionId };
    }
  });
  const read = await request(app).get(`/api/platform/evidence/${evidenceId}/review`);
  assert.equal(read.status, 200);
  assert.equal(read.body.review.status, 'review_required');
  const corrected = await request(app).post(`/api/platform/evidence/${evidenceId}/review`).send({ versionId: 'version-1' });
  assert.equal(corrected.status, 200);
  assert.equal(corrected.body.review.status, 'approved');
});

test('platform router creates and reads evidence-backed calculation ledger entries', async () => {
  const evidenceId = 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
  const calculationId = 'aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa';
  const app = buildApp({
    async createEvidenceCalculation(_pool, _context, receivedEvidenceId, input) {
      assert.equal(receivedEvidenceId, evidenceId);
      assert.equal(input.factorKey, 'uk_2026');
      return { id: calculationId, duplicate: false };
    },
    async getCalculationLedger(_pool, _context, receivedCalculationId) {
      assert.equal(receivedCalculationId, calculationId);
      return { id: calculationId, inputSha256: 'a'.repeat(64) };
    }
  });
  const created = await request(app).post(`/api/platform/evidence/${evidenceId}/calculations`).send({ factorKey: 'uk_2026' });
  assert.equal(created.status, 201);
  assert.equal(created.body.calculation.id, calculationId);
  const ledger = await request(app).get(`/api/platform/calculations/${calculationId}`);
  assert.equal(ledger.status, 200);
  assert.equal(ledger.body.calculation.inputSha256.length, 64);
});
