import assert from 'node:assert/strict';
import test from 'node:test';

import { getCarbonDashboardOverview } from '../services/carbonProfessional.js';
import { listUserOrganizations } from '../services/platformIdentityService.js';

const context = {
  organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  userId: '11111111-1111-4111-8111-111111111111'
};

test('dashboard overview uses the tenant context and maps auditable totals', async () => {
  const calls = [];
  const pool = fakePool(async (text, values) => {
    calls.push({ text, values });
    if (text.includes('platform.has_permission')) return { rows: [{ allowed: true }] };
    if (text.includes('platform.plan_features')) {
      return { rows: [{ enabled: true, limit_value: null, configuration: {} }] };
    }
    if (!text.includes('WITH selected_period')) return { rows: [] };
    return { rows: [{
      id: '22222222-2222-4222-8222-222222222222',
      inventory_id: '33333333-3333-4333-8333-333333333333',
      inventory_name: 'Corporate inventory', label: 'FY2026', starts_on: '2026-01-01',
      ends_on: '2026-12-31', status: 'in_review', scope_1_kg: '100',
      scope_2_location_kg: '200', scope_2_market_kg: '150', scope_3_kg: '700',
      activity_count: 10, evidence_covered_count: 8, high_quality_count: 6,
      approved_count: 7, review_required_count: 2,
      trend: [{ month: '2026-01-01', emissionsKgCo2e: 1000 }]
    }] };
  });

  const overview = await getCarbonDashboardOverview(pool, context);

  const query = calls.find((call) => call.text.includes('WITH selected_period'));
  assert.deepEqual(query.values, [context.organizationId]);
  assert.equal(query.text.includes(context.organizationId), false);
  assert.match(query.text, /CASE WHEN calculation\.status = 'approved'[\s\S]+activity\.review_status = 'approved'[\s\S]+activity\.approval_status = 'approved'[\s\S]+activity\.anomaly_status <> 'flagged'[\s\S]+THEN detail\.emissions_kg_co2e END/);
  assert.doesNotMatch(query.text, /WHERE detail\.id IS NULL/);
  assert.ok(calls.some((call) => call.values?.[0] === 'carbon.professional.workspace'));
  assert.equal(overview.metrics.totalKgCo2e, 1000);
  assert.equal(overview.metrics.evidenceCoveragePercent, 80);
  assert.equal(overview.metrics.highQualityPercent, 60);
  assert.equal(overview.metrics.reviewRequiredCount, 2);
});

test('organization switcher returns only database-filtered user memberships', async () => {
  const calls = [];
  const pool = fakePool(async (text, values) => {
    calls.push({ text, values });
    if (text.includes('list_current_user_organizations')) {
      return { rows: [{
        organization_id: context.organizationId, organization_name: 'Terrnix Test',
        organization_slug: 'terrnix-test', role_code: 'owner', plan_code: 'professional'
      }] };
    }
    return { rows: [] };
  });

  const organizations = await listUserOrganizations(pool, context.userId);

  assert.deepEqual(organizations, [{
    id: context.organizationId, name: 'Terrnix Test', slug: 'terrnix-test',
    role: 'owner', planCode: 'professional'
  }]);
  assert.ok(calls.some((call) => call.text.includes("set_config('app.current_user_id'") && call.values[0] === context.userId));
});

function fakePool(query) {
  return { async connect() { return { query, release() {} }; } };
}
