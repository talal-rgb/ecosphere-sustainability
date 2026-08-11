import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import express from 'express';
import request from 'supertest';
import { PGlite } from '@electric-sql/pglite';

import { createSessionContextMiddleware, createTenantContextMiddleware } from '../middleware/authContext.js';
import { provisionPlatformUser } from '../services/platformIdentityService.js';

const migrations = [
  new URL('../db/migrations/001_platform_foundation.sql', import.meta.url),
  new URL('../db/migrations/002_authentication.sql', import.meta.url)
];
const userId = '11111111-1111-4111-8111-111111111111';
const organizationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

async function createTestDatabase() {
  const db = new PGlite();
  await db.exec('CREATE ROLE terrnix_migrator; GRANT CREATE ON DATABASE postgres TO terrnix_migrator; SET ROLE terrnix_migrator');
  for (const migration of migrations) await db.exec(await fs.readFile(migration, 'utf8'));
  await db.exec(`
    RESET ROLE;
    CREATE ROLE terrnix_app_test;
    GRANT USAGE ON SCHEMA platform TO terrnix_app_test;
    GRANT USAGE ON SCHEMA auth TO terrnix_app_test;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO terrnix_app_test;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO terrnix_app_test;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO terrnix_app_test;
    SET ROLE terrnix_app_test;
  `);
  return db;
}

function asPool(db) {
  return { async connect() { return { query: db.query.bind(db), release() {} }; } };
}

function verifiedSession(overrides = {}) {
  return {
    session: { id: 'session-1' },
    user: {
      id: 'auth-user-1',
      platformUserId: userId,
      email: 'owner@example.com',
      name: 'Owner',
      emailVerified: true,
      ...overrides
    }
  };
}

test('authentication migration creates isolated auth persistence with a platform identity link', async () => {
  const db = await createTestDatabase();
  try {
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' AND table_name LIKE 'auth_%' ORDER BY table_name");
    assert.deepEqual(tables.rows.map((row) => row.table_name), [
      'auth_accounts', 'auth_rate_limits', 'auth_sessions', 'auth_users', 'auth_verifications'
    ]);
    const column = await db.query(
      "SELECT data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'auth_users' AND column_name = 'platform_user_id'"
    );
    assert.deepEqual(column.rows[0], { data_type: 'uuid', is_nullable: 'NO' });
  } finally {
    await db.close();
  }
});

test('verified auth identity provisions only its matching platform user', async () => {
  const db = await createTestDatabase();
  const pool = asPool(db);
  try {
    const user = await provisionPlatformUser(pool, {
      userId,
      authSubject: 'auth-user-1',
      email: 'OWNER@EXAMPLE.COM',
      displayName: 'Owner'
    });
    assert.equal(user.id, userId);
    assert.equal(user.email, 'owner@example.com');
    await assert.rejects(
      provisionPlatformUser(pool, {
        userId,
        authSubject: 'different-auth-user',
        email: 'owner@example.com',
        displayName: 'Owner'
      }),
      (error) => error.code === 'identity_mismatch'
    );
  } finally {
    await db.close();
  }
});

test('session middleware rejects anonymous and unverified users and exposes a verified platform identity', async () => {
  const identityProvisioner = async (_pool, input) => ({
    id: input.userId,
    email: input.email,
    display_name: input.displayName
  });
  const buildApp = (session) => {
    const app = express();
    app.get('/session', createSessionContextMiddleware({
      sessionResolver: async () => session,
      identityProvisioner,
      databasePool: {}
    }), (req, res) => res.json(req.authContext));
    return app;
  };

  assert.equal((await request(buildApp(null)).get('/session')).status, 401);
  assert.equal((await request(buildApp(verifiedSession({ emailVerified: false }))).get('/session')).status, 403);
  const response = await request(buildApp(verifiedSession())).get('/session');
  assert.equal(response.status, 200);
  assert.equal(response.body.userId, userId);
  assert.equal(response.body.authSubject, 'auth-user-1');
});

test('tenant middleware treats the organization header as a selection and verifies active membership', async () => {
  const app = express();
  app.get('/tenant',
    createSessionContextMiddleware({
      sessionResolver: async () => verifiedSession(),
      identityProvisioner: async () => ({ id: userId, email: 'owner@example.com', display_name: 'Owner' }),
      databasePool: {}
    }),
    createTenantContextMiddleware({
      databasePool: {},
      membershipResolver: async (_pool, context) => context.organizationId === organizationId
        ? { role_code: 'owner' }
        : null
    }),
    (req, res) => res.json(req.platformContext)
  );

  assert.equal((await request(app).get('/tenant')).status, 400);
  assert.equal((await request(app).get('/tenant').set('X-Terrnix-Organization-ID', 'invalid')).status, 400);
  assert.equal((await request(app).get('/tenant').set('X-Terrnix-Organization-ID', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')).status, 403);
  const response = await request(app).get('/tenant').set('X-Terrnix-Organization-ID', organizationId);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { userId, organizationId, role: 'owner' });
});
