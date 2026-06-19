/**
 * Terrnix Email Service
 *
 * Sends notifications via Zoho SMTP.
 * All credentials from environment variables — never hardcoded.
 *
 * Required env vars:
 *   ZOHO_SMTP_HOST    (default: smtp.zoho.com)
 *   ZOHO_SMTP_PORT    (default: 587)
 *   ZOHO_SMTP_USER    (e.g. notifications@terrnix.com)
 *   ZOHO_SMTP_PASS    (app-specific password, NOT account password)
 *   CONTACT_TO_EMAIL  (e.g. tallal@terrnix.com)
 */

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
const SMTP_PORT = parseInt(process.env.ZOHO_SMTP_PORT, 10) || 587;
const SMTP_USER = process.env.ZOHO_SMTP_USER || '';
const SMTP_PASS = process.env.ZOHO_SMTP_PASS || '';
const DEFAULT_TO  = process.env.CONTACT_TO_EMAIL || '';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured. Emails will be logged but not sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    tls: {
      rejectUnauthorized: true
    }
  });

  return transporter;
}

/**
 * Send a notification email.
 * @param {Object} opts
 * @param {string} [opts.to]      — recipient (defaults to CONTACT_TO_EMAIL)
 * @param {string} opts.subject   — email subject
 * @param {string} opts.text      — plain text body
 * @param {string} [opts.html]    — optional HTML body
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendNotificationEmail({ to, subject, text, html }) {
  const t = getTransporter();
  const recipient = to || DEFAULT_TO;

  if (!t) {
    console.log('[Email] Would send to:', recipient);
    console.log('[Email] Subject:', subject);
    console.log('[Email] Body:', text.substring(0, 500));
    return { success: false, error: 'SMTP not configured' };
  }

  if (!recipient) {
    console.warn('[Email] No recipient configured (CONTACT_TO_EMAIL missing)');
    return { success: false, error: 'No recipient configured' };
  }

  try {
    const info = await t.sendMail({
      from: `"Terrnix" <${SMTP_USER}>`,
      to: recipient,
      subject,
      text,
      html: html || `<pre style="font-family:monospace;font-size:13px;line-height:1.5">${escapeHtml(text)}</pre>`
    });

    console.log(`[Email] Sent: ${info.messageId} to ${recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed:', error.message);
    return { success: false, error: error.message };
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Verify SMTP connection on startup.
 */
async function verifyConnection() {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (err) {
    console.error('[Email] SMTP verification failed:', err.message);
    return false;
  }
}

module.exports = {
  sendNotificationEmail,
  verifyConnection,
  getTransporter
};
