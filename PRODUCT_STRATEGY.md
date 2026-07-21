# Homepage Product Strategy — Terrnix RC1

**Date:** 2026-07-21
**Auditor:** Terrnix AI
**Scope:** Homepage product presentation, CTA strategy, and flagship product positioning

---

## Executive Summary

The current homepage presents Terrnix primarily as a **content and intelligence platform** with a single calculator tool. There is no dedicated "Products" or "Solutions" section. The homepage lacks clear product positioning that communicates Terrnix as a sustainability platform with multiple tools and services.

**Current State:** Content-first, tool-second
**Recommended State:** Platform-first with clear product pillars

---

## Current Homepage Structure

### Above the Fold (Hero)
- **Headline:** "Sustainability Intelligence for the Decisive Decade"
- **Subheadline:** AI-powered insights, carbon accounting, and ESG analytics
- **CTAs:**
  1. "Launch Calculator" → `/carbon-accounting/carbon-footprint-calculator/`
  2. "Explore Tools" → `/tools/`
- **Stats:** 15,000+ assessments, 80+ countries, 6 frameworks, 50+ articles

### Below the Fold
- **Featured Intelligence Articles** (4 deep-dive articles)
- **Carbon Calculator** (full embedded calculator)
- **Deep Dive Topics** (6 topic overlays)
- **Sustainability Quiz** (30 questions)
- **Newsletter CTA**
- **Footer**

### What is MISSING
- ❌ No "Products" or "Solutions" section
- ❌ No product cards or feature grid
- ❌ No clear value proposition for each product
- ❌ No differentiation between tools, content, and services
- ❌ No ESG Report Analyzer mentioned
- ❌ No Sustainability Academy mentioned
- ❌ No Energy Economics Suite mentioned on homepage
- ❌ No certificate/assessment value proposition

---

## Product Inventory

### Existing Products (Live)

| # | Product | URL | Status | Homepage Visibility |
|---|---------|-----|--------|---------------------|
| 1 | Carbon Calculator | `/carbon-accounting/carbon-footprint-calculator/` | ✅ LIVE | Embedded in homepage |
| 2 | Energy Suite | `/tools/energy-suite/` | ✅ LIVE | Not on homepage |
| 3 | Readiness Assessment | `/carbon-accounting-readiness-assessment/` | ✅ LIVE | Footer link only |
| 4 | Sustainability Quiz | Homepage embedded | ✅ LIVE | Embedded in homepage |
| 5 | Certificate Verify | `/certificate/verify/` | ✅ LIVE | Not on homepage |

### Existing Content Hubs (Live)

| # | Hub | URL | Status |
|---|-----|-----|--------|
| 6 | Carbon Accounting Hub | `/carbon-accounting/` | ✅ LIVE |
| 7 | ESG Reporting Hub | `/esg-reporting/` | ✅ LIVE |
| 8 | Sustainability Intelligence | `/sustainability-intelligence/` | ✅ LIVE |
| 9 | Resources Hub | `/resources/` | ✅ LIVE |
| 10 | Tools Hub | `/tools/` | ✅ LIVE |

### Planned Products (Not Built)

| # | Product | Status | Priority |
|---|---------|--------|----------|
| 11 | ESG Report Analyzer | ❌ NOT BUILT | HIGH |
| 12 | Sustainability Academy | ❌ NOT BUILT | HIGH |
| 13 | CBAM Quiz | ❌ NOT BUILT | MEDIUM |
| 14 | Topic-Specific Quizzes | ❌ NOT BUILT | MEDIUM |
| 15 | Advanced Energy Tools | ❌ NOT BUILT | LOW |

---

## Option Evaluation

### Option A: Keep Current Layout (Status Quo)

**Description:** Maintain content-first approach. Calculator embedded in homepage. Tools page as secondary navigation.

**Pros:**
- Zero implementation effort
- Content drives SEO traffic
- Calculator is immediately accessible

**Cons:**
- Does not position Terrnix as a platform
- Hides valuable tools (Energy Suite, Assessment)
- No product differentiation
- Visitors may not discover tools beyond calculator
- Low conversion from content reader to tool user

**Verdict:** ❌ Not recommended. Underutilizes product assets.

---

### Option B: Add Four Flagship Product Cards (RECOMMENDED)

**Description:** Add a "Platform" or "Solutions" section with 4 flagship product cards between hero and content sections.

**Proposed Cards:**

1. **Carbon Calculator**
   - Icon: Calculator
   - Title: "AI Carbon Calculator"
   - Description: "Real-time emissions calculations with 2024 IPCC/EPA factors. 80+ countries. All Scope 3 categories."
   - CTA: "Calculate Emissions →"
   - URL: `/carbon-accounting/carbon-footprint-calculator/`

2. **ESG Report Analyzer** (Future — link to hub for now)
   - Icon: Document/magnifier
   - Title: "ESG Report Analyzer"
   - Description: "AI-assisted review of sustainability reports against CSRD, ESRS, GRI, ISSB. Coming Q3 2026."
   - CTA: "Learn More →"
   - URL: `/esg-reporting/` (until built)

3. **Sustainability Academy** (Future — link to quiz for now)
   - Icon: Graduation cap
   - Title: "Sustainability Academy"
   - Description: "Professional certifications in carbon accounting, ESG reporting, and CSRD compliance."
   - CTA: "Start Learning →"
   - URL: `#quiz` (until Academy built)

4. **Energy Economics Suite**
   - Icon: Lightning bolt
   - Title: "Energy Economics Suite"
   - Description: "Solar PV ROI, NPV, IRR, LCOE, heat pump, LED, and EV fleet calculators."
   - CTA: "Explore Calculators →"
   - URL: `/tools/energy-suite/`

**Pros:**
- Positions Terrnix as a multi-product platform
- Surfaces hidden tools (Energy Suite)
- Creates clear product hierarchy
- Enables future product launches
- Improves conversion from homepage
- Professional, enterprise-ready appearance

**Cons:**
- Requires homepage modification
- ESG Analyzer and Academy are not yet built (must link to existing content)
- Adds content above the fold (may push articles down)

**Implementation:**
- Add section after hero, before featured articles
- 4-card grid (2x2 on desktop, 1 column on mobile)
- Consistent with existing design language
- **Effort:** 2-3 hours

**Verdict:** ✅ RECOMMENDED

---

### Option C: Full Platform Redesign

**Description:** Restructure homepage as a product dashboard with clear product categories.

**Architecture:**
```
Hero → Platform tagline
Products Grid (4 cards)
  → Carbon Management
  → ESG & Compliance
  → Learning & Certification
  → Energy & Economics
Use Cases (by persona)
  → Sustainability Director
  → ESG Manager
  → Compliance Officer
  → CFO
Social Proof (stats, testimonials)
Featured Content (articles)
CTA Banner
```

**Pros:**
- Most professional presentation
- Clear product hierarchy
- Persona-based navigation
- Enterprise-ready

**Cons:**
- Major redesign effort (8-12 hours)
- Risk of breaking existing SEO
- Requires new content (testimonials, use cases)
- Over-engineered for current product maturity

**Verdict:** ❌ Too complex for RC1. Consider for RC3.

---

### Option D: Minimal Product Bar

**Description:** Add a simple product navigation bar below hero instead of cards.

**Implementation:**
- Horizontal row of 4 product icons + labels
- Click expands to description
- Less visual impact than cards

**Pros:**
- Compact
- Does not push content down
- Easy to implement

**Cons:**
- Less visually compelling
- Limited description space
- Lower conversion than cards

**Verdict:** ❌ Compromise solution. Cards are better.

---

## Comparative Scoring

| Criteria | Option A | Option B | Option C | Option D |
|----------|----------|----------|----------|----------|
| UX Clarity | 4/10 | 9/10 | 9/10 | 6/10 |
| Commercial Value | 3/10 | 8/10 | 9/10 | 5/10 |
| Implementation Effort | 10/10 | 7/10 | 3/10 | 8/10 |
| Scalability | 2/10 | 9/10 | 10/10 | 6/10 |
| SEO Impact | 5/10 | 7/10 | 6/10 | 6/10 |
| Brand Positioning | 3/10 | 8/10 | 10/10 | 5/10 |
| **Weighted Score** | **3.8** | **8.2** | **8.0** | **5.7** |

*(Weighting: UX 0.20, Commercial 0.20, Effort 0.15, Scalability 0.15, SEO 0.15, Brand 0.15)*

---

## Recommendation: Option B — Four Flagship Product Cards

### Rationale

1. **Immediate Impact:** Surfaces existing products (Energy Suite) that are currently hidden
2. **Future-Proof:** Creates slots for ESG Analyzer and Academy when built
3. **Professional:** Positions Terrnix as a platform, not just a blog
4. **Low Risk:** Minimal homepage changes, preserves existing SEO
5. **Scalable:** Easy to add fifth card (e.g., "Consulting Services") later

### Card Design Specification

```html
<section class="py-16 px-4 sm:px-6 lg:px-8 bg-[#0d1210]" id="products">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Sustainability Platform</h2>
      <p class="text-gray-400 max-w-2xl mx-auto">Professional tools for carbon accounting, ESG reporting, and energy economics.</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Card 1: Carbon Calculator -->
      <!-- Card 2: ESG Analyzer -->
      <!-- Card 3: Academy -->
      <!-- Card 4: Energy Suite -->
    </div>
  </div>
</section>
```

**Card Styling:**
- Background: `bg-[#111a16]` with `border border-[#2d3d35]`
- Hover: `hover:border-emerald-500/50` with subtle scale
- Icon: 48x48 rounded gradient background
- Title: `text-xl font-bold text-white`
- Description: `text-sm text-gray-400`
- CTA: `text-emerald-400 text-sm font-medium` with arrow

### Placement

Insert between:
- AFTER: Hero section
- BEFORE: Featured Intelligence Articles

This ensures products are visible above the fold on most screens while keeping content accessible.

---

## Implementation Plan

### Phase 1 (RC1): Add Product Cards

1. Create product section in `index.html`
2. Add 4 cards with existing products
3. Link ESG Analyzer and Academy to existing content (hub page, quiz)
4. Update hero CTA to "Explore Platform" instead of "Explore Tools"
5. **Effort:** 2-3 hours

### Phase 2 (RC2): Build ESG Analyzer Landing

1. Create `/esg-reporting/analyzer/` landing page
2. Describe capabilities and collect interest
3. Update product card to link to analyzer page
4. **Effort:** 4-6 hours

### Phase 3 (RC3): Build Sustainability Academy Hub

1. Create `/academy/` hub page
2. Migrate Deep Dive content (per ACADEMY_AUDIT.md)
3. Update product card to link to academy
4. **Effort:** 8-12 hours

### Phase 4 (RC4): Full Platform Positioning

1. Evaluate Option C (full redesign)
2. Add persona-based navigation
3. Add use case sections
4. **Effort:** 12-16 hours

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Homepage becomes too long | MEDIUM | Product section is compact (4 cards) |
| ESG/Academy cards link to incomplete experiences | MEDIUM | Clear "Coming Soon" badges on cards |
| SEO impact from content shift | LOW | Preserve all existing content, only add section |
| Mobile layout issues | LOW | Test responsive grid (1 col mobile, 2 col tablet, 4 col desktop) |
| Design inconsistency | LOW | Use existing card patterns from other sections |

---

## Files to Modify

1. `index.html` — Add product section
2. `tools/index.html` — Verify Energy Suite is prominently linked
3. `esg-reporting/index.html` — Ensure analyzer interest capture exists

---

## Success Metrics

| Metric | Baseline | Target (30 days post-launch) |
|--------|----------|------------------------------|
| Energy Suite page views | Unknown | +50% |
| Tools hub page views | Unknown | +30% |
| Homepage bounce rate | Unknown | -10% |
| Time on homepage | Unknown | +20% |

---

*Report generated by Terrnix AI — 2026-07-21*
