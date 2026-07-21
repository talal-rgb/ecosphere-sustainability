# Broken Links Report — Terrnix RC1

**Date:** 2026-07-21
**Auditor:** Terrnix AI
**Scope:** All internal links across terrnix.com

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical (404 on linked pages) | 6 | To be fixed |
| High (canonical mismatch) | 1 | To be fixed |
| Medium (missing brand assets) | 3 | Documented |
| Low (placeholder text) | 1 | Documented |

**Total broken/placeholder resources:** 6 pages returning 404, 3 missing brand assets, 1 placeholder text.

---

## Critical Issues — 404 Pages

### 1. `/carbon-accounting/ghg-protocol-guide/` — 404
- **Linked from:** `carbon-accounting/index.html` (hub page)
- **Impact:** HIGH — Linked from flagship Carbon Accounting hub
- **Action:** Build professional GHG Protocol Guide page
- **Effort:** Medium (~2-3 hours)

### 2. `/carbon-accounting/emission-factors/` — 404
- **Linked from:** `carbon-accounting/index.html` (hub page)
- **Impact:** HIGH — Linked from flagship Carbon Accounting hub
- **Action:** Build professional Emission Factors reference page
- **Effort:** Medium (~2-3 hours)

### 3. `/sustainability-intelligence/2026/06/carbon-accounting-software-market-2026/` — 404
- **Linked from:** `sustainability-intelligence/index.html`
- **Impact:** MEDIUM — Intelligence article link
- **Action:** Remove link from hub until article is written
- **Effort:** Low (5 minutes)

### 4. `/sustainability-intelligence/2026/06/csrd-omnibus-2026-guide/` — 404
- **Linked from:** `sustainability-intelligence/index.html`
- **Impact:** MEDIUM — Intelligence article link
- **Action:** Remove link from hub until article is written
- **Effort:** Low (5 minutes)

### 5. `/sustainability-intelligence/2026/06/esg-reporting-requirements-2026/` — 404
- **Linked from:** `sustainability-intelligence/index.html`
- **Impact:** MEDIUM — Intelligence article link
- **Action:** Remove link from hub until article is written
- **Effort:** Low (5 minutes)

### 6. `/sustainability-intelligence/2026/06/eu-90-percent-emission-target/` — 404
- **Linked from:** `sustainability-intelligence/index.html`
- **Impact:** MEDIUM — Intelligence article link
- **Action:** Remove link from hub until article is written
- **Effort:** Low (5 minutes)

---

## High Issues

### 7. Canonical URL Mismatch — `www.terrnix.com` vs `terrnix.com`
- **Location:** `sustainability-intelligence/index.html` line 9
- **Current:** `<link rel="canonical" href="https://www.terrnix.com/sustainability-intelligence/"/>`
- **Expected:** `<link rel="canonical" href="https://terrnix.com/sustainability-intelligence/"/>`
- **Impact:** HIGH — Split SEO authority between www and non-www
- **Action:** Fix canonical to `terrnix.com` (no www)
- **Effort:** Low (2 minutes)

---

## Medium Issues — Missing Brand Assets

### 8. Favicon Missing
- **Location:** `<head>` of all pages
- **Impact:** MEDIUM — Browser tab icon, bookmark icon
- **Action:** Create/add favicon.ico and favicon links
- **Effort:** Low (15 minutes once asset exists)

### 9. Apple Touch Icon Missing
- **Location:** `<head>` of all pages
- **Impact:** LOW — iOS home screen icon
- **Action:** Add apple-touch-icon.png
- **Effort:** Low (5 minutes once asset exists)

### 10. OG Image Verification Needed
- **Location:** `/assets/og-image.png`
- **Impact:** MEDIUM — Social sharing preview
- **Action:** Verify image exists and is branded correctly
- **Effort:** Low (verification only)

---

## Low Issues

### 11. Placeholder Text on Homepage
- **Location:** `index.html` line ~4931
- **Text:** "Detailed analytics dashboard coming soon. Track views, engagement, and content performance."
- **Impact:** LOW — Minor UX issue
- **Action:** Remove or replace with actual feature
- **Effort:** Low (5 minutes)

---

## Fix Strategy

### Immediate (This PR)
1. Fix canonical URL in `sustainability-intelligence/index.html`
2. Remove 4 broken intelligence article links from hub
3. Add favicon links to all pages (if asset exists)

### Short-term (Next 1-2 sprints)
4. Build `/carbon-accounting/ghg-protocol-guide/` page
5. Build `/carbon-accounting/emission-factors/` page
6. Write missing intelligence articles OR remove links permanently

### Medium-term
7. Create proper favicon and touch icon assets
8. Verify OG image branding

---

## Verification Commands

```bash
# Check all critical paths
curl -sI https://terrnix.com/carbon-accounting/ghg-protocol-guide/
curl -sI https://terrnix.com/carbon-accounting/emission-factors/
curl -sI https://terrnix.com/sustainability-intelligence/2026/06/carbon-accounting-software-market-2026/
curl -sI https://terrnix.com/sustainability-intelligence/2026/06/csrd-omnibus-2026-guide/
curl -sI https://terrnix.com/sustainability-intelligence/2026/06/esg-reporting-requirements-2026/
curl -sI https://terrnix.com/sustainability-intelligence/2026/06/eu-90-percent-emission-target/
```

---

## Files to Modify

1. `sustainability-intelligence/index.html` — Remove 4 broken links, fix canonical
2. `carbon-accounting/index.html` — Note broken links (fix in separate PR)
3. All `*.html` pages — Add favicon links (if asset available)

---

*Report generated by Terrnix AI — 2026-07-21*
