# Terrnix Urgent Fix Sprint — Implementation Plan

**Date:** 2026-06-18
**Status:** Audit Complete → Ready for Implementation
**Sprint Goal:** Fix all broken form delivery, PDF UX, and About page

---

## Audit Summary

| Issue | Severity | Root Cause | Status |
|-------|----------|------------|--------|
| Contact form not sending | 🔴 CRITICAL | Frontend has `alert()` only, no API call; backend has `TODO` for email | Audit complete |
| Expert inquiry not sending | 🔴 CRITICAL | Frontend calls backend, but backend has `TODO` for email | Audit complete |
| Newsletter not saving | 🔴 CRITICAL | Backend logs to console, no Brevo integration | Audit complete |
| PDF button UX | 🟡 HIGH | Uses `window.print()` instead of actual download | Audit complete |
| About page weak | 🟡 MEDIUM | Generic content, no trust signals | Audit complete |

---

## Recommended PR Sequence

### PR #1: Form Delivery + Email Integration (🔴 HIGHEST PRIORITY)
**Branch:** `agent/form-delivery-email-20260618`

**Scope:**
1. Fix `contact/index.html` — replace `alert()` with real `fetch()` to backend
2. Add `nodemailer` to backend
3. Add Zoho SMTP email sending to `/api/contact`
4. Add Zoho SMTP email sending to `/api/subscribe`
5. Add Brevo API integration to `/api/subscribe`
6. Add environment variable handling
7. Add error handling and logging

**Files:**
- `backend/package.json`
- `backend/server.js`
- `backend/services/email.js` (new)
- `contact/index.html`
- `.env.example` (new)

**Verification:**
- [ ] Contact form submission → Tallal receives Zoho email
- [ ] Newsletter signup → Contact added to Brevo list
- [ ] Honeypot → Request rejected
- [ ] Rate limit → 429 returned

---

### PR #2: PDF Export UX Fix
**Branch:** `agent/pdf-ux-fix-20260618`

**Scope:**
1. Rewrite `generatePDFReport()` to use `html2pdf.js`
2. Rename button to "📥 Download PDF Report"
3. Auto-generate filename: `terrnix-carbon-report-YYYY-MM-DD.pdf`
4. Remove popup dependency
5. Add loading state and error handling

**Files:**
- `carbon-accounting/carbon-footprint-calculator/index.html`

**Verification:**
- [ ] Chrome desktop → auto-downloads PDF
- [ ] Firefox desktop → auto-downloads PDF
- [ ] Mobile Chrome → downloads to Downloads folder
- [ ] Filename is correct
- [ ] PDF contains all 9 pages

---

### PR #3: About Page Rewrite
**Branch:** `agent/about-page-fix-20260618`

**Scope:**
1. Rewrite content with trust-building structure
2. Add founder section
3. Add methodology & standards section
4. Add product screenshots/descriptions
5. Add trust badges
6. Improve SEO (title, meta, structured data)
7. Strong single CTA

**Files:**
- `about/index.html`
- `assets/images/` (add screenshots/photos)

**Verification:**
- [ ] Mobile responsive
- [ ] Lighthouse > 90
- [ ] Structured data validates
- [ ] All links work

---

## Implementation Rules

1. **One PR per feature** — Do not mix form fixes with PDF fixes
2. **Never push to main** — Always create feature branch
3. **No secrets in repo** — All API keys via Render env vars
4. **Deploy before marking complete** — Test on terrnix.com
5. **Update MEMORY.md** after each PR merge

---

## Environment Variables Needed

| Variable | PR | Source |
|----------|-----|--------|
| `ZOHO_SMTP_HOST` | #1 | Zoho Mail settings |
| `ZOHO_SMTP_PORT` | #1 | Zoho Mail settings |
| `ZOHO_SMTP_USER` | #1 | Zoho Mail account |
| `ZOHO_SMTP_PASS` | #1 | Zoho app password |
| `CONTACT_TO_EMAIL` | #1 | Tallal's email |
| `BREVO_API_KEY` | #1 | Brevo Dashboard |
| `BREVO_LIST_ID` | #1 | Brevo Dashboard |

---

## Next Steps

1. **Tallal confirms:** Proceed with PR #1 implementation?
2. **Tallal provides:** Zoho SMTP credentials and Brevo API key?
3. **I implement:** PR #1 (forms + email)
4. **Tallal tests:** Submit contact form, verify email received
5. **I implement:** PR #2 (PDF UX)
6. **Tallal tests:** Download PDF from calculator
7. **I implement:** PR #3 (About page)
8. **Tallal reviews:** Content and trust signals

---

*Ready to begin implementation on approval.*
