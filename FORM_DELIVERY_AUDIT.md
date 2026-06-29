# Terrnix Form Delivery Audit

**Date:** 2026-06-18
**Auditor:** Terrnix AI
**Scope:** Contact form, newsletter signup, expert inquiry form, backend endpoints
**Status:** 🔴 CRITICAL — Forms submit successfully but emails are NOT sent

---

## Executive Summary

**Root Cause:** The backend API endpoints (`/api/contact` and `/api/subscribe`) accept form submissions, validate input, return success messages to users, but **do not actually send any emails or integrate with any external service**. Tallal receives nothing. Leads are lost.

**Severity:** 🔴 CRITICAL — Active lead loss on every form submission

---

## 1. Contact Form (`/contact/`)

### Current Behavior

| Component | Status | Detail |
|-----------|--------|--------|
| Form HTML | ✅ Present | `contact/index.html` has full form with name, email, company, discipline, message |
| Honeypot field | ✅ Present | `hp_field` hidden field exists |
| Frontend JS handler | 🔴 **BROKEN** | `alert()` only — **no API call to backend** |
| Backend endpoint | ✅ Exists | `POST /api/contact` with validation |
| Email sending | 🔴 **MISSING** | `TODO: Send notification email` in server.js:272 |
| Database storage | 🔴 **MISSING** | `TODO: Store contact in database` in server.js:273 |
| User sees | ⚠️ Misleading | "Thank you for your inquiry! We will get back to you within 1-2 business days." |
| Tallal receives | ❌ Nothing | No email, no notification, no CRM entry |

### Code Evidence

**Frontend (`contact/index.html:167`):**
```javascript
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your inquiry! We will get back to you within 1-2 business days.');
});
```

**Backend (`backend/server.js:268-275`):**
```javascript
const { name, email, company, phone, discipline, message } = req.body;

// TODO: Send notification email
// TODO: Store contact in database

console.log(`[Contact] ${name} (${email}) - ${discipline || 'General'}`);

res.json({
  success: true,
  message: 'Thank you for your message. We will get back to you within 24 hours.'
});
```

### Root Cause
The contact page form is **completely disconnected** from the backend. It only shows a browser `alert()` and never calls `fetch()` to `https://terrnix-backend.onrender.com/api/contact`. Even if it did, the backend would log to console but not send any email.

---

## 2. Expert Inquiry Form (Homepage `index.html`)

### Current Behavior

| Component | Status | Detail |
|-----------|--------|--------|
| Form HTML | ✅ Present | `expertContactForm` with full fields |
| Frontend JS handler | ✅ Present | `handleExpertSubmit()` calls `apiClient.contact()` or `fetch()` |
| Backend endpoint | ✅ Receives data | `POST /api/contact` accepts and validates |
| Email sending | 🔴 **MISSING** | Same `TODO` — no email sent |
| User sees | ⚠️ Misleading | "Thank you for your message. We will get back to you within 24 hours." |
| Tallal receives | ❌ Nothing | No email, no notification |

### Code Evidence

**Frontend (`index.html:6601-6650`):**
```javascript
apiClient.contact({
    name: name, email: email, company: company,
    phone: phone, discipline: disciplineName, message: message
}).then(result => {
    if (result.success) {
        document.getElementById('expertContactForm').reset();
        document.getElementById('expertFormSuccess').classList.remove('hidden');
        // ...
    }
});
```

The frontend correctly sends data to the backend. The backend accepts it. But **no email is dispatched**.

---

## 3. Newsletter Signup

### Current Behavior

| Component | Status | Detail |
|-----------|--------|--------|
| Form HTML (homepage) | ✅ Present | `newsletterForm` with email input |
| Form HTML (footer) | ✅ Present | Multiple newsletter forms in `index.html` |
| Frontend JS handler | ✅ Present | `handleNewsletterSubmit()` calls `apiClient.subscribe()` |
| Backend endpoint | ✅ Receives data | `POST /api/subscribe` with validation |
| Brevo/Mailchimp integration | 🔴 **MISSING** | `TODO: Add email to subscription list` |
| Confirmation email | 🔴 **MISSING** | `TODO: Send confirmation email` |
| User sees | ⚠️ Misleading | "Thank you for subscribing! Please check your email for confirmation." |
| Tallal receives | ❌ Nothing | No notification of new subscriber |

### Code Evidence

**Backend (`backend/server.js:198-206`):**
```javascript
const { email } = req.body;

// TODO: Add email to subscription list
// TODO: Send confirmation email

console.log(`[Subscribe] ${email} from ${req.rateLimit?.ip?.count || '?'} requests`);

res.json({
  success: true,
  message: 'Thank you for subscribing! Please check your email for confirmation.'
});
```

---

## 4. Backend Infrastructure Analysis

### What's Working
- ✅ Express server running on Render (`terrnix-backend.onrender.com`)
- ✅ Helmet security headers
- ✅ CORS configured for `terrnix.com`
- ✅ Rate limiting (IP: 100/15min, endpoint: 10/min, contact: 3/hr, subscribe: 5/hr)
- ✅ Input validation with express-validator
- ✅ Honeypot bot protection
- ✅ CSRF token endpoint
- ✅ Request size limits (10kb)

### What's Missing
- 🔴 **No email library installed** — `nodemailer`, `brevo`, `@sendgrid/mail`, none present
- 🔴 **No SMTP configuration** — no env vars for Zoho or any provider
- 🔴 **No Brevo API integration** — no newsletter service connection
- 🔴 **No database** — contacts/subscribers only logged to console
- 🔴 **No error alerting** — failed submissions not reported to admin

### Package.json Dependencies
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-validator": "^7.3.2",
    "helmet": "^8.2.0"
  }
}
```
**No email or HTTP client libraries.**

---

## 5. CORS / Connectivity Risk

The backend CORS configuration in production **rejects requests with no Origin header**:
```javascript
if (NODE_ENV === 'production') {
  if (!origin) return callback(new Error('Not allowed by CORS'));
  // ...
}
```

This could cause issues with:
- Direct form submissions from static HTML pages (depending on browser behavior)
- Mobile apps or embedded widgets
- Preflight requests under certain conditions

**However**, the current forms on `index.html` use `fetch()` with proper origin headers, so this is not the root cause of the current failure.

---

## 6. Summary Table: Every Form's Fate

| Form | Page | Reaches Backend? | Email Sent? | Stored? | User Feedback |
|------|------|------------------|-------------|---------|---------------|
| Contact | `/contact/` | ❌ NO (alert only) | ❌ No | ❌ No | Fake success alert |
| Expert Inquiry | `/` (homepage) | ✅ Yes | ❌ No | ❌ No | Fake success message |
| Newsletter | `/` (homepage) | ✅ Yes | ❌ No | ❌ No | Fake confirmation |
| Newsletter (footer) | `/` | ✅ Yes | ❌ No | ❌ No | Fake confirmation |

---

## 7. Recommended Fix Priority

### P0 — Critical (Fix First)
1. **Connect `/contact/` form to backend** — Add `fetch()` call to `/api/contact`
2. **Add Zoho SMTP email sending to `/api/contact`** — Install `nodemailer`, configure env vars
3. **Add Zoho SMTP email sending to `/api/subscribe`** — Notify Tallal of new subscribers

### P1 — High
4. **Add Brevo API integration** — Install `@getbrevo/brevo` or use `fetch()` to Brevo API
5. **Add double opt-in for newsletter** — Brevo supports this natively
6. **Add error logging/alerting** — Notify on failed email sends

### P2 — Medium
7. **Add database storage** — SQLite or PostgreSQL for contact/subscriber records
8. **Add admin dashboard** — View leads without checking server logs

---

## 8. Files to Modify

| File | Changes |
|------|---------|
| `backend/server.js` | Add `nodemailer`, implement email sending in `/api/contact` and `/api/subscribe`, add Brevo API call |
| `backend/package.json` | Add `nodemailer`, `@getbrevo/brevo` dependencies |
| `contact/index.html` | Replace alert-only handler with `fetch()` to backend |
| `index.html` | Verify form handlers are consistent (already mostly correct) |
| `.env` / Render env vars | Add `ZOHO_SMTP_*`, `BREVO_API_KEY`, `CONTACT_TO_EMAIL` |

---

## 9. Verification Checklist

After implementation, verify:
- [ ] Submit `/contact/` form → Tallal receives email within 30 seconds
- [ ] Submit expert inquiry → Tallal receives email with full details
- [ ] Subscribe to newsletter → Contact added to Brevo list
- [ ] Honeypot field filled → Request rejected with 400 error
- [ ] Rate limit exceeded → User sees "too many requests" message
- [ ] Invalid email → User sees validation error
- [ ] Backend logs show successful email sends
- [ ] No API keys exposed in frontend code
- [ ] No secrets in repository

---

*Audit complete. Ready for implementation phase.*
