# Zoho Email Notification Integration Plan

**Date:** 2026-06-18
**Author:** Terrnix AI
**Status:** 🔴 CRITICAL — No email sending exists

---

## Executive Summary

All form submissions (contact, expert inquiry, newsletter) reach the backend but are only logged to console. Tallal receives no email notifications. This is a complete breakdown of the lead capture funnel.

**Required:** Add Zoho SMTP email sending to backend for all form submissions.

---

## 1. Zoho Mail Setup

### Zoho Mail Account
- Tallal uses Zoho for email (assumed: `tallal@terrnix.com` or similar)
- SMTP settings for Zoho Mail:
  - **Host:** `smtp.zoho.com` (or `smtp.zoho.eu` for EU accounts)
  - **Port:** `587` (TLS) or `465` (SSL)
  - **Auth:** Username + App Password (not account password)

### App Password
1. Log in to Zoho Mail
2. Settings → Security → App-Specific Passwords
3. Generate app password for "Terrnix Backend"
4. **Never store in repository** — use Render environment variables

---

## 2. Backend Implementation

### Add Dependency
```bash
npm install nodemailer
```

### Email Service Module (`backend/services/email.js`)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.ZOHO_SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASS
  },
  tls: {
    rejectUnauthorized: true
  }
});

async function sendNotificationEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Terrnix Notifications" <${process.env.ZOHO_SMTP_USER}>`,
      to: to || process.env.CONTACT_TO_EMAIL,
      subject,
      text,
      html: html || `<pre>${text}</pre>`
    });
    console.log(`[Email] Sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendNotificationEmail, transporter };
```

### Update `/api/contact` Handler

```javascript
const { sendNotificationEmail } = require('./services/email');

app.post('/api/contact', [
  // ... existing validation ...
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, company, phone, discipline, message } = req.body;

  // Send notification to Tallal
  const emailResult = await sendNotificationEmail({
    subject: `New Contact Form: ${name} — ${discipline || 'General'}`,
    text: `
New contact form submission on terrnix.com

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Phone: ${phone || 'Not provided'}
Discipline: ${discipline || 'General'}

Message:
${message}

---
Submitted at: ${new Date().toISOString()}
IP: ${req.ip}
    `.trim()
  });

  if (!emailResult.success) {
    console.error('[Contact] Email failed but form accepted');
  }

  res.json({
    success: true,
    message: 'Thank you for your message. We will get back to you within 24 hours.'
  });
});
```

### Update `/api/subscribe` Handler

```javascript
app.post('/api/subscribe', [
  // ... existing validation ...
], async (req, res) => {
  const { email } = req.body;

  // Add to Brevo (see BREVO_NEWSLETTER_INTEGRATION.md)
  // ...

  // Notify Tallal
  await sendNotificationEmail({
    subject: 'New Terrnix Newsletter Subscriber',
    text: `New subscriber: ${email}\nDate: ${new Date().toISOString()}`
  });

  res.json({
    success: true,
    message: 'Thank you for subscribing! Please check your email to confirm.'
  });
});
```

---

## 3. Environment Variables

| Variable | Example | Required |
|----------|---------|----------|
| `ZOHO_SMTP_HOST` | `smtp.zoho.com` | Yes |
| `ZOHO_SMTP_PORT` | `587` | Yes |
| `ZOHO_SMTP_USER` | `notifications@terrnix.com` | Yes |
| `ZOHO_SMTP_PASS` | `app-specific-password` | Yes |
| `CONTACT_TO_EMAIL` | `tallal@terrnix.com` | Yes |

---

## 4. Error Handling & Resilience

```javascript
// In email service
async function sendNotificationEmailWithFallback({ to, subject, text }) {
  const result = await sendNotificationEmail({ to, subject, text });
  
  if (!result.success) {
    // Log for manual follow-up
    console.error('[CRITICAL] Email failed:', {
      to, subject, error: result.error,
      timestamp: new Date().toISOString()
    });
    
    // Could add: Slack webhook, Discord notification, etc.
  }
  
  return result;
}
```

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `backend/package.json` | Add `nodemailer` dependency |
| `backend/services/email.js` | New file — email service module |
| `backend/server.js` | Import email service, send emails in `/api/contact` and `/api/subscribe` |
| Render env vars | Add `ZOHO_SMTP_*`, `CONTACT_TO_EMAIL` |

---

## 6. Verification Checklist

- [ ] Submit contact form → Tallal receives email within 30 seconds
- [ ] Email contains all form fields (name, email, company, discipline, message)
- [ ] Submit newsletter signup → Tallal receives subscriber notification
- [ ] Invalid Zoho credentials → graceful error, user still sees success
- [ ] No SMTP credentials in logs or error messages
- [ ] No credentials in repository

---

*Plan complete. Ready for implementation phase.*
