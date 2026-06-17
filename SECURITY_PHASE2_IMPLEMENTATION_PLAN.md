# Security Phase 2 Implementation Plan

**Date:** 2026-06-17
**Branch:** `agent/security-phase2-20260617`
**Target:** Complete all P1 and P2 findings from SECURITY_PHASE2_AUDIT.md

---

## Implementation Checklist

### A. localStorage Encryption

- [x] **A.1 Create `assets/js/storageCrypto.js`**
  - AES-GCM encryption for localStorage values
  - Key derivation from domain + user agent (non-exportable)
  - Transparent get/set API matching localStorage
  - Fallback to plain localStorage if crypto unavailable

- [x] **A.2 Update `index.html`**
  - Replace direct localStorage calls with encrypted storage
  - Migrate existing plain data on first load
  - CHAT_STORAGE_KEY, ARTICLES_KEY encryption

- [x] **A.3 Update `assets/js/rateLimitHelper.js`**
  - Use encrypted storage for rate limit timestamps
  - Prevent timestamp manipulation attacks

### B. Backend Endpoint Hardening

- [x] **B.1 Install express-validator**
  - `npm install express-validator`

- [x] **B.2 Update `backend/server.js`**
  - Input validation on /api/contact (name, email, company, phone, discipline, message)
  - Input validation on /api/subscribe (email)
  - Sanitize all inputs (strip HTML, limit length)
  - Add per-endpoint body size limits
  - Add honeypot field validation

- [x] **B.3 Update CORS configuration**
  - Remove localhost from production
  - Use environment variable for origins

- [x] **B.4 Add CSRF protection**
  - Generate CSRF tokens for form endpoints
  - Validate tokens on POST requests

### C. Security Headers

- [x] **C.1 Add meta tags to all HTML pages**
  - `<meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">`
  - `<meta http-equiv="X-Frame-Options" content="DENY">`
  - `<meta http-equiv="X-Content-Type-Options" content="nosniff">`
  - `<meta name="referrer" content="strict-origin-when-cross-origin">`
  - `<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()">`

- [x] **C.2 Update backend to send security headers**
  - Add helmet.js or manual header middleware
  - All responses include security headers

- [x] **C.3 Update CSP with report-uri**
  - Add `report-uri https://terrnix.com/csp-report`
  - Create CSP report endpoint (optional)

---

## Files to Modify

| File | Changes |
|------|---------|
| `assets/js/storageCrypto.js` | **NEW** - Encryption layer for localStorage |
| `assets/js/rateLimitHelper.js` | Use encrypted storage |
| `index.html` | Use encrypted storage for chat/articles; add security meta tags |
| `backend/server.js` | Input validation, sanitization, CSRF, size limits |
| `backend/package.json` | Add express-validator, helmet dependencies |
| `contact/index.html` | Add security meta tags, honeypot field |
| `carbon-accounting/carbon-footprint-calculator/index.html` | Add security meta tags |
| `carbon-accounting/index.html` | Add security meta tags |
| `carbon-accounting/scope-1-emissions/index.html` | Add security meta tags |
| `carbon-accounting/scope-2-emissions/index.html` | Add security meta tags |
| `carbon-accounting/scope-3-emissions/index.html` | Add security meta tags |
| `esg-reporting/index.html` | Add security meta tags |
| `esg-reporting/csrd-omnibus-guide/index.html` | Add security meta tags |
| `sustainability-intelligence/index.html` | Add security meta tags |
| `tools/index.html` | Add security meta tags |
| `resources/index.html` | Add security meta tags |
| `about/index.html` | Add security meta tags |
| `privacy-policy.html` | Add security meta tags |
| `terms-of-use.html` | Add security meta tags |

---

## Implementation Order

1. **Create `storageCrypto.js`** - Foundation for all localStorage encryption
2. **Update backend** - Harden endpoints first (defense in depth)
3. **Update frontend storage** - Migrate to encrypted storage
4. **Add security headers** - Meta tags on all pages, backend middleware
5. **Test** - Verify all functionality works with encryption
6. **Commit and PR** - Document all changes

---

## Testing Checklist

- [ ] Calculator works with encrypted localStorage
- [ ] Chat history persists and encrypts
- [ ] Rate limiting still enforces limits
- [ ] Contact form validates and sanitizes
- [ ] Subscribe form validates and sanitizes
- [ ] Security headers present on all pages
- [ ] Backend returns security headers
- [ ] No console errors
- [ ] CSP doesn't break functionality

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| localStorage encryption | Medium - could break existing data | Migration path: detect plain data, encrypt on first read |
| Backend validation | Low - additive only | Validate before processing, return 400 on failure |
| Security headers | Low - meta tags are passive | Test CSP doesn't block required resources |
| CSRF tokens | Medium - requires frontend changes | Add token to all forms, validate on backend |

---

## Rollback Plan

1. Revert to branch `main`
2. If localStorage encryption causes issues, clear storage and fall back to plain
3. Backend changes are additive (validation), so rollback removes protection but doesn't break functionality
