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

export function calculateFootprint(activityData = {}, factorBundle = {}) {
  const factors = factorBundle.local || {};
  const warnings = [];
  const factorSources = [];

  const fuelType = activityData.fuelType || 'diesel_litre';
  const fuelQuantity = num(activityData.fuelQuantity);
  const fuelFactor = factors.stationary_combustion?.[fuelType];
  const scope1StationaryKg = fuelQuantity * num(fuelFactor?.value);
  pushFactor(factorSources, fuelFactor);
  addWarning(warnings, fuelQuantity > 0 && !fuelFactor, `Missing stationary combustion factor for ${fuelType}.`);

  const vehicleType = activityData.vehicleType || 'passenger_car_gasoline_km';
  const fleetDistanceKm = num(activityData.fleetDistanceKm);
  const vehicleFactor = factors.mobile_combustion?.[vehicleType];
  const scope1MobileKg = fleetDistanceKm * num(vehicleFactor?.value);
  pushFactor(factorSources, vehicleFactor);
  addWarning(warnings, fleetDistanceKm > 0 && !vehicleFactor, `Missing mobile combustion factor for ${vehicleType}.`);

  let scope1FugitiveKg = 0;
  for (const [gas, kg] of Object.entries(activityData.refrigerants || {})) {
    const f = factors.gwp_ar6_100yr?.[gas];
    scope1FugitiveKg += num(kg) * num(f?.value);
    pushFactor(factorSources, f);
    addWarning(warnings, num(kg) > 0 && !f, `Missing GWP factor for refrigerant ${gas}.`);
  }

  const electricityKwh = num(activityData.electricityKwh);
  const electricityRegion = activityData.electricityRegion || 'world_average';
  const dynamicElec = factorBundle.dynamic?.electricity;
  const electricityFactor = dynamicElec || factors.electricity_location_based?.[electricityRegion];
  const scope2LocationKg = electricityKwh * num(electricityFactor?.value);
  pushFactor(factorSources, electricityFactor);
  addWarning(warnings, electricityKwh > 0 && !dynamicElec, 'Using local fallback electricity factor. Configure Electricity Maps or official regional factors for better accuracy.');

  const renewableCertificatesMwh = num(activityData.renewableCertificatesMwh);
  const marketBasedKwh = Math.max(0, electricityKwh - renewableCertificatesMwh * 1000);
  const residualFactor = factors.electricity_market_based?.residual_mix_default || electricityFactor;
  const scope2MarketKg = marketBasedKwh * num(residualFactor?.value);
  pushFactor(factorSources, residualFactor);

  const steamHeatGj = num(activityData.steamHeatGj);
  const steamFactor = factors.purchased_heat?.steam_heat_gj;
  const scope2HeatKg = steamHeatGj * num(steamFactor?.value);
  pushFactor(factorSources, steamFactor);

  const scope3 = activityData.scope3 || {};
  let scope3Kg = 0;
  const scope3Details = [];
  for (const [category, entry] of Object.entries(scope3)) {
    const amount = num(entry.amount);
    const factorId = entry.factorId || category;
    const factor = factors.scope3?.[factorId];
    const kg = amount * num(factor?.value);
    scope3Kg += kg;
    scope3Details.push({ category, amount, unit: entry.unit || factor?.activity_unit || 'unknown', kg_co2e: kg, tonnes_co2e: tonnes(kg), factor });
    pushFactor(factorSources, factor);
    addWarning(warnings, amount > 0 && !factor, `Missing Scope 3 factor for ${category}.`);
  }

  const scope1Kg = scope1StationaryKg + scope1MobileKg + scope1FugitiveKg;
  const scope2LocationTotalKg = scope2LocationKg + scope2HeatKg;
  const scope2MarketTotalKg = scope2MarketKg + scope2HeatKg;
  const totalLocationKg = scope1Kg + scope2LocationTotalKg + scope3Kg;
  const dataQualityScore = Math.max(25, 100 - warnings.length * 10 - (dynamicElec ? 0 : 5));

  return {
    organization: activityData.organization || 'Not provided',
    reporting_period: activityData.reportingPeriod || 'Not provided',
    generated_at: new Date().toISOString(),
    totals: {
      scope1_tonnes_co2e: tonnes(scope1Kg),
      scope2_location_tonnes_co2e: tonnes(scope2LocationTotalKg),
      scope2_market_tonnes_co2e: tonnes(scope2MarketTotalKg),
      scope3_tonnes_co2e: tonnes(scope3Kg),
      total_location_based_tonnes_co2e: tonnes(totalLocationKg)
    },
    breakdown: {
      scope1_stationary_tonnes_co2e: tonnes(scope1StationaryKg),
      scope1_mobile_tonnes_co2e: tonnes(scope1MobileKg),
      scope1_fugitive_tonnes_co2e: tonnes(scope1FugitiveKg),
      scope2_electricity_tonnes_co2e: tonnes(scope2LocationKg),
      scope2_heat_tonnes_co2e: tonnes(scope2HeatKg),
      scope3_details: scope3Details
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
    data_quality_score: dataQualityScore
  };
}

function dedupeFactors(factors) {
  const seen = new Set();
  return factors.filter((f) => {
    if (!f?.id || seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}
