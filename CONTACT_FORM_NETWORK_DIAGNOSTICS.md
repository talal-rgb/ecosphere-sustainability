# Contact Form Network Diagnostics

## Objective
Systematically diagnose contact form timeout issue without assuming root cause.

## Methodology
Collect evidence from:
1. Browser DevTools Network tab
2. Render application logs during failed submission
3. Browser console output
4. OPTIONS request behavior
5. POST request behavior

## Evidence Log

### Test 1: curl — OPTIONS Preflight
**Timestamp:** 2026-06-22 17:55 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/contact
**Method:** OPTIONS
**Expected:** 204 No Content with CORS headers
**Actual:** ✅ HTTP 2 204 No Content
**Timing:** ~1-2s (TLS handshake + response)
**CORS Headers Present:**
- access-control-allow-headers: Content-Type,Authorization,X-CSRF-Token,X-Admin-Token
- access-control-allow-methods: GET,POST,OPTIONS
- access-control-allow-origin: https://terrnix.com
- access-control-max-age: 86400
**Backend reached:** ✅ Yes (via Cloudflare CDN)
**Server:** cloudflare (with x-render-origin-server: Render)
**Conclusion:** OPTIONS works correctly. CORS is not the issue.

### Test 2: curl — POST with 30s timeout (FAILED)
**Timestamp:** 2026-06-22 17:55 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/contact
**Method:** POST
**Payload:** {"name":"Diagnostic Test","email":"diagnostic@example.com","company":"TestCo","discipline":"Other / General Inquiry","message":"Network diagnostic test from curl","hp_field":""}
**Expected:** HTTP 200 with JSON response
**Actual:** ❌ Timeout after 30.002s — **0 bytes received**
**Detailed Timing:**
- DNS resolution: Immediate (216.24.57.8, 216.24.57.9)
- TCP connection: Immediate
- TLS handshake: ~1s (TLSv1.3, HTTP/2)
- Request upload: Complete (177 bytes sent)
- **TTFB (Time to First Byte): NEVER** — server sent 0 bytes back
- Total: 30.002s timeout
**Backend reached:** ⚠️ **UNCERTAIN** — TCP/TLS established, request uploaded, but **zero response bytes**
**response_sent log exists:** Unknown (need Render logs)
**Critical Finding:** The server accepted the TCP connection, completed TLS, received the full request body, but **never sent any response bytes**. This is NOT a connection failure — it's a server-side hang after request receipt.

### Test 3: curl — POST with 5s timeout (FAILED — same pattern)
**Timestamp:** 2026-06-22 earlier testing
**Actual:** ❌ Timeout at exactly 5.00s — HTTP 000
**Pattern:** Consistent with Test 2, just shorter timeout

### Test 4: curl — POST Success (1 in ~120)
**Timestamp:** 2026-06-22 earlier testing
**Actual:** ✅ HTTP 200 in 0.794s
**Response:** {"success":true,"message":"Thank you for your message..."}
**Significance:** Proves the code CAN work fast when the server responds

### Test 5: GET /health (CONTROL TEST)
**Timestamp:** 2026-06-22 17:56 GMT+2
**URL:** https://terrnix-backend.onrender.com/health
**Method:** GET
**Expected:** 200 OK with JSON
**Actual:** ✅ HTTP 200 in 0.327s
**Response:** {"ok":true,"service":"terrnix-website-api",...}
**Conclusion:** Simple GET works fine. Server is responsive.

### Test 6: GET /api/health/integrations (CONTROL TEST)
**Timestamp:** 2026-06-22 17:56 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/health/integrations
**Method:** GET
**Expected:** 200 OK with JSON
**Actual:** ✅ HTTP 200 in 0.134s
**Response:** {"success":true,"status":"healthy","integrations":{...}}
**Conclusion:** Another GET works fine. Server is responsive.

### Test 7: POST /api/contact with minimal payload (FAILED)
**Timestamp:** 2026-06-22 17:56 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/contact
**Method:** POST
**Payload:** {"name":"Minimal","email":"minimal@test.com","company":"Test","discipline":"Other / General Inquiry","message":"Minimal test","hp_field":""}
**Expected:** HTTP 200 with JSON
**Actual:** ❌ Timeout after 30.003s — HTTP 000
**Conclusion:** Even minimal payload hangs. Not payload-size related.

### Test 8: POST /api/chat (CONTROL — WORKS)
**Timestamp:** 2026-06-22 17:57 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/chat
**Method:** POST
**Payload:** {"message":"Test chat message","pageContext":"test"}
**Expected:** HTTP 200/503 with JSON
**Actual:** ✅ HTTP 503 in 0.310s
**Response:** {"error":"OPENAI_API_KEY is not configured",...}
**Conclusion:** Other POST endpoints work fine. This is specific to contact/subscribe handlers.

### Test 9: POST /api/subscribe (FAILED — SAME PATTERN)
**Timestamp:** 2026-06-22 17:57 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/subscribe
**Method:** POST
**Payload:** {"email":"subscribe-test@example.com","hp_field":""}
**Expected:** HTTP 200 with JSON
**Actual:** ❌ Timeout after 30.003s — HTTP 000
**Conclusion:** Subscribe endpoint ALSO hangs. Shares pattern with contact.

### Critical Pattern Identified
| Endpoint | Method | Result | Time |
|----------|--------|--------|------|
| /health | GET | ✅ 200 | 0.33s |
| /api/health/integrations | GET | ✅ 200 | 0.13s |
| /api/chat | POST | ✅ 503 | 0.31s |
| /api/contact | POST | ❌ Timeout | 30s+ |
| /api/subscribe | POST | ❌ Timeout | 30s+ |

**Both /api/contact and /api/subscribe hang. Both use `saveLead()` + email pattern.**

### Test 8: Render Logs — Failed Submission
**Timestamp:** (pending — need dashboard access)
**Request ID:** (pending)
**Log entries needed:**
- request_received: (critical — did backend receive the request?)
- lead_saved: (did it process?)
- response_sent: (did it try to respond?)
- email_async_started: (did async fire?)
- email_async_finished/failed: (did async complete?)
**Error messages:** (any exceptions?)

### Test 6: Browser Console Output
**Timestamp:** (pending — need browser test)
**Console errors:** (pending)
**Network errors:** (pending)
**CORS errors:** (pending)
**JavaScript errors:** (pending)

## Analysis

### Evidence Summary
| Test | Result | Key Finding |
|------|--------|-------------|
| OPTIONS preflight | ✅ PASS | CORS works, 204 response, ~1-2s |
| POST with 30s timeout | ❌ FAIL | **0 bytes received after 30s** |
| POST with 5s timeout | ❌ FAIL | Same pattern, shorter timeout |
| POST success (rare) | ✅ PASS | 0.794s when it works |
| GET /health | ✅ PASS | 0.327s — server responsive |
| GET /api/health/integrations | ✅ PASS | 0.134s — server responsive |
| POST minimal payload | ❌ FAIL | 30s timeout — not payload-size related |

### Critical Evidence: Server-Side Hang on POST Only
The 30s timeout test with `-v` (verbose) reveals the most important finding:

1. ✅ DNS resolves immediately
2. ✅ TCP connects immediately
3. ✅ TLS handshake completes (~1s)
4. ✅ HTTP/2 stream opens
5. ✅ Full request body uploaded (177 bytes)
6. ❌ **Server sends 0 bytes back — ever**
7. ❌ Connection times out at 30s

**GET requests work perfectly** (0.13-0.33s), so the server IS responsive.
**POST to /api/contact hangs** (~99% of the time).
**This is NOT infrastructure** — it's specific to the POST handler.

**This is NOT:**
- A connection failure (TCP/TLS work)
- A DNS issue (resolves fast)
- A CORS issue (OPTIONS works)
- A cold start (GET works fine, connection accepted)
- A rate limit (no 429, no connection reset)
- Payload size (minimal payload also hangs)

**This IS:**
- **Something in the POST /api/contact handler is blocking/hanging**
- Happens ~99% of the time
- Works ~1% of the time (0.79s response)
- GET endpoints work fine

### Hypotheses (Ranked by Evidence)

#### Hypothesis 1: Backend Code Hang in POST Handler (HIGHEST PRIORITY)
**Evidence:** GET works, POST hangs. Something specific to `/api/contact` POST handler is blocking.
**Possible causes:**
- `saveLead()` synchronous file I/O blocking event loop
- JSON parsing middleware hanging
- Request body parsing issue
- Some async operation not resolving
- Middleware (CORS, rate limiter, body parser) hanging for POST only

**Required Evidence:** Render logs showing `request_received` but NO `response_sent` for timed-out requests.

#### Hypothesis 2: Rate Limiter Middleware Blocking (HIGH PRIORITY)
**Evidence:** The rate limiter middleware runs before the handler. If it's doing synchronous file I/O or Redis call that's hanging, it would block POST requests.
**Possible causes:**
- File-based rate limiter doing sync writes
- Redis connection hanging
- Rate limit check never resolving

**Required Evidence:** Check if rate limiter uses async or sync operations. Test with rate limiter disabled.

#### Hypothesis 3: Body Parser Middleware Hanging (MEDIUM PRIORITY)
**Evidence:** POST requests have a body, GET doesn't. If body parser hangs, request never reaches handler.
**Possible causes:**
- express.json() middleware issue
- Request body stream not ending properly
- Content-Length mismatch

**Required Evidence:** Test with different content types or body sizes.

#### Hypothesis 4: Render Instance Resource Exhaustion (DEPRIORITIZED)
**Evidence:** GET works fine, so instance is responsive. Less likely.
**Required Evidence:** Would need to see GET also failing.

#### Hypothesis 5: Backend Exception Before Response (MEDIUM PRIORITY)
**Evidence:** If an exception occurs after request received but before response sent, and error handler also fails, could cause hang.
**Required Evidence:** Render logs showing uncaught exceptions.

### Evidence Required to Confirm Root Cause
| Hypothesis | Required Evidence |
|------------|-------------------|
| POST handler code hang | Render logs show `request_received` but NO `response_sent`; add step-by-step logging |
| Rate limiter blocking | Check rateLimiter.js for sync operations; test with it disabled |
| Body parser hanging | Test with different content types; check express.json() config |
| Resource exhaustion | GET would also fail (not matching) |
| Backend exception | Render logs show uncaught exception stack traces |

## Code Review Findings

### server.js — Contact Handler
The `/api/contact` handler uses `async/await` correctly:
1. Validation runs first (sync)
2. `await saveLead()` — async, but calls sync fs operations inside
3. `res.json()` — sends response
4. `fireAndForget()` — async email after response

**No obvious blocking code in the handler itself.**

### leadStore.js — CRITICAL FINDING
`saveLead()` is declared as `async` but uses **synchronous file operations**:
- `fs.existsSync(dir)` — sync
- `fs.mkdirSync(dir)` — sync
- `fs.statSync(LEADS_FILE)` — sync
- `fs.accessSync()` — sync
- `fs.appendFileSync()` — sync
- `fs.readFileSync()` — sync (in getStats)

**However:** These are fast local file operations. On a healthy system, they complete in milliseconds. Not likely to cause 30s hangs.

### No Rate Limiter Middleware
The server.js does NOT import or use any rate limiter middleware. The `rateLimiter.js` file exists but is not used in the current server.js. So rate limiting is NOT the cause.

## Updated Hypotheses (Ranked by Evidence)

#### Hypothesis 1: verifyConnection() Startup Blocking (HIGHEST PRIORITY)
**Evidence:** `email.js` has `verifyConnection()` which is called at startup:
```js
verifyConnection().then(ok => {
  if (!ok) {
    console.warn('[Startup] Email service not fully configured...');
  }
});
```
This creates a transporter and calls `t.verify()` which opens an SMTP connection to Zoho. If this hangs (e.g., Zoho blocking Render IP, network issue), the Promise never resolves.

**However:** It's not awaited, so shouldn't block. But if nodemailer has a bug where `verify()` blocks the event loop...

#### Hypothesis 2: saveLead() File I/O Blocking on Render (HIGH PRIORITY)
**Evidence:** Both `/api/contact` and `/api/subscribe` call `saveLead()`. Both hang. Other POST endpoints (`/api/chat`) don't call `saveLead()` and work fine.

`saveLead()` uses sync file operations:
- `fs.existsSync(dir)`
- `fs.mkdirSync(dir)`
- `fs.statSync(LEADS_FILE)`
- `fs.accessSync()`
- `fs.appendFileSync()`

On Render's ephemeral filesystem, these could be extremely slow or deadlocking.

**Required Evidence:** Add timing logs around each fs operation in saveLead().

#### Hypothesis 3: Express Validator Blocking (DEPRIORITIZED)
**Evidence:** `/api/subscribe` has minimal validation (just email) and also hangs. So it's not validator complexity.

#### Hypothesis 4: Body Parser Hanging (DEPRIORITIZED)
**Evidence:** `/api/chat` uses same body parser and works fine.

#### Hypothesis 5: CORS Middleware Hanging (DEPRIORITIZED)
**Evidence:** `/api/chat` uses same CORS and works fine.

## Current Leading Hypothesis: saveLead() Sync File I/O Blocking

**Evidence:**
1. Both `/api/contact` and `/api/subscribe` hang — both call `saveLead()`
2. `/api/chat` works — does NOT call `saveLead()`
3. GET endpoints work — do NOT call `saveLead()`
4. The pattern is consistent: any endpoint using `saveLead()` hangs

**Theory:** Render's ephemeral filesystem has issues with synchronous file operations. The `fs.appendFileSync()` or related operations may be blocking the event loop for 30+ seconds or deadlocking.

**Why this fits:**
- Render free tier uses ephemeral disks that can be slow
- Sync I/O blocks the entire Node.js event loop
- If the disk is unresponsive, the sync call hangs indefinitely
- Other endpoints (GET, /api/chat) don't touch the disk, so they work

## Next Steps
1. **URGENT: Fix saveLead() to use async file operations** — Convert `fs.*Sync` to `fs.promises.*`
2. **Add timing logs to saveLead()** — Log before/after each fs operation
3. **Check Render logs** — Look for `request_received` without `response_sent` or `lead_saved`
4. **Test /api/subscribe after fix** — Should work if hypothesis is correct
5. **Browser test** — Compare DevTools timing with curl results
6. **Only declare root cause after evidence confirms it**
