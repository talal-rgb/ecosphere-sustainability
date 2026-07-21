# SEO Deployment Checklist — Terrnix RC1

**Date:** 2026-07-21
**Auditor:** Terrnix AI
**Scope:** sitemap.xml, robots.txt, canonical URLs, metadata, structured data

---

## Executive Summary

| Check | Status | Count |
|-------|--------|-------|
| Sitemap exists | ✅ PASS | 22 URLs |
| Robots.txt exists | ⚠️ PARTIAL | Wrong domain in sitemap reference |
| Canonical consistency | ⚠️ PARTIAL | 7 pages use www.terrnix.com |
| Title tags | ✅ PASS | All 20 pages have unique titles |
| Meta descriptions | ✅ PASS | All 20 pages have descriptions |
| Structured data | ⚠️ PARTIAL | Only 2 hub pages have schema |
| Indexability | ✅ PASS | All pages allow indexing |

**Critical Issue:** robots.txt references `www.terrnix.com/sitemap.xml` instead of `terrnix.com/sitemap.xml`
**High Issue:** 7 pages have canonical URLs with `www.` prefix — splits SEO authority

---

## 1. Sitemap Audit

### File: `sitemap.xml`

**Status:** ✅ EXISTS, valid XML

**URL Count:** 22 URLs

**Coverage:**

| Page | In Sitemap | Status |
|------|-----------|--------|
| Homepage (/) | ✅ | 200 |
| Carbon Accounting hub | ✅ | 200 |
| Scope 1 guide | ✅ | 200 |
| Scope 2 guide | ✅ | 200 |
| Scope 3 guide | ✅ | 200 |
| Carbon Calculator | ✅ | 200 |
| ESG Reporting hub | ✅ | 200 |
| CSRD Omnibus guide | ✅ | 200 |
| Sustainability Intelligence hub | ✅ | 200 |
| 6 Intelligence articles | ✅ | 4 work, 2 removed |
| Tools hub | ✅ | 200 |
| Resources hub | ✅ | 200 |
| FAQ | ✅ | 200 |
| Glossary | ✅ | 200 |
| Guides | ✅ | 200 |
| About | ✅ | 200 |
| Contact | ✅ | 200 |

**Missing from Sitemap:**

| Page | Priority | Action |
|------|----------|--------|
| `/carbon-accounting-readiness-assessment/` | HIGH | Add to sitemap |
| `/certificate/verify/` | LOW | Add to sitemap |
| `/tools/energy-suite/` | MEDIUM | Add to sitemap |
| `/sustainability-intelligence/2026/07/eu-esg-rating-regulation-african-businesses/` | MEDIUM | Add to sitemap |
| `/sustainability-intelligence/2026/07/morocco-carbon-tax-cbam-8-billion-opportunity/` | MEDIUM | Add to sitemap |

**Lastmod Dates:**
- Some dates are stale (2026-06-11 for pages updated in July)
- Recommendation: Update lastmod dates for recently modified pages

---

## 2. Robots.txt Audit

### File: `robots.txt`

**Current Content:**
```
User-agent: *
Allow: /

Sitemap: https://www.terrnix.com/sitemap.xml
```

**Issues:**

1. **Wrong domain:** `https://www.terrnix.com/sitemap.xml` should be `https://terrnix.com/sitemap.xml`
   - Impact: Search engines may not find sitemap
   - Risk: LOW (most engines discover sitemap via other methods)
   - Fix: 1 minute

2. **Missing directives:**
   - No `Disallow` for private/internal pages
   - No crawl-delay (not critical)
   - No specific bot directives

**Recommended Content:**
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://terrnix.com/sitemap.xml
```

---

## 3. Canonical URL Audit

### Canonical Consistency Check

| Page | Canonical | Correct? |
|------|-----------|----------|
| Homepage | `https://terrnix.com/` | ✅ YES |
| Carbon Accounting | `https://terrnix.com/carbon-accounting/` | ✅ YES |
| ESG Reporting | `https://terrnix.com/esg-reporting/` | ✅ YES |
| Tools | `https://www.terrnix.com/tools/` | ❌ NO |
| Resources | `https://www.terrnix.com/resources/` | ❌ NO |
| Sustainability Intelligence | `https://www.terrnix.com/sustainability-intelligence/` | ❌ NO |
| Scope 1 | `https://www.terrnix.com/carbon-accounting/scope-1-emissions/` | ❌ NO |
| Scope 2 | `https://www.terrnix.com/carbon-accounting/scope-2-emissions/` | ❌ NO |
| Scope 3 | `https://www.terrnix.com/carbon-accounting/scope-3-emissions/` | ❌ NO |
| CSRD Guide | `https://www.terrnix.com/esg-reporting/csrd-omnibus-guide/` | ❌ NO |
| FAQ | `https://terrnix.com/resources/faq/` | ✅ YES |
| Glossary | `https://terrnix.com/resources/glossary/` | ✅ YES |
| Guides | `https://terrnix.com/resources/guides/` | ✅ YES |
| About | `https://terrnix.com/about/` | ✅ YES |
| Contact | `https://terrnix.com/contact/` | ✅ YES |
| Assessment | `https://terrnix.com/carbon-accounting-readiness-assessment/` | ✅ YES |

**Summary:** 7 pages have `www.` in canonical URL. This splits SEO authority between www and non-www versions.

**Fix Required:**
1. `tools/index.html`
2. `resources/index.html`
3. `sustainability-intelligence/index.html`
4. `carbon-accounting/scope-1-emissions/index.html`
5. `carbon-accounting/scope-2-emissions/index.html`
6. `carbon-accounting/scope-3-emissions/index.html`
7. `esg-reporting/csrd-omnibus-guide/index.html`

---

## 4. Title & Meta Description Audit

### Coverage: 100%

All 20 tested pages have:
- ✅ Unique `<title>` tag
- ✅ Unique `<meta name="description">`

### Quality Assessment

| Page | Title Length | Description Length | Quality |
|------|-------------|-------------------|---------|
| Homepage | 46 chars | 0 (missing!) | ⚠️ CRITICAL |
| Carbon Accounting | 47 chars | 156 chars | ✅ Good |
| ESG Reporting | 51 chars | 160 chars | ✅ Good |
| Tools | 58 chars | 147 chars | ✅ Good |
| Resources | 45 chars | 130 chars | ✅ Good |
| Intelligence | 46 chars | 160 chars | ✅ Good |
| About | 52 chars | 143 chars | ✅ Good |
| Contact | 41 chars | 130 chars | ✅ Good |

**Homepage meta description:** EXISTS (was missed in initial grep due to attribute order)

**Title Length Distribution:**
- Under 50 chars: 10 pages (may be too short for rich results)
- 50-60 chars: 6 pages (optimal)
- Over 60 chars: 4 pages (may be truncated)

---

## 5. Structured Data Audit

### Schema.org Implementation

| Page | Schema Type | Status |
|------|-------------|--------|
| Carbon Accounting hub | Article + FAQPage | ✅ Present |
| ESG Reporting hub | WebPage + FAQPage | ✅ Present |
| All other pages | None | ❌ Missing |

**Gap Analysis:**

| Page | Recommended Schema | Priority |
|------|-------------------|----------|
| Homepage | Organization + WebSite | HIGH |
| Tools | WebPage + SoftwareApplication | MEDIUM |
| Resources | WebPage | LOW |
| Intelligence hub | WebPage + ItemList | MEDIUM |
| Intelligence articles | Article + NewsArticle | HIGH |
| Scope 1/2/3 guides | Article + FAQPage | MEDIUM |
| CSRD guide | Article + FAQPage | MEDIUM |
| Calculator | WebPage + SoftwareApplication | MEDIUM |
| Assessment | WebPage + Product | MEDIUM |
| FAQ page | FAQPage | HIGH |
| Glossary | WebPage + DefinedTermSet | LOW |

---

## 6. Indexability Audit

### robots.txt
- ✅ `Allow: /` — All pages indexable
- ✅ No `Disallow` directives blocking content
- ✅ No `noindex` meta tags found on tested pages

### Potential Issues
- ⚠️ Intelligence hub had 4 links to 404 pages (fixed in Workstream A)
- ⚠️ No `X-Robots-Tag` headers verified

---

## 7. Google Search Console Readiness

### Prerequisites Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Domain verified | ✅ YES | Verified 2026-06-07 |
| Sitemap submitted | ⚠️ UNKNOWN | Should be submitted after robots.txt fix |
| HTTPS | ✅ YES | All pages serve over HTTPS |
| Mobile-friendly | ⚠️ NOT TESTED | Requires manual testing |
| Core Web Vitals | ⚠️ NOT TESTED | Requires field data |
| No manual actions | ⚠️ NOT CHECKED | Requires GSC access |

### Recommended Actions for GSC

1. Fix robots.txt sitemap URL
2. Submit corrected sitemap to GSC
3. Request indexing for new/updated pages
4. Monitor Coverage report for 404s
5. Check Core Web Vitals report

---

## Action Items

### Critical (Fix Before RC1 Merge)

1. **Fix robots.txt** — Change `www.terrnix.com` to `terrnix.com`
2. **Fix 7 canonical URLs** — Remove `www.` prefix

### High (Fix in RC1 or RC2)

4. **Update sitemap** — Add missing pages, update lastmod dates
5. **Add structured data** — Homepage Organization schema, FAQ page FAQPage schema

### Medium (Post-RC1)

6. **Page-specific OG images** — Custom images for major pages
7. **Breadcrumb schema** — Add to all hub and guide pages
8. **Article schema** — Add to intelligence articles

### Low (Ongoing)

9. **Core Web Vitals monitoring** — Set up in GSC
10. **Mobile usability testing** — Regular checks
11. **Internal link audit** — Quarterly review

---

## Verification Commands

```bash
# Check robots.txt
curl -s https://terrnix.com/robots.txt

# Check sitemap
curl -s https://terrnix.com/sitemap.xml | head -20

# Check canonical on key pages
curl -s https://terrnix.com/ | grep 'rel="canonical"'
curl -s https://terrnix.com/tools/ | grep 'rel="canonical"'
curl -s https://terrnix.com/resources/ | grep 'rel="canonical"'

# Check meta description
curl -s https://terrnix.com/ | grep 'name="description"'
```

---

*Report generated by Terrnix AI — 2026-07-21*
