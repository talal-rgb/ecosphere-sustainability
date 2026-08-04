# Technical Recommendation: Static Site Generator Migration

## Date: 2026-08-04
## Status: RECOMMENDATION — Do NOT migrate now. Prepare for future evolution.

---

## Current State

Terrnix is a static HTML site hosted on GitHub Pages with:
- 24+ HTML pages across multiple directories
- Repeated navigation, footer, and SEO `<head>` blocks on every page
- Inline CSS and JavaScript scattered across pages
- Manual maintenance of every page for any shared change

## Problem

Every shared change (navigation link, footer update, SEO template, design system) requires editing 14+ files manually. This:
- Is error-prone (as demonstrated by inconsistent nav/footer across pages)
- Makes the site unmaintainable as it grows beyond 50 pages
- Prevents automated content pipelines (news ingestion, article generation)
- Blocks A/B testing and personalization

## Recommended Solution: Astro

After evaluating Eleventy, Astro, and Vite-based SSGs, **Astro** is the best fit for Terrnix.

### Why Astro

| Criterion | Astro | Eleventy | Vite + React |
|-----------|-------|----------|--------------|
| **Zero JS by default** | ✅ Ships 0KB JS unless needed | ✅ | ❌ React hydrates everything |
| **Component islands** | ✅ React, Vue, Svelte, Alpine | ❌ No components | ✅ React only |
| **Markdown/MDX** | ✅ Native | ✅ | Via plugins |
| **Content collections** | ✅ Type-safe with Zod | ❌ | ❌ |
| **Partial hydration** | ✅ `client:visible`, `client:idle` | N/A | ❌ All or nothing |
| **Build speed** | ✅ Fast | ✅ Fast | ⚠️ Moderate |
| **GitHub Pages** | ✅ Static output | ✅ | ✅ |
| **Learning curve** | Low (HTML-like syntax) | Low | High (React) |
| **SEO-friendly** | ✅ | ✅ | ⚠️ Needs extra work |

### Why NOT Eleventy

Eleventy is excellent for simple blogs but lacks:
- Component-based architecture (no reusable `<Nav />`, `<Footer />` components)
- Content collections with type safety
- Partial hydration for interactive elements (calculators, chatbot)
- Modern developer experience (Hot Module Replacement, TypeScript)

### Why NOT Vite + React

React SSR/SSG requires hydration, which:
- Ships unnecessary JavaScript to the browser
- Hurts Core Web Vitals (LCP, TTI)
- Is overkill for a content-heavy site

### Astro Advantages for Terrnix

1. **Component Islands**: The carbon calculator, LCOE tool, and chatbot can be React/Vue islands while the rest of the page is static HTML
2. **Content Collections**: Articles, guides, and glossary terms become type-safe collections with automatic RSS/sitemap generation
3. **Shared Layouts**: One `Layout.astro` file provides nav, footer, SEO, and design system to all pages
4. **Zero JS**: Hub pages (Carbon, ESG, About) ship zero JavaScript — just HTML and CSS
5. **Markdown/MDX**: Articles and guides written in Markdown with embedded React components for calculators
6. **Build-time optimization**: Images optimized, CSS inlined, critical CSS extracted automatically

## Proposed Architecture

```
terrnix.com/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro          # Nav, footer, SEO, design system
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Breadcrumb.astro
│   │   ├── TrustBadges.astro
│   │   ├── CarbonCalculator.jsx      # React island
│   │   ├── LCOECalculator.jsx        # React island
│   │   └── Chatbot.jsx               # React island
│   ├── content/
│   │   ├── articles/                 # Markdown articles
│   │   ├── guides/                   # Markdown guides
│   │   └── glossary/                 # Markdown glossary terms
│   ├── pages/
│   │   ├── index.astro               # Homepage
│   │   ├── carbon-accounting.astro   # Hub page
│   │   ├── esg-reporting.astro       # Hub page
│   │   ├── tools/
│   │   │   ├── index.astro
│   │   │   └── energy-suite.astro
│   │   └── [slug].astro              # Dynamic article pages
│   └── styles/
│       └── design-system.css         # Your existing design system
├── public/
│   ├── assets/
│   └── components/                   # Keep for backward compat
└── astro.config.mjs
```

## Migration Path (Future)

When approved, migrate in this order:

1. **Phase 1**: Set up Astro project alongside existing site
2. **Phase 2**: Migrate shared components (Nav, Footer, Layout)
3. **Phase 3**: Migrate hub pages (Carbon, ESG, Tools, About)
4. **Phase 4**: Migrate articles to Markdown/MDX content collections
5. **Phase 5**: Migrate interactive tools (calculator, chatbot) as islands
6. **Phase 6**: Switch GitHub Pages source to Astro build output
7. **Phase 7**: Remove old static HTML files

## Effort Estimate

- Initial setup: 4-8 hours
- Component migration: 8-16 hours
- Page migration: 16-24 hours
- Content migration: 8-12 hours
- Testing & deployment: 4-8 hours
- **Total: 40-68 hours**

## Risk

- **Low**: Astro outputs static HTML — no runtime dependency
- **Low**: Can migrate incrementally, page by page
- **Low**: Existing URLs preserved via `permalink` config
- **Medium**: Team needs to learn Astro syntax (HTML-like, minimal learning curve)

## Recommendation

**Do NOT migrate now.** The current Phase A standardization (shared components via SSI) is the right intermediate step. 

**When to migrate:**
- When the site exceeds 30 pages
- When content pipeline (news ingestion) becomes priority
- When A/B testing or personalization is needed
- When the team has 1-2 weeks available for focused migration work

## Immediate Action

Keep the `components/` directory structure and SSI includes (`<!--#include virtual="..." -->`). When Astro migration happens, these become `src/components/` with minimal changes.

---

*Prepared by Terrnix AI, 2026-08-04*
