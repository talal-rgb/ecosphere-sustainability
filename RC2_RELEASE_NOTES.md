# RC2_RELEASE_NOTES.md — Terrnix Release Candidate 2

**Version:** RC2  
**Codename:** Platform Completion  
**Release Date:** 2026-07-22  
**Previous Version:** RC1 (Infrastructure & Audit)  
**Next Planned:** RC3 — Sustainability Academy (Hybrid)

---

## Overview

RC2 completes the platform foundation phase of Terrnix. This release adds flagship content, professional branding, interactive engagement tools, and product landing pages — transforming Terrnix from an audit-candidate into a production-ready sustainability platform.

---

## New Features

### Content & Knowledge

1. **GHG Protocol Guide** (`/carbon-accounting/ghg-protocol-guide/`)
   - Complete guide to the GHG Protocol Corporate Standard
   - Scope 1/2/3 breakdown with practical examples
   - 5 calculation principles: Relevance, Completeness, Consistency, Transparency, Accuracy
   - Reporting boundaries and organisational guidance
   - 3 industry examples: manufacturing, services, retail

2. **Emission Factors Reference** (`/carbon-accounting/emission-factors/`)
   - Regional electricity factors for 10 countries
   - Sector-specific factors: transport, stationary, refrigerants, materials
   - 5 recommended databases: IPCC, EPA, DEFRA/BEIS, IEA, Ecoinvent
   - Practical guidance for factor selection and application

### Brand & Identity

3. **Terrnix Branding Integration**
   - SVG logo with gradient leaf + Space Grotesk wordmark
   - SVG favicon for modern browsers
   - Applied across all 20+ public-facing pages
   - Consistent brand presence in navigation

### Engagement

4. **Sustainability Quiz** (`/quiz/`)
   - 30 questions across 6 categories
   - 3 difficulty levels (Beginner, Intermediate, Advanced)
   - Score tracking with per-category breakdown
   - Certificate generation with name/email capture
   - Certificate verification system
   - Print-friendly certificate download

### Product Landing Pages

5. **ESG Report Analyzer** (`/esg-reporting/esg-report-analyzer/`)
   - 4-step workflow visualization
   - Framework support: CSRD, ISSB, TCFD, GRI
   - 6 key features with detailed explanations
   - Waitlist form for early access

6. **Energy Economics Suite** (`/tools/energy-suite/`)
   - 6 planned calculators: NPV, IRR, LCOE, Renewable Sizing, Battery Optimisation, Demand Forecasting
   - 4-phase development roadmap (Q3 2026 – Q2 2027)
   - Use case personas for target audiences
   - Waitlist form for tool notifications

---

## Improvements

### SEO
- 4 new authoritative content pages with structured data
- Comprehensive metadata on all new pages (title, description, canonical, OG, Twitter)
- Article schema on guides, Product schema on landing pages
- Updated sitemap.xml with 29 URLs (8 new)

### Accessibility
- Skip links on all new pages
- Semantic HTML structure (`<main>`, `<nav>`, `<header>`, `<footer>`)
- ARIA labels for navigation and interactive elements
- Breadcrumb navigation on all content pages

### Mobile Responsiveness
- All new pages built with Tailwind responsive classes
- Touch-friendly interfaces on quiz and calculator
- Mobile-optimized card layouts

---

## Bug Fixes

### RC1 Issues Resolved
- Footer link to energy suite now points to carbon calculator (ESG Reporting hub)
- All canonical URLs verified (no `www.` prefix)
- Sitemap updated with all RC2 pages
- No broken internal links introduced

---

## Known Limitations

### Critical (Non-Blocking)
1. **Sustainability Academy** — Not yet implemented. All references show "Coming Soon" or link to existing content.
2. **ESG Report Analyzer** — Landing page only. AI engine not built.
3. **Energy Economics Suite** — Landing page + roadmap only. No calculators built.

### High
4. **Certificate Branding** — Certificates lack Terrnix logo and brand colours.
5. **PDF Report Branding** — Calculator PDF exports lack Terrnix branding.
6. **Generic OG Image** — All pages use same generic OG image.

### Medium
7. **Homepage Value Proposition** — Hero text could be clearer about product offering.
8. **Navigation Active State** — No visual indicator showing current section.
9. **Tailwind CDN** — Using CDN instead of self-hosted build.

### Low
10. **localStorage Storage** — Certificates and waitlist stored locally (not cross-device).
11. **No PNG Favicon Fallback** — SVG favicon works in modern browsers only.

---

## Deferred Work

### RC3 — Sustainability Academy (Hybrid) (Approved)
- Learning Paths (Carbon Accounting Pro, ESG Reporting Specialist, Energy Economics Analyst)
- Professional Guides (deep-dive content)
- Quizzes & Certification (expanded from current quiz)
- Resource Library (templates, checklists)
- Case Studies (future)
- Video Learning (future)

### RC4 — AI Compliance Platform
- ESG Report Analyzer AI engine
- Automated gap detection
- Framework comparison engine
- Report generation

### RC5 — Advanced Energy Economics Suite
- NPV Calculator
- IRR Calculator
- LCOE Calculator
- Renewable Sizing Tool
- Battery Optimisation
- Demand Forecasting

---

## Technical Details

### Files Changed
- 4 new content pages
- 2 new brand assets (logo.svg, favicon.svg)
- 19 pages updated with favicon links
- 1 updated sitemap.xml

### Dependencies
- Tailwind CSS 3.4.17 (CDN)
- Google Fonts (Space Grotesk, Inter)
- Heroicons (SVG)
- html2pdf.js (PDF export)
- Chart.js (calculator charts)

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- IE11: Not supported (SVG favicon, modern CSS)

---

## Rollback Considerations

### Full Rollback
- Revert all RC2 commits
- Delete new directories: `carbon-accounting/ghg-protocol-guide/`, `carbon-accounting/emission-factors/`, `esg-reporting/esg-report-analyzer/`, `quiz/`
- Remove brand assets: `assets/logo.svg`, `assets/favicon.svg`
- Restore previous sitemap.xml

### Partial Rollback
- Individual PRs can be reverted independently
- Content pages can be removed without affecting other features
- Branding can be removed by deleting favicon links

### Data Preservation
- Quiz certificates stored in localStorage will be lost on domain change
- Waitlist emails stored in localStorage will be lost
- No server-side data to preserve

---

## Verification Checklist

- [ ] All new URLs return 200
- [ ] Sitemap validates successfully
- [ ] No broken internal links
- [ ] All pages have favicon
- [ ] OG metadata present on all pages
- [ ] Calculator functions correctly
- [ ] Quiz completes and generates certificate
- [ ] Certificate verification works
- [ ] Contact form sends email
- [ ] Mobile responsive on all pages
- [ ] No console errors

---

## Support

For issues or questions about RC2:
- Review RC2_RELEASE_REPORT.md for detailed analysis
- Check RC2_REVIEW.md for UX and content scoring
- Contact: https://terrnix.com/contact/

---

*End of RC2 Release Notes*
