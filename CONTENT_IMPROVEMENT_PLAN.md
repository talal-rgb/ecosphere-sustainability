# Content Improvement Plan

**Date:** 2026-07-02
**Scope:** All 53 pages, prioritized by impact
**Method:** Quality audit findings + competitor validation + CRO gaps

---

## Executive Summary

| Priority | Actions | Pages | Est. Hours | Impact |
|---|---|---|---|---|
| P0 — This Week | Fix critical gaps | 12 | 4 | High |
| P1 — Next Week | Expand thin content | 8 | 8 | High |
| P2 — Month 2 | Add authority signals | 20 | 12 | Medium |
| P3 — Month 3 | Enhance engagement | 15 | 10 | Medium |

---

## P0 — Critical Fixes (This Week)

### 1. Block Test Pages from Indexation
**Pages:** test-encryption-migration.html, test-pdf-report.html, test-security-headers.html
**Why:** Security risk, crawl budget waste, potential duplicate content
**Action:** Add `<meta name="robots" content="noindex, nofollow">` to each
**Time:** 15 minutes

### 2. Update robots.txt
**Why:** Block test pages and analytics dashboard from crawlers
**Action:**
```
User-agent: *
Allow: /
Disallow: /test-*.html
Disallow: /analytics-dashboard/
Disallow: /download-pdf.html
Crawl-delay: 1
Sitemap: https://terrnix.com/sitemap.xml
```
**Time:** 10 minutes

### 3. Add Missing Canonical URLs (12 pages)
**Pages:** about, contact, tools, resources, carbon-accounting, scope-1-emissions, sustainability-intelligence, privacy-policy, terms-of-use, analytics-dashboard, plus 3 test pages (or noindex them)
**Action:** Add `<link rel="canonical" href="https://www.terrnix.com/PATH/">`
**Time:** 30 minutes

### 4. Add Schema to Hub Pages (6 pages)
**Pages:** carbon-accounting, tools, resources, about, contact, sustainability-intelligence
**Action:** Add WebPage schema with BreadcrumbList
**Time:** 45 minutes

### 5. Add Consultation CTA to Missing Pages (8 pages)
**Pages:** about, contact, tools, resources, carbon-accounting, scope-1-emissions, scope-2-emissions, sustainability-intelligence
**Action:** Add standard consultation CTA section
**Time:** 30 minutes

---

## P1 — Content Expansion (Next Week)

### 6. Expand resources/index.html
**Current:** 84 words — essentially empty
**Target:** 800+ words
**Content to add:**
- Resource categories (guides, templates, tools, glossaries)
- Featured downloads (CBAM checklist, CSRD timeline, Scope 3 template)
- Links to all cluster pillars
- Newsletter signup CTA
**Time:** 2 hours

### 7. Expand tools/index.html
**Current:** 235 words — minimal tool descriptions
**Target:** 600+ words
**Content to add:**
- Carbon footprint calculator description
- CBAM certificate cost calculator
- Planned tools (CSRD readiness, ESG framework selector, Scope 3 scorer)
- Tool usage instructions
- CTA for custom tool requests
**Time:** 1.5 hours

### 8. Expand carbon-accounting/index.html
**Current:** 216 words — major hub, minimal content
**Target:** 800+ words
**Content to add:**
- What is carbon accounting (definition)
- Why it matters (regulatory, investor, customer drivers)
- Scope 1, 2, 3 overview with links
- Standards (GHG Protocol, ISO 14064)
- How Terrnix helps
- Links to calculator and guides
**Time:** 2 hours

### 9. Expand carbon-accounting/scope-1-emissions/index.html
**Current:** 243 words
**Target:** 600+ words
**Content to add:**
- Definition and examples
- Calculation methodology
- Common emission sources by sector
- Data collection tips
- Reduction strategies
**Time:** 1.5 hours

### 10. Expand about/index.html
**Current:** 236 words
**Target:** 500+ words
**Content to add:**
- Terrnix mission and story
- Team/expertise (or placeholder)
- Values and approach
- Client results (anonymized)
- Contact information
**Time:** 1 hour

---

## P2 — Authority & Trust (Month 2)

### 11. Add Official References to All Pages
**Target:** Every cluster page should cite at least one official source
**Sources to add:**
- EC/CBAM Regulation links on CBAM pages
- EFRAG/ESRS links on CSRD pages
- GHG Protocol links on GHG pages
- ISO links on ISO 14064 pages
- GRI/SASB/ISSB links on ESG pages
**Time:** 3 hours

### 12. Add Regional Guidance
**Priority regions:**
- **EU:** Already well covered
- **Morocco:** Add references to Moroccan sustainability regulations, AfDB frameworks
- **GCC:** Add references to Saudi Green Initiative, UAE Net Zero 2050
- **Africa:** Add references to African Union Green Stimulus, CDP Africa
**Pages to enhance:** All pillar pages with 2-3 sentences on regional applicability
**Time:** 3 hours

### 13. Add Case Studies with Real Numbers
**Current:** Only CBAM has case studies
**Target:** Add 1-2 case studies per cluster
**Ideas:**
- CSRD: Manufacturing company, 6-month implementation
- GHG Protocol: Logistics company, Scope 3 reduction
- Carbon Footprinting: Food company, PCF for product line
- ISO 14064: Energy company, verification success
**Time:** 4 hours (can use anonymized composites)

### 14. Add Downloadable Templates
**Target:** 1 lead magnet per cluster
**Ideas:**
- CBAM: Compliance checklist PDF
- CSRD: Implementation timeline template
- GHG Protocol: Supplier data request template
- Carbon Footprinting: Data collection spreadsheet
- ESG: Framework selection decision tree
- ISO 14064: Verification preparation checklist
**Time:** 4 hours

### 15. Add Diagrams/Flowcharts
**Target:** 1 visual per implementation guide
**Ideas:**
- CBAM compliance process flowchart
- CSRD 12-step timeline visual
- Scope 3 data collection workflow
- ISO 14064 verification steps
- ESG framework decision tree
**Format:** SVG or Mermaid diagrams
**Time:** 3 hours

---

## P3 — Engagement & CRO (Month 2-3)

### 16. Add Inline CTAs to Long Guides
**Target:** Every guide >500 words gets 1 inline CTA
**Format:** "Stuck on Step 3? Book a free 15-minute call"
**Pages:** All implementation guides, deep dives
**Time:** 1 hour

### 17. Add Urgency Elements
**Target:** Regulatory deadline countdowns on CBAM and CSRD pages
**Format:** Banner: "Q3 CBAM report due in X days"
**Time:** 30 minutes

### 18. Add Social Proof to Pillar Pages
**Target:** 6 pillar pages get trust signals
**Elements:**
- Client stat: "€2.3M saved for clients"
- Response rate: "60-80% supplier response rate"
- Time saved: "Reduce verification prep by 60%"
**Time:** 1 hour

### 19. Add Newsletter Segments
**Target:** 3 topic-specific newsletters
**Segments:**
- CBAM Alert (weekly regulatory updates)
- CSRD Weekly (implementation tips)
- Carbon Accounting Digest (methodology updates)
**Time:** 2 hours

### 20. Add Exit-Intent Popup
**Target:** Pillar pages only
**Offer:** "Download [Topic] Compliance Checklist"
**Time:** 2 hours (requires JS)

---

## Improvement Impact Matrix

| Improvement | SEO Impact | Lead Impact | Effort | Priority |
|---|---|---|---|---|
| Block test pages | High | None | Low | P0 |
| Add canonicals | High | None | Low | P0 |
| Expand resources hub | Medium | Medium | Medium | P1 |
| Expand tools hub | Medium | High | Medium | P1 |
| Expand carbon-accounting hub | High | Medium | Medium | P1 |
| Add official references | High | Low | Medium | P2 |
| Add case studies | Medium | High | High | P2 |
| Add downloadable templates | Medium | High | Medium | P2 |
| Add diagrams | Medium | Low | Medium | P2 |
| Add inline CTAs | Low | High | Low | P3 |
| Add urgency banners | Low | High | Low | P3 |
| Add social proof | Low | High | Low | P3 |

---

## Success Metrics

| Metric | Current | Month 1 Target | Month 3 Target |
|---|---|---|---|
| Avg page word count | 450 | 600 | 800 |
| Pages with schema | 27 | 45 | 50 |
| Pages with CTA | 35 | 48 | 50 |
| Pages with external refs | 18 | 35 | 45 |
| Thin pages (<300 words) | 6 | 2 | 0 |
| Avg technical score | 81.8 | 88 | 92 |
| Avg depth score | 66.5 | 72 | 78 |
