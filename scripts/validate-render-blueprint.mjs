import fs from 'node:fs';
import YAML from 'yaml';

const blueprint = YAML.parse(fs.readFileSync(new URL('../render.yaml', import.meta.url), 'utf8'));
const project = blueprint.projects?.find((entry) => entry.name === 'terrnix-platform');
const staging = project?.environments?.find((entry) => entry.name === 'staging');
if (!staging) throw new Error('The terrnix-platform staging environment is missing.');

const website = staging.services?.find((entry) => entry.name === 'terrnix-staging');
const api = staging.services?.find((entry) => entry.name === 'terrnix-staging-api');
const database = staging.databases?.find((entry) => entry.name === 'terrnix-staging-postgres');
if (!website || website.runtime !== 'static') throw new Error('The staging website is missing.');
if (!api || api.runtime !== 'node' || api.rootDir !== 'backend') throw new Error('The staging API must use the backend Node runtime.');
if (!database || database.plan === 'free') throw new Error('Persistent staging must not use an expiring free database.');
if (database.plan !== '0.1c-256mb' || database.diskSizeGB !== 1) {
  throw new Error('Staging PostgreSQL must use the smallest paid persistent configuration.');
}
if (!Array.isArray(database.ipAllowList) || database.ipAllowList.length !== 0) {
  throw new Error('The staging database must block external network connections by default.');
}
if (api.branch !== 'main' || api.healthCheckPath !== '/health' || api.autoDeployTrigger !== 'checksPass') {
  throw new Error('The staging API deployment contract is incomplete.');
}
if (api.plan !== 'free') throw new Error('The staging API should use free compute until always-on validation is approved.');
if (staging.networking?.isolation === 'enabled' || staging.permissions?.protection === 'enabled') {
  throw new Error('Staging must not require paid workspace controls without a documented security need.');
}

const variables = new Map(api.envVars?.map((entry) => [entry.key, entry]));
const databaseUrl = variables.get('DATABASE_URL');
if (!databaseUrl || databaseUrl.sync !== false || 'value' in databaseUrl) {
  throw new Error(`DATABASE_URL must be supplied through Render's encrypted environment UI.`);
}
for (const variable of api.envVars || []) {
  if (/(?:SECRET|PASSWORD|TOKEN|API_KEY|ACCESS_KEY)/.test(variable.key) && 'value' in variable) {
    throw new Error(`${variable.key} must not be hardcoded in the Blueprint.`);
  }
}
if (variables.get('BETTER_AUTH_SECRET')?.generateValue !== true) {
  throw new Error('Render must generate BETTER_AUTH_SECRET.');
}
if (variables.get('DEPLOYMENT_ENVIRONMENT')?.value !== 'staging') {
  throw new Error('The API must identify itself as staging.');
}

console.log('Render Blueprint contract validated: free website/API and least-cost persistent PostgreSQL.');
