# Brand Assets Audit — Terrnix RC1

**Date:** 2026-07-21
**Auditor:** Terrnix AI
**Scope:** All brand assets across terrnix.com

---

## Executive Summary

| Asset | Status | Location | Notes |
|-------|--------|----------|-------|
| Website logo (text-based) | ✅ EXISTS | Homepage nav | CSS-generated, no image file |
| Favicon | ❌ MISSING | N/A | 404 on /favicon.ico |
| Apple Touch Icon | ❌ MISSING | N/A | Not referenced |
| OG Image | ✅ EXISTS | /assets/og-image.png | Used across pages |
| Assessment OG Image | ✅ EXISTS | /assets/images/assessment-og.webp | Assessment-specific |
| PDF Report Branding | ⚠️ PARTIAL | Assessment PDF | Uses text branding, no logo image |
| Certificate Branding | ⚠️ PARTIAL | certificate/verify/ | Uses text branding, no logo image |

**Critical Gap:** No favicon means every browser tab shows a generic icon — unprofessional and hurts brand recognition.

---

## Detailed Findings

### 1. Website Logo — Text-Based (Acceptable)

**Location:** Homepage navigation, all page navs

**Implementation:**
```html
<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, var(--accent), var(--accent2));">
  <i class="fas fa-leaf text-sm" style="color: var(--bg-dark);"></i>
</div>
<div class="flex flex-col">
  <span class="font-display font-bold text-lg tracking-tight">Terrnix</span>
  <span class="text-[0.6rem] uppercase tracking-[0.15em] font-medium">Sustainability Intelligence</span>
</div>
```

**Assessment:**
- ✅ Consistent across all pages
- ✅ Uses Font Awesome leaf icon (appropriate for sustainability)
- ✅ Gradient background (emerald/teal)
- ⚠️ No SVG or image file for high-res displays
- ⚠️ Cannot be used in PDFs, certificates, or external materials

**Recommendation:** Create an SVG logo file for flexibility.

---

### 2. Favicon — MISSING ❌

**Expected locations:**
- `/favicon.ico` — 404
- `/favicon-32x32.png` — Not referenced
- `/favicon-16x16.png` — Not referenced

**Impact:**
- Browser tabs show generic icon
- Bookmarks lack visual identification
- Mobile home screen icons missing
- Unprofessional appearance

**HTML that should exist:**
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
```

**Recommendation:** Create favicon from existing logo gradient + leaf icon.

---

### 3. Apple Touch Icon — MISSING ❌

**Expected:** `/apple-touch-icon.png`

**Impact:** iOS users adding to home screen get generic icon.

**HTML that should exist:**
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

---

### 4. Open Graph Image — EXISTS ✅

**Location:** `/assets/og-image.png`
**Verified:** HTTP 200, content-type: image/png
**Last modified:** 2026-07-21 14:49:25 GMT

**Usage:**
- Homepage: `https://terrnix.com/assets/og-image.png`
- Carbon Accounting hub: `https://terrnix.com/assets/og-image.png`
- ESG Reporting hub: `https://terrnix.com/assets/og-image.png`
- Assessment page: `https://terrnix.com/assets/images/assessment-og.webp`

**Assessment:**
- ✅ Consistent across main pages
- ✅ Correct dimensions (1200x630 implied by OG standard)
- ⚠️ Same image used for all pages — no page-specific OG images
- ⚠️ Not verified: Does the image contain Terrnix branding?

---

### 5. PDF Report Branding — PARTIAL ⚠️

**Location:** `carbon-accounting-readiness-assessment/index.html` (PDF generation)

**Assessment:**
- Uses text-based "Terrnix" header
- No logo image embedded
- No brand colors in PDF header
- Professional but minimal branding

**Recommendation:** Add SVG logo to PDF header when logo file is created.

---

### 6. Certificate Branding — PARTIAL ⚠️

**Location:** `certificate/verify/index.html`

**Assessment:**
- Text-based "Terrnix" branding
- No logo image
- Clean, professional design
- Missing favicon

---

### 7. Assessment Report OG Image — EXISTS ✅

**Location:** `/assets/images/assessment-og.webp`
**Verified:** HTTP 200, content-type: image/webp

**Note:** This is a dedicated OG image for the assessment page — good practice.

---

## Asset Inventory

### Existing Files

| File | Size | Type | Used By |
|------|------|------|---------|
| `/assets/og-image.png` | Unknown | PNG | Homepage, hubs |
| `/assets/images/assessment-og.webp` | Unknown | WebP | Assessment page |

### Missing Files

| File | Priority | Effort |
|------|----------|--------|
| `/favicon.ico` | HIGH | 15 min (once designed) |
| `/favicon-32x32.png` | HIGH | 15 min |
| `/favicon-16x16.png` | HIGH | 15 min |
| `/apple-touch-icon.png` | MEDIUM | 15 min |
| `/assets/logo.svg` | MEDIUM | 30 min |
| `/assets/logo-dark.svg` | LOW | 30 min |

---

## Recommendations

### Immediate (RC1)

1. **Add favicon links to all pages**
   - Create favicon files (see below)
   - Add `<link rel="icon">` tags to all HTML pages
   - **Effort:** 30 minutes

### Short-term (Post-RC1)

2. **Create SVG logo**
   - Design SVG version of current text+icon logo
   - Use for PDFs, certificates, and external materials
   - **Effort:** 1-2 hours (design + implementation)

3. **Page-specific OG images**
   - Create custom OG images for major pages
   - Carbon Accounting hub, ESG hub, Tools, etc.
   - **Effort:** 2-3 hours

### Medium-term

4. **Brand style guide**
   - Document colors, fonts, logo usage
   - Ensure consistency across all materials
   - **Effort:** 2-3 hours

---

## Favicon Creation Guide

Since Terrnix uses a text-based logo with a leaf icon, the favicon should be:

1. **Design:** Emerald/teal gradient square with white leaf icon
2. **Sizes:**
   - 16x16 (browser tabs)
   - 32x32 (bookmarks, Windows)
   - 180x180 (Apple touch icon)
   - 192x192 (Android)
   - 512x512 (PWA)

3. **Tools:**
   - Use a design tool (Figma, Canva) to create 512x512 master
   - Export to required sizes
   - Use favicon generator for .ico file

4. **Implementation:**
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

---

## Files to Modify

1. All `*.html` pages — Add favicon links
2. `carbon-accounting-readiness-assessment/index.html` — Add logo to PDF
3. `certificate/verify/index.html` — Add logo, favicon

---

*Report generated by Terrnix AI — 2026-07-21*
