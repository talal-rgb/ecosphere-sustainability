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

## Recommended Action: Restart Render Instance
The evidence strongly suggests the Render instance itself is in a bad state. The fact that:
1. GET works perfectly
2. POST hangs indefinitely
3. Request logging at the app entry point shows nothing
4. The issue persists across code changes

All point to an instance-level problem that a restart may fix.

## Next Steps
1. **Restart Render instance** — Via Render dashboard or deploy trigger
2. **Test immediately after restart** — Before any other requests
3. **Check if POST works after restart** — If yes, confirms instance state issue
4. **Monitor for recurrence** — If it happens again, investigate deeper
5. **Only declare root cause after evidence confirms it**
