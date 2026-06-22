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
 * @version 1.0.0
 */

import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';

const LEADS_FILE = process.env.LEADS_FILE_PATH || path.join(process.cwd(), 'data', 'leads.jsonl');
const MAX_FILE_SIZE_MB = parseInt(process.env.LEADS_MAX_SIZE_MB, 10) || 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

let directoryChecked = false;

async function ensureDirectory() {
  if (directoryChecked) return;
  const dir = path.dirname(LEADS_FILE);
  try {
    await fsp.access(dir);
  } catch {
    await fsp.mkdir(dir, { recursive: true, mode: 0o700 });
    console.log('[LeadStore] Created directory:', dir);
  }
  directoryChecked = true;
}

async function getFileSize() {
  try {
    const stat = await fsp.stat(LEADS_FILE);
    return stat.size;
  } catch {
    return 0;
  }
}

async function isWritable() {
  await ensureDirectory();
  try {
    await fsp.access(path.dirname(LEADS_FILE), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save a lead to persistent storage.
 * @param {Object} lead
 * @param {string} lead.type       — 'contact' | 'newsletter'
 * @param {string} lead.name       — optional
 * @param {string} lead.email      — required
 * @param {string} lead.company    — optional
 * @param {string} lead.message    — optional
 * @param {string} lead.source              — 'contact-form' | 'newsletter-form' | etc
 * @param {string} lead.discipline          — optional
 * @param {string} lead.phone               — optional
 * @param {string} lead.sourceUrl           — optional
 * @param {string} lead.submissionTimestamp — optional
 * @param {string} lead.utmSource           — optional
 * @param {string} lead.utmMedium           — optional
 * @param {string} lead.utmCampaign         — optional
 * @param {string} lead.referrer            — optional
 * @param {number} lead.leadScore           — optional
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
export async function saveLead({ type, name, email, company, message, source, discipline, phone, sourceUrl, submissionTimestamp, utmSource, utmMedium, utmCampaign, referrer, leadScore }) {
  const startTime = Date.now();
  console.log(`[LeadStore] saveLead started for ${email}`);

  await ensureDirectory();
  console.log(`[LeadStore] ensureDirectory took ${Date.now() - startTime}ms`);

  if (!await isWritable()) {
    console.error('[LeadStore] Directory not writable:', path.dirname(LEADS_FILE));
    return { success: false, error: 'Lead storage directory not writable' };
  }
  console.log(`[LeadStore] isWritable took ${Date.now() - startTime}ms`);

  const fileSize = await getFileSize();
  console.log(`[LeadStore] getFileSize took ${Date.now() - startTime}ms, size=${fileSize}`);
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    console.error('[LeadStore] File size limit exceeded:', LEADS_FILE);
    return { success: false, error: 'Lead storage file size limit exceeded' };
  }

  const id = crypto.randomUUID();
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
    ip: null, // Do not store IP in file (privacy)
    userAgent: null // Do not store UA in file (privacy)
  };

  try {
    const line = JSON.stringify(record) + '\n';
    const writeStart = Date.now();
    await fsp.appendFile(LEADS_FILE, line, { flag: 'a', mode: 0o600 });
    console.log(`[LeadStore] appendFile took ${Date.now() - writeStart}ms`);
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
 * @returns {{leadStorageWritable: boolean, emailConfigured: boolean, brevoConfigured: boolean}}
 */
export async function getHealthStatus() {
  return {
    leadStorageWritable: await isWritable(),
    emailConfigured: !!(process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASS && process.env.CONTACT_TO_EMAIL),
    brevoConfigured: !!(process.env.BREVO_API_KEY)
  };
}

/**
 * Get lead storage statistics (admin only).
 * @returns {{totalLeads: number, fileSize: number, filePath: string, writable: boolean}}
 */
export async function getStats() {
  await ensureDirectory();
  let totalLeads = 0;
  let fileSize = 0;

  try {
    const stat = await fsp.stat(LEADS_FILE);
    fileSize = stat.size;
    const content = await fsp.readFile(LEADS_FILE, 'utf8');
    totalLeads = content.split('\n').filter(line => line.trim()).length;
  } catch {
    // File doesn't exist yet
  }

  return {
    totalLeads,
    fileSize,
    fileSizeHuman: `${(fileSize / 1024).toFixed(2)} KB`,
    filePath: LEADS_FILE,
    writable: await isWritable()
  };
}

export { isWritable };

// Backward-compatible sync version for non-async callers
export function isWritableSync() {
  try {
    fs.accessSync(path.dirname(LEADS_FILE), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
