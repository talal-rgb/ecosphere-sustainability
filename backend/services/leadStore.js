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

const fs = require('fs');
const path = require('path');

const LEADS_FILE = process.env.LEADS_FILE_PATH || path.join(__dirname, '..', 'data', 'leads.jsonl');
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
 * @param {Object} lead
 * @param {string} lead.type       — 'contact' | 'newsletter'
 * @param {string} lead.name       — optional
 * @param {string} lead.email      — required
 * @param {string} lead.company    — optional
 * @param {string} lead.message    — optional
 * @param {string} lead.source     — 'contact-form' | 'newsletter-form' | etc
 * @param {string} lead.discipline — optional
 * @param {string} lead.phone      — optional
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
async function saveLead({ type, name, email, company, message, source, discipline, phone }) {
  ensureDirectory();

  if (!isWritable()) {
    console.error('[LeadStore] Directory not writable:', path.dirname(LEADS_FILE));
    return { success: false, error: 'Lead storage directory not writable' };
  }

  const fileSize = getFileSize();
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    console.error('[LeadStore] File size limit exceeded:', LEADS_FILE);
    return { success: false, error: 'Lead storage file size limit exceeded' };
  }

  const id = require('crypto').randomUUID();
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
    ip: null, // Do not store IP in file (privacy)
    userAgent: null // Do not store UA in file (privacy)
  };

  try {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(LEADS_FILE, line, { flag: 'a', mode: 0o600 });
    console.log(`[LeadStore] Saved ${type} lead: ${id} (${email})`);
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
function getHealthStatus() {
  return {
    leadStorageWritable: isWritable(),
    emailConfigured: !!(process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASS && process.env.CONTACT_TO_EMAIL),
    brevoConfigured: !!(process.env.BREVO_API_KEY)
  };
}

/**
 * Get lead storage statistics (admin only).
 * @returns {{totalLeads: number, fileSize: number, filePath: string, writable: boolean}}
 */
function getStats() {
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

module.exports = {
  saveLead,
  getHealthStatus,
  getStats,
  isWritable
};
