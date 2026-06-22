# Contact Form Timeout — Root Cause Analysis

**Date:** 2026-06-22  
**Reporter:** Tallal (Founder)  
**Status:** INVESTIGATION COMPLETE — Fix required before PR #32 merge  
**Severity:** HIGH — Blocks lead capture

---

## 1. Symptom

Manual contact form submission on terrnix.com returned:
> "Request timed out. Please try again."

This occurred **after** PR #31 (Contact Form Validation UX Fix) was merged and supposedly verified.

---

## 2. Frontend Analysis

### 2.1 Which endpoint is called?

There are **TWO contact form implementations** with **different endpoints and behaviors**:

| Location | File | Endpoint | Timeout | AbortController |
|----------|------|----------|---------|-----------------|
| **Contact page** | `contact/index.html` | `POST /api/contact` | **15 seconds** | Yes (`fetchWithTimeout`) |
| **Homepage** | `index.html` (expert form) | `POST /api/contact` | **No timeout** | No — uses `apiClient` which calls `rateLimitHelper.fetchWithRateLimit()` with no timeout |

**Critical finding:** The homepage expert contact form (`index.html`) has **NO timeout** on its fetch call. The `apiClient.request()` method and `rateLimitHelper.fetchWithRateLimit()` do **not** pass an AbortController or timeout to `fetch()`. This means:
- If the backend hangs, the user sees **no feedback** — the request hangs indefinitely
- The browser may eventually abort (Chrome ~300s), but the user has no UX for this
- The contact page (`contact/index.html`) has a 15s timeout, which is what produced the visible error

### 2.2 Request timeout duration

- `contact/index.html`: **15,000ms** (15 seconds) — `fetchWithTimeout()` with AbortController
- `index.html`: **None** — raw `fetch()` via `apiClient` → `rateLimitHelper.fetchWithRateLimit()`

### 2.3 Does request reach backend?

**Cannot confirm without Render logs.** The 15s timeout on `contact/index.html` means:
- If backend takes >15s to respond, frontend aborts and shows timeout error
- The backend may still be processing (lead saved, email sent) — **fire-and-forget risk**
- User sees failure, but lead may actually be captured → **false negative UX**

### 2.4 AbortController behavior

```javascript
// contact/index.html — fetchWithTimeout()
const controller = new AbortController();
const id = setTimeout(() => controller.abort(), 15000);
// If backend takes >15s, fetch throws AbortError → "Request timed out"
```

The AbortController **cancels the HTTP request** at 15s. If the backend is still processing:
- Request is terminated at TCP level
- Backend may or may not complete its work
- **Race condition:** Lead may be saved but email may fail, or vice versa

### 2.5 Missing: response status and timing logs

Neither frontend logs response timing or status to console in development. No `console.log` of:
- HTTP status code
- Response time (TTFB, total)
- Whether timeout fired before or after response headers

---

## 3. Backend Analysis

### 3.1 Server code path (`/api/contact`)

```javascript
app.post('/api/contact', [validation...], async (req, res) => {
  // 1. Validate input (sync, fast)
  // 2. saveLead() — file I/O, local disk, usually <100ms
  // 3. sendNotificationEmail() — SMTP to Zoho, **network call**, variable latency
  // 4. res.json({ success: true }) — ONLY after email completes
});
```

### 3.2 Critical finding: Synchronous blocking

The backend **waits for email sending to complete** before returning HTTP 200 to the user:

```javascript
const emailResult = await sendNotificationEmail({...});  // BLOCKS response
// ...
res.json({ success: true });  // Only sent after email finishes
```

If Zoho SMTP is slow (connection setup, TLS handshake, queue delay), the entire HTTP response is delayed.

### 3.3 Email service analysis (`backend/services/email.js`)

```javascript
export async function sendNotificationEmail({ to, subject, text, html }) {
  const t = getTransporter();  // Creates nodemailer transporter
  // ...
  const info = await t.sendMail({...});  // No timeout on SMTP send
  // ...
}
```

**No timeout configured on `nodemailer.sendMail()`**. Default Node.js/socket timeouts apply (~2 minutes), but:
- SMTP connection setup can take 5-30s if Zoho is slow
- TLS handshake adds latency
- If Zoho is down or throttling, `sendMail()` hangs

### 3.4 No async/fire-and-forget pattern

The backend does **not**:
- Save lead → return 200 immediately → send email in background
- Wrap email sending in a timeout
- Use a job queue or event emitter for email

### 3.5 Render logs unavailable

Cannot access Render logs without dashboard credentials. Required checks:
- [ ] Did the request arrive at Render?
- [ ] Did validation pass?
- [ ] Did `saveLead()` succeed?
- [ ] Did `sendNotificationEmail()` start?
- [ ] How long did `sendNotificationEmail()` take?
- [ ] Did the response go out before or after the 15s frontend timeout?

---

## 4. Root Cause Hypothesis

### Primary: Email sending blocks HTTP response

**Likelihood: HIGH (90%)**

The backend waits for `sendNotificationEmail()` (Zoho SMTP) to complete before returning `res.json()`. If Zoho is slow:
1. Frontend sends POST /api/contact
2. Backend validates, saves lead (~50ms)
3. Backend starts SMTP send to Zoho
4. Zoho connection/setup takes >15 seconds
5. Frontend AbortController fires at 15s
6. User sees "Request timed out"
7. Backend may eventually complete email, but user already left

### Secondary: No timeout on nodemailer

**Likelihood: HIGH (contributes to primary)**

`nodemailer.sendMail()` has no explicit timeout. If Zoho is unresponsive, it hangs indefinitely.

### Tertiary: Homepage form has no timeout

**Likelihood: MEDIUM**

The `index.html` expert form has no AbortController timeout. If this is the form the user actually used, they may have seen an indefinite hang rather than a timeout message. But the reported error "Request timed out" matches the `contact/index.html` form behavior.

---

## 5. Evidence Summary

| Check | Result |
|-------|--------|
| Frontend timeout on contact page | 15s AbortController — **confirmed** |
| Frontend timeout on homepage | **None** — confirmed |
| Backend waits for email before response | **Yes** — confirmed in code |
| Nodemailer timeout configured | **No** — confirmed in code |
| Async email sending | **No** — confirmed in code |
| Render logs inspected | **No** — need dashboard access |
| Health check endpoint | `/api/health/integrations` healthy — emailConfigured=true |

---

## 6. Conclusion

**Root cause:** The backend's `/api/contact` handler performs **synchronous email sending** via Zoho SMTP before returning the HTTP response. When Zoho is slow or experiencing latency, the response is delayed beyond the frontend's 15-second timeout, causing the user to see a timeout error even though the lead may have been saved.

**This is a reliability bug, not a validation bug.** PR #31 fixed validation UX but did not address the async architecture of the contact form.

---

## 7. Required Fix (see CONTACT_FORM_RELIABILITY_FIX.md)

1. **Backend:** Return HTTP 200 immediately after `saveLead()` succeeds
2. **Backend:** Send notification email asynchronously (fire-and-forget with error logging)
3. **Backend:** Add timeout wrapper around `sendNotificationEmail()` (max 5s)
4. **Frontend (contact/index.html):** Increase timeout from 15s to 30s
5. **Frontend (index.html):** Add AbortController timeout to `apiClient` or `rateLimitHelper`
6. **Both frontends:** Add `console.log` timing in development for debugging
