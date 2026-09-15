import fs from 'node:fs/promises';

const buildDate = new Date().toISOString();
await fs.writeFile(new URL('../.build-date', import.meta.url), `${buildDate}\n`, { mode: 0o600 });
console.log(`[Build] Recorded build date ${buildDate}`);
