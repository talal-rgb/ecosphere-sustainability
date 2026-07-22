# Brand Integration Implementation — RC2 Workstream 3

**Date:** 2026-07-21
**Status:** In Progress
**Scope:** Favicon, OG image verification, logo standardisation, PDF/certificate branding

---

## Asset Inventory

### Existing Assets

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| OG Image | `/assets/og-image.png` | ✅ EXISTS | 1200x630 JPEG (misnamed as .png). Verified on production. |
| Assessment OG | `/assets/images/assessment-og.webp` | ✅ EXISTS | WebP format, assessment-specific |

### Missing Assets

| Asset | Priority | Impact | Action |
|-------|----------|--------|--------|
| Favicon | HIGH | Browser tabs show generic icon | Create from existing logo gradient + leaf |
| Apple Touch Icon | MEDIUM | iOS home screen icon missing | Create 180x180 version |
| SVG Logo | MEDIUM | Cannot use logo in PDFs/certificates | Create vector version of text+leaf logo |
| Logo PNG | LOW | External sharing, social media | Export from SVG |

---

## Implementation Plan

### 1. Favicon (HIGH Priority)

**Design:**
- Base: Existing CSS logo gradient (emerald #4ade80 → cyan #22d3ee)
- Icon: Font Awesome leaf (same as nav)
- Format: .ico (multi-resolution) + .png fallbacks

**Sizes needed:**
- 16x16 (browser tabs)
- 32x32 (bookmarks, Windows)
- 180x180 (Apple touch icon)
- 192x192 (Android/Chrome)

**HTML to add to ALL pages:**
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

**Challenge:** No image generation tool available in this environment.
**Workaround:** Create favicon using ImageMagick or generate SVG-based favicon.

### 2. OG Image Verification

**Current:** `/assets/og-image.png` (actually JPEG, 1200x630)
**Status:** ✅ Verified on production (HTTP 200)
**Action:** Verify branding is correct (Terrnix name/logo visible)
**Note:** Cannot inspect image content in this environment. Need manual verification.

### 3. Logo Standardisation

**Current implementation (CSS-only):**
```html
<div class="w-9 h-9 rounded-lg flex items-center justify-center" 
     style="background: linear-gradient(135deg, var(--accent), var(--accent2));">
  <i class="fas fa-leaf text-sm" style="color: var(--bg-dark);"></i>
</div>
<div class="flex flex-col">
  <span class="font-display font-bold text-lg tracking-tight">Terrnix</span>
  <span class="text-[0.6rem] uppercase tracking-[0.15em] font-medium">
    Sustainability Intelligence
  </span>
</div>
```

**Limitation:** Cannot embed CSS logo in:
- PDF reports
- Certificates
- Email templates
- External sharing

**Solution:** Create SVG logo file

### 4. PDF/Certificate Branding

**Current state:**
- Assessment page: No PDF generation found
- Certificate page: Text-only "Terrnix" branding

**Required:**
- Add logo to certificate verification page
- Add logo to assessment results (if PDF exists)
- Consistent footer with copyright

---

## Files to Modify

### All HTML pages (add favicon links):
1. `index.html`
2. `carbon-accounting/index.html`
3. `carbon-accounting/scope-1-emissions/index.html`
4. `carbon-accounting/scope-2-emissions/index.html`
5. `carbon-accounting/scope-3-emissions/index.html`
6. `carbon-accounting/carbon-footprint-calculator/index.html`
7. `carbon-accounting/ghg-protocol-guide/index.html` (new)
8. `carbon-accounting/emission-factors/index.html` (new)
9. `esg-reporting/index.html`
10. `esg-reporting/csrd-omnibus-guide/index.html`
11. `tools/index.html`
12. `tools/energy-suite/index.html`
13. `resources/index.html`
14. `resources/faq/index.html`
15. `resources/glossary/index.html`
16. `resources/guides/index.html`
17. `sustainability-intelligence/index.html`
18. `contact/index.html`
19. `about/index.html`
20. `carbon-accounting-readiness-assessment/index.html`
21. `certificate/verify/index.html`

### Certificate/PDF pages (add logo):
- `certificate/verify/index.html`
- `carbon-accounting-readiness-assessment/index.html` (if PDF exists)

---

## Implementation Approach

Since we cannot generate image files in this environment, the RC2 branding work will focus on:

1. **HTML favicon links** — Add to all pages (ready for when favicon files are created)
2. **SVG logo creation** — Create a scalable vector logo for PDF/certificate use
3. **Certificate page branding** — Enhance with logo placeholder and consistent styling
4. **Documentation** — Clear specification for favicon creation

### SVG Logo Specification

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4ade80"/>
      <stop offset="100%" style="stop-color:#22d3ee"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="32" rx="6" fill="url(#grad)"/>
  <path d="M16 6 C16 6 10 12 10 18 C10 22 13 26 16 26 C19 26 22 22 22 18 C22 12 16 6 16 6Z" 
        fill="#0a0f0d"/>
  <text x="40" y="24" font-family="Space Grotesk, sans-serif" font-size="20" 
        font-weight="700" fill="#e2e8f0">Terrnix</text>
</svg>
```

---

## Verification Checklist

- [ ] Favicon links added to all pages
- [ ] SVG logo created and saved to `/assets/logo.svg`
- [ ] Certificate page displays logo
- [ ] OG image verified (manual check)
- [ ] No broken image references

---

*Implementation plan created by Terrnix AI — 2026-07-21*
