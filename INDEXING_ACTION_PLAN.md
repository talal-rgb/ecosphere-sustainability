# Indexing Action Plan
**Date:** 2026-07-14  
**Property:** terrnix.com (sc-domain)  
**Sitemap URLs:** 19  
**Status:** 🟡 PARTIAL — Sitemap submitted but issues found

---

## 1. Sitemap Status

| Check | Result | Status |
|-------|--------|--------|
| Sitemap exists | ✅ Yes, at `/sitemap.xml` | 🟢 |
| Sitemap accessible | ✅ Returns 200, XML valid | 🟢 |
| robots.txt references sitemap | ⚠️ Points to `www.terrnix.com` (wrong subdomain) | 🟡 |
| Sitemap submitted to GSC | ❓ Unknown — needs verification | ⚠️ |

**robots.txt Issue:**
```
Sitemap: https://www.terrnix.com/sitemap.xml
```
The canonical domain is `terrnix.com` (no www). The robots.txt references `www.terrnix.com` which may cause:
- Google to fetch from wrong subdomain
- Potential canonicalization confusion
- Split authority between www and non-www

**Fix Required:**
```
Sitemap: https://terrnix.com/sitemap.xml
```

---

## 2. URL Status Check (Live Fetch Results)

| # | URL | Status | Title | Issues |
|---|-----|--------|-------|--------|
| 1 | `https://terrnix.com/` | ✅ 200 | Terrnix — AI Sustainability Intelligence Platform | Title not keyword-optimized |
| 2 | `https://terrnix.com/carbon-accounting/` | ✅ 200 | Carbon Accounting Guide & Software | "Software" misleading |
| 3 | `https://terrnix.com/carbon-accounting/scope-1-emissions/` | ❓ Not tested | — | — |
| 4 | `https://terrnix.com/carbon-accounting/scope-2-emissions/` | ❓ Not tested | — | — |
| 5 | `https://terrnix.com/carbon-accounting/scope-3-emissions/` | ❓ Not tested | — | — |
| 6 | `https://terrnix.com/carbon-accounting/carbon-footprint-calculator/` | ❓ Not tested | — | — |
| 7 | `https://terrnix.com/esg-reporting/` | ✅ 200 | ESG Reporting Guide & CSRD Compliance | — |
| 8 | `https://terrnix.com/esg-reporting/csrd-omnibus-guide/` | ❓ Not tested | — | — |
| 9 | `https://terrnix.com/sustainability-intelligence/` | ❓ Not tested | — | — |
| 10 | `https://terrnix.com/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/` | ✅ 200 | GHG Protocol Scope 3 Revisions 2026... | Title long |
| 11 | `https://terrnix.com/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/` | ✅ 200 | CBAM Definitive Phase 2026... | — |
| 12 | `https://terrnix.com/sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/` | ✅ 200 | SBTi Rules Update 2026... | — |
| 13 | `https://terrnix.com/sustainability-intelligence/2026/06/esrs-simplified-standards-2026/` | ✅ 200 | ESRS Simplified Standards 2026... | — |
| 14 | `https://terrnix.com/sustainability-intelligence/2026/06/cbam-definitive-phase-july-2026/` | ❓ Not tested | — | Potential duplicate with #11 |
| 15 | `https://terrnix.com/sustainability-intelligence/2026/06/scope-3-supplier-engagement-2026/` | ✅ 200 | Scope 3 Supplier Engagement... | — |
| 16 | `https://terrnix.com/tools/` | ❓ Not tested | — | — |
| 17 | `https://terrnix.com/resources/` | ❓ Not tested | — | — |
| 18 | `https://terrnix.com/about/` | ❓ Not tested | — | — |
| 19 | `https://terrnix.com/contact/` | ❓ Not tested | — | — |

**Tested URLs:** 7/19 (36%)  
**All tested URLs return 200** ✅

---

## 3. Canonical URL Analysis

| URL | Canonical | Matches Sitemap? | Issue |
|-----|-----------|------------------|-------|
| `https://terrnix.com/` | `https://terrnix.com/` | ✅ Yes | None |
| `https://terrnix.com/carbon-accounting/` | Not checked | ❓ Unknown | — |
| `https://terrnix.com/esg-reporting/` | Not checked | ❓ Unknown | — |

**SPA Architecture Risk:**
Terrnix uses a single-page application (SPA) structure. The `index.html` has:
```html
<link rel="canonical" href="https://terrnix.com/"/>
```

**Problem:** All pages may have the SAME canonical (`https://terrnix.com/`) because:
- SPA routing doesn't update the canonical tag
- Google may see all URLs as canonical to homepage
- This causes indexation issues for deep pages

**Fix Required:**
Add dynamic canonical update in router:
```javascript
// Update canonical tag on route change
const canonical = document.querySelector('link[rel="canonical"]');
if (canonical) {
  canonical.href = 'https://terrnix.com' + window.location.pathname;
}
```

---

## 4. Duplicate Content Risk

| URLs | Issue | Severity |
|------|-------|----------|
| `/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/` and `/sustainability-intelligence/2026/06/cbam-definitive-phase-july-2026/` | Two CBAM articles with similar titles | 🟡 Medium |

**Analysis:**
- URLs #11 and #14 both cover CBAM definitive phase
- Titles are very similar
- Risk of cannibalization

**Recommendation:**
- Verify content is unique for each
- If duplicate, 301 redirect the weaker one
- Add canonical tag pointing to preferred version

---

## 5. Pages Not Yet Indexed (Inferred)

**From GSC Data (52 impressions, 0 clicks):**
- Some pages ARE indexed (impressions exist)
- But click-through is zero
- Cannot determine which specific pages are indexed without GSC page-level data

**High-Priority Pages to Verify Index Status:**

| Priority | Page | Why Critical |
|----------|------|-------------|
| P0 | `/carbon-accounting/carbon-footprint-calculator/` | Highest traffic potential (score 91) |
| P0 | `/carbon-accounting/` | Hub page, main keyword target |
| P0 | `/esg-reporting/` | Hub page, CSRD traffic |
| P1 | `/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/` | High-value article |
| P1 | `/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/` | High-value article |
| P2 | `/tools/` | Conversion page |
| P2 | `/about/` | Trust/authority page |

---

## 6. Orphan or Weakly Linked Pages

**Potential Orphans:**

| Page | Internal Links | Risk |
|------|---------------|------|
| `/sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/` | Unknown | May be orphan if not linked from hub |
| `/sustainability-intelligence/2026/06/esrs-simplified-standards-2026/` | Unknown | May be orphan |
| `/sustainability-intelligence/2026/06/scope-3-supplier-engagement-2026/` | Unknown | May be orphan |

**SPA Navigation Risk:**
- SPA internal links may not be crawlable by Google
- JavaScript-required navigation limits discovery
- Sitemap is the primary discovery mechanism

---

## 7. Action Plan

### Immediate (This Week)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | **Fix robots.txt sitemap URL** — change `www.terrnix.com` to `terrnix.com` | Low | High |
| 2 | **Add dynamic canonical tags** — update on SPA route change | Medium | High |
| 3 | **Verify sitemap submitted to GSC** — check GSC > Sitemaps | Low | Critical |
| 4 | **Request indexing for top 5 pages** — GSC > URL Inspection | Low | High |

### Short-Term (Next 2 Weeks)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 5 | **Add static HTML fallbacks** for key pages (carbon-accounting, esg-reporting) | High | Very High |
| 6 | **Fix duplicate CBAM articles** — merge or differentiate | Medium | Medium |
| 7 | **Add internal links** from hub pages to all articles | Medium | High |
| 8 | **Verify all 19 sitemap URLs return 200** | Low | Medium |

### Medium-Term (Next 30 Days)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 9 | **Implement server-side rendering (SSR)** or prerendering for SEO | High | Very High |
| 10 | **Add breadcrumb navigation** with structured data | Medium | Medium |
| 11 | **Create XML sitemap index** if scaling beyond 50,000 URLs | Low | Low |

---

## 8. Verification Checklist

- [ ] robots.txt sitemap URL corrected
- [ ] Canonical tags update dynamically per page
- [ ] Sitemap confirmed in GSC
- [ ] All 19 URLs return 200
- [ ] No duplicate content issues
- [ ] Top 5 pages indexed in Google
- [ ] Internal linking structure verified
- [ ] SPA navigation crawlable

---

## 9. Expected Outcomes

| Metric | Current | Target (Day 14) | Target (Day 30) |
|--------|---------|-----------------|-----------------|
| Indexed Pages | Unknown | 15+ | 19 (100%) |
| Sitemap URLs Valid | 7/19 tested | 19/19 | 19/19 |
| Canonical Issues | 1+ | 0 | 0 |
| Duplicate Issues | 1 potential | 0 | 0 |

---

*Plan prepared: 2026-07-14*  
*Next review: 2026-07-28*
