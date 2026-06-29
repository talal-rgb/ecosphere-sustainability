# Terrnix About Page Fix Plan

**Date:** 2026-06-18
**Auditor:** Terrnix AI
**Scope:** `/about/` page content and trust signals
**Status:** 🟡 MEDIUM — Page exists but is generic and underutilized

---

## Executive Summary

The current `/about/` page is a generic corporate overview. It lists capabilities but fails to build trust, demonstrate expertise, or guide visitors toward conversion. It reads like a template, not a sustainability intelligence platform.

**Severity:** 🟡 MEDIUM — Missed conversion opportunity, but page is functional

---

## 1. Current Page Analysis

### What's Present
- ✅ Basic company description
- ✅ Mission statement (generic)
- ✅ "What We Offer" grid (3 cards: Carbon Accounting, ESG Reporting, AI Intelligence)
- ✅ CTA to calculator and contact
- ✅ Navigation and footer

### What's Missing

| Element | Status | Impact |
|---------|--------|--------|
| Founder/team presence | ❌ Missing | No human trust signal |
| Specific credentials | ❌ Missing | No proof of expertise |
| Calculator demo/screenshot | ❌ Missing | No product visualization |
| PDF report sample | ❌ Missing | No tangible output proof |
| Scope 1/2/3 specificity | ❌ Missing | Reads as generic sustainability tool |
| ESG hub depth | ❌ Missing | No mention of CSRD, ISSB, GRI |
| Testimonials/social proof | ❌ Missing | No validation |
| Trust badges (GHG Protocol, etc.) | ❌ Missing | No authority signals |
| Clear differentiation | ❌ Missing | Sounds like any SaaS |
| Metrics/numbers | ❌ Missing | No scale or traction proof |

### Current Weaknesses

1. **"Built by experts, for experts"** — Who? No names, no credentials, no photos.
2. **"15,000+ emission factors covering 80+ countries"** — Good stat, but buried in small card text with no source proof.
3. **No visual proof** — A carbon calculator page without showing the calculator.
4. **No differentiation** — Could be any sustainability tool. Why Terrnix?
5. **Passive voice throughout** — "We combine cutting-edge AI with deep domain expertise" vs. "Terrnix helps 500+ companies calculate Scope 3 emissions in minutes."
6. **CTA is weak** — "Ready to Get Started?" with two equal buttons dilutes intent.

---

## 2. Competitive Benchmark

Leading sustainability platforms' About pages include:
- **Persefoni:** Team photos, investor logos, specific compliance claims
- **Watershed:** Customer logos, methodology whitepapers, team credentials
- **Sweep:** Interactive product demo, case studies, certification badges
- **Normative:** Academic partnerships, research citations, audit credentials

Terrnix currently competes with none of these trust signals.

---

## 3. Recommended Content Structure

### Hero Section
```
Terrnix
AI-Powered Carbon Accounting & ESG Intelligence

Not another dashboard. A calculation engine built on
15,000+ verified emission factors, GHG Protocol alignment,
and real-time Scope 1/2/3 analysis.

[Launch Calculator] [View Sample Report]
```

### Trust Bar (logos/badges)
- GHG Protocol Corporate Standard
- IPCC AR6 Compliant
- CSRD / ISSB / GRI Aligned
- 80+ Countries Covered
- 15,000+ Emission Factors

### The Problem We Solve
```
Most carbon calculators give you a number.
Terrnix gives you an audit-ready report.

→ Scope 1: Stationary, mobile, fugitive emissions
→ Scope 2: Location-based & market-based methods
→ Scope 3: 8 of 15 categories with EEIO, distance-based,
   and spend-based methodologies
→ Output: PDF report with recommendations, factor sources,
   and uncertainty ratings
```

### Product Proof (screenshots/demos)
- Calculator interface screenshot
- Sample PDF report preview (first page)
- CSV export example
- Methodology panel showing factor sources

### Methodology & Standards
```
Our emission factors are sourced from:
• IPCC 2006 Guidelines (AR6 GWP values)
• DEFRA 2024 Conversion Factors
• EPA AP-42 & eGRID 2023
• IEA 2023 Grid Emission Factors
• EXIOBASE 3.8 (for Scope 3 EEIO)
• GLEC Framework / ISO 14083 (for transport)
```

### Founder/Team Section
```
Built by sustainability practitioners who were tired of
spreadsheets that don't scale.

[Tallal — Founder]
[Background: X years in sustainability/ESG/carbon accounting]
[Photo or professional headshot]
```

### Use Cases
```
Who uses Terrnix?

→ Sustainability Managers building CSRD reports
→ Consultants verifying client emissions
→ CFOs preparing for carbon pricing compliance
→ Procurement teams assessing Scope 3 hotspots
→ Startups seeking B-Corp or net-zero certification
```

### CTA Section (strong, single action)
```
Calculate your carbon footprint in 5 minutes.
Get a PDF report you can share with auditors,
investors, or your board.

[Launch Free Calculator →]
```

---

## 4. SEO Improvements

| Current | Recommended |
|---------|-------------|
| Title: "About Terrnix — AI Sustainability Intelligence Platform" | "About Terrnix | Carbon Accounting & ESG Reporting Platform" |
| Meta description: generic | "Terrnix is an AI-powered sustainability platform for GHG Protocol-aligned carbon accounting, CSRD-ready ESG reporting, and Scope 1/2/3 emissions calculation." |
| No structured data | Add `Organization` schema with logo, URL, sameAs (LinkedIn, X) |
| No FAQ | Add FAQ schema for common questions |

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `about/index.html` | Complete rewrite with new structure |
| Add sample report image | `assets/images/sample-report-cover.png` |
| Add calculator screenshot | `assets/images/calculator-preview.png` |
| Add founder photo | `assets/images/team/tallal.png` |

---

## 6. Verification Checklist

After implementation, verify:
- [ ] Page loads correctly on mobile
- [ ] All images have alt text
- [ ] CTA button links to calculator
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Internal links to hubs (Carbon Accounting, ESG Reporting, Tools)
- [ ] No broken links
- [ ] Lighthouse score > 90

---

*Plan complete. Ready for implementation phase.*
