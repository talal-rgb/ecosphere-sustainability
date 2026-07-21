# Terrnix Backlog

> Living roadmap for continuous improvement. Items are grouped by priority and include effort estimates and expected impact.

---

## Critical

### C-1: Fix Canonical URL Inconsistency (www vs non-www)
- **Description:** A3 uses `https://www.terrnix.com/esg-reporting/` while A1/A2 use `https://terrnix.com/`. This splits SEO ranking signals.
- **Effort:** 5 min
- **Impact:** HIGH — prevents duplicate content issues in search engines
- **Action:** Standardize all canonicals to non-www (`terrnix.com`) to match A1/A2
- **Scope:** PR A3 (or follow-up fix)

---

## High

### H-1: Add Accessibility Features to A1 and A2
- **Description:** A1 and A2 lack skip-to-content links, aria-labels on navigation, and aria-labels on breadcrumbs. A3 has all of these.
- **Effort:** 15 min per page
- **Impact:** MEDIUM — improves keyboard and screen reader navigation
- **Action:** Add `skip-link`, `aria-label="Main navigation"`, `aria-label="Breadcrumb"`, `aria-current="page"` to A1/A2
- **Scope:** PR A1, PR A2 (or follow-up fix)

### H-2: Standardize CTA Wording Across All Pages
- **Description:** Calculator CTAs vary wildly: "Get Started", "Calculate Emissions", "Try Calculator", "Launch Calculator", "Free Carbon Calculator", "Explore". Users may not recognise these as the same action.
- **Effort:** 10 min
- **Impact:** MEDIUM — improves click confidence and conversion
- **Action:** Standardize primary calculator CTA to **"Calculate Your Carbon Footprint"** across A1, A2, A3
- **Scope:** All pages

### H-3: Add Cross-Link to Readiness Assessment in A3
- **Description:** A3 "How Terrnix Helps" section links to calculator, guides, glossary, FAQ, and tools — but not to the Carbon Accounting Readiness Assessment, a key lead generation tool.
- **Effort:** 5 min
- **Impact:** MEDIUM — increases assessment traffic and lead generation
- **Action:** Add bullet: "Carbon Accounting Readiness Assessment — 25-question assessment to identify your biggest carbon accounting gaps."
- **Scope:** PR A3

### H-4: Add twitter:image to A3
- **Description:** A3 has Twitter Card meta tags but missing `twitter:image`. A1/A2 include it.
- **Effort:** 2 min
- **Impact:** MEDIUM — ensures Twitter cards display preview images
- **Action:** Add `<meta name="twitter:image" content="https://terrnix.com/assets/og-image.png" />`
- **Scope:** PR A3

### H-5: Create Missing ESG Hub Spoke Pages
- **Description:** ESG hub links to `/esg-reporting/gri-standards/`, `/esg-reporting/sasb-standards/`, `/esg-reporting/sec-climate-rule/`, `/esg-reporting/esg-reporting-templates/`, `/esg-reporting/double-materiality/` — all return 404.
- **Effort:** 2-3 hours per page
- **Impact:** HIGH — eliminates broken links, improves topical authority
- **Action:** Create minimum viable content for each spoke page (500-800 words)
- **Scope:** New PRs

### H-6: Create `/carbon-accounting/ghg-protocol-guide/` Page
- **Description:** Empty directory exists but no index.html. A2 references this path.
- **Effort:** 1 hour
- **Impact:** MEDIUM — completes carbon accounting hub
- **Action:** Write GHG Protocol guide (800-1000 words)
- **Scope:** New PR

---

## Medium

### M-1: Add og:site_name and og:locale to A3
- **Description:** A3 missing `og:site_name` and `og:locale` tags that A1/A2 include.
- **Effort:** 2 min
- **Impact:** LOW — minor social sharing consistency
- **Action:** Add `og:site_name=Terrnix` and `og:locale=en_US`
- **Scope:** PR A3

### M-2: Standardize Footer Layout Across All Pages
- **Description:** A1 has 4-column footer, A2 has 3-column, A3 has 4-column. A2 footer missing ESG Reporting link.
- **Effort:** 15 min
- **Impact:** LOW — consistent navigation experience
- **Action:** Standardize to 4-column: Brand | Topics | Resources | Company
- **Scope:** All pages

### M-3: Add Eyebrow Label to A2 Hero
- **Description:** A3 hero has "ESG Disclosure & Compliance" eyebrow above H1. A2 lacks this visual hierarchy element.
- **Effort:** 2 min
- **Impact:** LOW — visual consistency between hub pages
- **Action:** Add `<p class="... uppercase ...">Carbon Accounting</p>` above A2 H1
- **Scope:** PR A2

### M-4: Add Semantic `<main>` Wrapper to A1 and A2
- **Description:** A3 wraps content in `<main id="main-content">`. A1/A2 do not use semantic `<main>`.
- **Effort:** 5 min per page
- **Impact:** LOW — improves landmark navigation for assistive tech
- **Action:** Wrap page content in `<main id="main-content">`
- **Scope:** PR A1, PR A2

### M-5: Standardize CSRD Guide CTA Wording in A3
- **Description:** A3 uses 5 different labels for the same CSRD guide link.
- **Effort:** 5 min
- **Impact:** LOW — reduces user confusion
- **Action:** Standardize to "Read the CSRD Guide" consistently
- **Scope:** PR A3

### M-6: Improve A3 Sentence Readability
- **Description:** A3 has 15.2% long sentences (>25 words) vs A2's 3.0%. Executive Overview and CSRD sections are dense.
- **Effort:** 20 min
- **Impact:** LOW — improves readability for busy executives
- **Action:** Break up 3-4 longest sentences in Executive Overview and CSRD sections
- **Scope:** PR A3

### M-7: Add ISSB/IFRS S1-S2 Dedicated Guide Page
- **Description:** A3 covers ISSB but no dedicated guide page exists.
- **Effort:** 2 hours
- **Impact:** MEDIUM — captures search traffic for ISSB-related queries
- **Action:** Write ISSB guide (800-1000 words)
- **Scope:** New PR

### M-8: Add ESG Data Collection Playbook
- **Description:** Common user need: how to collect ESG data internally.
- **Effort:** 3 hours
- **Impact:** MEDIUM — high practical value, shareable content
- **Action:** Write data collection playbook (1000-1500 words)
- **Scope:** New PR

---

## Nice to Have

### N-1: Document Schema Strategy
- **Description:** A1 uses Organization+WebSite, A2 uses Article, A3 uses WebPage+FAQPage. Each is appropriate but inconsistent in approach.
- **Effort:** 10 min
- **Impact:** LOW — documentation only
- **Action:** Add schema strategy note to SEO documentation
- **Scope:** Documentation

### N-2: Standardize Navigation Links Across All Pages
- **Description:** A1 nav includes About, Contact, Get Started; A2/A3 omit these.
- **Effort:** 10 min
- **Impact:** LOW — navigation consistency
- **Action:** Either add About/Contact to A2/A3 nav or remove from A1
- **Scope:** All pages

### N-3: Verify og-esg-reporting.jpg Exists
- **Description:** A3 references `og-esg-reporting.jpg` which may not exist in `/assets/`.
- **Effort:** 2 min
- **Impact:** LOW — prevents broken social images
- **Action:** Check file exists; if not, create or fall back to `og-image.png`
- **Scope:** PR A3

### N-4: Add FAQ Schema to A2
- **Description:** A3 has FAQPage schema. A2 could benefit from similar structured data.
- **Effort:** 15 min
- **Impact:** LOW — potential rich snippet eligibility
- **Action:** Add 3-4 FAQ schema items to carbon accounting hub
- **Scope:** PR A2

### N-5: Add Reading Progress Indicator
- **Description:** Long guides (A3, CSRD guide) could benefit from reading progress.
- **Effort:** 30 min
- **Impact:** LOW — minor UX improvement
- **Action:** Add simple scroll progress bar
- **Scope:** Future enhancement

### N-6: Add "Was This Helpful?" Feedback Widget
- **Description:** Collect qualitative feedback on guide usefulness.
- **Effort:** 1 hour
- **Impact:** LOW — data collection for content improvement
- **Action:** Simple thumbs up/down widget at bottom of guides
- **Scope:** Future enhancement

### N-7: Add Materiality Assessment Template/Tool
- **Description:** Double materiality is complex; a template would add value.
- **Effort:** 4 hours
- **Impact:** MEDIUM — high-value downloadable lead magnet
- **Action:** Create Excel/template for double materiality assessment
- **Scope:** New PR

### N-8: Add EU Taxonomy Alignment Guide
- **Description:** Natural extension of CSRD/ESRS content.
- **Effort:** 3 hours
- **Impact:** MEDIUM — captures EU Taxonomy search traffic
- **Action:** Write EU Taxonomy guide (800-1000 words)
- **Scope:** New PR

---

## Recently Completed

- ✅ Security audit v1
- ✅ SEO audit v1
- ✅ Carbon Accounting hub (PR A2)
- ✅ ESG Reporting hub (PR A3)
- ✅ Homepage SEO metadata (PR A1)
- ✅ Resource Hubs MVP (FAQ, Glossary, Guides)
- ✅ Contact Form Validation UX
- ✅ Content Learning System + KPI Dashboard
- ✅ 90-Day Growth Plan

---

*Last updated: 2026-07-21*
