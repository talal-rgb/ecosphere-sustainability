# Contact Form Reliability Fix

**Date:** 2026-06-22  
**Priority:** CRITICAL — Blocks PR #32 merge  
**Goal:** Contact form submission succeeds reliably within 5 seconds, regardless of email provider latency.

---

## 1. Fix Strategy

**Core principle:** The user must get immediate confirmation. Everything else is background work.

```
User submits form
    ↓
Backend validates input (< 50ms)
    ↓
Backend saves lead to disk (< 100ms)
    ↓
Backend returns HTTP 200 "success" immediately (< 200ms total)
    ↓ (async, non-blocking)
Backend sends notification email (5s timeout, logs failure)
    ↓ (async, non-blocking)
Backend syncs to Brevo (5s timeout, logs failure)
```

---

## 2. Backend Changes (`backend/server.js`)

### 2.1 Contact endpoint — return immediately after lead save

**Current (blocking):**
```javascript
const leadResult = await saveLead({...});
const emailResult = await sendNotificationEmail({...});  // BLOCKS
res.json({ success: true });
```

**Fixed (non-blocking):**
```javascript
const leadResult = await saveLead({...});

// Return success immediately — don't wait for email
res.json({ success: true, message: 'Thank you...' });

// Fire-and-forget email with timeout
sendNotificationEmailWithTimeout({...}, 5000).catch(err => {
  console.error('[Contact] Async email failed:', err.message);
});
```

### 2.2 Add timeout wrapper for email service

```javascript
/**
 * Send email with timeout. Never throws — logs failure.
 */
async function sendNotificationEmailWithTimeout(mailOptions, timeoutMs = 5000) {
  return Promise.race([
    sendNotificationEmail(mailOptions),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), timeoutMs)
    )
  ]);
}
```

### 2.3 Same fix for newsletter endpoint (`/api/subscribe`)

The newsletter endpoint has the same pattern:
```javascript
await saveLead({...});
await sendNotificationEmail({...});  // BLOCKS
await addContact(email);              // BLOCKS — Brevo API call!
res.json({ success: true });
```

**Brevo API call is also blocking and can timeout!** Fix:
```javascript
await saveLead({...});
res.json({ success: true });

// Async fire-and-forget
sendNotificationEmailWithTimeout({...}, 5000).catch(...);
addContactWithTimeout(email, {}, 5000).catch(...);
```

### 2.4 Add timeout wrapper for Brevo

```javascript
async function addContactWithTimeout(email, attributes, timeoutMs = 5000) {
  return Promise.race([
    addContact(email, attributes),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Brevo timeout')), timeoutMs)
    )
  ]);
}
```

---

## 3. Frontend Changes

### 3.1 `contact/index.html` — increase timeout to 30s

**Current:** 15 seconds  
**Fixed:** 30 seconds (generous, but async backend should respond in < 500ms)

```javascript
const response = await fetchWithTimeout(
  'https://terrnix-backend.onrender.com/api/contact',
  { method: 'POST', headers, body },
  30000  // Was 15000
);
```

### 3.2 `contact/index.html` — add development logging

```javascript
try {
  const startTime = performance.now();
  const response = await fetchWithTimeout(..., 30000);
  const elapsed = Math.round(performance.now() - startTime);
  
  if (location.hostname === 'localhost' || location.search.includes('debug=1')) {
    console.log(`[Contact] Response: ${response.status} in ${elapsed}ms`);
  }
  // ...
}
```

### 3.3 `index.html` — add timeout to `apiClient` / `rateLimitHelper`

**Option A: Add timeout to `apiClient.request()`**
```javascript
async request(endpoint, options = {}, endpointType = 'default', timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await this.rateLimitHelper.fetchWithRateLimit(
      url,
      { ...options, signal: controller.signal },
      endpointType
    );
    clearTimeout(timeoutId);
    return { success: true, data, response };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, error: 'TIMEOUT', message: 'Request timed out. Please try again.' };
    }
    // ...
  }
}
```

**Option B: Add timeout to `rateLimitHelper.fetchWithRateLimit()`**

Same pattern — wrap the inner `fetch()` with AbortController.

**Recommendation:** Option A is cleaner — timeout is an API client concern, not a rate limit concern.

### 3.4 `index.html` — handle timeout in `handleExpertSubmit()`

```javascript
apiClient.contact({...}).then(result => {
  if (result.success) {
    // Show success
  } else if (result.error === 'TIMEOUT') {
    alert('Request timed out. Please try again.');
  } else {
    alert(result.message || 'Failed to send inquiry.');
  }
});
```

---

## 4. Testing Checklist

### 4.1 Backend tests
- [ ] Submit contact form → response returns in < 500ms
- [ ] Verify lead is saved to `data/leads.jsonl`
- [ ] Verify email is sent (check Zoho inbox)
- [ ] Simulate slow email (add `await sleep(10000)` in `sendNotificationEmail`) → response still returns fast
- [ ] Simulate email failure → response still returns fast, error logged
- [ ] Same tests for `/api/subscribe`

### 4.2 Frontend tests
- [ ] `contact/index.html` → submit with 30s timeout, success in < 1s
- [ ] `index.html` expert form → submit with timeout, success in < 1s
- [ ] Both forms show "Request timed out" only if backend truly fails
- [ ] Development logging shows response time in console

### 4.3 Integration tests
- [ ] Submit from contact page → lead saved + email sent
- [ ] Submit from homepage → lead saved + email sent
- [ ] Submit with Zoho down → lead saved + user sees success + error logged
- [ ] Submit with Brevo down → newsletter lead saved + user sees success + error logged

---

## 5. Rollback Plan

If the fix causes issues:
1. Revert `backend/server.js` to synchronous email sending
2. Revert frontend timeout changes
3. Contact form returns to previous behavior (slow but functional when Zoho is fast)

---

## 6. Implementation Order

1. **Backend first** — make `/api/contact` and `/api/subscribe` async
2. **Test backend** — verify fast response + background email
3. **Frontend second** — update timeouts and error handling
4. **Test end-to-end** — both forms, both pages
5. **Merge to main** — only after manual submission succeeds reliably
6. **Then resume PR #32** — lead attribution tracking
