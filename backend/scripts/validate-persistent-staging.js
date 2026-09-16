import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
if (process.env.STAGING_E2E_CONFIRM !== 'persistent-staging') {
  throw new Error('Refusing to inspect a persistent database without STAGING_E2E_CONFIRM=persistent-staging.');
}

const connections = {
  application: requiredStagingUrl('STAGING_DATABASE_URL'),
  documentWorker: requiredStagingUrl('STAGING_DOCUMENT_WORKER_DATABASE_URL'),
  billing: requiredStagingUrl('STAGING_BILLING_DATABASE_URL'),
  reportWorker: requiredStagingUrl('STAGING_REPORT_WORKER_DATABASE_URL')
};
const usernames = new Set(Object.values(connections).map((value) => value.username));
if (usernames.size !== Object.keys(connections).length) {
  throw new Error('Application, document-worker, billing, and report-worker database roles must be distinct.');
}

const pools = Object.fromEntries(Object.entries(connections).map(([name, url]) => [
  name,
  new Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    ssl: process.env.STAGING_DATABASE_SSL === 'disable' ? undefined : { rejectUnauthorized: true },
    application_name: `terrnix-staging-preflight-${name}`
  })
]));

try {
  const identities = {};
  for (const [name, pool] of Object.entries(pools)) identities[name] = await validateIdentity(name, pool);
  await validateMigrations(pools.application);
  await validateRequiredRelations(pools.application);
  await validateRls(pools.application);
  await assertAllowed(pools.application, 'SELECT id FROM platform.organizations LIMIT 0', 'application tenant reads');
  await assertDenied(pools.application, 'UPDATE platform.subscriptions SET status = status WHERE false', 'application subscription writes');
  await assertAllowed(pools.documentWorker, 'SELECT id FROM platform.document_processing_jobs LIMIT 0', 'document-worker queue reads');
  await assertDenied(pools.documentWorker, 'SELECT id FROM auth.auth_users LIMIT 0', 'document-worker auth reads');
  await assertAllowed(pools.billing, 'SELECT id FROM platform.subscriptions LIMIT 0', 'billing subscription reads');
  await assertDenied(pools.billing, 'SELECT id FROM platform.evidence_documents LIMIT 0', 'billing evidence reads');
  await assertAllowed(pools.reportWorker, 'SELECT id FROM platform.reports LIMIT 0', 'report-worker report reads');
  await assertDenied(pools.reportWorker, 'SELECT id FROM auth.auth_users LIMIT 0', 'report-worker auth reads');

  console.log(JSON.stringify({
    ok: true,
    environment: 'staging',
    database: identities.application.database,
    roles: Object.fromEntries(Object.entries(identities).map(([name, identity]) => [
      name,
      { role: identity.role, superuser: identity.superuser, bypassRls: identity.bypassRls, ownsDatabase: identity.ownsDatabase }
    ])),
    migrations: 'checksums verified',
    tenantIsolation: 'RLS enabled and forced on tenant relations',
    privilegeSeparation: 'verified'
  }, null, 2));
} finally {
  await Promise.all(Object.values(pools).map((pool) => pool.end().catch(() => {})));
}

async function validateIdentity(name, pool) {
  const result = await pool.query(
    `SELECT current_database() AS database, current_user AS role,
            role.rolsuper AS superuser, role.rolbypassrls AS bypass_rls,
            database.datdba = role.oid AS owns_database
       FROM pg_database database
       JOIN pg_roles role ON role.rolname = current_user
      WHERE database.datname = current_database()`
  );
  const identity = result.rows[0];
  if (!identity || identity.superuser || identity.owns_database) {
    throw new Error(`${name} must use a non-owner, non-superuser database role.`);
  }
  if (name === 'application' && identity.bypass_rls) {
    throw new Error('The public application role must not have BYPASSRLS.');
  }
  if (name !== 'application' && !identity.bypass_rls) {
    throw new Error(`${name} must use its dedicated cross-tenant BYPASSRLS worker role.`);
  }
  return {
    database: identity.database,
    role: identity.role,
    superuser: identity.superuser,
    bypassRls: identity.bypass_rls,
    ownsDatabase: identity.owns_database
  };
}

async function validateMigrations(pool) {
  const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
  const names = (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  const applied = await pool.query('SELECT name, checksum FROM platform.schema_migrations ORDER BY name');
  const rows = new Map(applied.rows.map((row) => [row.name, row.checksum]));
  for (const name of names) {
    const sql = await fs.readFile(path.join(directory, name), 'utf8');
    const expected = crypto.createHash('sha256').update(sql).digest('hex');
    if (rows.get(name) !== expected) throw new Error(`Migration is missing or has a different checksum: ${name}`);
  }
  if (rows.size !== names.length) throw new Error('Persistent staging contains an unexpected migration set.');
}

async function validateRequiredRelations(pool) {
  const required = [
    'app_users', 'organizations', 'organization_memberships', 'roles', 'business_units',
    'sites', 'facilities', 'projects', 'evidence_documents', 'evidence_versions',
    'document_processing_jobs', 'document_field_reviews', 'document_classification_reviews',
    'calculations', 'calculation_lineage', 'reports', 'subscriptions', 'plan_features', 'audit_events',
    'carbon_inventories', 'carbon_reporting_periods', 'carbon_boundary_members',
    'carbon_activity_data', 'carbon_activity_evidence', 'carbon_emission_factors',
    'carbon_calculation_details', 'carbon_factor_mapping_proposals',
    'carbon_factor_mapping_reviews', 'carbon_calculation_runs',
    'carbon_calculation_run_activities'
  ];
  const result = await pool.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'platform' AND table_name = ANY($1::text[])`,
    [required]
  );
  const present = new Set(result.rows.map((row) => row.table_name));
  const missing = required.filter((name) => !present.has(name));
  if (missing.length) throw new Error(`Persistent staging is missing required relations: ${missing.join(', ')}`);
}

async function validateRls(pool) {
  const tenantRelations = [
    'business_units', 'sites', 'facilities', 'projects', 'evidence_documents', 'evidence_versions',
    'document_processing_jobs', 'document_field_reviews', 'document_classification_reviews',
    'calculations', 'calculation_lineage', 'reports', 'audit_events', 'carbon_inventories',
    'carbon_reporting_periods', 'carbon_boundary_members', 'carbon_activity_data',
    'carbon_activity_evidence', 'carbon_emission_factors', 'carbon_calculation_details',
    'carbon_factor_mapping_proposals', 'carbon_factor_mapping_reviews',
    'carbon_calculation_runs', 'carbon_calculation_run_activities'
  ];
  const result = await pool.query(
    `SELECT relname, relrowsecurity, relforcerowsecurity
       FROM pg_class
       JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE nspname = 'platform' AND relname = ANY($1::text[])`,
    [tenantRelations]
  );
  const invalid = result.rows.filter((row) => !row.relrowsecurity || !row.relforcerowsecurity).map((row) => row.relname);
  if (result.rows.length !== tenantRelations.length || invalid.length) {
    throw new Error(`Tenant RLS is incomplete: ${invalid.join(', ') || 'one or more relations are missing'}`);
  }
}

async function assertAllowed(pool, sql, label) {
  try {
    await pool.query(sql);
  } catch {
    throw new Error(`Expected privilege is missing: ${label}.`);
  }
}

async function assertDenied(pool, sql, label) {
  try {
    await pool.query(sql);
  } catch (error) {
    if (error.code === '42501') return;
    throw new Error(`Unable to verify denied privilege: ${label}.`);
  }
  throw new Error(`Forbidden privilege is present: ${label}.`);
}

function requiredStagingUrl(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured through the secure staging environment.`);
  const parsed = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error(`${name} must be a PostgreSQL URL.`);
  const database = parsed.pathname.slice(1);
  if (!database.endsWith('_staging') && database !== 'terrnix_staging') {
    throw new Error(`${name} does not target a staging-named database.`);
  }
  if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
    throw new Error(`${name} must target persistent staging, not a local database.`);
  }
  return parsed;
}
