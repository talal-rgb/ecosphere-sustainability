# Deployment Verification — A1, A2, A3

**Deployment Date:** 2026-07-21  
**Deployed By:** Terrnix AI  
**Branch Merged:** `main` (commit `149328b`)  
**PRs Included:**
- A1 — Homepage SEO & Metadata
- A2 — Carbon Accounting Hub Flagship Page
- A3 — ESG Reporting Hub Flagship Resource

---

## 1. Deployment Status

| Step | Status | Notes |
|------|--------|-------|
| Merge A1 to main | ✅ COMPLETE | Fast-forward |
| Merge A2 to main | ✅ COMPLETE | Fast-forward |
| Merge A3 to main | ✅ COMPLETE | Resolved conflicts (took `--theirs` for consistency fixes) |
| Push to origin | ✅ COMPLETE | Commit `149328b` |
| Delete feature branches | ✅ COMPLETE | Local + remote |
| GitHub Pages build | ⏳ PENDING | Auto-deploy triggered |

---

## 2. Smoke Test Results

### 2.1 Homepage (A1)

| Check | Status | Method |
|-------|--------|--------|
| Page loads | ⏳ PENDING | `curl -I https://terrnix.com/` |
| Title correct | ⏳ PENDING | Browser dev tools |
| Meta description present | ⏳ PENDING | View source |
| Canonical URL | ⏳ PENDING | View source |
| OG tags present | ⏳ PENDING | Facebook Debugger or view source |
| Twitter Card tags present | ⏳ PENDING | Twitter Card Validator or view source |
| Schema (Organization + WebSite) | ⏳ PENDING | Google Rich Results Test |
| OG image renders | ⏳ PENDING | Direct image URL |
| No console errors | ⏳ PENDING | Browser dev tools |

### 2.2 Carbon Accounting Hub (A2)

| Check | Status | Method |
|-------|--------|--------|
| Page loads | ⏳ PENDING | `curl -I https://terrnix.com/carbon-accounting/` |
| All sections render | ⏳ PENDING | Visual inspection |
| Internal links work | ⏳ PENDING | Click test |
| Calculator CTA | ⏳ PENDING | Click test |
| Assessment CTA | ⏳ PENDING | Click test |
| Breadcrumb present | ⏳ PENDING | Visual inspection |
| Schema (Article) | ⏳ PENDING | Google Rich Results Test |
| Mobile layout | ⏳ PENDING | Responsive mode |
| No console errors | ⏳ PENDING | Browser dev tools |

### 2.3 ESG Reporting Hub (A3)

| Check | Status | Method |
|-------|--------|--------|
| Page loads | ⏳ PENDING | `curl -I https://terrnix.com/esg-reporting/` |
| All sections render | ⏳ PENDING | Visual inspection |
| FAQ schema | ⏳ PENDING | Google Rich Results Test |
| Internal links work | ⏳ PENDING | Click test |
| Assessment CTA | ⏳ PENDING | Click test |
| Metadata complete | ⏳ PENDING | View source |
| Canonical (non-www) | ⏳ PENDING | View source |
| Mobile layout | ⏳ PENDING | Responsive mode |
| No console errors | ⏳ PENDING | Browser dev tools |

---

## 3. SEO Verification

| Check | Target | Status |
|-------|--------|--------|
| All canonicals use `https://terrnix.com/` | 100% | ⏳ PENDING |
| No `www.` in any canonical | 100% | ⏳ PENDING |
| OG image URL valid | 200 OK | ⏳ PENDING |
| Twitter image URL valid | 200 OK | ⏳ PENDING |
| Title length 50-60 chars | All pages | ⏳ PENDING |
| Description length 150-160 chars | All pages | ⏳ PENDING |
| Schema validates | 0 errors | ⏳ PENDING |
| No broken internal links | 0 404s | ⏳ PENDING |
| Sitemap updated | Includes new URLs | ⏳ PENDING |

---

## 4. Accessibility Verification

| Check | A1 | A2 | A3 | Status |
|-------|----|----|----|--------|
| One H1 per page | ⏳ | ⏳ | ⏳ | PENDING |
| Logical heading hierarchy | ⏳ | ⏳ | ⏳ | PENDING |
| Skip link present | ⏳ | ⏳ | ✅ | PENDING |
| Aria labels on nav | ⏳ | ⏳ | ✅ | PENDING |
| Aria labels on breadcrumb | N/A | ⏳ | ✅ | PENDING |
| Semantic `<main>` | N/A | ⏳ | ✅ | PENDING |
| Descriptive link text | ⏳ | ⏳ | ⏳ | PENDING |
| Image alt text | ⏳ | N/A | N/A | PENDING |
| Lighthouse accessibility ≥90 | ⏳ | ⏳ | ⏳ | PENDING |

---

## 5. Cross-Page Consistency Verification

| Check | Status |
|-------|--------|
| Same nav labels across all pages | ⏳ PENDING |
| Same footer structure | ⏳ PENDING |
| Same CTA vocabulary | ⏳ PENDING |
| Same metadata structure | ⏳ PENDING |
| Same color scheme and fonts | ⏳ PENDING |
| Same container widths | ⏳ PENDING |

---

## 6. Remaining Issues (Post-Merge)

| Issue | Severity | PR | BACKLOG Ref |
|-------|----------|-----|-------------|
| A2 hero lacks eyebrow label | LOW | A2 | M-3 |
| A3 sentence length slightly high | LOW | A3 | M-6 |
| Footer structure varies (3-col vs 4-col) | LOW | All | M-2 |
| Schema types differ (Article vs WebPage) | LOW | A2/A3 | N-1 |
| A1 nav has extra links | LOW | A1 | N-2 |
| A1 missing semantic `<main>` | LOW | A1 | SPA architecture |

---

## 7. Verification Commands

Run these after GitHub Pages deployment completes (~2-5 minutes):

```bash
# Homepage
curl -s https://terrnix.com/ | grep -o '<title>.*</title>'
curl -s https://terrnix.com/ | grep -o 'rel="canonical" href="[^"]*"'
curl -s https://terrnix.com/ | grep -o 'property="og:image" content="[^"]*"'

# Carbon Accounting Hub
curl -s https://terrnix.com/carbon-accounting/ | grep -o '<title>.*</title>'
curl -s https://terrnix.com/carbon-accounting/ | grep -o 'rel="canonical" href="[^"]*"'

# ESG Reporting Hub
curl -s https://terrnix.com/esg-reporting/ | grep -o '<title>.*</title>'
curl -s https://terrnix.com/esg-reporting/ | grep -o 'rel="canonical" href="[^"]*"'
curl -s https://terrnix.com/esg-reporting/ | grep -o '"@type": "FAQPage"'

# OG Image
curl -I https://terrnix.com/assets/og-image.png

# Link check (install lynx or use online tool)
# lynx -dump https://terrnix.com/ | grep -o 'https://terrnix.com[^ ]*' | sort -u
```

---

## 8. Final Status

| PR | Status | Date |
|----|--------|------|
| A1 — Homepage SEO & Metadata | ⏳ MERGED — AWAITING VERIFICATION | 2026-07-21 |
| A2 — Carbon Accounting Hub | ⏳ MERGED — AWAITING VERIFICATION | 2026-07-21 |
| A3 — ESG Reporting Hub | ⏳ MERGED — AWAITING VERIFICATION | 2026-07-21 |

**Next Step:** Wait for GitHub Pages deployment, then run verification commands and update this document.

---

*Template created: 2026-07-21*  
*To be updated after production verification complete*
