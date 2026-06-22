/**
 * Terrnix Lead Storage Service
 *
 * Safely persists contact form submissions and newsletter signups
 * to a local JSONL file when external integrations (email/Brevo) fail
 * or are not configured.
 *
 * Security:
 * - No secrets stored
 * - File path from env var (default: ./data/leads.jsonl)
 * - Directory auto-created
 * - Atomic append with line-delimited JSON
 * - Max file size protection (10MB default)
 * - No sensitive details exposed in API responses
 *
 * @author Terrnix Security Team
 * @version 1.1.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LEADS_FILE = process.env.LEADS_FILE_PATH || path.join(process.cwd(), 'data', 'leads.jsonl');
const MAX_FILE_SIZE_MB = parseInt(process.env.LEADS_MAX_SIZE_MB, 10) || 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

let directoryChecked = false;

function ensureDirectory() {
  if (directoryChecked) return;
  const dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    console.log('[LeadStore] Created directory:', dir);
  }
  directoryChecked = true;
}

function getFileSize() {
  try {
    return fs.statSync(LEADS_FILE).size;
  } catch {
    return 0;
  }
}

function isWritable() {
  ensureDirectory();
  try {
    fs.accessSync(path.dirname(LEADS_FILE), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save a lead to persistent storage.
 * Uses synchronous file I/O — fast and reliable for small writes.
 * @param {Object} lead
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
export async function saveLead({ type, name, email, company, message, source, discipline, phone, sourceUrl, submissionTimestamp, utmSource, utmMedium, utmCampaign, referrer, leadScore }) {
  const startTime = Date.now();
  console.log(`[LeadStore] saveLead started for ${email}`);

  // Use setImmediate to yield event loop before sync operations
  await new Promise(resolve => setImmediate(resolve));
  console.log(`[LeadStore] step 1: after setImmediate, elapsed=${Date.now() - startTime}ms`);

  ensureDirectory();
  console.log(`[LeadStore] step 2: after ensureDirectory, elapsed=${Date.now() - startTime}ms`);

  if (!isWritable()) {
    console.error('[LeadStore] Directory not writable:', path.dirname(LEADS_FILE));
    return { success: false, error: 'Lead storage directory not writable' };
  }
  console.log(`[LeadStore] step 3: after isWritable, elapsed=${Date.now() - startTime}ms`);

  const fileSize = getFileSize();
  console.log(`[LeadStore] step 4: after getFileSize, elapsed=${Date.now() - startTime}ms, size=${fileSize}`);
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    console.error('[LeadStore] File size limit exceeded:', LEADS_FILE);
    return { success: false, error: 'Lead storage file size limit exceeded' };
  }

  console.log(`[LeadStore] step 5: before crypto.randomUUID, elapsed=${Date.now() - startTime}ms`);
  const id = crypto.randomUUID();
  console.log(`[LeadStore] step 6: after crypto.randomUUID, elapsed=${Date.now() - startTime}ms, id=${id}`);

  const record = {
    id,
    timestamp: new Date().toISOString(),
    type: type || 'unknown',
    name: name || null,
    email: email || null,
    company: company || null,
    message: message ? message.substring(0, 5000) : null,
    source: source || 'unknown',
    discipline: discipline || null,
    phone: phone || null,
    sourceUrl: sourceUrl || null,
    submissionTimestamp: submissionTimestamp || null,
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    utmCampaign: utmCampaign || null,
    referrer: referrer || null,
    leadScore: typeof leadScore === 'number' ? leadScore : null,
    ip: null,
    userAgent: null
  };
  console.log(`[LeadStore] step 7: after record creation, elapsed=${Date.now() - startTime}ms`);

  try {
    const line = JSON.stringify(record) + '\n';
    console.log(`[LeadStore] step 8: after JSON.stringify, elapsed=${Date.now() - startTime}ms`);

    const writeStart = Date.now();
    const fd = fs.openSync(LEADS_FILE, 'a', 0o600);
    console.log(`[LeadStore] step 9: after openSync, elapsed=${Date.now() - startTime}ms`);
    try {
      fs.writeSync(fd, line);
      console.log(`[LeadStore] step 10: after writeSync, elapsed=${Date.now() - startTime}ms`);
    } finally {
      fs.closeSync(fd);
      console.log(`[LeadStore] step 11: after closeSync, elapsed=${Date.now() - startTime}ms`);
    }

    console.log(`[LeadStore] writeSync took ${Date.now() - writeStart}ms`);
    console.log(`[LeadStore] Saved ${type} lead: ${id} (${email})`);
    console.log(`[LeadStore] saveLead total took ${Date.now() - startTime}ms`);
    return { success: true, id };
  } catch (error) {
    console.error('[LeadStore] Failed to save lead:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get integration health status (safe for public exposure).
 */
export function getHealthStatus() {
  return {
    leadStorageWritable: isWritable(),
    emailConfigured: !!(process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASS && process.env.CONTACT_TO_EMAIL),
    brevoConfigured: !!(process.env.BREVO_API_KEY)
  };
}

/**
 * Get lead storage statistics (admin only).
 */
export function getStats() {
  ensureDirectory();
  let totalLeads = 0;
  let fileSize = 0;

  try {
    fileSize = fs.statSync(LEADS_FILE).size;
    const content = fs.readFileSync(LEADS_FILE, 'utf8');
    totalLeads = content.split('\n').filter(line => line.trim()).length;
  } catch {
    // File doesn't exist yet
  }

  return {
    totalLeads,
    fileSize,
    fileSizeHuman: `${(fileSize / 1024).toFixed(2)} KB`,
    filePath: LEADS_FILE,
    writable: isWritable()
  };
}

export { isWritable };

// Backward-compatible sync version for non-async callers
export function isWritableSync() {
  return isWritable();
}
