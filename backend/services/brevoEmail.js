/**
 * Terrnix Brevo Transactional Email Service
 *
 * Sends notification emails via Brevo (Sendinblue) SMTP/API.
 * Used as PRIMARY notification channel for contact form submissions.
 * Zoho SMTP is fallback only.
 *
 * Required env vars:
 *   BREVO_API_KEY     — API key from Brevo Dashboard
 *   CONTACT_TO_EMAIL  — recipient for notifications
 *   CONTACT_FROM_EMAIL — sender address (must be verified in Brevo)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const API_KEY = process.env.BREVO_API_KEY || '';
const DEFAULT_TO = process.env.CONTACT_TO_EMAIL || '';
const DEFAULT_FROM = process.env.CONTACT_FROM_EMAIL || process.env.ZOHO_SMTP_USER || 'notifications@terrnix.com';

/**
 * Send a transactional email via Brevo API.
 * @param {Object} opts
 * @param {string} [opts.to]      — recipient (defaults to CONTACT_TO_EMAIL)
 * @param {string} opts.subject   — email subject
 * @param {string} opts.text      — plain text body
 * @param {string} [opts.html]    — optional HTML body
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendBrevoEmail({ to, subject, text, html }) {
  const recipient = to || DEFAULT_TO;

  if (!API_KEY) {
    console.warn('[BrevoEmail] BREVO_API_KEY not configured');
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  if (!recipient) {
    console.warn('[BrevoEmail] No recipient configured (CONTACT_TO_EMAIL missing)');
    return { success: false, error: 'No recipient configured' };
  }

  const payload = {
    sender: { email: DEFAULT_FROM, name: 'Terrnix' },
    to: [{ email: recipient }],
    subject,
    textContent: text,
    htmlContent: html || `<pre style="font-family:monospace;font-size:13px;line-height:1.5">${escapeHtml(text)}</pre>`
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 201) {
      const data = await response.json().catch(() => ({}));
      const messageId = data.messageId || `brevo-${Date.now()}`;
      console.log(`[BrevoEmail] Sent: ${messageId} to ${recipient}`);
      return { success: true, messageId };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.message || `HTTP ${response.status}`;
    console.error('[BrevoEmail] API error:', errorMsg, '| Status:', response.status);
    return { success: false, error: errorMsg, status: response.status };
  } catch (error) {
    console.error('[BrevoEmail] Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a Brevo email with explicit timeout wrapper.
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendBrevoEmailWithTimeout(opts, timeoutMs = 5000) {
  return Promise.race([
    sendBrevoEmail(opts),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Brevo email timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
