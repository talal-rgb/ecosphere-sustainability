/**
 * Terrnix Certificate Storage Service
 *
 * Stores assessment certificates in a JSONL file for verification.
 * Each certificate has a unique, cryptographically strong ID.
 *
 * Security:
 * - No email or private data stored
 * - Non-sequential IDs
 * - File path from env var
 * - Atomic append
 * - Max file size protection
 *
 * @author Terrnix Security Team
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CERTS_FILE = process.env.CERTS_FILE_PATH || path.join(process.cwd(), 'data', 'certificates.jsonl');
const MAX_FILE_SIZE_MB = parseInt(process.env.CERTS_MAX_SIZE_MB, 10) || 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

let directoryChecked = false;

function ensureDirectory() {
  if (directoryChecked) return;
  const dir = path.dirname(CERTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    console.log('[CertificateStore] Created directory:', dir);
  }
  directoryChecked = true;
}

function getFileSize() {
  try {
    return fs.statSync(CERTS_FILE).size;
  } catch {
    return 0;
  }
}

function isWritable() {
  ensureDirectory();
  try {
    fs.accessSync(path.dirname(CERTS_FILE), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically strong certificate ID.
 * Format: TRX-CAA-YYYYMMDD-XXXXXXXX (CAA = Carbon Accounting Assessment)
 */
export function generateCertificateId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TRX-CAA-${date}-${random}`;
}

/**
 * Check if a certificate ID already exists.
 */
export function certificateExists(certificateId) {
  ensureDirectory();
  try {
    const content = fs.readFileSync(CERTS_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const record = JSON.parse(line);
      if (record.certificateId === certificateId) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Save a certificate record.
 * @param {Object} cert
 * @returns {Promise<{success: boolean, certificateId?: string, error?: string}>}
 */
export async function saveCertificate({
  certificateId,
  participantName,
  assessmentId,
  assessmentName,
  issueDate,
  score,
  maturityLevel,
  achievementLabel,
  status = 'active'
}) {
  const startTime = Date.now();

  await new Promise(resolve => setImmediate(resolve));

  ensureDirectory();

  if (!isWritable()) {
    return { success: false, error: 'Certificate storage directory not writable' };
  }

  const fileSize = getFileSize();
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: 'Certificate storage file size limit exceeded' };
  }

  // Ensure unique ID
  let finalId = certificateId;
  let attempts = 0;
  while (certificateExists(finalId) && attempts < 10) {
    finalId = generateCertificateId();
    attempts++;
  }
  if (attempts >= 10) {
    return { success: false, error: 'Could not generate unique certificate ID' };
  }

  const record = {
    certificateId: finalId,
    participantName: participantName || null,
    assessmentId: assessmentId || null,
    assessmentName: assessmentName || null,
    issueDate: issueDate || new Date().toISOString(),
    score: typeof score === 'number' ? score : null,
    maturityLevel: maturityLevel || null,
    achievementLabel: achievementLabel || null,
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  try {
    const line = JSON.stringify(record) + '\n';
    const fd = fs.openSync(CERTS_FILE, 'a', 0o600);
    try {
      fs.writeSync(fd, line);
    } finally {
      fs.closeSync(fd);
    }

    console.log(`[CertificateStore] Saved certificate: ${finalId} (${participantName})`);
    return { success: true, certificateId: finalId };
  } catch (error) {
    console.error('[CertificateStore] Failed to save certificate:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Find a certificate by ID.
 * @param {string} certificateId
 * @returns {Object|null}
 */
export function findCertificate(certificateId) {
  ensureDirectory();
  try {
    const content = fs.readFileSync(CERTS_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    for (let i = lines.length - 1; i >= 0; i--) {
      const record = JSON.parse(lines[i]);
      if (record.certificateId === certificateId) {
        return record;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get certificate storage health status.
 */
export function getHealthStatus() {
  return {
    certificateStorageWritable: isWritable(),
    totalCertificates: getStats().totalCertificates
  };
}

/**
 * Get certificate storage statistics.
 */
export function getStats() {
  ensureDirectory();
  let totalCertificates = 0;
  let fileSize = 0;

  try {
    fileSize = fs.statSync(CERTS_FILE).size;
    const content = fs.readFileSync(CERTS_FILE, 'utf8');
    totalCertificates = content.split('\n').filter(line => line.trim()).length;
  } catch {
    // File doesn't exist yet
  }

  return {
    totalCertificates,
    fileSize,
    fileSizeHuman: `${(fileSize / 1024).toFixed(2)} KB`,
    filePath: CERTS_FILE,
    writable: isWritable()
  };
}
