import fs from 'node:fs';
import YAML from 'yaml';

const blueprint = YAML.parse(fs.readFileSync(new URL('../render.yaml', import.meta.url), 'utf8'));
const project = blueprint.projects?.find((entry) => entry.name === 'terrnix-platform');
const staging = project?.environments?.find((entry) => entry.name === 'staging');
if (!staging) throw new Error('The terrnix-platform staging environment is missing.');

const website = staging.services?.find((entry) => entry.name === 'terrnix-staging');
const api = staging.services?.find((entry) => entry.name === 'terrnix-staging-api');
const database = staging.databases?.find((entry) => entry.name === 'terrnix-staging-postgres');
if (!website || website.runtime !== 'static') throw new Error('The isolated staging website is missing.');
if (!api || api.runtime !== 'node' || api.rootDir !== 'backend') throw new Error('The staging API must use the backend Node runtime.');
if (!database || database.plan === 'free') throw new Error('Persistent staging must not use an expiring free database.');
if (!Array.isArray(database.ipAllowList) || database.ipAllowList.length !== 0) {
  throw new Error('The staging database must block external network connections by default.');
}
if (api.branch !== 'main' || api.healthCheckPath !== '/health' || api.autoDeployTrigger !== 'checksPass') {
  throw new Error('The staging API deployment contract is incomplete.');
}

const variables = new Map(api.envVars?.map((entry) => [entry.key, entry]));
for (const key of [
  'DATABASE_URL',
  'EVIDENCE_STORAGE_BUCKET',
  'EVIDENCE_STORAGE_REGION',
  'EVIDENCE_STORAGE_ENDPOINT',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'BREVO_API_KEY',
  'CONTACT_FROM_EMAIL',
  'CONTACT_TO_EMAIL'
]) {
  const variable = variables.get(key);
  if (!variable || variable.sync !== false || 'value' in variable) {
    throw new Error(`${key} must be supplied through Render's encrypted environment UI.`);
  }
}
if (variables.get('BETTER_AUTH_SECRET')?.generateValue !== true) {
  throw new Error('Render must generate BETTER_AUTH_SECRET.');
}
if (variables.get('DEPLOYMENT_ENVIRONMENT')?.value !== 'staging') {
  throw new Error('The API must identify itself as staging.');
}

console.log('Render Blueprint contract validated: isolated staging website, API, and persistent PostgreSQL.');
