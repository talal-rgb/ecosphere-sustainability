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
      'carbon_emission_factors',
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
    assert.equal(protectedRelations.rows[0].count, 7);
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
