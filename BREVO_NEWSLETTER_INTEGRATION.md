# Brevo Newsletter Integration Plan

**Date:** 2026-06-18
**Author:** Terrnix AI
**Status:** 🔴 CRITICAL — No newsletter integration exists

---

## Executive Summary

Newsletter signups on Terrnix currently reach the backend but go nowhere. The backend logs the email to console and returns a fake success message. No contact is added to any list. No confirmation is sent.

**Required:** Integrate Brevo (formerly Sendinblue) API so newsletter signups are added to a Brevo contact list with double opt-in.

---

## 1. Brevo Setup Requirements

### Brevo Account
- Sign up at https://www.brevo.com (free tier: 300 emails/day)
- Create a contact list named "Terrnix Newsletter"
- Note the List ID (e.g., `4`)

### API Key
- Generate API key at Brevo Dashboard → SMTP & API → API Keys
- Store as environment variable: `BREVO_API_KEY`
- **Never commit to repository**

---

## 2. Backend Implementation

### Add Dependency
```bash
npm install sib-api-v3-sdk
```

Or use raw `fetch()` to avoid dependencies:
```javascript
const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';
```

### Implementation (`backend/server.js`)

```javascript
// Add to imports
const BrevoApiSdk = require('sib-api-v3-sdk');

// Configure Brevo client
const brevoClient = BrevoApiSdk.ApiClient.instance;
const apiKey = brevoClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const brevoContactsApi = new BrevoApiSdk.ContactsApi();

// In /api/subscribe handler:
app.post('/api/subscribe', [
  // ... existing validation ...
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Add to Brevo with double opt-in
    const contact = new BrevoApiSdk.CreateContact();
    contact.email = email;
    contact.listIds = [parseInt(process.env.BREVO_LIST_ID)];
    contact.updateEnabled = true; // Update if exists
    contact.attributes = {
      SOURCE: 'terrnix-website',
      SIGNUP_DATE: new Date().toISOString()
    };

    await brevoContactsApi.createContact(contact);

    // Also notify Tallal
    await sendNotificationEmail({
      to: process.env.CONTACT_TO_EMAIL,
      subject: 'New Terrnix Newsletter Subscriber',
      text: `New subscriber: ${email}\nSource: terrnix.com\nDate: ${new Date().toISOString()}`
    });

    res.json({
      success: true,
      message: 'Thank you for subscribing! Please check your email to confirm.'
    });
  } catch (error) {
    console.error('[Brevo Error]', error);
    res.status(500).json({
      success: false,
      message: 'Subscription failed. Please try again later.'
    });
  }
});
```

### Double Opt-In Configuration
In Brevo dashboard:
1. Go to Contacts → Settings → Subscription
2. Enable "Double opt-in confirmation"
3. Customize confirmation email template
4. Set redirect URL after confirmation (e.g., `https://terrnix.com/newsletter-confirmed/`)

---

## 3. Frontend Changes

Minimal changes needed — frontend already calls `/api/subscribe` correctly.

### Verify Success Message
Current message: "Thank you for subscribing! Please check your email for confirmation."

This is actually appropriate for double opt-in. Keep it.

### Add Error Handling
Ensure frontend shows proper error if Brevo API fails:
```javascript
apiClient.subscribe(email).then(result => {
  if (result.success) {
    showSuccess(result.data.message);
  } else {
    showError(result.message || 'Subscription failed. Please try again.');
  }
});
```

---

## 4. Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `BREVO_API_KEY` | Brevo Dashboard → API Keys | Yes |
| `BREVO_LIST_ID` | Brevo Dashboard → Lists | Yes |
| `CONTACT_TO_EMAIL` | Tallal's email | Yes (for notifications) |

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `backend/package.json` | Add `sib-api-v3-sdk` dependency |
| `backend/server.js` | Implement Brevo contact creation in `/api/subscribe` |
| Render env vars | Add `BREVO_API_KEY`, `BREVO_LIST_ID` |

---

## 6. Verification Checklist

- [ ] Sign up with test email → appears in Brevo contact list
- [ ] Confirmation email received
- [ ] Clicking confirmation → contact status changes to "Confirmed"
- [ ] Tallal receives notification email
- [ ] Honeypot filled → request rejected, no Brevo call
- [ ] Invalid email → validation error, no Brevo call
- [ ] Rate limit exceeded → 429 error, no Brevo call
- [ ] No Brevo API key in logs or error messages

---

*Plan complete. Ready for implementation phase.*
