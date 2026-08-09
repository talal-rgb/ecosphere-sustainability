function num(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function tonnes(kg) {
  return Math.round((kg / 1000) * 1000) / 1000;
}

function addWarning(warnings, condition, message) {
  if (condition) warnings.push(message);
}

function pushFactor(list, factor) {
  if (factor) list.push(factor);
}

const FACTOR_GROUPS = {
  stationary_combustion: { scope: 1, breakdown: 'stationary' },
  mobile_combustion: { scope: 1, breakdown: 'mobile' },
  electricity_location_based: { scope: 2, breakdown: 'electricity' },
  purchased_heat: { scope: 2, breakdown: 'heat' },
  scope3: { scope: 3, breakdown: 'scope3' }
};

function calculateActivityLines(activities, factors, warnings, factorSources) {
  const lines = [];

  for (const [index, activity] of activities.entries()) {
    const group = FACTOR_GROUPS[activity.factorGroup];
    const factor = group && factors[activity.factorGroup]?.[activity.factorId];
    const quantity = num(activity.quantity);
    const activityId = String(activity.id || `activity-${index + 1}`);

    if (!group || !factor) {
      addWarning(warnings, quantity > 0, `Activity ${activityId} has no approved factor mapping and was excluded.`);
      lines.push({
        activity_id: activityId,
        evidence_ref: activity.evidenceRef || null,
        status: 'excluded',
        reason: 'missing_factor_mapping',
        quantity,
        activity_unit: activity.unit || null
      });
      continue;
    }

    if (normalizeActivityUnit(activity.unit) !== normalizeActivityUnit(factor.activity_unit)) {
      addWarning(warnings, quantity > 0, `Activity ${activityId} uses ${activity.unit || 'no unit'} but factor ${activity.factorId} requires ${factor.activity_unit}; the row was excluded.`);
      lines.push({
        activity_id: activityId,
        evidence_ref: activity.evidenceRef || null,
        status: 'excluded',
        reason: 'activity_unit_mismatch',
        quantity,
        activity_unit: activity.unit || null,
        expected_activity_unit: factor.activity_unit,
        factor_id: activity.factorId
      });
      continue;
    }

    const kg = quantity * num(factor.value);
    pushFactor(factorSources, factor);
    lines.push({
      activity_id: activityId,
      evidence_ref: activity.evidenceRef || null,
      site: activity.site || null,
      supplier: activity.supplier || null,
      activity_date: activity.date || null,
      scope: group.scope,
      ghg_category: activity.ghgCategory || null,
      factor_group: activity.factorGroup,
      factor_id: activity.factorId,
      quantity,
      activity_unit: factor.activity_unit,
      factor_value: factor.value,
      factor_unit: factor.unit,
      emissions_kg_co2e: Math.round(kg * 1000) / 1000,
      emissions_tonnes_co2e: tonnes(kg),
      formula: `${quantity} ${factor.activity_unit} x ${factor.value} ${factor.unit}`,
      status: 'calculated'
    });
  }

  return lines;
}

function normalizeActivityUnit(value) {
  return String(value || '').trim().toLowerCase().replace(/³/g, '3').replace(/\s+/g, '-');
}

export function calculateFootprint(activityData = {}, factorBundle = {}) {
  const factors = factorBundle.local || {};
  const warnings = [];
  const factorSources = [];

  const calculationLines = calculateActivityLines(
    Array.isArray(activityData.activities) ? activityData.activities : [],
    factors,
    warnings,
    factorSources
  );

  const importedScope1StationaryKg = sumLines(calculationLines, 1, 'stationary');
  const importedScope1MobileKg = sumLines(calculationLines, 1, 'mobile');
  const importedScope2ElectricityKg = sumLines(calculationLines, 2, 'electricity');
  const importedScope2HeatKg = sumLines(calculationLines, 2, 'heat');
  const importedScope3Kg = sumLines(calculationLines, 3, 'scope3');

  const fuelAliases = { diesel: 'diesel_litre', petrol: 'petrol_litre', gasoline: 'petrol_litre', natural_gas: 'natural_gas_m3' };
  const requestedFuelType = activityData.fuelType || 'diesel_litre';
  const fuelType = fuelAliases[requestedFuelType] || requestedFuelType;
  const fuelQuantity = num(activityData.fuelQuantity);
  const fuelFactor = factors.stationary_combustion?.[fuelType];
  const scope1StationaryKg = fuelQuantity * num(fuelFactor?.value) + importedScope1StationaryKg;
  if (fuelQuantity > 0) pushFactor(factorSources, fuelFactor);
  addWarning(warnings, fuelQuantity > 0 && !fuelFactor, `Missing stationary combustion factor for ${fuelType}.`);

  const vehicleAliases = { passenger_car_gasoline_km: 'passenger_car_petrol_km' };
  const requestedVehicleType = activityData.vehicleType || 'passenger_car_petrol_km';
  const vehicleType = vehicleAliases[requestedVehicleType] || requestedVehicleType;
  const fleetDistanceKm = num(activityData.fleetDistanceKm);
  const vehicleFactor = factors.mobile_combustion?.[vehicleType];
  const scope1MobileKg = fleetDistanceKm * num(vehicleFactor?.value) + importedScope1MobileKg;
  if (fleetDistanceKm > 0) pushFactor(factorSources, vehicleFactor);
  addWarning(warnings, fleetDistanceKm > 0 && !vehicleFactor, `Missing mobile combustion factor for ${vehicleType}.`);

  let scope1FugitiveKg = 0;
  for (const [gas, kg] of Object.entries(activityData.refrigerants || {})) {
    const f = factors.gwp_ar6_100yr?.[gas];
    scope1FugitiveKg += num(kg) * num(f?.value);
    if (num(kg) > 0) pushFactor(factorSources, f);
    addWarning(warnings, num(kg) > 0 && !f, `Missing GWP factor for refrigerant ${gas}.`);
  }

  const electricityKwh = num(activityData.electricityKwh);
  const electricityRegion = activityData.electricityRegion || 'world_average';
  const dynamicElec = factorBundle.dynamic?.electricity;
  const electricityFactor = dynamicElec || factors.electricity_location_based?.[electricityRegion];
  const scope2LocationKg = electricityKwh * num(electricityFactor?.value) + importedScope2ElectricityKg;
  if (electricityKwh > 0) pushFactor(factorSources, electricityFactor);
  addWarning(warnings, electricityKwh > 0 && !electricityFactor, `Missing electricity factor for ${electricityRegion}.`);
  addWarning(
    warnings,
    electricityKwh > 0 && !dynamicElec && electricityFactor?.confidence === 'low',
    'Using a low-confidence electricity planning proxy. Select a reporting-year and jurisdiction-specific factor.'
  );

  const renewableCertificatesMwh = num(activityData.renewableCertificatesMwh);
  const hasMarketBasedData = activityData.marketBasedConfirmed === true || renewableCertificatesMwh > 0;
  const marketBasedKwh = Math.max(0, electricityKwh - renewableCertificatesMwh * 1000);
  const residualFactor = factors.electricity_market_based?.residual_mix_default || electricityFactor;
  const scope2MarketKg = hasMarketBasedData ? marketBasedKwh * num(residualFactor?.value) : null;
  if (hasMarketBasedData && electricityKwh > 0) pushFactor(factorSources, residualFactor);
  addWarning(
    warnings,
    hasMarketBasedData && residualFactor?.confidence === 'low',
    'Market-based Scope 2 uses a planning proxy, not a verified supplier or residual-mix factor.'
  );
  addWarning(
    warnings,
    importedScope2ElectricityKg > 0,
    'Market-based Scope 2 was not calculated for imported electricity because contractual-instrument data was not supplied.'
  );

  const steamHeatGj = num(activityData.steamHeatGj);
  const steamFactor = factors.purchased_heat?.steam_heat_gj;
  const scope2HeatKg = steamHeatGj * num(steamFactor?.value) + importedScope2HeatKg;
  if (steamHeatGj > 0) pushFactor(factorSources, steamFactor);

  const scope3 = activityData.scope3 || {};
  let scope3Kg = importedScope3Kg;
  const scope3Details = [];
  for (const [category, entry] of Object.entries(scope3)) {
    const amount = num(entry.amount);
    const factorId = entry.factorId || category;
    const factor = factors.scope3?.[factorId];
    const kg = amount * num(factor?.value);
    scope3Kg += kg;
    scope3Details.push({ category, amount, unit: entry.unit || factor?.activity_unit || 'unknown', kg_co2e: kg, tonnes_co2e: tonnes(kg), factor });
    if (amount > 0) pushFactor(factorSources, factor);
    addWarning(warnings, amount > 0 && !factor, `Missing Scope 3 factor for ${category}.`);
  }

  const scope1Kg = scope1StationaryKg + scope1MobileKg + scope1FugitiveKg;
  const scope2LocationTotalKg = scope2LocationKg + scope2HeatKg;
  const marketElectricityIncomplete = importedScope2ElectricityKg > 0 || (electricityKwh > 0 && !hasMarketBasedData);
  const scope2MarketTotalKg = marketElectricityIncomplete ? null : (scope2MarketKg || 0) + scope2HeatKg;
  const totalLocationKg = scope1Kg + scope2LocationTotalKg + scope3Kg;
  const dataQualityScore = Math.max(25, 100 - warnings.length * 10);

  return {
    organization: activityData.organization || 'Not provided',
    reporting_period: activityData.reportingPeriod || 'Not provided',
    generated_at: new Date().toISOString(),
    totals: {
      scope1_tonnes_co2e: tonnes(scope1Kg),
      scope2_location_tonnes_co2e: tonnes(scope2LocationTotalKg),
      scope2_market_tonnes_co2e: scope2MarketTotalKg === null ? null : tonnes(scope2MarketTotalKg),
      scope3_tonnes_co2e: tonnes(scope3Kg),
      total_location_based_tonnes_co2e: tonnes(totalLocationKg)
    },
    breakdown: {
      scope1_stationary_tonnes_co2e: tonnes(scope1StationaryKg),
      scope1_mobile_tonnes_co2e: tonnes(scope1MobileKg),
      scope1_fugitive_tonnes_co2e: tonnes(scope1FugitiveKg),
      scope2_electricity_tonnes_co2e: tonnes(scope2LocationKg),
      scope2_heat_tonnes_co2e: tonnes(scope2HeatKg),
      scope3_details: scope3Details,
      calculation_lines: calculationLines
    },
    factor_sources: dedupeFactors(factorSources),
    formula_summary: [
      'Emissions kgCO2e = activity data x emission factor.',
      'Scope 2 location-based = electricity kWh x selected grid factor.',
      'Scope 2 market-based = remaining kWh after eligible EAC/PPA/green tariff data x residual/supplier factor.',
      'Scope 3 uses activity-based factors where available and spend-based factors only as fallback.'
    ],
    assumptions: [
      'Results are estimates unless verified by a qualified professional.',
      'Fallback factors are for planning and should be replaced with official/supplier-specific factors for reporting.',
      'Market-based Scope 2 requires valid contractual instrument data to be assurance-grade.'
    ],
    warnings,
    data_quality_score: dataQualityScore,
    evidence_summary: {
      activities_received: calculationLines.length,
      activities_calculated: calculationLines.filter((line) => line.status === 'calculated').length,
      activities_excluded: calculationLines.filter((line) => line.status === 'excluded').length,
      evidence_references: [...new Set(calculationLines.map((line) => line.evidence_ref).filter(Boolean))]
    }
  };
}

function sumLines(lines, scope, breakdown) {
  return lines
    .filter((line) => line.status === 'calculated' && line.scope === scope && FACTOR_GROUPS[line.factor_group]?.breakdown === breakdown)
    .reduce((sum, line) => sum + line.emissions_kg_co2e, 0);
}

function dedupeFactors(factors) {
  const seen = new Set();
  return factors.filter((f) => {
    if (!f?.id || seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}
