# Terrnix Analytics Setup Guide

**Version:** 1.0  
**Date:** 2026-06-29  
**Status:** Required before analytics deployment  
**Estimated Time:** 45 minutes

---

## Overview

This guide explains how to obtain the four account IDs required to activate Terrnix analytics:

1. Google Search Console verification code
2. Google Analytics 4 Measurement ID
3. Google Tag Manager Container ID
4. Microsoft Clarity Project ID

All four services are free. You need a Google account for items 1–3 and a Microsoft account for item 4.

---

## 1. Google Search Console Verification Code

**Purpose:** Prove domain ownership to Google. Required for search performance data, indexing requests, and Core Web Vitals monitoring.

### Step-by-Step

1. Go to https://search.google.com/search-console
2. Click **"Start now"** and sign in with your Google account
3. In the welcome screen, select **"Domain"** (not URL prefix)
4. Enter: `terrnix.com`
5. Click **"Continue"**
6. Google will show a DNS TXT record to add:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
7. **Copy the verification string** (the part after `google-site-verification=`)
8. Add the TXT record to your DNS provider (Cloudflare, Namecheap, etc.):
   - Type: TXT
   - Name: @ (or leave blank)
   - Value: `google-site-verification=XXXXXXXX...`
   - TTL: Auto or 3600
9. Return to Search Console and click **"Verify"**
10. Once verified, go to **Settings → Ownership verification**
11. Copy the **meta tag verification code** (the long string inside `content="..."`)

### Where to Use It

Replace `YOUR_GOOGLE_VERIFICATION_CODE` in `index.html`:

```html
<meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE">
```

---

## 2. Google Analytics 4 Measurement ID

**Purpose:** Track website traffic, user behavior, conversions, and custom events.

### Step-by-Step

1. Go to https://analytics.google.com
2. Click **"Start measuring"** and sign in with your Google account
3. **Account setup:**
   - Account name: `Terrnix`
   - Check all data sharing settings (recommended)
   - Click **"Next"**
4. **Property setup:**
   - Property name: `Terrnix Website`
   - Reporting time zone: `Europe/Paris`
   - Currency: `Euro (EUR)`
   - Click **"Next"**
5. **Business details:**
   - Industry category: `Business and Industrial Markets`
   - Business size: Select appropriate size
   - Click **"Next"**
6. **Business objectives:**
   - Select: `Generate leads`, `Examine user behavior`, `Get baseline reports`
   - Click **"Create"**
7. Accept the Terms of Service
8. **Data collection:**
   - Select **"Web"**
   - Website URL: `https://terrnix.com`
   - Stream name: `Terrnix Web Stream`
   - Click **"Create stream"**
9. On the next screen, find your **Measurement ID**:
   ```
   Measurement ID: G-XXXXXXXXXX
   ```
10. **Copy this ID** (format: `G-` followed by 10 characters)

### Where to Use It

Replace `G-XXXXXXXXXX` in the GA4 config:

```javascript
gtag('config', 'G-XXXXXXXXXX');
```

---

## 3. Google Tag Manager Container ID

**Purpose:** Manage all tracking tags (GA4, Clarity, future pixels) without editing code.

### Step-by-Step

1. Go to https://tagmanager.google.com
2. Sign in with your Google account
3. Click **"Create Account"**
4. **Account setup:**
   - Account name: `Terrnix`
   - Country: `France`
   - Check "Share data anonymously with Google"
5. **Container setup:**
   - Container name: `Terrnix Website`
   - Target platform: **"Web"**
6. Click **"Create"**
7. Accept the Terms of Service
8. You will see a popup with two code snippets. **Ignore them for now** — we use a different installation method.
9. In the top-right corner, find your **Container ID**:
   ```
   GTM-XXXXXXX
   ```
10. **Copy this ID** (format: `GTM-` followed by 7 characters)

### Where to Use It

Replace `GTM-XXXXXXX` in the GTM loader:

```javascript
window.gtmId = 'GTM-XXXXXXX';
```

### Note on GTM vs Direct Installation

This implementation uses **direct tag installation** (not GTM container snippets) for faster loading and simpler CSP compliance. GTM is used as a configuration layer — you can enable GTM-managed tags later by uncommenting the GTM loader in `assets/js/analytics.js`.

---

## 4. Microsoft Clarity Project ID

**Purpose:** Heatmaps, session recordings, and scroll tracking to understand user behavior.

### Step-by-Step

1. Go to https://clarity.microsoft.com
2. Sign in with your Microsoft account (or create one)
3. Click **"New Project"**
4. **Project setup:**
   - Project name: `Terrnix`
   - Website URL: `https://terrnix.com`
   - Category: `Technology`
5. Click **"Create"**
6. On the project dashboard, go to **Settings → Setup**
7. Find your **Project ID**:
   ```
   (function(c,l,a,r,i,t,y){
       c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
       t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
       y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
   })(window, document, "clarity", "script", "CLARITY_PROJECT_ID");
   ```
8. **Copy the Project ID** (the value where `CLARITY_PROJECT_ID` appears — usually a string like `abcdefghij`)

### Where to Use It

Replace `CLARITY_PROJECT_ID` in the Clarity loader:

```javascript
clarity("init", "CLARITY_PROJECT_ID");
```

---

## Summary Checklist

| Service | ID Format | Example | Status |
|---------|-----------|---------|--------|
| Google Search Console | Alphanumeric string | `abc123def456ghi789jkl012mno345pqr678stu` | ☐ |
| Google Analytics 4 | `G-XXXXXXXXXX` | `G-A1B2C3D4E5` | ☐ |
| Google Tag Manager | `GTM-XXXXXXX` | `GTM-ABC1234` | ☐ |
| Microsoft Clarity | Alphanumeric string | `abcdefghij` | ☐ |

---

## Next Steps After Obtaining IDs

1. Replace all placeholders in:
   - `index.html` (GSC verification)
   - `assets/js/analytics.js` (GA4, GTM, Clarity)
2. Set `window.analyticsEnabled = true` in `assets/js/analytics.js`
3. Deploy to production
4. Follow `DEPLOYMENT_CHECKLIST_ANALYTICS.md`

---

## Support

- Google Search Console Help: https://support.google.com/webmasters
- GA4 Setup Help: https://support.google.com/analytics/topic/9303319
- GTM Help: https://support.google.com/tagmanager
- Clarity Help: https://docs.microsoft.com/en-us/clarity

---

*Guide created: 2026-06-29*  
*Next update: After analytics deployment verification*
