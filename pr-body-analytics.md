# Analytics Foundation — Implementation Complete (Placeholders)

## Goal
Build the complete analytics infrastructure with placeholder IDs. Analytics remains DISABLED until real IDs are configured.

## What Changed

### 1. ANALYTICS_SETUP_GUIDE.md (NEW)
Step-by-step guide to obtain 4 required IDs:
- Google Search Console verification code (DNS TXT method)
- Google Analytics 4 Measurement ID (G-XXXXXXXXXX)
- Google Tag Manager Container ID (GTM-XXXXXXX)
- Microsoft Clarity Project ID

Includes screenshots guidance, troubleshooting, and support links.

### 2. assets/js/analytics.js (NEW)
Complete analytics implementation with:
- **Google Analytics 4** — Custom event tracking with 13 events
- **Google Tag Manager** — Loader for future tag management
- **Microsoft Clarity** — Heatmaps and session recordings
- **Scroll depth tracking** — 50% and 90% thresholds
- **Outbound link tracking** — All external clicks
- **Event deduplication** — Prevents double-counting
- **Debug mode** — Console logging for testing

**Status: DISABLED** (`enabled: false`)
**All IDs: PLACEHOLDERS**

### 3. ANALYTICS_EVENTS_SPEC.md (NEW)
Complete event specification:
- 13 events with triggers, parameters, and business purpose
- Data attributes reference (data-track, data-calculator-type, etc.)
- GA4 Custom Dimensions setup instructions
- Conversion events with assigned values

### 4. DEPLOYMENT_CHECKLIST_ANALYTICS.md (NEW)
9-phase deployment checklist:
1. Replace placeholders (5 min)
2. Include analytics script (2 min)
3. Update sitemap (3 min)
4. Deploy (5 min)
5. Verify GSC (5 min)
6. Verify GA4 (5 min)
7. Verify Clarity (5 min)
8. Final verification (2 min)
9. Post-deployment monitoring (ongoing)

### 5. analytics-dashboard/index.html (NEW)
Growth Dashboard template with sections:
- Analytics status (GA4, GSC, Clarity, GTM)
- Traffic overview (organic sessions, users, indexed pages, avg position)
- Conversions (calculator, quiz, PDF, contact)
- Top articles and search queries
- Traffic sources and countries
- Content performance table (Week 1 articles)
- Required actions panel

**Status: Static template — populates with real data after analytics activation**

### 6. sitemap.xml (UPDATED)
Added 3 new intelligence articles:
- GHG Protocol Scope 3 Revisions
- CBAM Definitive Phase
- SBTi Rules Update

Updated lastmod for sustainability-intelligence hub.

### 7. Pages updated with analytics script
- index.html
- sustainability-intelligence/index.html
- sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/index.html
- sustainability-intelligence/2026/06/cbam-definitive-phase-2026-compliance/index.html
- sustainability-intelligence/2026/06/sbti-rules-update-2026-2030-targets/index.html

## Events Implemented (13 total)

| # | Event | Trigger | Status |
|---|-------|---------|--------|
| 1 | article_view | Article page load | ✅ |
| 2 | calculator_start | Click calculator CTA | ✅ |
| 3 | calculator_complete | Calculator finished | ✅ |
| 4 | pdf_download | Click PDF link | ✅ |
| 5 | quiz_start | Click quiz CTA | ✅ |
| 6 | quiz_complete | Quiz finished | ✅ |
| 7 | quiz_lead_submit | Email captured | ✅ |
| 8 | contact_submit | Contact form submitted | ✅ |
| 9 | newsletter_signup | Newsletter form submitted | ✅ |
| 10 | consultation_cta_click | Click consultation button | ✅ |
| 11 | linkedin_click | Click social link | ✅ |
| 12 | scroll_depth_50 | Scroll past 50% | ✅ |
| 13 | scroll_depth_90 | Scroll past 90% | ✅ |

## Security Considerations

- Analytics script is self-hosted (no CDN dependency)
- CSP-compatible (no inline eval)
- Cookie flags: SameSite=None;Secure
- No PII collected in event parameters
- Email domains tracked, not full addresses

## Files Changed

| File | Status | Purpose |
|------|--------|---------|
| `ANALYTICS_SETUP_GUIDE.md` | NEW | How to obtain 4 required IDs |
| `ANALYTICS_EVENTS_SPEC.md` | NEW | 13 events specification |
| `DEPLOYMENT_CHECKLIST_ANALYTICS.md` | NEW | 9-phase deployment guide |
| `assets/js/analytics.js` | NEW | Complete analytics implementation |
| `analytics-dashboard/index.html` | NEW | Growth dashboard template |
| `sitemap.xml` | MODIFIED | +3 new article URLs |
| `index.html` | MODIFIED | +analytics script, GSC placeholder |
| `sustainability-intelligence/index.html` | MODIFIED | +analytics script |
| `sustainability-intelligence/2026/06/*/index.html` | MODIFIED (×3) | +analytics script |

## Next Steps (Requires Tallal)

1. Follow `ANALYTICS_SETUP_GUIDE.md` to obtain 4 IDs
2. Replace placeholders in `assets/js/analytics.js`
3. Set `enabled: true`
4. Deploy
5. Follow `DEPLOYMENT_CHECKLIST_ANALYTICS.md` to verify

## Risks

- **Low risk** — Analytics is disabled by default. No data collection until enabled.
- Placeholder IDs will log console messages but not send data.
- Dashboard is static template until real data sources connected.

## Rollback

- Disable analytics: Set `enabled: false` in `assets/js/analytics.js`
- Remove script tags from pages if needed
- Single commit revert available
