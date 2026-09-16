import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

import { getInventoryYearOverYear } from '../services/carbonProfessional.js';

test('Carbon Professional migration defines the complete inventory and provenance model', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE terrnix_migrator; GRANT CREATE ON DATABASE postgres TO terrnix_migrator; SET ROLE terrnix_migrator');
    const migrationDirectory = new URL('../db/migrations/', import.meta.url);
    const names = (await fs.readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
    for (const name of names) await db.exec(await fs.readFile(new URL(name, migrationDirectory), 'utf8'));

    const tables = await db.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'platform' AND table_name LIKE 'carbon_%' ORDER BY table_name`
    );
    assert.deepEqual(tables.rows.map((row) => row.table_name), [
      'carbon_activity_data',
      'carbon_activity_evidence',
      'carbon_boundary_members',
      'carbon_calculation_details',
      'carbon_calculation_run_activities',
      'carbon_calculation_runs',
      'carbon_emission_factors',
      'carbon_factor_mapping_proposals',
      'carbon_factor_mapping_reviews',
      'carbon_inventories',
      'carbon_reporting_periods',
      'carbon_scope_categories'
    ]);
    const categories = await db.query(
      'SELECT ghg_scope, count(*)::integer AS count FROM platform.carbon_scope_categories GROUP BY ghg_scope ORDER BY ghg_scope'
    );
    assert.deepEqual(categories.rows, [
      { ghg_scope: 1, count: 4 },
      { ghg_scope: 2, count: 2 },
      { ghg_scope: 3, count: 15 }
    ]);
    const protectedRelations = await db.query(
      `SELECT count(*)::integer AS count FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       WHERE namespace.nspname = 'platform' AND relation.relname LIKE 'carbon_%'
         AND relation.relkind = 'r' AND relation.relrowsecurity AND relation.relforcerowsecurity`
    );
    assert.equal(protectedRelations.rows[0].count, 11);
    const detailColumns = await db.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'platform' AND table_name = 'carbon_calculation_details'`
    );
    const detailColumnNames = new Set(detailColumns.rows.map((row) => row.column_name));
    for (const required of ['scope_2_method', 'calculation_version', 'supersedes_calculation_detail_id', 'recalculation_reason', 'is_current']) {
      assert.ok(detailColumnNames.has(required), `Expected calculation provenance column ${required}`);
    }
    const activityColumns = await db.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'platform' AND table_name = 'carbon_activity_data'`
    );
    assert.ok(new Set(activityColumns.rows.map((row) => row.column_name)).has('approval_status'));
    const periodConstraints = await db.query(
      `SELECT pg_get_constraintdef(oid) AS definition
         FROM pg_constraint
        WHERE conrelid = 'platform.carbon_reporting_periods'::regclass AND contype = 'f'`
    );
    assert.ok(periodConstraints.rows.some((row) =>
      row.definition.includes('(organization_id, comparison_period_id, inventory_id)')),
    'Comparison periods must belong to the same organization and inventory');
    const lifecyclePolicies = await db.query(
      `SELECT policyname FROM pg_policies
        WHERE schemaname = 'platform'
          AND policyname IN ('carbon_factors_review', 'carbon_details_retire')
        ORDER BY policyname`
    );
    assert.deepEqual(lifecyclePolicies.rows.map((row) => row.policyname), [
      'carbon_details_retire',
      'carbon_factors_review'
    ]);
    const workflowTables = await db.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'platform'
          AND table_name IN ('carbon_factor_mapping_proposals','carbon_factor_mapping_reviews',
                             'carbon_calculation_runs','carbon_calculation_run_activities')
        ORDER BY table_name`
    );
    assert.equal(workflowTables.rows.length, 4);
    const lifecycleTriggers = await db.query(
      `SELECT trigger_name FROM information_schema.triggers
        WHERE trigger_schema = 'platform'
          AND trigger_name IN ('carbon_reporting_periods_lifecycle','carbon_activity_data_lifecycle',
                               'calculations_approval_lifecycle','reports_approval_lifecycle')`
    );
    assert.equal(new Set(lifecycleTriggers.rows.map((row) => row.trigger_name)).size, 4);
  } finally {
    await db.close();
  }
});

test('Carbon Professional lifecycle guards allow review and supersession without mutating provenance', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE terrnix_migrator; GRANT CREATE ON DATABASE postgres TO terrnix_migrator; SET ROLE terrnix_migrator');
    const migrationDirectory = new URL('../db/migrations/', import.meta.url);
    const names = (await fs.readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
    for (const name of names) await db.exec(await fs.readFile(new URL(name, migrationDirectory), 'utf8'));

    await db.query("SELECT set_config('app.current_organization_id',$1,false)", ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']);
    await db.query("SELECT set_config('app.current_user_id',$1,false)", ['11111111-1111-4111-8111-111111111111']);
    await db.query(
      'SELECT platform.bootstrap_organization($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      ['11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'auth:lifecycle', 'lifecycle@example.test', 'Lifecycle Owner', 'lifecycle-org', 'Lifecycle Org', null, null]
    );

    await db.exec(`
      CREATE TEMP TABLE factor_guard_probe (
        review_status text NOT NULL,
        reviewed_by uuid,
        reviewed_at timestamptz,
        valid_to date,
        factor_value numeric NOT NULL
      );
      CREATE TRIGGER factor_guard_probe_trigger BEFORE UPDATE OR DELETE ON factor_guard_probe
      FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_emission_factor_mutation();
      INSERT INTO factor_guard_probe (review_status, factor_value) VALUES ('proposed', 0.42);
      UPDATE factor_guard_probe
         SET review_status = 'approved', reviewed_by = '11111111-1111-4111-8111-111111111111', reviewed_at = now();
    `);
    await assert.rejects(
      db.exec('UPDATE factor_guard_probe SET factor_value = 0.99'),
      /Unsupported carbon emission factor lifecycle transition|cannot alter factor provenance/
    );
    await db.exec("UPDATE factor_guard_probe SET review_status = 'superseded', valid_to = '2026-12-31'");
    await assert.rejects(db.exec('DELETE FROM factor_guard_probe'), /append-only/);

    await db.exec(`
      CREATE TEMP TABLE calculation_guard_probe (
        is_current boolean NOT NULL,
        formula text NOT NULL
      );
      CREATE TRIGGER calculation_guard_probe_trigger BEFORE UPDATE OR DELETE ON calculation_guard_probe
      FOR EACH ROW EXECUTE FUNCTION platform.guard_carbon_calculation_detail_mutation();
      INSERT INTO calculation_guard_probe (is_current, formula) VALUES (true, 'activity x factor');
      UPDATE calculation_guard_probe SET is_current = false;
    `);
    await assert.rejects(
      db.exec("UPDATE calculation_guard_probe SET formula = 'changed'"),
      /Carbon calculation provenance is immutable/
    );
    await assert.rejects(db.exec('DELETE FROM calculation_guard_probe'), /append-only/);
  } finally {
    await db.close();
  }
});

test('year-over-year aggregation is tenant-parameterized and maps comparison values', async () => {
  const calls = [];
  const client = {
    async query(text, values) {
      calls.push({ text, values });
      if (text.startsWith('BEGIN') || text.startsWith('SET LOCAL') || text.startsWith('COMMIT')) return { rows: [] };
      if (text.includes('platform.has_permission')) return { rows: [{ allowed: true }] };
      if (text.includes('FROM platform.subscriptions subscription')) return { rows: [{ enabled: true, limit_value: null, configuration: {} }] };
      return { rows: [{
        id: '33333333-3333-4333-8333-333333333333', label: '2026', starts_on: '2026-01-01', ends_on: '2026-12-31',
        scope_1_kg: '100', scope_2_location_kg: '200', scope_2_market_kg: '150', scope_3_kg: '700',
        total_location_kg: '1000', previous_total_location_kg: '800'
      }] };
    },
    release() {}
  };
  const pool = { async connect() { return client; } };
  const context = {
    organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    userId: '11111111-1111-4111-8111-111111111111'
  };
  const inventoryId = '22222222-2222-4222-8222-222222222222';
  const periods = await getInventoryYearOverYear(pool, context, inventoryId);

  const aggregateCall = calls.find((call) => call.text.includes('WITH period_totals'));
  assert.deepEqual(aggregateCall.values, [context.organizationId, inventoryId]);
  assert.equal(aggregateCall.text.includes(context.organizationId), false);
  assert.equal(periods[0].totalLocationKgCo2e, 1000);
  assert.equal(periods[0].yearOverYearPercent, 25);
});
