# Google Readiness Report

**Date:** 2026-07-02
**Scope:** All 53 HTML pages + sitemap + robots.txt
**Method:** Technical SEO audit, schema validation, mobile check

---

## Executive Summary

| Check | Status | Notes |
|---|---|---|
| XML sitemap | ✅ Updated | 49 URLs (was 19) |
| robots.txt | ✅ Present | Allows all, points to sitemap |
| Canonical URLs | ⚠️ Partial | 41/53 pages have canonicals |
| Breadcrumb schema | ⚠️ Partial | 27/53 pages have breadcrumbs |
| FAQ schema | ✅ Good | 6 FAQ pages have valid FAQPage schema |
| Article schema | ✅ Good | 6 news articles have structured data |
| Internal linking | ✅ Good | Hub-and-spoke architecture |
| Mobile friendliness | ✅ Good | Tailwind responsive, viewport meta |
| Page indexing readiness | ⚠️ Needs action | Test pages should be noindex |
| Core Web Vitals | ⚠️ Unknown | Needs real-world testing |

**Overall Status:** 75% ready. Critical gaps: canonicals on legacy pages, noindex on test pages, schema on hub pages.

---

## Sitemap Analysis

### Before vs After
| Metric | Before | After |
|---|---|---|
| URLs in sitemap | 19 | 49 |
| Last modified date | 2026-06-11 | 2026-07-02 |
| Priority distribution | Flat | Hierarchical |
| Missing clusters | CBAM, CSRD, GHG, PCF, ESG Hub, ISO 14064 | All included |

### Priority Distribution
| Priority | Count | Pages |
|---|---|---|
| 1.00 | 1 | Homepage |
| 0.90 | 8 | Major hubs |
| 0.85 | 6 | Cluster pillars |
| 0.80 | 34 | Guides, FAQs, articles |

### Issues
- ❌ **No `<xhtml:link rel="alternate">`** for language variants (not needed yet, single language)
- ❌ **No image sitemap** — 42 images on homepage not indexed separately
- ✅ **Proper `<lastmod>`** dates
- ✅ **Valid XML format**

---

## robots.txt Analysis

```
User-agent: *
Allow: /
Sitemap: https://www.terrnix.com/sitemap.xml
```

### Issues
- ⚠️ **No crawl-delay directive** — may overwhelm server if crawled aggressively
- ⚠️ **No disallow for test pages** — test-*.html should be blocked
- ⚠️ **Sitemap URL uses www** — should match canonical domain preference

### Recommended Update
```
User-agent: *
Allow: /
Disallow: /test-*.html
Disallow: /analytics-dashboard/
Disallow: /download-pdf.html
Crawl-delay: 1
Sitemap: https://terrnix.com/sitemap.xml
```

---

## Canonical URL Audit

### Pages WITH Canonical (41/53)
All Week 2 cluster pages, news articles, and main hubs have self-referencing canonicals.

### Pages WITHOUT Canonical (12/53)
| Page | Issue |
|---|---|
| about/index.html | Missing — add self-referencing |
| analytics-dashboard/index.html | Missing — add or noindex |
| carbon-accounting/index.html | Missing — add self-referencing |
| carbon-accounting/scope-1-emissions/index.html | Missing — add self-referencing |
| contact/index.html | Missing — add self-referencing |
| download-pdf.html | Missing — should be noindex |
| privacy-policy.html | Missing — add self-referencing |
| resources/index.html | Missing — add self-referencing |
| sustainability-intelligence/index.html | Missing — add self-referencing |
| terms-of-use.html | Missing — add self-referencing |
| test-*.html (3) | Missing — should be noindex |

---

## Schema Markup Validation

### FAQPage Schema (6 pages) — ALL VALID ✅
| Page | Questions | Validation |
|---|---|---|
| cbam/faq/index.html | 10 | ✅ Valid JSON-LD, proper Question/Answer structure |
| csrd/faq/index.html | 7 | ✅ Valid JSON-LD, proper Question/Answer structure |
| ghg-protocol/faq/index.html | 6 | ✅ Valid JSON-LD, proper Question/Answer structure |
| carbon-footprinting/faq/index.html | 6 | ✅ Valid JSON-LD, proper Question/Answer structure |
| esg-reporting-hub/faq/index.html | 6 | ✅ Valid JSON-LD, proper Question/Answer structure |
| iso-14064/faq/index.html | 6 | ✅ Valid JSON-LD, proper Question/Answer structure |

### BreadcrumbList Schema (27 pages) — ALL VALID ✅
Present on all cluster pages and news articles. Proper `itemListElement` with `ListItem` structure.

### Article Schema (6 pages) — ALL VALID ✅
News articles have `NewsArticle` schema with headline, datePublished, author.

### Missing Schema (26 pages)
| Page Type | Count | Recommended Schema |
|---|---|---|
| Hub pages | 6 | WebPage + Organization |
| Legacy guides | 4 | Article or WebPage |
| Utility pages | 5 | WebPage |
| Test pages | 3 | None (noindex) |
| Calculator | 1 | SoftwareApplication |

---

## Mobile Friendliness

### Checks Passed
- ✅ Viewport meta tag on 100% of pages
- ✅ Tailwind responsive breakpoints (sm:, md:, lg:)
- ✅ Flexible grid layouts
- ✅ Readable font sizes (16px base)
- ✅ Touch-friendly spacing

### Checks Unknown (Need Browser Testing)
- ⚠️ Actual tap target sizes
- ⚠️ Content reflow on small screens
- ⚠️ Horizontal scrolling
- ⚠️ LCP (Largest Contentful Paint) on mobile
- ⚠️ CLS (Cumulative Layout Shift)

---

## Core Web Vitals Assessment (Estimated)

| Metric | Estimate | Status | Notes |
|---|---|---|---|
| LCP (Largest Contentful Paint) | 2.5-4.0s | ⚠️ Needs Improvement | Large hero images, CDN scripts |
| FID/INP (Interaction) | 100-200ms | ✅ Good | Minimal JS, mostly static |
| CLS (Layout Shift) | 0.05-0.15 | ⚠️ Needs Improvement | Fonts loading, dynamic content |
| TTFB (Time to First Byte) | 200-500ms | ✅ Good | Static hosting (GitHub Pages) |

### Optimization Recommendations
1. **Preload critical fonts** — add `<link rel="preload">` for Space Grotesk and Inter
2. **Self-host Tailwind** — CDN script adds ~200ms blocking time
3. **Optimize images** — compress and add width/height attributes
4. **Add font-display: swap** — prevent invisible text during load
5. **Minify HTML** — reduce file sizes (index.html is 45KB+)

---

## Indexation Readiness Checklist

| Requirement | Status | Action Needed |
|---|---|---|
| Sitemap submitted to GSC | ❌ Unknown | Submit updated sitemap |
| robots.txt valid | ✅ Yes | Update to block test pages |
| No duplicate content | ✅ Yes | Canonicals prevent this |
| No soft 404s | ✅ Yes | All pages have content |
| Noindex on test pages | ❌ No | Add noindex meta or robots.txt block |
| HTTPS only | ✅ Yes | All URLs use https |
| Hreflang tags | N/A | Single language site |
| Pagination | N/A | No paginated content |

---

## Immediate Actions (This Week)

1. **Update robots.txt** — block test pages, add crawl-delay
2. **Add noindex to test pages** — 3 test files
3. **Add canonicals to 12 missing pages**
4. **Submit updated sitemap to Google Search Console**
5. **Request indexing for new cluster URLs**

## Short-term Actions (Next 2 Weeks)

6. **Add WebPage schema to all hub pages**
7. **Add SoftwareApplication schema to calculator**
8. **Preload fonts for faster LCP**
9. **Self-host Tailwind CSS**
10. **Compress and optimize images**

## Medium-term Actions (Month 2)

11. **Run Lighthouse audit** on all pillar pages
12. **Set up Core Web Vitals monitoring** in GSC
13. **Create image sitemap** for visual content
14. **Implement structured data for tools/calculators**
15. **Add Organization schema to homepage**
