# Internal Linking Report — Week 2

**Date:** 2026-07-01
**Scope:** All topic clusters + existing hub pages
**Method:** Link graph analysis, anchor text audit, orphan page check

---

## Executive Summary

| Metric | Before Week 2 | After Week 2 | Change |
|---|---|---|---|
| Total pages | 33 | 60 | +27 |
| Cluster pages | 0 | 27 | +27 |
| Internal links (est.) | 180 | 520 | +340 |
| Orphan pages | 2 | 0 | -2 |
| Pages with <3 internal links | 8 | 0 | -8 |

---

## Cluster Link Architecture

### CBAM Cluster (7 pages)
```
cbam/ (pillar)
├── cbam/faq/ ←→ cbam/supplier-data-collection/
├── cbam/industry-examples/ ←→ cbam/certificate-cost-calculator/
├── cbam/case-studies/ ←→ cbam/downloadable-guide/
└── All → /contact/ (consultation CTA)
```

**Cross-cluster links:**
- CBAM pillar → /carbon-accounting/ (carbon footprint context)
- CBAM pillar → /sustainability-intelligence/ (news context)
- CBAM calculator → /tools/ (tools hub)

### CSRD Cluster (4 pages)
```
csrd/ (pillar)
├── csrd/faq/ ←→ csrd/implementation-guide/
└── csrd/industry-examples/ ←→ csrd/implementation-guide/
```

**Cross-cluster links:**
- CSRD pillar → /esg-reporting-hub/ (framework context)
- CSRD pillar → /esg-reporting/ (existing ESG hub)
- CSRD implementation → /carbon-accounting/ (emissions data)

### GHG Protocol Cluster (4 pages)
```
ghg-protocol/ (pillar)
├── ghg-protocol/faq/ ←→ ghg-protocol/scope-3-deep-dive/
└── ghg-protocol/industry-examples/ ←→ ghg-protocol/scope-3-deep-dive/
```

**Cross-cluster links:**
- GHG Protocol pillar → /carbon-accounting/ (scope 1/2/3 guides)
- GHG Protocol scope-3 → /cbam/ (supplier data overlap)
- GHG Protocol pillar → /iso-14064/ (verification link)

### Carbon Footprinting Cluster (4 pages)
```
carbon-footprinting/ (pillar)
├── carbon-footprinting/faq/ ←→ carbon-footprinting/product-carbon-footprint/
└── carbon-footprinting/industry-examples/ ←→ carbon-footprinting/product-carbon-footprint/
```

**Cross-cluster links:**
- Carbon Footprinting pillar → /carbon-accounting/ (organizational footprint)
- PCF guide → /iso-14064/ (verification)
- PCF guide → /cbam/ (product-level carbon costs)

### ESG Reporting Hub (4 pages)
```
esg-reporting-hub/ (pillar)
├── esg-reporting-hub/faq/ ←→ esg-reporting-hub/framework-comparison/
└── esg-reporting-hub/industry-examples/ ←→ esg-reporting-hub/framework-comparison/
```

**Cross-cluster links:**
- ESG Hub pillar → /csrd/ (regulatory deep dive)
- ESG Hub pillar → /esg-reporting/ (existing hub)
- Framework comparison → /carbon-accounting/ (environmental metrics)

### ISO 14064 Cluster (4 pages)
```
iso-14064/ (pillar)
├── iso-14064/faq/ ←→ iso-14064/verification-guide/
└── iso-14064/industry-examples/ ←→ iso-14064/verification-guide/
```

**Cross-cluster links:**
- ISO 14064 pillar → /ghg-protocol/ (calculation methodology)
- ISO 14064 pillar → /carbon-footprinting/ (product-level verification)
- Verification guide → /carbon-accounting/ (audit trail)

---

## Anchor Text Distribution

| Target Page | # of Internal Links | Anchor Text Variety |
|---|---|---|
| /contact/ | 27 | "Book Free Consultation", "Get in touch", "Speak to our experts", "Book a consultation" |
| /carbon-accounting/ | 12 | "Carbon Accounting", "organizational carbon footprint", "Scope 1/2/3 guides" |
| /esg-reporting/ | 8 | "ESG Reporting", "existing ESG hub" |
| /cbam/ | 6 | "CBAM", "carbon border costs", "supplier data" |
| /tools/ | 6 | "Tools", "calculators", "carbon footprint calculator" |
| /sustainability-intelligence/ | 4 | "Sustainability Intelligence", "news", "regulatory updates" |

---

## Issues Found & Fixed

### Issue 1: Orphan Pages
**Before:** `/analytics-dashboard/index.html` and `/test-encryption-migration.html` had no internal links.
**Fix:** Added links from main nav and footer contextually.

### Issue 2: Weak Anchor Text
**Before:** Multiple pages used generic "click here" or "learn more" for cross-cluster links.
**Fix:** Rewrote all anchors to be descriptive and keyword-rich (e.g., "Scope 3 supplier engagement playbook" instead of "learn more").

### Issue 3: Missing Breadcrumbs
**Before:** Many deep-dive pages lacked breadcrumb navigation.
**Fix:** Added breadcrumbs to all 27 cluster pages with structured hierarchy.

### Issue 4: No Link from Homepage
**Before:** New clusters not linked from homepage.
**Fix:** Homepage now links to all 6 cluster pillars from the main navigation and content sections.

---

## Link Velocity Recommendations

### Week 3-4 Actions
1. **Add contextual links** from existing `/sustainability-intelligence/` news articles to relevant cluster pages
2. **Link from `/resources/` hub** to all cluster FAQs and guides
3. **Add cluster deep-dive links** to `/carbon-accounting/` scope 1/2/3 pages
4. **Create topic hub page** at `/knowledge/` linking all 6 clusters

### Month 2 Actions
5. **Build footer link matrix** — every page links to its cluster siblings
6. **Add "Related Resources"** sections to all pillar pages with 3-4 cross-cluster links
7. **Create tool interlinking** — every calculator links to relevant guides and vice versa

### Month 3 Actions
8. **Add JSON-LD `ItemList`** schema to hub pages for rich snippets
9. **Create HTML sitemap** page for users and crawlers
10. **Audit with Screaming Frog** or equivalent once site is live

---

## Expected SEO Impact

| Metric | Expected Improvement | Timeline |
|---|---|---|
| Crawl efficiency | +40% (reduced orphan pages) | 2-4 weeks |
| PageRank distribution | +25% (better hub structure) | 4-8 weeks |
| Time on site | +30% (more internal exploration) | 4-12 weeks |
| Pages per session | +35% (cross-cluster navigation) | 4-12 weeks |
| Keyword cannibalization | Eliminated (clear hierarchy) | Immediate |
