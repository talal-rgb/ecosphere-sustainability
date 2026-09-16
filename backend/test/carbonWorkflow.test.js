import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

import {
  createCarbonActivity,
  createCarbonBoundaryMember,
  createCarbonCalculationRun,
  createCarbonInventory,
  createCarbonReportingPeriod,
  getCarbonCalculationRun,
  proposeCarbonFactor,
  reviewCarbonActivity,
  reviewCarbonFactorProposal
} from '../services/carbonWorkflow.js';
import { bootstrapOrganization, createFacility, createProject, createSite } from '../services/platformService.js';

const ids = {
  userA: '11111111-1111-4111-8111-111111111111', orgA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  userB: '22222222-2222-4222-8222-222222222222', orgB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
};

test('Carbon Professional workflow is reviewed, multi-lineage ready, and tenant isolated', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE terrnix_migrator; GRANT CREATE ON DATABASE postgres TO terrnix_migrator; SET ROLE terrnix_migrator');
    const directory = new URL('../db/migrations/', import.meta.url);
    for (const name of (await fs.readdir(directory)).filter((item) => item.endsWith('.sql')).sort()) {
      await db.exec(await fs.readFile(new URL(name, directory), 'utf8'));
    }
    await db.exec(`RESET ROLE; CREATE ROLE terrnix_app_test;
      GRANT USAGE ON SCHEMA platform TO terrnix_app_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO terrnix_app_test;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO terrnix_app_test;
      SET ROLE terrnix_app_test`);
    const pool = { async connect() { return { query: db.query.bind(db), release() {} }; } };
    const contextA = { organizationId: ids.orgA, userId: ids.userA };
    await bootstrapOrganization(pool, { userId: ids.userA, organizationId: ids.orgA,
      email: 'owner-a@example.test', displayName: 'Owner A', authSubject: 'auth:a',
      organizationName: 'Organization A', organizationSlug: 'organization-a' });
    await db.exec('RESET ROLE');
    await db.query("UPDATE platform.subscriptions SET plan_code='professional', status='active' WHERE organization_id=$1", [ids.orgA]);
    await db.exec('SET ROLE terrnix_app_test');

    const site = await createSite(pool, contextA, { name: 'Paris', countryCode: 'FR' });
    const facility = await createFacility(pool, contextA, { siteId: site.id, name: 'Paris Office' });
    const project = await createProject(pool, contextA, { name: '2026 Inventory', productModule: 'carbon', projectType: 'annual_inventory', facilityId: facility.id });
    const inventory = await createCarbonInventory(pool, contextA, { name: 'Corporate 2026', consolidationApproach: 'operational_control' });
    const period = await createCarbonReportingPeriod(pool, contextA, inventory.id, { label: '2026', startsOn: '2026-01-01', endsOn: '2026-12-31' });
    await createCarbonBoundaryMember(pool, contextA, inventory.id, { facilityId: facility.id, consolidationPercent: 100, controlClassification: 'operational_control' });
    const activity = await createCarbonActivity(pool, contextA, { inventoryId: inventory.id, reportingPeriodId: period.id,
      projectId: project.id, facilityId: facility.id, scopeCategoryCode: 'scope_2.purchased_electricity',
      activityType: 'purchased electricity', quantity: 1200, unit: 'kWh', activityDate: '2026-01-31', dataQualityStatus: 'primary' });
    const engineerId = '33333333-3333-4333-8333-333333333333';
    await db.exec('RESET ROLE');
    await db.query(
      `INSERT INTO platform.app_users (id, auth_subject, email, display_name) VALUES ($1,$2,$3,$4)`,
      [engineerId, 'auth:engineer', 'engineer@example.test', 'Engineer']
    );
    await db.query(
      `INSERT INTO platform.organization_memberships (organization_id, user_id, role_code, status, joined_at)
       VALUES ($1,$2,'engineer','active',now())`, [ids.orgA, engineerId]
    );
    await db.exec('SET ROLE terrnix_app_test');
    await db.query("SELECT set_config('app.current_organization_id',$1,false)", [ids.orgA]);
    await db.query("SELECT set_config('app.current_user_id',$1,false)", [engineerId]);
    await assert.rejects(
      db.query("UPDATE platform.carbon_activity_data SET review_status='approved', approval_status='approved' WHERE id=$1", [activity.id]),
      /approval permission/i
    );
    const proposal = await proposeCarbonFactor(pool, contextA, activity.id, { geography: 'GB' });
    assert.equal(proposal.compatibility, 'compatible');
    assert.equal(proposal.requiresReview, true);
    await reviewCarbonFactorProposal(pool, contextA, proposal.id, { decision: 'accepted', expectedRevision: 0, reasonCode: 'review.source_verified' });
    await reviewCarbonActivity(pool, contextA, activity.id, { decision: 'approved', reason: 'Evidence checked' });
    const run = await createCarbonCalculationRun(pool, contextA, { inventoryId: inventory.id, reportingPeriodId: period.id,
      activityIds: [activity.id], idempotencyKey: 'org-a-2026-run-1' });
    assert.equal(run.lines.length, 1);
    assert.equal(run.result.scope2LocationKgCo2e, 157.152);
    const duplicate = await createCarbonCalculationRun(pool, contextA, { inventoryId: inventory.id, reportingPeriodId: period.id,
      activityIds: [activity.id], idempotencyKey: 'org-a-2026-run-1' });
    assert.equal(duplicate.duplicate, true);
    await assert.rejects(
      createCarbonCalculationRun(pool, contextA, { inventoryId: inventory.id, reportingPeriodId: period.id,
        activityIds: [activity.id], idempotencyKey: 'org-a-2026-run-2' }),
      /recalculationReason/
    );
    const rerun = await createCarbonCalculationRun(pool, contextA, { inventoryId: inventory.id, reportingPeriodId: period.id,
      activityIds: [activity.id], idempotencyKey: 'org-a-2026-run-2', recalculationReason: 'Corrected reporting run' });
    assert.equal(rerun.lines.length, 1);
    const versions = await db.query(
      `SELECT calculation_version, is_current FROM platform.carbon_calculation_details
        WHERE organization_id=$1 AND activity_data_id=$2 ORDER BY calculation_version`, [ids.orgA, activity.id]
    );
    assert.deepEqual(versions.rows, [{ calculation_version: 1, is_current: false }, { calculation_version: 2, is_current: true }]);

    const contextB = { organizationId: ids.orgB, userId: ids.userB };
    await bootstrapOrganization(pool, { userId: ids.userB, organizationId: ids.orgB,
      email: 'owner-b@example.test', displayName: 'Owner B', authSubject: 'auth:b',
      organizationName: 'Organization B', organizationSlug: 'organization-b' });
    await db.exec('RESET ROLE');
    await db.query("UPDATE platform.subscriptions SET plan_code='professional', status='active' WHERE organization_id=$1", [ids.orgB]);
    await db.exec('SET ROLE terrnix_app_test');
    await assert.rejects(getCarbonCalculationRun(pool, contextB, run.id), /not found/i);
  } finally {
    await db.close();
  }
});

test('factor proposals fail closed when no deterministic match exists', async () => {
  const calls = [];
  const client = {
    async query(text, values) {
      calls.push({ text, values });
      if (text.includes('platform.has_permission')) return { rows: [{ allowed: true }] };
      if (text.includes('FROM platform.subscriptions subscription')) return { rows: [{ enabled: true, limit_value: null, configuration: {} }] };
      if (text.includes('FROM platform.carbon_activity_data')) return { rows: [{ id: 'aaaaaaaa-3000-4000-8000-aaaaaaaaaaaa', activity_type: 'unknown', unit: 'widgets', scope_category_code: 'scope_3.01' }] };
      if (text.includes('COALESCE(max(revision)')) return { rows: [{ revision: 0 }] };
      return { rows: [] };
    }, release() {}
  };
  const pool = { async connect() { return client; } };
  const proposal = await proposeCarbonFactor(pool, { organizationId: ids.orgA, userId: ids.userA }, 'aaaaaaaa-3000-4000-8000-aaaaaaaaaaaa');
  assert.equal(proposal.factorId, null);
  assert.equal(proposal.compatibility, 'incompatible');
  assert.equal(proposal.requiresReview, true);
  assert.ok(calls.some((call) => call.text.includes('carbon_factor_mapping_proposals')));
});
