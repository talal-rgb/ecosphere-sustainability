# Security Phase 2 Audit Report

**Date:** 2026-06-17
**Auditor:** Terrnix Security Agent
**Scope:** localStorage, sessionStorage, API endpoints, contact forms, calculator exports, chatbot endpoints, PDF generation flow
**Risk Scale:** 0-10 (10 = critical)

---

## Executive Summary

| Category | Findings | Critical | High | Medium | Low |
|----------|----------|----------|------|--------|-----|
| localStorage | 3 | 0 | 1 | 2 | 0 |
| API Endpoints | 5 | 0 | 2 | 2 | 1 |
| Contact Forms | 2 | 0 | 1 | 1 | 0 |
| Chatbot | 2 | 0 | 0 | 1 | 1 |
| PDF Generation | 1 | 0 | 0 | 1 | 0 |
| Security Headers | 6 | 0 | 3 | 3 | 0 |
| **Total** | **19** | **0** | **7** | **10** | **2** |

---

## 1. localStorage Security

### Finding 1.1: Chat History Stored in Plain Text
**Risk:** 6.5/10 (High)
**Location:** `index.html:5349-5357`
```javascript
const CHAT_STORAGE_KEY = 'terrnix_chat_history';
let history = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));
```
**Issue:** Chat messages are stored in localStorage without encryption. Any XSS vulnerability or malicious browser extension can read the full chat history.
**Impact:** Sensitive business queries (emissions data, strategy questions) exposed to attackers.
**Recommendation:** Encrypt localStorage data with AES-GCM using a derived key.

### Finding 1.2: Rate Limit Data Stored in Plain Text
**Risk:** 4.0/10 (Medium)
**Location:** `assets/js/rateLimitHelper.js:82-88`
```javascript
localStorage.setItem(
  this.getStorageKey(endpoint),
  JSON.stringify(requests)
);
```
**Issue:** Rate limit timestamps stored unencrypted. Attackers can manipulate timestamps to bypass rate limiting.
**Impact:** Rate limiting bypassed, enabling brute force or spam attacks.
**Recommendation:** Encrypt rate limit data or use sessionStorage instead.

### Finding 1.3: CMS Articles Stored in Plain Text
**Risk:** 4.0/10 (Medium)
**Location:** `index.html:6093-6095`
```javascript
let articles = JSON.parse(localStorage.getItem(ARTICLES_KEY) || '[]');
localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
```
**Issue:** CMS article data stored unencrypted. Less sensitive but still business data.
**Impact:** Content manipulation, potential XSS if article content is not sanitized.
**Recommendation:** Encrypt or sign article data to prevent tampering.

---

## 2. API Endpoint Security

### Finding 2.1: No Input Validation on Contact Form
**Risk:** 7.0/10 (High)
**Location:** `backend/server.js:115-140`
```javascript
app.post('/api/contact', (req, res) => {
  const { name, email, company, phone, discipline, message } = req.body;
  // Only checks if fields exist, no sanitization
});
```
**Issue:** No input sanitization on name, company, phone, discipline, or message fields. Vulnerable to injection attacks.
**Impact:** NoSQL injection, log injection, potential XSS if data is displayed elsewhere.
**Recommendation:** Implement strict input validation and sanitization using validator.js or express-validator.

### Finding 2.2: No Honeypot or CAPTCHA on Forms
**Risk:** 6.5/10 (High)
**Location:** `backend/server.js:92-140`
**Issue:** No bot protection on subscribe or contact endpoints. Automated scripts can spam forms.
**Impact:** Email list pollution, contact form spam, resource exhaustion.
**Recommendation:** Add honeypot fields and/or CAPTCHA (hCaptcha/reCAPTCHA v3).

### Finding 2.3: CORS Allows localhost in Production
**Risk:** 5.0/10 (Medium)
**Location:** `backend/server.js:24-33`
```javascript
const corsOptions = {
  origin: [
    'https://terrnix.com',
    'https://www.terrnix.com',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  // ...
};
```
**Issue:** localhost origins allowed in production CORS config. Attackers can run malicious local servers.
**Impact:** CSRF attacks from locally running malicious applications.
**Recommendation:** Remove localhost from production CORS, use environment-based config.

### Finding 2.4: No Request Size Limits on Specific Endpoints
**Risk:** 5.0/10 (Medium)
**Location:** `backend/server.js:92-140`
**Issue:** Global 10kb body limit is reasonable, but no per-endpoint limits. Contact form could accept large payloads.
**Impact:** Memory exhaustion, DoS attacks.
**Recommendation:** Add stricter limits per endpoint (contact: 5kb, subscribe: 1kb).

### Finding 2.5: Error Messages Leak Stack Traces
**Risk:** 3.0/10 (Low)
**Location:** `backend/server.js:147-152`
```javascript
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```
**Issue:** Error logged to console but safe response sent. However, console.error in production may leak to logs.
**Impact:** Information disclosure through logs.
**Recommendation:** Use structured logging with sensitive data redaction.

---

## 3. Contact Form Security

### Finding 3.1: Client-Side Validation Only
**Risk:** 6.0/10 (High)
**Location:** `contact/index.html`, `index.html:6185-6195`
**Issue:** Email validation is only `email.includes('@')` on client side. Server accepts any string.
**Impact:** Invalid emails stored, bounced emails, wasted resources.
**Recommendation:** Server-side regex validation + MX record verification.

### Finding 3.2: No CSRF Protection
**Risk:** 5.0/10 (Medium)
**Location:** `backend/server.js:92-140`
**Issue:** No CSRF tokens on form submissions. Cross-site request forgery possible.
**Impact:** Attacker can trick users into submitting forms.
**Recommendation:** Implement CSRF tokens or use SameSite cookies.

---

## 4. Chatbot Security

### Finding 4.1: Chat History Persists Indefinitely
**Risk:** 4.5/10 (Medium)
**Location:** `index.html:5349-5357`
**Issue:** Chat history never expires. Sensitive business data accumulates in localStorage.
**Impact:** Long-term data exposure if device is compromised.
**Recommendation:** Auto-expire chat history after 7 days, encrypt storage.

### Finding 4.2: Admin Password in Client Code
**Risk:** 3.0/10 (Low)
**Location:** `index.html:5208`
```javascript
const ADMIN_PASSWORD = 'terrnix2026';
```
**Issue:** Hardcoded password visible in client-side JavaScript. Already noted in previous audit.
**Impact:** CMS access if attacker inspects source.
**Recommendation:** Move to server-side authentication (already planned).

---

## 5. PDF Generation Security

### Finding 5.1: PDF Uses document.write with User Data
**Risk:** 4.5/10 (Medium)
**Location:** `carbon-accounting/carbon-footprint-calculator/index.html:1220`
```javascript
printWindow.document.write(html);
```
**Issue:** User-entered data injected into PDF HTML without full sanitization. Potential for HTML injection in PDF context.
**Impact:** Malicious user input could affect PDF rendering or contain hidden content.
**Recommendation:** Strict HTML escaping before injecting into PDF template.

---

## 6. Security Headers

### Finding 6.1: Missing HSTS Header
**Risk:** 7.0/10 (High)
**Location:** All HTML files, backend server
**Issue:** No HTTP Strict Transport Security header. Site vulnerable to SSL stripping attacks.
**Impact:** Man-in-the-middle attacks, downgrade to HTTP.
**Recommendation:** Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### Finding 6.2: Missing X-Frame-Options
**Risk:** 6.5/10 (High)
**Location:** All HTML files, backend server
**Issue:** No clickjacking protection. Site can be embedded in malicious iframes.
**Impact:** Clickjacking attacks, UI redressing.
**Recommendation:** Add `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`

### Finding 6.3: Missing X-Content-Type-Options
**Risk:** 5.5/10 (Medium)
**Location:** All HTML files, backend server
**Issue:** No MIME type sniffing protection. Browsers may execute uploaded files.
**Impact:** MIME sniffing attacks, XSS via file uploads.
**Recommendation:** Add `X-Content-Type-Options: nosniff`

### Finding 6.4: Missing Referrer-Policy
**Risk:** 5.0/10 (Medium)
**Location:** All HTML files
**Issue:** No control over referrer information leaked to third parties.
**Impact:** Sensitive URL parameters exposed to external sites.
**Recommendation:** Add `Referrer-Policy: strict-origin-when-cross-origin`

### Finding 6.5: Missing Permissions-Policy
**Risk:** 5.0/10 (Medium)
**Location:** All HTML files
**Issue:** No restrictions on browser features (camera, microphone, geolocation).
**Impact:** Unintended feature access by embedded content.
**Recommendation:** Add `Permissions-Policy` restricting unnecessary features.

### Finding 6.6: CSP Missing report-uri
**Risk:** 4.5/10 (Medium)
**Location:** `index.html:12`
**Issue:** Content Security Policy has no report-uri directive. Violations go unnoticed.
**Impact:** Undetected CSP bypass attempts.
**Recommendation:** Add `report-uri https://terrnix.com/csp-report` or use report-to.

---

## Risk Matrix

| Finding | Risk | Effort | Priority |
|---------|------|--------|----------|
| 2.1 Input validation | 7.0 | Medium | P1 |
| 6.1 HSTS header | 7.0 | Low | P1 |
| 2.2 No CAPTCHA/honeypot | 6.5 | Medium | P1 |
| 6.2 X-Frame-Options | 6.5 | Low | P1 |
| 1.1 localStorage encryption | 6.5 | Medium | P1 |
| 3.1 Client-side validation only | 6.0 | Low | P2 |
| 6.3 X-Content-Type-Options | 5.5 | Low | P2 |
| 2.3 CORS localhost | 5.0 | Low | P2 |
| 2.4 Request size limits | 5.0 | Low | P2 |
| 3.2 No CSRF protection | 5.0 | Medium | P2 |
| 6.4 Referrer-Policy | 5.0 | Low | P2 |
| 6.5 Permissions-Policy | 5.0 | Low | P2 |
| 4.1 Chat history expiry | 4.5 | Low | P3 |
| 5.1 PDF HTML injection | 4.5 | Low | P3 |
| 6.6 CSP report-uri | 4.5 | Low | P3 |
| 1.2 Rate limit storage | 4.0 | Low | P3 |
| 1.3 Article storage | 4.0 | Low | P3 |
| 4.2 Admin password | 3.0 | Low | P3 |
| 2.5 Error logging | 3.0 | Low | P3 |

---

## Compliance Mapping

| Finding | OWASP Top 10 2021 | NIST 800-53 |
|---------|-------------------|-------------|
| 1.1 localStorage encryption | A05:2021 – Security Misconfiguration | SC-28 Protection of Information at Rest |
| 2.1 Input validation | A03:2021 – Injection | SI-10 Information Input Validation |
| 2.2 No CAPTCHA | A07:2021 – Identification and Authentication Failures | IA-2 Identification and Authentication |
| 6.1 HSTS | A05:2021 – Security Misconfiguration | SC-8 Transmission Confidentiality |
| 6.2 X-Frame-Options | A05:2021 – Security Misconfiguration | SC-7 Boundary Protection |
| 3.2 No CSRF | A01:2021 – Broken Access Control | AC-12 Session Termination |

---

## Next Steps

1. Implement localStorage encryption (AES-GCM)
2. Harden backend endpoints with input validation
3. Add security headers to all pages and backend responses
4. Add bot protection to forms
5. Implement CSRF protection
6. Add CSP reporting endpoint
