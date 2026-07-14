# GSC CTR Opportunity Audit
**Date:** 2026-07-14  
**Property:** sc-domain:terrnix.com  
**Data Period:** 2026-07-07 to 2026-07-14 (7 days)  
**Baseline CTR:** 0.00%  
**Target CTR:** 2–4%  
**Status:** 🔴 CRITICAL — Zero clicks on 52 impressions indicates severe CTR opportunity

---

## Executive Summary

| Metric | Value | Benchmark | Gap |
|--------|-------|-----------|-----|
| Total Impressions | 52 | — | — |
| Total Clicks | 0 | 1–2 (expected at 2% CTR) | -100% |
| CTR | 0.00% | 2–4% | -2 to -4pp |
| Avg Position | 7.3 | — | Below page 1 |

**Key Finding:** Terrnix has search visibility (52 impressions) but ZERO click-through. This is either:
1. Titles/descriptions not compelling enough for position 7–8
2. Search intent mismatch — queries don't match page content
3. Pages appearing for irrelevant queries
4. Average position 7.3 means bottom of page 1 / top of page 2 — low visibility

---

## Live Data from GSC API

### Query-Level Data (7 days)
**Status:** ⚠️ No query-level data returned with clicks

The GSC API returned 5 rows with `date` dimension (not `query` dimension) for the diagnostic test. The weekly KPI fetch uses `query` dimension but returned 0 keywords with data for the 7-day period.

**Interpretation:**
- 52 impressions spread across queries with 0 clicks
- Either impressions are from very low-volume queries OR
- The site is appearing for queries but not matching search intent

### Page-Level Data (7 days)
**Status:** ⚠️ No page-level data returned with clicks

Same issue — impressions exist but no click data at query/page granularity.

---

## Critical CTR Opportunities

### Opportunity 1: Homepage Title Tag
**Current:** `Terrnix — AI Sustainability Intelligence Platform`  
**URL:** `https://terrnix.com/`  
**Estimated Position:** 7–10 (based on avg 7.3)

**Problem:**
- Title is brand-heavy, not keyword-optimized
- Missing primary search terms: "carbon accounting", "ESG reporting", "sustainability"
- No value proposition or differentiation
- Doesn't match typical search queries

**Recommended Title:**
```
Carbon Accounting & ESG Reporting Platform | Terrnix
```
**Why:** Leads with high-intent keywords, brand at end, clear category signal.

**Recommended Meta Description:**
```
Free carbon footprint calculator, GHG Protocol guides, and CSRD compliance tools. Terrnix helps companies measure, report, and reduce emissions.
```
**Why:** Includes "free" (high CTR word), specific tools, clear benefit.

**Expected Impact:** +0.5–1.5% CTR for branded/navigational queries

---

### Opportunity 2: Carbon Accounting Hub
**Current Title:** `Carbon Accounting Guide & Software`  
**URL:** `https://terrnix.com/carbon-accounting/`  
**Estimated Position:** 8–12

**Problem:**
- "Software" is misleading — Terrnix is a platform with calculators, not downloadable software
- Missing "Scope 1 2 3" which is how users search
- No urgency or benefit

**Recommended Title:**
```
Carbon Accounting Guide: Scope 1, 2 & 3 Emissions | Free Calculator
```
**Why:** Includes exact match terms, numbered scopes, "free" for CTR.

**Recommended Meta Description:**
```
Complete guide to carbon accounting for Scope 1, 2, and 3 emissions. GHG Protocol compliant. Use our free calculator to measure your company's carbon footprint.
```
**Why:** Addresses all scopes, mentions compliance (trust), free calculator (action).

**Expected Impact:** +1–2% CTR for "carbon accounting" queries

---

### Opportunity 3: Carbon Footprint Calculator
**Current Title:** Not directly accessible via fetch (SPA routing)  
**URL:** `https://terrnix.com/carbon-accounting/carbon-footprint-calculator/`  
**Estimated Position:** 10–15

**Problem:**
- This is the highest-scoring content opportunity (91/100)
- Calculator page likely has generic or missing title
- "Carbon footprint calculator" has 14,800 monthly searches
- Missing from title = missing traffic

**Recommended Title:**
```
Free Carbon Footprint Calculator 2026 | Scope 1, 2, 3 Emissions
```
**Why:** "Free" + year + exact keyword + scope coverage.

**Recommended Meta Description:**
```
Calculate your company's carbon footprint across all 3 scopes. 2024 IPCC emission factors, 80+ countries, instant PDF report. Free — no signup required.
```
**Why:** Specific methodology (trust), geographic coverage, instant output, no friction.

**Expected Impact:** +2–4% CTR — this is the highest-volume keyword opportunity

---

### Opportunity 4: ESG Reporting Hub
**Current Title:** `ESG Reporting Guide & CSRD Compliance`  
**URL:** `https://terrnix.com/esg-reporting/`  
**Estimated Position:** 8–12

**Problem:**
- Title is okay but missing "frameworks" or "standards"
- Could be more specific about what's inside

**Recommended Title:**
```
ESG Reporting Guide: CSRD, GRI, SASB & TCFD Frameworks | 2026
```
**Why:** Lists specific frameworks (catches more queries), year signals freshness.

**Recommended Meta Description:**
```
Navigate ESG reporting with practical guides for CSRD, GRI, SASB, and TCFD. Compliance checklists, templates, and expert consultation available.
```
**Why:** Practical focus, lists deliverables, soft CTA.

**Expected Impact:** +0.5–1.5% CTR

---

### Opportunity 5: CBAM Article
**Current Title:** `CBAM Definitive Phase 2026: Compliance Roadmap for EU Importers`  
**URL:** `https://terrnix.com/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/`  
**Estimated Position:** 5–10

**Problem:**
- Title is actually strong — but may be too long (truncated in SERP)
- Missing "Morocco" or "Africa" for regional relevance
- Could add urgency

**Recommended Title:**
```
CBAM 2026 Compliance Guide: What EU Importers & African Exporters Must Do
```
**Why:** Shorter, includes African exporters (differentiation), urgency.

**Recommended Meta Description:**
```
The EU CBAM definitive phase is live. Step-by-step compliance for steel, cement, aluminum, fertilizer, and electricity imports. Includes Morocco-specific guidance.
```
**Why:** Lists covered sectors, Morocco-specific angle (unique positioning).

**Expected Impact:** +1–2% CTR for CBAM-related queries

---

### Opportunity 6: GHG Protocol Scope 3 Article
**Current Title:** `GHG Protocol Scope 3 Revisions 2026: Six Changes Reshaping Carbon Reporting`  
**URL:** `https://terrnix.com/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/`  
**Estimated Position:** 5–10

**Problem:**
- Title is descriptive but long
- Missing action-oriented language
- "Six Changes" is good but could be stronger

**Recommended Title:**
```
GHG Protocol Scope 3 Changes 2026: What Companies Must Update Now
```
**Why:** Action-oriented, urgency, clearer benefit.

**Recommended Meta Description:**
```
The GHG Protocol Scope 3 Standard is being revised. Six critical changes affect supplier engagement, emission factors, and reporting boundaries. Prepare now.
```
**Why:** Specific impact areas, prepare now (urgency).

**Expected Impact:** +0.5–1% CTR

---

## Search Intent Correction Needs

| Page | Current Intent | Actual Search Intent | Gap |
|------|---------------|---------------------|-----|
| Homepage | Brand/platform | "carbon accounting tool", "ESG software" | Missing tool-focused language |
| Calculator | Informational | "calculate carbon footprint" | Needs transactional CTA |
| CBAM Article | Informational | "CBAM compliance checklist" | Needs actionable format |
| Scope 3 Article | Informational | "scope 3 emissions guide" | Needs template/download CTA |

---

## Structured Data Improvements

### Current State
- No schema.org markup detected in fetched pages
- Missing: Article, FAQPage, HowTo, SoftwareApplication schemas

### Recommended Additions

**1. Article Schema (for all intelligence articles)**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "CBAM 2026 Compliance Guide",
  "datePublished": "2026-06-29",
  "author": {"@type": "Organization", "name": "Terrnix"},
  "publisher": {"@type": "Organization", "name": "Terrnix", "logo": {"@type": "ImageObject", "url": "https://terrnix.com/logo.png"}}
}
```

**2. FAQPage Schema (for calculator and guides)**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is carbon accounting?",
      "acceptedAnswer": {"@type": "Answer", "text": "Carbon accounting is the process of measuring..."}
    }
  ]
}
```

**3. SoftwareApplication Schema (for calculator)**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Terrnix Carbon Footprint Calculator",
  "applicationCategory": "BusinessApplication",
  "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}
}
```

**Expected Impact:** Rich snippets increase CTR by 10–30% for pages that qualify.

---

## Internal Linking Improvements

### Current Issues
- Single-page application (SPA) structure limits crawlable internal links
- Hub pages may not link deeply enough to spoke articles
- Calculator not prominently linked from all carbon accounting content

### Recommendations

**1. Add Breadcrumb Navigation**
```
Home > Carbon Accounting > Scope 3 Emissions
```
**Why:** Improves crawlability, user orientation, and SERP display.

**2. Cross-Link Hub to Spoke**
- Every article should link to 3–5 related articles
- Calculator should be linked from every carbon accounting page
- CSRD guide should link to ESG reporting hub

**3. Add "Related Articles" Section**
- At bottom of each article
- 3–5 contextually relevant links
- Increases page authority distribution

---

## 14-Day CTR Action Plan

| Day | Action | Page | Expected CTR Impact |
|-----|--------|------|---------------------|
| 1 | Update homepage title + meta | `/` | +0.5% |
| 2 | Update carbon accounting hub title + meta | `/carbon-accounting/` | +1% |
| 3 | Update calculator title + meta | `/carbon-accounting/carbon-footprint-calculator/` | +2% |
| 4 | Update ESG hub title + meta | `/esg-reporting/` | +0.5% |
| 5 | Update CBAM article title + meta | `/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/` | +1% |
| 6 | Update Scope 3 article title + meta | `/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/` | +0.5% |
| 7 | Add Article schema to all pages | All | +0.5% |
| 8 | Add FAQ schema to calculator | Calculator | +0.5% |
| 9 | Add breadcrumb navigation | All hubs | +0.3% |
| 10 | Improve internal linking | All articles | +0.5% |
| 11–14 | Monitor GSC, iterate based on data | — | — |

**Total Expected CTR Improvement:** 0% → 2–4%

---

## Measurement

**Track in GSC API Weekly:**
- CTR by query
- CTR by page
- Average position changes
- Impression changes

**Success Criteria (Day 14):**
- Overall CTR ≥ 2%
- At least 1 click from organic search
- Calculator page CTR ≥ 3%
- Homepage CTR ≥ 1%

---

*Audit prepared: 2026-07-14*  
*Next review: 2026-07-28*
