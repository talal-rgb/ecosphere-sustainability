# Content Quality Audit Report

**Date:** 2026-07-02
**Scope:** All 53 HTML pages in repository
**Method:** Automated scoring (technical + depth) + manual review

---

## Executive Summary

| Metric | Before Fixes | After Fixes | Target |
|---|---|---|---|
| Total pages audited | 53 | 53 | 53 |
| Avg technical score | 77.1 | 81.8 | 85 |
| Avg depth score | 59.9 | 66.5 | 70 |
| Pages < 85 technical | 38 | 26 | <15 |
| Pages < 85 depth | 42 | 42 | <20 |
| Thin pages (<300 words) | 16 | 6 | <5 |
| Pages with schema | 18 | 27 | 40 |
| Pages with external refs | 12 | 18 | 30 |

**Status:** Significant improvement after batch rewrites. 6 pages remain critically thin. 26 pages need technical improvements.

---

## Scoring Methodology

### Technical Score (0-100)
| Criterion | Points | Weight |
|---|---|---|
| Unique title tag (>10 chars) | 15 | Critical |
| Meta description | 10 | Critical |
| Canonical URL | 10 | Critical |
| Open Graph tags | 5 | Important |
| Schema.org markup | 10 | Critical |
| Breadcrumb navigation | 5 | Important |
| FAQ/Article schema | 5 | Important |
| Consultation CTA | 10 | Critical |
| Internal links (3+) | 5 | Important |
| External references | 5 | Important |
| Mobile responsive | 5 | Important |
| Content length (>500 words) | 5 | Important |
| Language attribute | 5 | Standard |
| Viewport meta | 5 | Standard |
| Charset | 5 | Standard |

### Depth Score (0-100)
| Criterion | Points | Weight |
|---|---|---|
| Content length (>2000 words) | 15 | Critical |
| Official references (EC, ISO, etc.) | 10 | Critical |
| Statistics/numbers | 10 | Important |
| Practical steps/templates | 10 | Critical |
| Risk/penalty mentions | 10 | Important |
| Cost/financial impact | 10 | Important |
| Terrnix value proposition | 10 | Critical |
| Multiple headings (3+) | 10 | Important |
| Lists/structured content | 5 | Standard |

---

## Pages by Quality Tier

### Tier 1: Excellent (90-100 technical, 70+ depth)
| Page | Tech | Depth | Words | Notes |
|---|---|---|---|---|
| cbam/index.html | 100 | 75 | 1,006 | Strong pillar, calculator + case studies |
| cbam/faq/index.html | 100 | 75 | 1,474 | FAQ schema, comprehensive answers |
| cbam/supplier-data-collection/index.html | 100 | 85 | 1,071 | Deep practical guide |
| csrd/index.html | 90 | 85 | 1,593 | Strong pillar with stats |
| csrd/implementation-guide/index.html | 85 | 75 | 607 | 12-step guide, needs expansion |
| esg-reporting/index.html | 95 | 85 | 1,894 | Rich content, multiple frameworks |
| sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/index.html | 100 | 90 | 3,045 | News article, excellent depth |
| sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/index.html | 100 | 90 | 3,096 | News article, excellent depth |
| sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/index.html | 100 | 90 | 2,959 | News article, excellent depth |
| carbon-footprinting/index.html | 98 | 70 | 450 | Good pillar, expanded |
| iso-14064/index.html | 98 | 65 | 467 | Good pillar, expanded |
| esg-reporting-hub/index.html | 98 | 55 | 490 | Good pillar, expanded |
| carbon-footprinting/faq/index.html | 100 | 75 | 640 | FAQ schema, comprehensive |
| ghg-protocol/faq/index.html | 100 | 65 | 614 | FAQ schema, good depth |
| csrd/faq/index.html | 100 | 55 | 676 | FAQ schema, good answers |
| esg-reporting-hub/faq/index.html | 100 | 65 | 601 | FAQ schema, good depth |
| iso-14064/faq/index.html | 100 | 75 | 582 | FAQ schema, good depth |

### Tier 2: Good (70-89 technical, 50+ depth)
| Page | Tech | Depth | Words | Notes |
|---|---|---|---|---|
| cbam/case-studies/index.html | 90 | 60 | 510 | Case studies with € figures |
| cbam/certificate-cost-calculator/index.html | 88 | 55 | 398 | Interactive tool |
| cbam/industry-examples/index.html | 90 | 70 | 545 | Sector scenarios |
| ghg-protocol/index.html | 90 | 65 | 631 | Good pillar |
| ghg-protocol/scope-3-deep-dive/index.html | 83 | 80 | 466 | Deep content, good |
| iso-14064/verification-guide/index.html | 85 | 75 | 509 | 7-step guide |
| carbon-accounting/scope-2-emissions/index.html | 88 | 70 | 477 | Good guide |
| carbon-accounting/scope-3-emissions/index.html | 90 | 80 | 651 | Good guide |
| carbon-footprinting/product-carbon-footprint/index.html | 83 | 55 | 440 | 6-step guide |
| esg-reporting-hub/framework-comparison/index.html | 83 | 45 | 390 | Comparison table |
| carbon-footprinting/industry-examples/index.html | 83 | 55 | 397 | Sector examples |
| csrd/industry-examples/index.html | 83 | 55 | 379 | Sector examples |
| ghg-protocol/industry-examples/index.html | 83 | 65 | 363 | Sector examples |
| esg-reporting-hub/industry-examples/index.html | 83 | 45 | 371 | Sector examples |
| iso-14064/industry-examples/index.html | 83 | 55 | 367 | Sector examples |
| carbon-accounting/carbon-footprint-calculator/index.html | 85 | 90 | 6,832 | Large calculator page |
| esg-reporting/csrd-omnibus-guide/index.html | 85 | 50 | 987 | Good guide |

### Tier 3: Needs Improvement (<70 technical OR <50 depth)
| Page | Tech | Depth | Words | Issues |
|---|---|---|---|---|
| about/index.html | 73 | 70 | 236 | No schema, no CTA, thin |
| contact/index.html | 75 | 60 | 730 | No schema, no CTA |
| tools/index.html | 78 | 60 | 235 | No schema, no CTA, thin |
| resources/index.html | 65 | 45 | 84 | No OG, no schema, no CTA, very thin |
| carbon-accounting/index.html | 78 | 70 | 216 | No schema, no CTA, thin |
| carbon-accounting/scope-1-emissions/index.html | 68 | 45 | 243 | No OG, no schema, no breadcrumb, no CTA |
| sustainability-intelligence/index.html | 73 | 65 | 366 | No OG, no schema, no breadcrumb, no CTA |
| analytics-dashboard/index.html | 58 | 55 | 344 | No canonical, no OG, no schema, no CTA |
| cbam/downloadable-guide/index.html | 78 | 65 | 382 | No schema, no CTA |
| privacy-policy.html | 50 | 50 | 763 | No canonical, no OG, no schema |
| terms-of-use.html | 60 | 60 | 864 | No canonical, no OG, no schema |
| download-pdf.html | 25 | 15 | 92 | Multiple critical issues |
| test-*.html (3 files) | 30-40 | 40-75 | 1,200-1,500 | Test pages, should be noindex |

---

## Critical Issues Found

### 1. Missing Schema Markup (26 pages)
**Impact:** No rich snippets in search results. Reduced CTR.
**Affected:** about, contact, tools, resources, carbon-accounting, scope-1/2 emissions, sustainability-intelligence, analytics-dashboard, cbam/downloadable-guide, privacy-policy, terms-of-use, and all test pages.
**Fix:** Add WebPage or Article schema to all content pages.

### 2. Missing Consultation CTAs (18 pages)
**Impact:** Lost lead generation opportunities.
**Affected:** about, contact, tools, resources, carbon-accounting, scope-1/2 emissions, sustainability-intelligence, analytics-dashboard, privacy-policy, terms-of-use.
**Fix:** Add consultation CTA section to all non-test pages.

### 3. Thin Content (6 pages < 300 words)
**Impact:** Poor rankings, low user engagement.
**Affected:**
- resources/index.html (84 words)
- tools/index.html (235 words)
- about/index.html (236 words)
- carbon-accounting/index.html (216 words)
- carbon-accounting/scope-1-emissions/index.html (243 words)
- download-pdf.html (92 words)

### 4. Test Pages Indexed (3 pages)
**Impact:** Dilutes crawl budget, potential security info exposure.
**Affected:** test-encryption-migration.html, test-pdf-report.html, test-security-headers.html
**Fix:** Add `<meta name="robots" content="noindex">` or move out of web root.

### 5. Missing Breadcrumbs (15 pages)
**Impact:** Poor navigation, missed rich snippet opportunity.
**Affected:** carbon-accounting/*, sustainability-intelligence/*, tools, resources, about, contact, privacy-policy, terms-of-use.

### 6. No External References (35 pages)
**Impact:** Reduced E-E-A-T signals. Google values citations to authoritative sources.
**Fix:** Add links to official sources (EC, EFRAG, GHG Protocol, ISO) on relevant pages.

---

## Content Accuracy Review

| Topic | Accuracy | Sources Cited | Needs Update |
|---|---|---|---|
| CBAM definitive phase | ✅ Accurate | EC, CBAM Regulation | No |
| CSRD timelines | ✅ Accurate | EC, EFRAG | Monitor FY2025 updates |
| GHG Protocol scopes | ✅ Accurate | GHG Protocol | No |
| ISO 14064 parts | ✅ Accurate | ISO | No |
| ESG frameworks | ✅ Accurate | GRI, SASB, ISSB, EC | Monitor ISSB adoption |
| SBTi rules | ✅ Accurate | SBTi | Monitor 2026 updates |
| ESRS simplified | ✅ Accurate | EFRAG | No |

**No factual errors detected.** All regulatory timelines and requirements are current as of July 2026.

---

## Mobile Readiness

| Check | Result |
|---|---|
| Viewport meta | 100% of pages |
| Tailwind responsive classes | 85% of pages |
| Font size readability | ✅ 16px base |
| Touch target size | ⚠️ Not tested (needs browser) |
| Content reflow | ✅ Tailwind grid/flex |

---

## Recommendations by Priority

### P0 — Fix This Week
1. **Add noindex to test pages** — security + crawl budget
2. **Expand resources/index.html** — currently 84 words, useless
3. **Expand tools/index.html** — currently 235 words, missing tool descriptions
4. **Add schema to all Tier 3 pages**

### P1 — Fix Next Week
5. **Add breadcrumbs to all hub and guide pages**
6. **Add external references to official sources**
7. **Expand carbon-accounting/index.html** — major hub, only 216 words
8. **Expand scope-1-emissions guide** — only 243 words

### P2 — Month 2
9. **Add diagrams/flowcharts** to implementation guides
10. **Add regional guidance** (Morocco, GCC, Africa) where relevant
11. **Add video content** to pillar pages
12. **Create downloadable templates** for each cluster
