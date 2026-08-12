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

function buildApp(services) {
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
