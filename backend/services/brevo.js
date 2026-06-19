/**
 * Terrnix Brevo (Sendinblue) Integration
 *
 * Adds newsletter subscribers to Brevo contact lists.
 * All credentials from environment variables — never hardcoded.
 *
 * Required env vars:
 *   BREVO_API_KEY     — API key from Brevo Dashboard
 *   BREVO_LIST_ID     — Brevo contact list ID (number)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';
const API_KEY = process.env.BREVO_API_KEY || '';
const LIST_ID = process.env.BREVO_LIST_ID || '';

/**
 * Add or update a contact in Brevo.
 * @param {string} email
 * @param {Object} [attributes] — optional custom attributes
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function addContact(email, attributes = {}) {
  if (!API_KEY) {
    console.warn('[Brevo] BREVO_API_KEY not configured. Contact logged but not synced.');
    console.log('[Brevo] Would add:', email, attributes);
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  const payload = {
    email,
    updateEnabled: true,
    attributes: {
      SOURCE: 'terrnix-website',
      SIGNUP_DATE: new Date().toISOString(),
      ...attributes
    }
  };

  if (LIST_ID) {
    payload.listIds = [parseInt(LIST_ID, 10)];
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 204 || response.ok) {
      console.log(`[Brevo] Contact added/updated: ${email}`);
      return { success: true, message: 'Contact added to Brevo' };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.message || `HTTP ${response.status}`;
    console.error('[Brevo] API error:', errorMsg);
    return { success: false, error: errorMsg };
  } catch (error) {
    console.error('[Brevo] Request failed:', error.message);
    return { success: false, error: error.message };
  }
}
