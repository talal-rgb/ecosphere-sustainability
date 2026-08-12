import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateFootprint } from '../services/carbonEngine.js';
import { getFactorBundle } from '../services/factorProvider.js';

test('legacy activity inputs calculate against traceable 2026 factors', async () => {
  const activityData = {
    organization: 'Terrnix Test',
    reportingPeriod: '2026',
    fuelType: 'diesel_litre',
    fuelQuantity: 100,
    electricityRegion: 'uk_2026',
    electricityKwh: 1000
  };
  const factors = await getFactorBundle(activityData);
  const result = calculateFootprint(activityData, factors);

  assert.equal(result.totals.scope1_tonnes_co2e, 0.258);
  assert.equal(result.totals.scope2_location_tonnes_co2e, 0.131);
  assert.equal(result.totals.total_location_based_tonnes_co2e, 0.389);
  assert.equal(result.factor_sources.length, 2);
  assert.ok(result.factor_sources.every((factor) => factor.id && factor.source_url && factor.year === 2026));
  assert.equal(result.totals.scope2_market_tonnes_co2e, null);
});

test('imported activity rows preserve evidence and calculation traceability', async () => {
  const activityData = {
    activities: [
      {
        id: 'fuel-1',
        quantity: 100,
        unit: 'litre',
        factorGroup: 'stationary_combustion',
        factorId: 'diesel_litre',
        evidenceRef: 'INV-100',
        site: 'Paris'
      },
      {
        id: 'power-1',
        quantity: 1000,
        unit: 'kWh',
        factorGroup: 'electricity_location_based',
        factorId: 'uk_2026',
        evidenceRef: 'ELEC-1',
        site: 'London'
      },
      {
        id: 'travel-1',
        quantity: 1000,
        unit: 'passenger-km',
        factorGroup: 'scope3',
        factorId: 'business_flight_short_haul_pkm',
        evidenceRef: 'TRAVEL-1'
      }
    ]
  };
  const factors = await getFactorBundle(activityData);
  const result = calculateFootprint(activityData, factors);

  assert.equal(result.totals.scope1_tonnes_co2e, 0.258);
  assert.equal(result.totals.scope2_location_tonnes_co2e, 0.131);
  assert.equal(result.totals.scope3_tonnes_co2e, 0.128);
  assert.equal(result.totals.total_location_based_tonnes_co2e, 0.517);
  assert.deepEqual(result.evidence_summary.evidence_references, ['INV-100', 'ELEC-1', 'TRAVEL-1']);
  assert.equal(result.breakdown.calculation_lines.length, 3);
  assert.match(result.breakdown.calculation_lines[0].formula, /100 litre x 2\.58354/);
});

test('unknown imported mappings are excluded and explicitly warned', async () => {
  const factors = await getFactorBundle({});
  const result = calculateFootprint({ activities: [{ id: 'unknown-1', quantity: 50, factorGroup: 'scope3', factorId: 'not-approved' }] }, factors);

  assert.equal(result.totals.total_location_based_tonnes_co2e, 0);
  assert.equal(result.evidence_summary.activities_excluded, 1);
  assert.match(result.warnings[0], /no approved factor mapping/);
});

test('activity units must match the approved factor unit', async () => {
  const factors = await getFactorBundle({});
  const result = calculateFootprint({ activities: [{
    id: 'wrong-unit',
    quantity: 100,
    unit: 'kg',
    factorGroup: 'stationary_combustion',
    factorId: 'diesel_litre'
  }] }, factors);

  assert.equal(result.totals.scope1_tonnes_co2e, 0);
  assert.equal(result.breakdown.calculation_lines[0].reason, 'activity_unit_mismatch');
  assert.match(result.warnings[0], /requires litre/);
});
