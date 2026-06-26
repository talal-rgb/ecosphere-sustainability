# Email Delivery Reliability Fix

**Date:** 2026-06-26  
**Status:** Committed, awaiting deploy verification  
**Commit:** `bce02a1` on `talal-rgb/ecosphere-sustainability`

---

## Problem

Contact form submissions succeed for the user (lead saved, thank-you message shown), but **notification emails are never received** by the admin.

### Root Cause

Zoho SMTP connection hangs indefinitely on Render's infrastructure:
- `/api/health/integrations` reports `emailConfigured: true` (env vars present)
- `/api/debug-smtp` times out after 25+ seconds when attempting SMTP connection
- No error is ever logged because the connection never fails — it just hangs
- Possible causes: Zoho blocking Render IPs, app password expired, or SMTP not enabled on free plan

---

## Solution

Switch notification priority from Zoho SMTP to **Brevo API**, with Zoho as strict fallback.

### New Notification Order

1. **Save lead** (source of truth — always first)
2. **Return success to user** immediately (never block on email)
3. **Send notification via Brevo API** asynchronously (5s timeout)
4. **Fallback to Zoho SMTP** only if Brevo fails (5s timeout)

---

## Files Changed

| File | Change |
|------|--------|
| `backend/services/brevoEmail.js` | **NEW** — Brevo transactional email client |
| `backend/server.js` | Updated contact + subscribe handlers, debug endpoint |

---

## Required Environment Variables

### Brevo (PRIMARY)
```
BREVO_API_KEY=your-brevo-api-key
CONTACT_TO_EMAIL=tallal@terrnix.com
CONTACT_FROM_EMAIL=notifications@terrnix.com   (must be verified in Brevo)
```

### Zoho (FALLBACK — existing)
```
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587
ZOHO_SMTP_USER=notifications@terrnix.com
ZOHO_SMTP_PASS=your-app-password
CONTACT_TO_EMAIL=tallal@terrnix.com
```

---

## Logging

### Brevo Primary Channel
```
[reqId] brevo_notification_started
[reqId] brevo_notification_sent messageId=...
[reqId] brevo_notification_failed error="..."
[reqId] brevo_notification_exception error="..."
```

### Zoho Fallback Channel
```
[reqId] zoho_fallback_started
[reqId] zoho_fallback_sent messageId=...
[reqId] zoho_fallback_failed error="..." code=...
[reqId] zoho_fallback_exception error="..."
```

---

## Timeouts

| Channel | Timeout | Behavior |
|---------|---------|----------|
| Brevo API | 5s | Fails fast, triggers Zoho fallback |
| Zoho SMTP | 5s | Fails fast, logs error |
| User response | <2s | Never blocked by email sending |

---

## Testing

### After Deploy

1. **Test Brevo directly:**
   ```bash
   curl -X POST https://terrnix-backend.onrender.com/api/debug-smtp \
     -H "Content-Type: application/json" -d '{}'
   ```
   Expected: Returns in ~5-10s with `brevoResult.success: true`

2. **Test full contact flow:**
   ```bash
   curl -X POST https://terrnix-backend.onrender.com/api/contact \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","message":"Testing Brevo email delivery"}'
   ```
   Expected: `success: true` response, then check inbox for notification

3. **Check Render logs** for:
   - `brevo_notification_started`
   - `brevo_notification_sent`
   - (or `brevo_notification_failed` → `zoho_fallback_started`)

---

## Verification Checklist

- [ ] Deploy `bce02a1` to Render (manual deploy if auto-deploy disabled)
- [ ] `/health` shows version `brevo-primary-2026-06-26`
- [ ] `/api/debug-smtp` returns `brevoResult.success: true`
- [ ] Real contact form submission sends email to `CONTACT_TO_EMAIL`
- [ ] Email received in inbox (not spam)
- [ ] Render logs show `brevo_notification_sent`

---

## Do Not Mark Email Notification VERIFIED Until

A real contact form submission results in a notification email successfully delivered to the admin inbox.
