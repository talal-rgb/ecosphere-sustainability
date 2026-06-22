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

### Test 10: POST after 60s cooldown (FAILED)
**Timestamp:** 2026-06-22 18:01 GMT+2
**URL:** https://terrnix-backend.onrender.com/api/contact
**Method:** POST
**Payload:** {"name":"Cooldown Test","email":"cooldown@example.com",...}
**Expected:** HTTP 200 with JSON
**Actual:** ❌ Timeout after 30.002s — HTTP 000
**Conclusion:** Even after 60s cooldown, still hangs. Not request throttling from rapid testing.

### Test 11: POST after request logging added (FAILED)
**Timestamp:** 2026-06-22 18:03 GMT+2
**Commit:** `074c9fb`
**URL:** https://terrnix-backend.onrender.com/api/contact
**Method:** POST
**Expected:** HTTP 200 with JSON + request logs in Render
**Actual:** ❌ Timeout after 30.003s — HTTP 000
**Conclusion:** Even with request logging at the VERY START of Express (before any middleware), still hangs. This means the request is NOT reaching our Express app at all, OR something below Express is hanging.

### Critical Finding: Request NOT Reaching Express
Since we added logging before ALL middleware and still see no response, either:
1. Render is not routing the request to our app
2. The Node.js process is hung/dead
3. Something at the platform level is intercepting POST requests

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

## Fix Attempt 1: Async File I/O (DEPLOYED but NOT WORKING)
**Timestamp:** 2026-06-22 18:00 GMT+2
**Commit:** `2dda26c`
**Changes:** Converted all `fs.*Sync` to `fs.promises.*` in leadStore.js
**Test Result:** ❌ Still times out after 30s
**Conclusion:** File I/O was NOT the root cause. The hang persists even with async operations.

## Updated Critical Evidence
The async fix didn't work. This means the hang is NOT in the file I/O operations. We need to look elsewhere.

### New Hypothesis: Render Instance-Level Issue
**Evidence:**
- GET works fine
- POST /api/chat works fine
- POST /api/contact and /api/subscribe BOTH hang
- The only common factor is that contact/subscribe are the ONLY endpoints that:
  1. Use express-validator with many validation rules
  2. Call `saveLead()` (even async version hangs)
  3. Are called frequently during testing

**But wait:** The async file I/O fix should have worked if file I/O was the issue. Since it didn't, the hang must be elsewhere.

### New Leading Hypothesis: Render Free Tier Request Queuing/Throttling
**Evidence:**
- Render free tier has limitations on concurrent requests
- We've been hammering the endpoint with 120+ requests
- The instance may be queuing or throttling POST requests
- GET requests are cached or handled differently

**Required Evidence:** Check Render dashboard for request metrics, throttling logs.

### Alternative: Node.js/Express Bug with Specific Request Pattern
**Evidence:** The request IS received (TCP/TLS complete, body uploaded) but server never responds. Could be a bug in how Express handles certain POST request patterns.

**Required Evidence:** Add logging at the VERY START of the Express request pipeline (before any middleware).

## Updated Hypotheses (After Logging Test)

#### Hypothesis 1: Render Instance Process Dead/Hung (HIGHEST PRIORITY)
**Evidence:**
- GET works fine (0.3s)
- POST hangs (30s timeout)
- Request logging added at app level shows nothing
- The instance may be in a bad state where only GET works

**Theory:** The Node.js process may have partially crashed or is in a state where:
- Event loop is blocked by something we haven't identified
- Only GET handlers are responsive
- POST handlers are dead

**Required Evidence:** Restart the Render instance and test again.

#### Hypothesis 2: Render Platform POST Handling Issue (HIGH PRIORITY)
**Evidence:**
- Connection IS accepted (TCP/TLS complete)
- Request body IS uploaded
- But zero bytes received back
- Only affects POST, not GET

**Theory:** Render's reverse proxy or load balancer may have an issue with POST requests to this specific instance.

**Required Evidence:** Check Render status page, restart instance.

#### Hypothesis 3: Node.js/Express Internal State Corruption (MEDIUM PRIORITY)
**Evidence:**
- App was working before PR #32
- After multiple deployments, may be in corrupted state
- GET works, POST doesn't

**Theory:** Something in the Node.js runtime or Express internal state is corrupted.

**Required Evidence:** Restart instance, test immediately.

## Render Instance Restart Test
**Timestamp:** 2026-06-22 21:03 GMT+2
**Action:** Render instance restarted

### Test 12: GET /health after restart
**Result:** ✅ HTTP 200 in 4.15s (first request after restart, slower due to cold start)
**Subsequent GET:** ✅ HTTP 200 in 0.31s

### Test 13: OPTIONS /api/contact after restart
**Result:** ✅ HTTP 204 in 0.31s

### Test 14: POST /api/contact after restart (FAILED)
**Result:** ❌ Timeout after 15.00s — HTTP 000
**Conclusion:** Restart did NOT fix the issue. POST still hangs.

### Test 15: POST /api/subscribe after restart (FAILED)
**Result:** ❌ Timeout after 15.00s — HTTP 000
**Conclusion:** Restart did NOT fix the issue. POST still hangs.

## Critical Update: Restart Did Not Fix
The Render instance restart DID NOT resolve the timeout. This rules out:
- Instance state corruption
- Memory leaks
- Process hangs

The issue is **REPRODUCIBLE** and **CONSISTENT** across restarts.

## Fix Attempt 2: Defer verifyConnection (PARTIAL SUCCESS)
**Timestamp:** 2026-06-22 21:05 GMT+2
**Commit:** `177a28a`
**Changes:** Moved `verifyConnection()` into `setTimeout(..., 100)` to prevent any startup blocking
**Test Results:**
- POST /api/contact: ✅ HTTP 200 in 6.58s (SUCCESS!)
- POST /api/subscribe: ❌ Timeout after 15s (STILL FAILS)
- POST /api/contact (2nd try): ❌ Timeout after 15s (INTERMITTENT)

**Conclusion:** Deferring `verifyConnection()` helped — we got ONE successful contact submission! But it's still intermittent. The 6.58s response time is slow but within tolerance.

## Fix Attempt 4: Defer All Email/Brevo Operations (FAILED)
**Timestamp:** 2026-06-22 21:10 GMT+2
**Commit:** `f3f2ded`
**Changes:** Deferred all email and Brevo operations with setTimeout(..., 100)
**Test Results:**
- POST /api/contact (1st): ❌ Timeout after 15s
- POST /api/contact (2nd): ❌ Timeout after 15s

**Conclusion:** Deferring email operations didn't help either.

## Updated Critical Evidence
All fixes have failed:
1. ❌ Async fs.promises
2. ❌ Explicit fd close
3. ❌ Defer all email/brevo operations
4. ✅ Defer verifyConnection — ONE success (6.58s), then failed

The fact that we got ONE success after deferring verifyConnection but cannot reproduce it suggests the issue is **NOT consistently in any single component**.

## New Leading Hypothesis: Render Platform Issue with POST Requests
**Theory:** This may be a Render platform-level issue where:
1. POST requests to specific paths are being dropped or mishandled
2. The reverse proxy or load balancer has a bug
3. There's an IP-based rate limit or block affecting POST

**Evidence:**
- GET always works
- POST to /api/chat works (returns 503 quickly)
- POST to /api/contact and /api/subscribe hang
- The issue is consistent across restarts and code changes
- The ONE success might have been a fluke or different routing

## Alternative: Express Body Parser Issue
**Theory:** The `express.json()` body parser might be hanging on POST requests with specific body sizes or content types.

**Evidence:**
- /api/chat also uses express.json() and works
- But /api/chat has a simpler body structure

### Test 12: POST with empty body (WORKS!)
**Timestamp:** 2026-06-22 21:12 GMT+2
**Payload:** `{}`
**Result:** ✅ HTTP 400 in 0.34s
**Response:** Validation errors (expected)
**Conclusion:** Empty body POST works! Validation runs and returns errors quickly.

### Test 13: POST with valid body (FAILED)
**Timestamp:** 2026-06-22 21:12 GMT+2
**Payload:** `{"name":"Empty Body Test","email":"empty-body@example.com",...}`
**Result:** ❌ Timeout after 15s
**Conclusion:** Valid body POST still hangs. The issue occurs AFTER validation, during processing.

## Critical Finding: Empty Body Works, Valid Body Hangs
This is the most important finding yet:
- **Empty body** → Validation fails quickly (0.34s)
- **Valid body** → Hangs indefinitely

This means the hang occurs **AFTER validation** and **BEFORE or DURING** `saveLead()` or response.

## Updated Leading Hypothesis: saveLead() Hangs on Valid Data
**Theory:** The `saveLead()` function hangs when it tries to process valid lead data. The empty body test proves validation works, but something in the save process hangs.

**Possible causes:**
1. `crypto.randomUUID()` hangs (unlikely but possible in some Node.js versions)
2. `JSON.stringify()` hangs on certain data (unlikely)
3. File system operations hang when writing valid data (but we tested this)
4. Something else in the save process

### Test 14: POST with step-by-step logging (FAILED — NO LOGS)
**Timestamp:** 2026-06-22 21:14 GMT+2
**Commit:** `7be1384`
**Result:** ❌ Timeout after 15s
**Critical Finding:** Even with step-by-step logging at the VERY START of saveLead(), we see NO logs for timed-out requests.

### Test 15: POST with handler-start logging (FAILED — NO LOGS)
**Timestamp:** 2026-06-22 21:16 GMT+2
**Commit:** `2f85b4b`
**Result:** ❌ Timeout after 15s
**Critical Finding:** Even with logging at the VERY START of the contact handler (before validationResult), we see NO logs for timed-out requests.

This means the handler is **NEVER BEING CALLED** for timed-out requests.

## Updated Leading Hypothesis: Express Router/Route Matching Issue
Since:
1. Empty body POST works (returns 400 from validation)
2. Valid body POST hangs (no handler logs)
3. Request logging at app level shows nothing for timed-out requests

The hang occurs **BEFORE the route handler is invoked**.

### Most Likely Cause: Express Middleware Hanging Before Handler
**Theory:** One of the middlewares (CORS, helmet, body parser) is hanging when processing a valid POST request body. The empty body works because the body parser completes quickly with no data to parse.

**But wait:** /api/chat uses the SAME middleware and works fine with a valid body.

### Alternative: Route Registration Order Issue
**Theory:** There might be an issue with how Express matches routes. If a previous route is matching and hanging, the contact route never gets called.

### Alternative: Render Platform Issue
**Theory:** Render's infrastructure might be doing something with POST requests that causes them to hang at the platform level before reaching our app.

### Test 16: POST after getHealthStatusSync fix (FAILED)
**Timestamp:** 2026-06-22 21:18 GMT+2
**Commit:** `59f6fd9`
**Result:** ❌ Timeout after 15s
**Conclusion:** The getHealthStatus sync fix didn't help either.

## Summary of All Fix Attempts
| Fix | Commit | Result |
|-----|--------|--------|
| Async file I/O | 2dda26c | ❌ Failed |
| Defer verifyConnection | 177a28a | ✅ One success (6.58s) |
| Explicit fd close | 6ea9e1d | ❌ Failed |
| Defer all email/brevo | f3f2ded | ❌ Failed |
| Step-by-step logging | 7be1384 | ❌ Failed (no logs) |
| Handler-start logging | 2f85b4b | ❌ Failed (no logs) |
| getHealthStatusSync | 59f6fd9 | ❌ Failed |

## Current Status
**The contact form timeout issue remains unresolved.**

### What We Know
1. GET works fine
2. POST with empty body works (validation returns 400)
3. POST with valid body hangs (no handler logs)
4. The hang occurs BEFORE the route handler is called
5. Other POST endpoints (/api/chat) work fine
6. Restart doesn't fix it
7. Multiple code fixes haven't resolved it

### What We Don't Know
1. Whether requests are reaching the Express app at all for valid POSTs
2. What's different between empty-body and valid-body POSTs at the middleware level
3. Whether this is a Render platform issue or code issue

## Recommended Next Steps
1. **Create a minimal test endpoint** — `app.post('/test', (req, res) => res.json({ok: true}))` to see if ANY valid POST works
2. **Test from browser** — Browser may handle requests differently than curl
3. **Check Render logs** — Look for any request logs at all
4. **Consider Render support ticket** — If it's a platform issue
5. **Only declare root cause after evidence confirms it**
