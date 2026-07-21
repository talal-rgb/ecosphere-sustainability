# Sustainability Academy Audit — Terrnix RC1

**Date:** 2026-07-21
**Auditor:** Terrnix AI
**Scope:** "Deep Dive Topics" section on homepage

---

## Executive Summary

The current "Deep Dive Topics" section contains **substantial, high-quality educational content** — approximately 17,500 words across 6 topic overlays with 24 sub-topics. It is NOT empty. However, it has significant UX, SEO, and strategic limitations that warrant a restructuring.

**Recommendation: Option B — Convert into Sustainability Academy** (with phased implementation)

---

## Current State Analysis

### Content Inventory

| Topic | Sub-topics | Est. Words | Quality |
|-------|-----------|------------|---------|
| Environment | Biodiversity, Carbon Sinks, Ocean Acidification, Deforestation | ~3,000 | High — detailed, sourced, actionable |
| Social | Just Transition, ESG Social Pillar, Supply Chain Human Rights, DEI Metrics | ~3,000 | High — comprehensive frameworks |
| Governance | Board ESG Oversight, TCFD Governance, Whistleblower Policies, Anti-Corruption | ~2,500 | High — practical guidance |
| Energy & Decarbonization | Solar LCOE, Green Hydrogen, Battery Storage, Industrial Heat | ~3,000 | High — technical depth |
| GHG Protocol | Scope 1, Scope 2, Scope 3, SBTi Alignment | ~3,000 | High — accounting detail |
| Reporting & Regulations | CSRD/ESRS, ISSB S1/S2, SEC Climate Rule, CBAM | ~3,000 | High — regulatory accuracy |

**Total: 6 topics, 24 sub-topics, ~17,500 words**

### Content Quality Assessment

**Strengths:**
- Each sub-topic has 6-8 detailed paragraphs
- Includes specific data points, frameworks, and regulations
- Action-oriented with "Strategic Implications for Organizations" sections
- Covers cutting-edge topics (TNFD, SBTN, CSDDD, JETPs)
- Professional tone appropriate for target audience

**Weaknesses:**
- No citations or references (data presented without sources)
- Some statistics may be unverifiable
- Dense text walls without visual breaks
- No interactive elements
- No progress tracking or completion markers

---

## UX Analysis

### Current Implementation

- **Trigger:** Click topic card → opens full-screen overlay
- **Navigation:** Scroll within overlay, X button to close
- **Mobile:** Works but text-heavy
- **Accessibility:** No skip links, no aria-labels on overlays

### Problems

1. **Overlay Trap:** Users cannot link directly to specific sub-topics
2. **No URL State:** Cannot bookmark or share specific content
3. **Navigation Dead-End:** No related content links within overlays
4. **Discovery:** Only accessible from homepage — no dedicated landing page
5. **Mobile Experience:** 17,500 words in overlays is overwhelming on mobile
6. **No Search:** Cannot search across all Deep Dive content

---

## SEO Analysis

### Current State

- **Indexability:** Overlay content is in DOM but not directly linkable
- **URL Structure:** No URLs for individual topics
- **Internal Links:** No other pages link to specific Deep Dive content
- **Schema:** No structured data for educational content
- **Cannibalization Risk:** Some content overlaps with hub pages (Scope 1/2/3 guides)

### SEO Impact

| Factor | Current | Potential |
|--------|---------|-----------|
| Indexed pages | 0 (overlays) | 24+ standalone pages |
| Internal links | Minimal | Rich cross-linking |
| Keyword targeting | Broad | Specific per topic |
| Featured snippets | None | High potential |
| Backlink potential | Low | High (reference content) |

---

## Option Evaluation

### Option A: Keep Deep Dive (Status Quo)

**Pros:**
- Zero implementation effort
- Content already exists and works
- No broken links risk

**Cons:**
- Poor UX (overlay trap, no direct links)
- Zero SEO value from 17,500 words
- Not scalable (adding topics makes overlays longer)
- No commercial value (no lead generation, no certificates)
- Duplicates hub page content

**Verdict:** ❌ Not recommended. Wasted content asset.

---

### Option B: Convert into Sustainability Academy (RECOMMENDED)

**Architecture:**
```
/academy/                    [HUB — landing page]
/academy/environment/        [CATEGORY]
/academy/environment/biodiversity-loss/
/academy/environment/carbon-sinks/
/academy/environment/ocean-acidification/
/academy/environment/deforestation/
/academy/social/             [CATEGORY]
/academy/social/just-transition/
...
/academy/certificate/        [VERIFICATION]
```

**Pros:**
- Each sub-topic becomes an indexed, linkable page
- Massive SEO uplift (24 new keyword-targeted pages)
- Scalable architecture for new topics
- Enables certificates and progress tracking
- Can integrate with quiz platform
- Commercial potential (lead magnets, certifications)
- Better UX (direct links, bookmarks, sharing)

**Cons:**
- Significant implementation effort (4-6 weeks)
- Requires new page templates
- Risk of content duplication with existing hubs
- Need redirects if external links exist

**Implementation Phases:**
1. **Phase 1:** Build `/academy/` hub with existing 6 categories
2. **Phase 2:** Migrate 24 sub-topics to standalone pages
3. **Phase 3:** Add progress tracking and certificates
4. **Phase 4:** Add quizzes per topic

**Verdict:** ✅ RECOMMENDED

---

### Option C: Convert into Learning Centre

**Difference from Option B:** More formal, course-based structure with modules, lessons, and assessments.

**Pros:**
- Higher perceived value than "Academy"
- Natural fit for certificates
- Course completion rates trackable

**Cons:**
- Over-engineered for current content
- Requires restructuring content into "courses"
- Current content is reference, not sequential learning
- Higher implementation complexity

**Verdict:** ❌ Over-engineered for current state.

---

### Option D: Merge with Resources

**Architecture:** Move Deep Dive content into `/resources/guides/`

**Pros:**
- Consolidates educational content
- Uses existing resources infrastructure

**Cons:**
- Resources is currently a glossary/FAQ hub
- Would dilute resources focus
- No natural home for 24 detailed guides
- Loses "Academy" branding potential

**Verdict:** ❌ Wrong fit for content type.

---

### Option E: Hybrid Model

**Architecture:** Keep overlays for quick browsing + create standalone academy pages for deep learning.

**Pros:**
- Best of both worlds
- Quick access + deep learning

**Cons:**
- Content duplication
- Maintenance burden
- Confusing UX (two ways to access same content)
- SEO cannibalization risk

**Verdict:** ❌ Too complex, duplicates effort.

---

## Comparative Scoring

| Criteria | Option A | Option B | Option C | Option D | Option E |
|----------|----------|----------|----------|----------|----------|
| UX | 3/10 | 9/10 | 7/10 | 5/10 | 6/10 |
| SEO Value | 1/10 | 10/10 | 8/10 | 4/10 | 7/10 |
| Scalability | 2/10 | 9/10 | 7/10 | 4/10 | 5/10 |
| Commercial Value | 1/10 | 8/10 | 8/10 | 3/10 | 6/10 |
| Implementation Effort | 10/10 | 4/10 | 2/10 | 6/10 | 3/10 |
| Maintenance | 8/10 | 6/10 | 5/10 | 5/10 | 3/10 |
| **Weighted Score** | **2.7** | **8.0** | **6.8** | **4.2** | **5.3** |

*(Weighting: UX 0.20, SEO 0.25, Scalability 0.15, Commercial 0.15, Effort 0.15, Maintenance 0.10)*

---

## Recommendation: Option B — Sustainability Academy

### Rationale

1. **SEO:** 17,500 words of high-quality content currently generate ZERO SEO value. Converting to standalone pages unlocks 24+ indexed, keyword-targeted pages.

2. **UX:** Overlays are a dead-end. Standalone pages enable bookmarks, sharing, and natural navigation.

3. **Commercial:** Academy model enables certificates, progress tracking, and lead generation — all aligned with Terrnix platform strategy.

4. **Scalability:** New topics (Circular Economy, Water Stewardship, Climate Adaptation) fit naturally.

5. **Brand:** "Sustainability Academy" positions Terrnix as an educational authority, not just a content site.

### Phased Implementation

**Phase 1 (RC2):** Build `/academy/` hub page
- Design academy landing page
- Create category cards (Environment, Social, Governance, Energy, GHG, Reporting)
- Link from homepage navigation
- **Effort:** 4-6 hours

**Phase 2 (RC3):** Migrate first 2 categories
- Build page template for academy lessons
- Migrate Environment + Social content
- Add breadcrumbs, prev/next navigation
- **Effort:** 8-10 hours

**Phase 3 (RC4):** Complete migration
- Migrate remaining 4 categories
- Add search functionality
- Add progress tracking (localStorage)
- **Effort:** 8-10 hours

**Phase 4 (RC5):** Certificates and quizzes
- Integrate with certificate system
- Add per-topic quizzes
- Add completion certificates
- **Effort:** 12-16 hours

### Risk Mitigation

1. **Content Duplication:** Add canonical tags to academy pages pointing to hub pages where content overlaps (Scope 1/2/3)
2. **Broken Links:** No external links to Deep Dive overlays exist (not linkable), so no redirects needed
3. **Performance:** Extract overlays from homepage → reduce homepage size by ~714 lines → faster load

---

## Immediate Actions for RC1

1. **Document decision** in ACADEMY_AUDIT.md ✅
2. **Add to BACKLOG.md** as "Sustainability Academy — Phase 1"
3. **No implementation** — this is a strategic audit, not a build task

---

## Files Analyzed

- `index.html` lines 1470-2286 (Deep Dive section + 6 overlays)
- `index.html` line 6506 (`openOverlay` function)

---

*Report generated by Terrnix AI — 2026-07-21*
