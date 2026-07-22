# PLATFORM_CONSISTENCY.md — Terrnix Design & Brand Consistency Audit

**Date:** 2026-07-22  
**Scope:** All public-facing pages  
**Methodology:** Visual inspection, code review, automated checks

---

## 1. Logo Usage

| Page | Logo in Nav | Favicon | Notes |
|------|-------------|---------|-------|
| Homepage | ✅ SVG | ✅ SVG | |
| Carbon Accounting | ✅ SVG | ✅ SVG | |
| ESG Reporting | ✅ SVG | ✅ SVG | |
| Sustainability Intelligence | ✅ SVG | ✅ SVG | |
| Tools | ✅ SVG | ✅ SVG | |
| Resources | ✅ SVG | ✅ SVG | |
| About | ✅ SVG | ✅ SVG | |
| Contact | ✅ SVG | ✅ SVG | |
| Calculator | ✅ SVG | ✅ SVG | |
| Assessment | ✅ SVG | ✅ SVG | |
| Quiz | ✅ SVG | ✅ SVG | |
| Certificate/Verify | ✅ SVG | ✅ SVG | |
| Scope 1/2/3 Guides | ✅ SVG | ✅ SVG | |
| GHG Protocol Guide | ✅ SVG | ✅ SVG | |
| Emission Factors | ✅ SVG | ✅ SVG | |
| CSRD Guide | ✅ SVG | ✅ SVG | |
| ESG Analyzer | ✅ SVG | ✅ SVG | |
| Energy Suite | ✅ SVG | ✅ SVG | |
| FAQ | ✅ SVG | ✅ SVG | |
| Glossary | ✅ SVG | ✅ SVG | |

**Status:** ✅ CONSISTENT — All 20 pages have logo and favicon

**Issues:**
- Logo is not used in page content (only nav) — missed branding opportunity
- No logo in footer (text-only "Terrnix")
- OG images still use generic image, not branded logo

---

## 2. Brand Colours

| Colour | Hex | Usage | Status |
|--------|-----|-------|--------|
| Background Dark | `#0a0f0d` | Body background | ✅ Consistent |
| Panel | `#111a16` | Cards, sections | ✅ Consistent |
| Surface | `#1a2520` | Inputs, elevated cards | ✅ Consistent |
| Border | `#2d3d35` | Dividers, card borders | ✅ Consistent |
| Accent (Emerald) | `#4ade80` | Primary buttons, highlights | ✅ Consistent |
| Accent 2 (Cyan) | `#22d3ee` | Gradients, secondary | ✅ Consistent |
| Text Primary | `#e2e8f0` | Headings, body | ✅ Consistent |
| Text Secondary | `#9ca3af` / `#6b7280` | Descriptions, meta | ⚠️ Inconsistent — two greys used |

**Status:** ⚠️ MINOR ISSUE — Two different secondary text colours (`#9ca3af` and `#6b7280`) appear across pages. Standardise on one.

---

## 3. Typography

| Element | Font | Weight | Size | Status |
|---------|------|--------|------|--------|
| H1 | Space Grotesk | 700 | 4xl-6xl | ✅ Consistent |
| H2 | Space Grotesk | 700 | 3xl | ✅ Consistent |
| H3 | Space Grotesk | 600 | xl-lg | ✅ Consistent |
| Body | Inter | 400 | base | ✅ Consistent |
| Buttons | Inter/Space Grotesk | 600-700 | base | ⚠️ Inconsistent — some buttons use different fonts |
| Nav Links | Inter | 400-500 | base | ✅ Consistent |

**Status:** ⚠️ MINOR ISSUE — Button font weight varies (600 vs 700) across pages.

---

## 4. Spacing

| Element | Pattern | Status |
|---------|---------|--------|
| Section padding | `py-16` to `py-24` | ✅ Consistent |
| Card padding | `p-6` | ✅ Consistent |
| Grid gaps | `gap-6` to `gap-8` | ✅ Consistent |
| Container max-width | `max-w-7xl` | ✅ Consistent |
| Page padding | `px-4 sm:px-6 lg:px-8` | ✅ Consistent |

**Status:** ✅ CONSISTENT

---

## 5. Buttons

| Type | Style | Status |
|------|-------|--------|
| Primary | Gradient (emerald→cyan), black text, rounded-lg | ✅ Consistent |
| Secondary | Border `#2d3d35`, white text, rounded-lg | ✅ Consistent |
| Ghost | Text only, hover underline | ✅ Consistent |

**Status:** ✅ CONSISTENT

**Issues:**
- Some CTAs use `<button>` vs `<a>` inconsistently
- "Coming Soon" badges vary in style (some pills, some text)

---

## 6. CTA Wording

| Location | Current | Status |
|----------|---------|--------|
| Hero primary | "Get Started" / "Explore" | ⚠️ Inconsistent |
| Calculator | "Calculate Now" | ✅ Good |
| Assessment | "Start Assessment" | ✅ Good |
| Quiz | "Start Quiz" | ✅ Good |
| ESG Analyzer | "Join the Waitlist" | ✅ Good |
| Energy Suite | "Join Waitlist" | ⚠️ Slightly different from ESG |
| Guide CTAs | "Learn More" / "Read Guide" / "Explore" | ⚠️ Inconsistent |

**Status:** ⚠️ MODERATE ISSUE — CTA wording should be standardised:
- Live tools: "[Verb] Now →" (Calculate, Analyze, Start)
- Coming Soon: "Join Waitlist" (consistent)
- Guides: "Read Full Guide →" (consistent)

---

## 7. Icons

| Library | Usage | Status |
|---------|-------|--------|
| Heroicons (SVG) | Navigation, features | ✅ Consistent |
| Custom SVG | Logo, favicon | ✅ Consistent |
| Emoji | Some cards | ⚠️ Inconsistent — mix of SVG icons and emoji |

**Status:** ⚠️ MINOR ISSUE — Some pages use emoji (🧮, 📊, 🎓) in product cards while others use SVG icons. Standardise on SVG for professionalism.

---

## 8. Cards

| Element | Pattern | Status |
|---------|---------|--------|
| Background | `#111a16` | ✅ Consistent |
| Border | `1px solid #2d3d35` | ✅ Consistent |
| Border radius | `rounded-xl` (12px) | ✅ Consistent |
| Hover effect | `border-emerald-500/30` | ✅ Consistent |
| Shadow | None (flat design) | ✅ Consistent |

**Status:** ✅ CONSISTENT

---

## 9. Headers

| Element | Pattern | Status |
|---------|---------|--------|
| Background | `#0a0f0d`/95 + backdrop-blur | ✅ Consistent |
| Border | `border-b #2d3d35` | ✅ Consistent |
| Height | `h-16` | ✅ Consistent |
| Position | `sticky top-0` | ✅ Consistent |
| Z-index | `z-50` | ✅ Consistent |

**Status:** ✅ CONSISTENT

---

## 10. Footers

| Element | Pattern | Status |
|---------|---------|--------|
| Background | `#0a0f0d` | ✅ Consistent |
| Border | `border-t #2d3d35` | ✅ Consistent |
| Columns | 4-column grid | ✅ Consistent |
| Links | Product, Resources, Company | ⚠️ Inconsistent — some footers have different link sets |

**Status:** ⚠️ MODERATE ISSUE — Footer links vary:
- Some footers link to "Academy" (empty page)
- Some footers link to "Energy Suite" (generic page)
- Some don't include "Quiz" link

**Fix:** Standardise footer across all pages with:
- Product: Carbon Calculator, ESG Analyzer, Academy (Coming Soon), Energy Suite (Coming Soon)
- Resources: Intelligence, Guides, Glossary, FAQ, Quiz
- Company: About, Contact, Privacy, Terms

---

## 11. Navigation

| Element | Pattern | Status |
|---------|---------|--------|
| Items | Carbon, ESG, Intelligence, Tools | ✅ Consistent |
| Mobile | Hamburger menu | ✅ Present |
| Active state | No visual active indicator | 🔴 Missing |
| Dropdowns | None | N/A |

**Status:** 🔴 ISSUE — No active state on navigation. User can't tell which section they're in.

**Fix:** Add active state:
```css
.nav-link.active { color: #4ade80; border-bottom: 2px solid #4ade80; }
```

---

## 12. Metadata

| Element | Coverage | Status |
|---------|----------|--------|
| Title | 100% | ✅ All pages |
| Description | 100% | ✅ All pages |
| Canonical | 100% | ✅ All pages |
| OG tags | 100% | ✅ All pages |
| Twitter Cards | 100% | ✅ All pages |
| Favicon | 100% | ✅ All pages |

**Status:** ✅ CONSISTENT

---

## 13. Schema

| Page Type | Schema | Status |
|-----------|--------|--------|
| Guides | Article | ✅ Present |
| Hubs | WebPage | ✅ Present |
| Product pages | Product | ✅ Present |
| Calculator | SoftwareApplication | 🔴 Missing |
| Quiz | Quiz | 🔴 Missing |
| FAQ | FAQPage | 🔴 Missing |

**Status:** 🔴 ISSUES — Missing schemas:
- Calculator should have SoftwareApplication schema
- Quiz should have Quiz schema (or at least CreativeWork)
- FAQ should have FAQPage schema

---

## 14. Accessibility

| Element | Status | Notes |
|---------|--------|-------|
| Skip links | ✅ Present | All pages |
| Semantic HTML | ✅ Good | `<main>`, `<nav>`, `<header>`, `<footer>` |
| ARIA labels | ✅ Present | Navigation, buttons |
| Alt text | ⚠️ Partial | Some decorative SVGs lack `aria-hidden` |
| Colour contrast | ✅ Good | Emerald on dark passes WCAG AA |
| Focus indicators | ⚠️ Partial | Some custom elements lack focus styles |
| Form labels | ✅ Present | All inputs have labels |

**Status:** ⚠️ MINOR ISSUES
- Some decorative SVGs need `aria-hidden="true"`
- Focus styles could be more visible
- No `prefers-reduced-motion` support

---

## 15. Responsive Behaviour

| Breakpoint | Behaviour | Status |
|------------|-----------|--------|
| Mobile (<640px) | Single column, stacked nav | ✅ Good |
| Tablet (640-1024px) | 2-column grids | ✅ Good |
| Desktop (>1024px) | Full layout | ✅ Good |
| Touch targets | Minimum 44px | ✅ Good |
| Font scaling | Responsive sizes | ✅ Good |

**Status:** ✅ CONSISTENT

---

## Consistency Scorecard

| Category | Score | Issues |
|----------|-------|--------|
| Logo Usage | 8/10 | Missing in footer, OG images |
| Brand Colours | 9/10 | Two secondary greys |
| Typography | 9/10 | Button weight inconsistency |
| Spacing | 10/10 | None |
| Buttons | 9/10 | Element type inconsistency |
| CTA Wording | 7/10 | Multiple variations |
| Icons | 8/10 | Emoji vs SVG mix |
| Cards | 10/10 | None |
| Headers | 10/10 | None |
| Footers | 7/10 | Link inconsistency |
| Navigation | 7/10 | Missing active state |
| Metadata | 10/10 | None |
| Schema | 7/10 | Missing on calculator, quiz, FAQ |
| Accessibility | 8/10 | Minor SVG and focus issues |
| Responsive | 10/10 | None |
| **Overall** | **8.5/10** | |

---

## Priority Fixes

### P0 — Before Release
1. **Standardise footer links** across all pages
2. **Add nav active state** to show current section
3. **Fix footer product links** — remove empty page links

### P1 — Post-Release Patch
4. **Standardise CTA wording** — create CTA style guide
5. **Replace emoji with SVG icons** in product cards
6. **Add missing schemas** (calculator, quiz, FAQ)

### P2 — RC3
7. **Add logo to footer**
8. **Standardise secondary text colour**
9. **Improve focus indicators**
10. **Add `prefers-reduced-motion` support**

---

*End of Platform Consistency Audit*
