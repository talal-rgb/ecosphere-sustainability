# FEATURE_READINESS.md — Terrnix Feature Classification

**Date:** 2026-07-22  
**Classification:** READY / BETA / COMING SOON / INTERNAL  
**Goal:** Ensure every visible feature accurately represents its state

---

## Classification Definitions

| Status | Meaning | User Expectation |
|--------|---------|------------------|
| **READY** | Fully functional, tested, production-quality | Can use immediately with confidence |
| **BETA** | Functional but may have bugs or limitations | Can use but expect occasional issues |
| **COMING SOON** | Not yet available, clearly marked | Cannot use yet, can join waitlist |
| **INTERNAL** | Not user-facing, development only | Should not be visible to public |

---

## Feature Inventory

### Carbon Accounting

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Carbon Calculator | `/carbon-accounting/carbon-footprint-calculator/` | **READY** | Live calculation, charts, CSV/PDF export | None |
| Scope 1 Guide | `/carbon-accounting/scope-1-emissions/` | **READY** | Complete guide, SEO optimised | None |
| Scope 2 Guide | `/carbon-accounting/scope-2-emissions/` | **READY** | Complete guide, SEO optimised | None |
| Scope 3 Guide | `/carbon-accounting/scope-3-emissions/` | **READY** | Complete guide, SEO optimised | None |
| GHG Protocol Guide | `/carbon-accounting/ghg-protocol-guide/` | **READY** | Comprehensive 376-line guide | None |
| Emission Factors | `/carbon-accounting/emission-factors/` | **READY** | Reference with 10-country table | None |
| Readiness Assessment | `/carbon-accounting-readiness-assessment/` | **READY** | 10-question assessment with scoring | None |

### ESG Reporting

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| ESG Reporting Hub | `/esg-reporting/` | **READY** | Well-structured hub page | None |
| CSRD Omnibus Guide | `/esg-reporting/csrd-omnibus-guide/` | **READY** | Comprehensive guide | None |
| ESG Report Analyzer | `/esg-reporting/esg-report-analyzer/` | **COMING SOON** | Landing page only, no AI engine | ✅ Correctly marked |

### Sustainability Intelligence

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Intelligence Hub | `/sustainability-intelligence/` | **READY** | News and articles | None |
| Deep Dive Articles | `/sustainability-intelligence/` | **READY** | Article content present | None |

### Tools

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Tools Hub | `/tools/` | **READY** | Lists available tools | None |
| Energy Economics Suite | `/tools/energy-suite/` | **COMING SOON** | Landing page only, no calculators | ✅ Correctly marked |

### Resources

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Resources Hub | `/resources/` | **READY** | Overview page | None |
| Guides | `/resources/guides/` | **READY** | Guide listings | None |
| FAQ | `/resources/faq/` | **READY** | 15+ questions answered | None |
| Glossary | `/resources/glossary/` | **READY** | 50+ terms defined | None |

### Quiz & Certification

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Sustainability Quiz | `/quiz/` | **READY** | 30 questions, scoring, certificate | None |
| Certificate Verification | `/certificate/verify/` | **READY** | Verification form | None |

### Chatbot

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Terrnix AI Chatbot | All pages | **BETA** | Functional but occasional irrelevant responses | Monitor and improve |

### Other

| Feature | URL | Status | Evidence | Action Required |
|---------|-----|--------|----------|-----------------|
| Contact Form | `/contact/` | **READY** | Form with validation, email sending | None |
| About Page | `/about/` | **BETA** | Minimal content, needs expansion | Add team info, mission |

---

## Misleading Elements Found

### 🔴 CRITICAL

**1. Footer Links to Empty Pages**
- Location: Footer on multiple pages
- Issue: Links to "Sustainability Academy" and "Energy Economics Suite" in footer product section
- Current: Clickable links that go to empty or generic pages
- Should be: "Sustainability Academy — Coming Soon" (text, not link) or link to landing page with clear "Coming Soon"

**2. Homepage Product Section (Current)**
- Location: Homepage
- Issue: Current product section is unclear about what's live vs coming
- Current: Mixed messaging
- Should be: Clear visual distinction (green badge = LIVE, grey badge = COMING SOON)

### 🟡 MODERATE

**3. "Analyze Now" CTA on ESG Analyzer**
- Location: `/esg-reporting/esg-report-analyzer/`
- Issue: Primary CTA says "Analyze Now" but tool doesn't exist
- Current: Button scrolls to waitlist
- Should be: "Join the Waitlist" as primary CTA throughout

**4. Tools Hub Mixed Messaging**
- Location: `/tools/`
- Issue: Lists Energy Suite without clear "Coming Soon" indicator
- Current: Card looks like live tool
- Should be: Greyed out card with "Coming Soon" badge

**5. Navigation "Tools" Link**
- Location: Header navigation
- Issue: Links to tools hub which mixes live and coming soon
- Current: No visual distinction
- Should be: Tools hub clearly separates LIVE and COMING SOON sections

---

## Correct Examples

### ✅ ESG Report Analyzer (Good)
- "Coming Soon" badge prominently displayed
- "Join the Waitlist" as primary CTA
- No misleading "Analyze" or "Upload" buttons
- Clear expectation setting

### ✅ Energy Economics Suite (Good)
- All 6 tools have "Coming Soon" badges
- Roadmap shows future timeline
- "Join Waitlist" as primary CTA
- No fake calculator interfaces

---

## Recommended Fixes

### Immediate (Before RC2 Release)

1. **Fix Footer Product Links**
   ```
   Current: <a href="/academy/">Sustainability Academy</a>
   Fixed:  <span class="text-gray-500">Sustainability Academy — Coming Soon</span>
   
   Current: <a href="/tools/energy-suite/">Energy Economics Suite</a>
   Fixed:  <a href="/tools/energy-suite/">Energy Economics Suite <span class="text-xs">(Coming Soon)</span></a>
   ```

2. **Fix ESG Analyzer CTA**
   ```
   Current: "Analyze Now" → scrolls to waitlist
   Fixed:  "Join the Waitlist" (primary button)
   ```

3. **Fix Tools Hub Cards**
   ```
   Current: Energy Suite card looks live
   Fixed:  Greyed background, "Coming Soon" badge, no "Open Tool" button
   ```

### Post-Release

4. **Add Feature Status Badges to All Product Cards**
   - LIVE: Green badge
   - BETA: Amber badge
   - COMING SOON: Grey badge

5. **Create Feature Status Page**
   - Public roadmap showing all features and their status
   - Increases transparency and trust

---

## Feature Readiness Summary

| Status | Count | Features |
|--------|-------|----------|
| READY | 16 | Calculator, all guides, quiz, contact, chatbot, resources |
| BETA | 2 | Chatbot (occasional issues), About page (minimal) |
| COMING SOON | 2 | ESG Analyzer, Energy Economics Suite |
| INTERNAL | 0 | None visible |

**Misleading Elements:** 5 identified (2 critical, 3 moderate)

**Overall Assessment:** Good transparency on landing pages, but footer and tools hub need fixes to prevent user confusion.

---

*End of Feature Readiness Classification*
