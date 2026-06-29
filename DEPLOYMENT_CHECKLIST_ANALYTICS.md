# Terrnix Analytics Deployment Checklist

**Version:** 1.0  
**Date:** 2026-06-29  
**Status:** Pre-deployment  
**Estimated Time:** 30 minutes

---

## Phase 1: Replace Placeholders (5 min)

### 1.1 Google Search Console Verification
- [ ] Obtain verification code from GSC (see ANALYTICS_SETUP_GUIDE.md)
- [ ] Open `index.html`
- [ ] Find: `<meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE">`
- [ ] Replace `YOUR_GOOGLE_VERIFICATION_CODE` with real code
- [ ] Verify the meta tag is inside `<head>`

### 1.2 Google Analytics 4
- [ ] Obtain Measurement ID from GA4 (format: `G-XXXXXXXXXX`)
- [ ] Open `assets/js/analytics.js`
- [ ] Find: `ga4Id: 'G-XXXXXXXXXX'`
- [ ] Replace with real Measurement ID

### 1.3 Google Tag Manager
- [ ] Obtain Container ID from GTM (format: `GTM-XXXXXXX`)
- [ ] Open `assets/js/analytics.js`
- [ ] Find: `gtmId: 'GTM-XXXXXXX'`
- [ ] Replace with real Container ID

### 1.4 Microsoft Clarity
- [ ] Obtain Project ID from Clarity
- [ ] Open `assets/js/analytics.js`
- [ ] Find: `clarityId: 'CLARITY_PROJECT_ID'`
- [ ] Replace with real Project ID

### 1.5 Enable Analytics
- [ ] In `assets/js/analytics.js`, find: `enabled: false`
- [ ] Change to: `enabled: true`
- [ ] Optional: Set `debug: true` for console logging during testing

---

## Phase 2: Include Analytics Script (2 min)

### 2.1 Add to index.html
- [ ] Open `index.html`
- [ ] Find the closing `</head>` tag
- [ ] Add before `</head>`:
  ```html
  <script src="/assets/js/analytics.js"></script>
  ```

### 2.2 Add to all intelligence articles
- [ ] Open each article HTML file
- [ ] Add the same script tag before `</head>`
- [ ] Articles to update:
  - `sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/index.html`
  - `sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/index.html`
  - `sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/index.html`

### 2.3 Add to hub pages
- [ ] `sustainability-intelligence/index.html`
- [ ] `carbon-accounting/index.html`
- [ ] `esg-reporting/index.html`
- [ ] `tools/index.html`
- [ ] `resources/index.html`
- [ ] `about/index.html`
- [ ] `contact/index.html`

---

## Phase 3: Update Sitemap (3 min)

### 3.1 Add New Articles
- [ ] Open `sitemap.xml`
- [ ] Add entries for all 3 new intelligence articles:
  ```xml
  <url>
    <loc>https://terrnix.com/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/</loc>
    <lastmod>2026-06-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://terrnix.com/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/</loc>
    <lastmod>2026-06-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://terrnix.com/sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/</loc>
    <lastmod>2026-06-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  ```

### 3.2 Update Lastmod Dates
- [ ] Update `<lastmod>` for `sustainability-intelligence/` to `2026-06-29`

---

## Phase 4: Deploy (5 min)

### 4.1 Commit Changes
```bash
git add -A
git commit -m "Analytics Foundation: GA4 + GTM + Clarity + GSC verification

- Replace all placeholder IDs with real values
- Enable analytics (enabled: true)
- Add analytics.js to all pages
- Update sitemap.xml with 3 new articles
- Ready for verification"
git push origin main
```

### 4.2 Verify Deployment
- [ ] Check GitHub Actions / Pages build status
- [ ] Confirm site loads without console errors
- [ ] Check that analytics.js is loaded in Network tab

---

## Phase 5: Verify Google Search Console (5 min)

### 5.1 Verify Domain Ownership
- [ ] Go to https://search.google.com/search-console
- [ ] Check that `terrnix.com` shows as verified
- [ ] If not verified, check DNS TXT record propagation (can take up to 48 hours)

### 5.2 Submit Sitemap
- [ ] In GSC, go to **Sitemaps**
- [ ] Enter: `sitemap.xml`
- [ ] Click **Submit**
- [ ] Wait for "Success" status (may take a few minutes)

### 5.3 Request Indexing for New Articles
- [ ] In GSC, go to **URL Inspection**
- [ ] Enter each new article URL:
  - `https://terrnix.com/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/`
  - `https://terrnix.com/sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/`
  - `https://terrnix.com/sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/`
- [ ] Click **Request Indexing** for each
- [ ] Wait for "URL is on Google" or "URL submitted"

### 5.4 Check Coverage
- [ ] Go to **Coverage** report
- [ ] Check for errors (404, soft 404, server errors)
- [ ] Check for excluded pages (noindex, redirect, etc.)
- [ ] Verify all 16 URLs are in "Valid" status

### 5.5 Check Enhancements
- [ ] Go to **Enhancements** → **Breadcrumbs**
- [ ] Go to **Enhancements** → **Sitelinks searchbox**
- [ ] Check for any structured data errors

---

## Phase 6: Verify Google Analytics 4 (5 min)

### 6.1 Realtime Report
- [ ] Go to https://analytics.google.com
- [ ] Open **Realtime** report
- [ ] Visit terrnix.com in an incognito window
- [ ] Check that your visit appears in Realtime within 30 seconds
- [ ] Verify page_location shows correct URL

### 6.2 Event Testing
- [ ] In Realtime → **Event count by event name**
- [ ] Navigate to an intelligence article
- [ ] Check for `article_view` event
- [ ] Scroll to 50% of page
- [ ] Check for `scroll_depth_50` event
- [ ] Click a calculator CTA
- [ ] Check for `calculator_start` event
- [ ] Click a consultation CTA
- [ ] Check for `consultation_cta_click` event

### 6.3 DebugView (Optional but Recommended)
- [ ] In GA4, go to **Configure** → **DebugView**
- [ ] Install GA Debugger Chrome extension
- [ ] Refresh page with extension active
- [ ] Verify all events fire with correct parameters

---

## Phase 7: Verify Microsoft Clarity (5 min)

### 7.1 Project Dashboard
- [ ] Go to https://clarity.microsoft.com
- [ ] Open Terrnix project
- [ ] Check **Dashboard** shows active sessions

### 7.2 Session Recordings
- [ ] Go to **Recordings**
- [ ] Wait 10-15 minutes after deployment
- [ ] Check that recordings appear
- [ ] Play a recording to verify data collection

### 7.3 Heatmaps
- [ ] Go to **Heatmaps**
- [ ] Select an intelligence article URL
- [ ] Check click heatmap shows data
- [ ] Check scroll heatmap shows scroll depth

---

## Phase 8: Final Verification (2 min)

### 8.1 Console Check
- [ ] Open browser DevTools → Console
- [ ] Visit terrnix.com
- [ ] Confirm no analytics-related errors
- [ ] If debug mode enabled, confirm `[Terrnix Analytics] ACTIVE` message

### 8.2 Network Check
- [ ] Open DevTools → Network
- [ ] Filter by `google` or `clarity`
- [ ] Confirm requests to:
  - `google-analytics.com/g/collect` (GA4)
  - `googletagmanager.com` (GTM)
  - `clarity.ms/tag/` (Clarity)

### 8.3 Cookie Check
- [ ] Open DevTools → Application → Cookies
- [ ] Confirm GA4 cookies (`_ga`, `_ga_XXXXXXXXXX`)
- [ ] Confirm Clarity cookies (`_clck`, `_clsk`)

---

## Phase 9: Post-Deployment (Ongoing)

### 9.1 Daily (First Week)
- [ ] Check GSC Coverage for new errors
- [ ] Check GA4 Realtime for active users
- [ ] Check Clarity for new recordings

### 9.2 Weekly
- [ ] Review GA4 Acquisition → Traffic acquisition
- [ ] Review GSC Performance → Search results
- [ ] Review Clarity Insights → Dead clicks, rage clicks
- [ ] Update KPI dashboard with latest data

### 9.3 Monthly
- [ ] Review article performance (views, scroll depth, CTR)
- [ ] Review conversion rates (calculator, quiz, contact)
- [ ] Identify underperforming content for updates
- [ ] Identify top-performing content for expansion

---

## Troubleshooting

### GA4 Not Receiving Data
- Check `CONFIG.enabled` is `true`
- Check Measurement ID is correct (G-XXXXXXXXXX)
- Check ad blockers are disabled
- Check browser console for errors
- Verify in GA4 DebugView

### GSC Not Verified
- Check DNS TXT record is correct
- Wait 24-48 hours for DNS propagation
- Try HTML file upload method as alternative
- Check GSC Settings → Ownership verification

### Clarity Not Recording
- Check Project ID is correct
- Check script loaded in Network tab
- Wait 15 minutes for first recording
- Check Clarity project settings

### Events Not Firing
- Check `data-track` attributes are present
- Check `window.terrnixTrack` is available in console
- Enable debug mode for console logging
- Verify in GA4 DebugView

---

## Sign-Off

| Check | Verified By | Date |
|-------|------------|------|
| Placeholders replaced | | |
| Analytics enabled | | |
| Sitemap updated | | |
| Deployed to production | | |
| GSC verified | | |
| Sitemap submitted | | |
| Articles indexed | | |
| GA4 receiving data | | |
| Clarity recording | | |
| All events firing | | |

**Analytics Foundation is complete when ALL checkboxes are checked.**

---

*Checklist created: 2026-06-29*  
*Next update: After deployment verification*
