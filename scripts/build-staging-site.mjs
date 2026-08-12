import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'dist-staging');
const productionApiOrigin = 'https://terrnix-backend.onrender.com';
const stagingApiOrigin = validateStagingApiOrigin(process.env.STAGING_API_ORIGIN);

const publicEntries = [
  'index.html',
  'privacy-policy.html',
  'terms-of-use.html',
  'download-pdf.html',
  'robots.txt',
  'sitemap.xml',
  'about',
  'assets',
  'carbon-accounting',
  'carbon-accounting-readiness-assessment',
  'certificate',
  'contact',
  'data',
  'esg-reporting',
  'platform',
  'privacy',
  'quiz',
  'resources',
  'sustainability-intelligence',
  'terms',
  'training'
];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

for (const entry of publicEntries) {
  const source = path.join(root, entry);
  await fs.access(source);
  await fs.cp(source, path.join(output, entry), {
    recursive: true,
    dereference: false,
    filter: (candidate) => !path.basename(candidate).startsWith('.')
  });
}

let replacements = 0;
for await (const file of walk(output)) {
  if (!/\.(?:html|js|json|xml)$/i.test(file)) continue;
  const before = await fs.readFile(file, 'utf8');
  const after = before.replaceAll(productionApiOrigin, stagingApiOrigin);
  if (after !== before) {
    replacements += before.split(productionApiOrigin).length - 1;
    await fs.writeFile(file, after);
  }
}

for (const forbidden of ['backend', 'docs', 'node_modules', '.git', 'CNAME']) {
  try {
    await fs.access(path.join(output, forbidden));
    throw new Error(`Staging artifact unexpectedly contains ${forbidden}.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

console.log(`[Staging Build] Published ${publicEntries.length} entries and rewrote ${replacements} API references.`);

function validateStagingApiOrigin(value) {
  if (!value) throw new Error('STAGING_API_ORIGIN is required.');
  const parsed = new URL(value);
  const allowed = parsed.protocol === 'https:' && (
    parsed.hostname.endsWith('.onrender.com') || parsed.hostname === 'api-staging.terrnix.com'
  );
  if (!allowed || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('STAGING_API_ORIGIN must be an HTTPS onrender.com origin or https://api-staging.terrnix.com.');
  }
  return parsed.origin;
}

async function* walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the staging artifact: ${candidate}`);
    if (entry.isDirectory()) yield* walk(candidate);
    else if (entry.isFile()) yield candidate;
  }
}
