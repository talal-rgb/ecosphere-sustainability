# Terrnix Style Guide

> Editorial and technical standards for all Terrnix web content. Follow this guide to ensure consistency across pages, PRs, and contributors.

**Version:** 1.0  
**Last updated:** 2026-07-21  
**Applies to:** All HTML pages, content PRs, and future hub expansions

---

## 1. Canonical URL Policy

**Always use `https://terrnix.com/` — never `www.terrnix.com`.**

```html
<!-- ✅ CORRECT -->
<link rel="canonical" href="https://terrnix.com/page-path/"/>
<meta property="og:url" content="https://terrnix.com/page-path/"/>

<!-- ❌ INCORRECT -->
<link rel="canonical" href="https://www.terrnix.com/page-path/"/>
<meta property="og:url" content="https://www.terrnix.com/page-path/"/>
```

This applies to:
- Canonical links
- Open Graph URLs
- Schema.org `@id` and `url` fields
- Twitter Card URLs
- Breadcrumb links
- All internal hrefs

---

## 2. Preferred Terminology

Use these exact terms consistently. Do not invent variations.

| Preferred Term | Avoid |
|---------------|-------|
| Carbon Accounting | Carbon accounting (lowercase when not a title), emissions tracking |
| ESG Reporting | ESG reporting, sustainability reporting, ESG disclosure |
| Sustainability Intelligence | Climate intelligence, green intelligence |
| Carbon Footprint Calculator | Carbon calculator, emissions calculator, GHG calculator |
| Readiness Assessment | Assessment, quiz, survey, diagnostic |
| Scope 1 / Scope 2 / Scope 3 | Scope One, scope1, Scope-1 |
| GHG Protocol | Greenhouse Gas Protocol, GHG protocol |
| CSRD | Csrd, csrd (except in titles) |
| ESRS | Esrs, esrs (except in titles) |
| Double Materiality | dual materiality, double-materiality |
| ISSB | Issb, issb (except in titles) |
| Terrnix | terrnix, TerrNix, TERRNIX (except in logos) |

---

## 3. CTA Wording Standards

Use one label per destination. Do not invent variations.

| Destination | Standard Label | Variants to Avoid |
|------------|----------------|-------------------|
| `/carbon-accounting/carbon-footprint-calculator/` | **Calculate Your Carbon Footprint** | Get Started, Calculate Emissions, Try Calculator, Launch Calculator, Free Carbon Calculator, Explore |
| `/carbon-accounting-readiness-assessment/` | **Start Readiness Assessment** | Assess Your Readiness, Take Assessment, Try Assessment |
| `/esg-reporting/csrd-omnibus-guide/` | **Read the CSRD Guide** | CSRD Omnibus Guide, Read our full CSRD Omnibus Guide, CSRD Guide (standalone) |
| `/resources/guides/` | **Explore Guides** | Guides, Browse Guides, Read Guides |
| `/resources/faq/` | **Browse FAQ** | FAQ, Read FAQ |
| `/resources/glossary/` | **Browse Glossary** | Glossary, Read Glossary |
| `/tools/` | **Explore Tools** | Tools, All Tools, Browse Tools |
| `/contact/` | **Contact Us** | Contact, Get in Touch |

**Arrow convention:** Primary CTAs use `→` (e.g., `Calculate Your Carbon Footprint →`). Secondary CTAs omit the arrow.

---

## 4. Heading Conventions

### Hierarchy
- **One H1 per page** — the page title
- **H2** for major sections
- **H3** for subsections
- **H4** for footer columns and card titles only

### H1 Format
```html
<!-- Hub pages -->
<h1>Topic: Descriptive Subtitle</h1>
<!-- Example: "ESG Reporting: A Practical Guide for Companies" -->

<!-- Homepage -->
<h1>Brand Tagline</h1>
<!-- Example: "Intelligence for a Greener Tomorrow" -->
```

### Section Order (Hub Pages)
1. Hero (H1 + subtitle + CTAs)
2. Executive Overview (H2)
3. What Is [Topic]? (H2)
4. Why [Topic] Matters (H2)
5. [Technical/Regulatory Detail] (H2)
6. How Terrnix Helps (H2)
7. Related Resources (H2)
8. CTA Section (H2)

### Eyebrow Labels
Hub pages should include an eyebrow label above the H1:
```html
<p class="text-emerald-400 font-medium text-sm tracking-wide uppercase mb-4">
  Carbon Accounting
</p>
<h1>...</h1>
```

---

## 5. Metadata Template

Every page must include this exact metadata block (adapt title/description per page):

```html
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>[Page Title] | Terrnix</title>
<meta name="description" content="[150-160 character description]"/>
<link rel="canonical" href="https://terrnix.com/page-path/"/>

<!-- Open Graph -->
<meta property="og:title" content="[Page Title] | Terrnix"/>
<meta property="og:description" content="[Description]"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://terrnix.com/page-path/"/>
<meta property="og:image" content="https://terrnix.com/assets/og-image.png"/>
<meta property="og:site_name" content="Terrnix"/>
<meta property="og:locale" content="en_US"/>

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="[Page Title] | Terrnix"/>
<meta name="twitter:description" content="[Description]"/>
<meta name="twitter:image" content="https://terrnix.com/assets/og-image.png"/>
```

**Rules:**
- Title: 50-60 characters
- Description: 150-160 characters
- OG image: always `https://terrnix.com/assets/og-image.png` unless a custom image exists
- No `www.` in any URL

---

## 6. Schema Conventions

### Hub Pages
Use `WebPage` as base type. Add `FAQPage` as `mainEntity` if the page includes FAQs.

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Title",
  "description": "...",
  "url": "https://terrnix.com/page-path/",
  "publisher": {
    "@type": "Organization",
    "name": "Terrnix",
    "url": "https://terrnix.com"
  }
}
```

### Homepage
Use `Organization` + `WebSite` with `SearchAction`.

### Article/Guide Pages
Use `Article` for standalone guides (e.g., CSRD Omnibus Guide).

---

## 7. Internal Linking Rules

### Every Hub Page Must Link To:
- `/` (homepage)
- `/carbon-accounting/` (Carbon Accounting hub)
- `/esg-reporting/` (ESG Reporting hub)
- `/sustainability-intelligence/` (Intelligence hub)
- `/tools/` (Tools hub)
- `/resources/` (Resources hub)
- `/resources/faq/` (FAQ)
- `/resources/glossary/` (Glossary)
- `/resources/guides/` (Guides)
- `/contact/` (Contact)

### Cross-Linking Priority
1. **Calculator** → always link from Carbon Accounting, ESG Reporting, and Tools
2. **Assessment** → always link from Carbon Accounting and ESG Reporting "How Terrnix Helps"
3. **Guides** → link between related topics (e.g., CSRD Guide from ESG hub)
4. **Resources** → link glossary terms on first mention in each section

### Link Text Rules
- Use descriptive text — never "click here", "read more", "learn more"
- Match the destination page title where possible
- Use exact terminology from Section 2

---

## 8. Tone and Writing Style

### Audience
Write for:
- Sustainability Directors
- ESG Managers
- Compliance Officers
- CFOs
- Executive leadership

### Voice
- **Professional** — consultant-level, not academic
- **Direct** — no filler, no throat-clearing
- **Evidence-based** — no unsupported claims, no invented statistics
- **Action-oriented** — every section should answer a real business question

### Prohibited
- AI clichés: "delve", "leverage", "groundbreaking", "revolutionary", "cutting-edge"
- Marketing fluff: "best-in-class", "world-leading", "unparalleled"
- Generic intros: "In today's world...", "As we navigate..."
- Unsupported claims: "studies show", "research proves" without citation
- Invented data: statistics, regulations, customer examples, certifications, case studies

### Sentence Length
- Average: 15-20 words
- Maximum: 25 words (break up longer sentences)
- Paragraphs: 2-4 sentences maximum

---

## 9. Accessibility Standards

### Required on Every Page
```html
<!-- Skip link -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Navigation -->
<nav aria-label="Main navigation">
  <a href="/page/" aria-current="page">Current Page</a>
</nav>

<!-- Breadcrumb -->
<nav aria-label="Breadcrumb">
  <span aria-current="page">Current Page</span>
</nav>

<!-- Main content -->
<main id="main-content">
  <!-- page content -->
</main>
```

### CSS for Skip Link
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #4ade80;
  color: #0a0f0d;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.3s;
  font-weight: 600;
}
.skip-link:focus { top: 0; }
```

### Images
- All images must have `alt` text
- Decorative images: `alt=""` (empty) with `aria-hidden="true"`
- Informative images: descriptive alt text

### Headings
- One H1 per page
- No skipped levels (H1 → H2 → H3, never H1 → H3)
- Use headings for structure, not styling

---

## 10. Responsive Design Standards

### Container
```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### Grid
```html
<!-- Mobile-first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Typography
```html
<!-- Hero H1 -->
<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold">

<!-- Section H2 -->
<h2 class="text-2xl md:text-3xl font-bold">

<!-- Body -->
<p class="text-lg md:text-xl text-gray-400">
```

### CTAs
```html
<div class="flex flex-wrap gap-4">
  <a class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 ...">
  <a class="px-6 py-3 border border-[#2d3d35] hover:border-emerald-500/50 ...">
</div>
```

---

## 11. Pre-PR Checklist

Before requesting review, verify:

- [ ] Self-review completed (factual accuracy, grammar, readability)
- [ ] SEO review (title, description, canonical, OG, Twitter, schema)
- [ ] Accessibility review (skip link, aria-labels, heading hierarchy, alt text)
- [ ] Cross-link review (all required internal links present)
- [ ] Metadata review (all required tags present, no `www.`)
- [ ] CTA review (standardized wording per Section 3)
- [ ] Terminology review (preferred terms per Section 2)
- [ ] Responsive review (mobile layout verified)
- [ ] No AI clichés or unsupported claims
- [ ] Word count within target range

---

## 12. Verification Checklist (Post-Deploy)

After merging and deploying:

- [ ] Canonical URL returns 200 with correct `rel="canonical"`
- [ ] OG tags validate with Facebook Sharing Debugger
- [ ] Twitter cards validate with Twitter Card Validator
- [ ] Schema validates with Google Rich Results Test
- [ ] All internal links return 200 (no 404s)
- [ ] Skip link works with keyboard navigation
- [ ] Page passes Lighthouse accessibility audit (≥90)
- [ ] Mobile layout verified on actual device or emulator
- [ ] No console errors

---

*This style guide is a living document. Update it as standards evolve.*
