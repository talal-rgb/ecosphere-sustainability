import fs from 'node:fs/promises';
import path from 'node:path';

const localFactorPath = path.join(process.cwd(), 'data', 'emission_factors.local.json');

async function loadLocalFactors() {
  const raw = await fs.readFile(localFactorPath, 'utf8');
  return JSON.parse(raw);
}

async function getElectricityMapsFactor(activityData) {
  if (!process.env.ELECTRICITYMAPS_API_KEY || process.env.ELECTRICITYMAPS_API_KEY.includes('REPLACE_WITH')) return null;
  if (!activityData.electricityMapsZone) return null;
  const url = `https://api.electricitymaps.com/v4/carbon-intensity/latest?zone=${encodeURIComponent(activityData.electricityMapsZone)}`;
  const response = await fetch(url, { headers: { 'auth-token': process.env.ELECTRICITYMAPS_API_KEY } });
  if (!response.ok) return null;
  const data = await response.json();
  if (typeof data.carbonIntensity !== 'number') return null;
  return {
    id: `electricitymaps:${activityData.electricityMapsZone}`,
    name: `Electricity Maps latest carbon intensity for ${activityData.electricityMapsZone}`,
    value: data.carbonIntensity / 1000,
    unit: 'kgCO2e/kWh',
    source: 'Electricity Maps API',
    source_url: 'https://app.electricitymaps.com/developer-hub/api/getting-started',
    year: new Date().getUTCFullYear(),
    retrieved_at: new Date().toISOString(),
    confidence: data.isEstimated ? 'medium' : 'high'
  };
}

export async function getFactorBundle(activityData = {}) {
  const local = await loadLocalFactors();
  const dynamicElectricity = await getElectricityMapsFactor(activityData).catch(() => null);
  return {
    local,
    dynamic: { electricity: dynamicElectricity },
    metadata: {
      generated_at: new Date().toISOString(),
      hierarchy: ['supplier/user-specific', 'official national/regional', 'recognized API/database', 'local fallback default'],
      recommended_sources: [
        'EPA GHG Emission Factors Hub',
        'UK DESNZ GHG Conversion Factors',
        'GHG Protocol guidance',
        'Electricity Maps API',
        'Climatiq API'
      ]
    }
  };
}
