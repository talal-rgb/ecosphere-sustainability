# Definition of Done (DoD)

> Every PR must satisfy all items on this checklist before it can be marked "Ready for Review."
>
> **Version:** 1.0  
> **Last updated:** 2026-07-21  
> **Applies to:** All content, feature, and bug-fix PRs

---

## Mandatory Checklist

### 1. Functional Implementation
- [ ] Feature or content is fully implemented per PR objective
- [ ] No placeholder text, TODOs, or commented-out code remains
- [ ] All acceptance criteria from the PR description are met
- [ ] Code/content has been tested locally (where applicable)

### 2. Self-Review
- [ ] Factual accuracy verified (no invented statistics, regulations, or claims)
- [ ] Grammar and spelling checked
- [ ] Readability reviewed (sentence length, paragraph structure)
- [ ] No AI clichés ("delve", "leverage", "groundbreaking", etc.)
- [ ] No marketing fluff or unsupported superlatives
- [ ] Word count within target range

### 3. SEO Review
- [ ] Title tag: 50-60 characters, includes target keyword
- [ ] Meta description: 150-160 characters, actionable
- [ ] Canonical URL: uses `https://terrnix.com/` (never `www.`)
- [ ] Open Graph tags: title, description, image, url, type, site_name, locale
- [ ] Twitter Card tags: card, title, description, image
- [ ] Schema.org structured data: appropriate type, validates as JSON-LD
- [ ] Heading hierarchy: one H1, logical H2→H3 progression, no skipped levels

### 4. Accessibility Review
- [ ] Skip-to-content link present
- [ ] `aria-label="Main navigation"` on `<nav>`
- [ ] `aria-label="Breadcrumb"` on breadcrumb `<nav>`
- [ ] `aria-current="page"` on active nav item
- [ ] Semantic `<main id="main-content">` wrapper
- [ ] All images have `alt` text (empty for decorative)
- [ ] Descriptive link text (no "click here", "read more")
- [ ] Color contrast meets WCAG AA (where applicable)

### 5. Metadata Completeness
- [ ] All 12 required meta tags present (see STYLE_GUIDE.md Section 5)
- [ ] No `www.` in any URL field
- [ ] OG image points to `https://terrnix.com/assets/og-image.png` (or custom if created)
- [ ] Schema `@id` and `url` fields use canonical URL

### 6. Schema Validation
- [ ] JSON-LD parses without errors
- [ ] `@context` is `https://schema.org`
- [ ] `@type` is appropriate for page content
- [ ] Required properties populated (name, description, url)
- [ ] Tested with Google Rich Results Test (or equivalent)

### 7. Internal Links Verified
- [ ] All internal links return 200 (no 404s)
- [ ] Cross-links to related hubs present (Carbon Accounting, ESG, Intelligence, Tools, Resources)
- [ ] Calculator linked from relevant pages
- [ ] Assessment linked from relevant pages
- [ ] FAQ, Glossary, Guides linked where appropriate
- [ ] Contact page linked from CTAs

### 8. Mobile Responsiveness
- [ ] Page renders correctly at 320px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] CTAs are tappable (min 44px height)
- [ ] Text readable without zoom (16px minimum)
- [ ] Grid collapses to single column on mobile

### 9. Console Errors
- [ ] No JavaScript errors in browser console
- [ ] No 404s for assets (CSS, JS, images, fonts)
- [ ] No CORS errors
- [ ] No mixed content warnings (HTTPS only)

### 10. STYLE_GUIDE.md Compliance
- [ ] Preferred terminology used consistently (Section 2)
- [ ] CTA wording matches standard labels (Section 3)
- [ ] Heading conventions followed (Section 4)
- [ ] Metadata template used (Section 5)
- [ ] Schema conventions followed (Section 6)
- [ ] Internal linking rules followed (Section 7)
- [ ] Tone and writing style match (Section 8)
- [ ] Accessibility standards met (Section 9)
- [ ] Responsive design standards followed (Section 10)

### 11. BACKLOG Updated
- [ ] Any new improvements discovered during work are logged
- [ ] Each item includes: description, priority, effort, impact
- [ ] Items are categorized: Critical / High / Medium / Nice to Have
- [ ] No scope creep in current PR — new work goes to BACKLOG

### 12. QUALITY_REVIEW Updated (Major Content Initiatives)
- [ ] Cross-PR consistency checked (if part of a series)
- [ ] Issues documented with severity and fix recommendations
- [ ] Score before/after recorded
- [ ] Verdict included (ready to merge / needs fixes)

---

## Optional but Recommended

- [ ] Lighthouse SEO score ≥95
- [ ] Lighthouse Accessibility score ≥90
- [ ] Lighthouse Performance score ≥80
- [ ] Page load time <3s on 3G
- [ ] Social preview validated (Facebook Debugger, Twitter Card Validator)
- [ ] Screenshot of key sections attached to PR

---

## Reviewer Checklist

The reviewer verifies:

- [ ] All 12 DoD items are checked by the author
- [ ] No merge conflicts with `main`
- [ ] Branch is up to date with `main`
- [ ] Commit messages are clear and descriptive
- [ ] Risk assessment included in PR description
- [ ] Rollback plan documented

---

## Post-Merge Verification

After deployment, verify:

- [ ] Page loads correctly on production
- [ ] Canonical URL returns 200
- [ ] OG tags validate
- [ ] Twitter cards validate
- [ ] Schema validates
- [ ] All internal links work
- [ ] No console errors
- [ ] Mobile layout correct
- [ ] Lighthouse scores meet targets

Update `DEPLOYMENT_VERIFICATION.md` with results.

---

## Enforcement

- PRs without a completed DoD checklist will be returned to the author
- The DoD is a minimum standard, not a maximum — exceed it where possible
- If an item genuinely does not apply, mark it N/A with explanation
- The DoD evolves — propose changes via PR to this file

---

*This Definition of Done ensures every Terrnix PR meets a repeatable quality standard. It reduces review cycles, prevents regressions, and maintains consistency as the site grows.*
