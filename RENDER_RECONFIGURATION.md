# Render Reconfiguration Guide

**Date:** 2026-06-19  
**Purpose:** Connect Render to `ecosphere-sustainability/backend` as single source of truth

---

## Current State

- **Render service:** `terrnix-backend` on render.com
- **Current source:** Manual folder `/data/terrnix-pack/website-api/` (NOT Git-tracked)
- **New source:** `talal-rgb/ecosphere-sustainability` repository, `backend/` folder

---

## Step-by-Step Reconfiguration

### 1. Go to Render Dashboard

https://dashboard.render.com/

### 2. Select Your Service

Find and click: `terrnix-backend`

### 3. Navigate to Settings

Click: **Settings** tab

### 4. Update Build & Deploy Settings

| Setting | Current Value | New Value |
|---------|--------------|-----------|
| **Root Directory** | (likely empty or `/`) | `backend` |
| **Build Command** | (existing) | `npm install` |
| **Start Command** | (existing) | `npm start` |

**How to set Root Directory:**
1. In Settings, find **Root Directory**
2. Enter: `backend`
3. Click **Save Changes**

### 5. Connect GitHub Repository (if not already connected)

1. In Settings, find **Git Repository**
2. If not connected, click **Connect** and select:
   - **Account:** `talal-rgb`
   - **Repository:** `ecosphere-sustainability`
3. **Branch:** `main`
4. Click **Connect**

### 6. Add Environment Variables

In Settings → **Environment**, add ALL of the following:

#### Required for PR #30 features:
```
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587
ZOHO_SMTP_USER=notifications@terrnix.com
ZOHO_SMTP_PASS=YOUR_APP_PASSWORD_HERE
CONTACT_TO_EMAIL=tallal@terrnix.com
BREVO_API_KEY=YOUR_BREVO_API_KEY_HERE
BREVO_LIST_ID=4
ADMIN_API_TOKEN=GENERATE_STRONG_RANDOM_TOKEN
LEADS_FILE_PATH=./data/leads.jsonl
LEADS_MAX_SIZE_MB=10
```

#### Required for live backend features:
```
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=https://terrnix.com
TERRNIX_SITE_URL=https://terrnix.com
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
OPENAI_MODEL=gpt-5.4-mini
CLIMATIQ_API_KEY=YOUR_CLIMATIQ_KEY_OR_LEAVE_BLANK
ELECTRICITYMAPS_API_KEY=YOUR_EMAPS_KEY_OR_LEAVE_BLANK
REPORT_BRAND_NAME=Terrnix Sustainability Intelligence
REPORT_CONTACT_EMAIL=info@terrnix.com
```

### 7. Deploy

1. Go to the **Deploy** tab
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for build to complete (2-3 minutes)

### 8. Verify Deployment

Test these endpoints:

```bash
# Health check
curl https://terrnix-backend.onrender.com/health

# Integration health (PR #30)
curl https://terrnix-backend.onrender.com/api/health/integrations

# Factor status (live backend)
curl https://terrnix-backend.onrender.com/api/factors/status
```

Expected responses:
- `/health` → `{"ok":true,"service":"terrnix-website-api",...}`
- `/api/health/integrations` → `{"success":true,"status":"degraded",...}`
- `/api/factors/status` → `{"ok":true,"metadata":{...}}`

### 9. Test Contact Form (after env vars are set)

```bash
curl -X POST https://terrnix-backend.onrender.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","company":"TestCo","discipline":"Other / General Inquiry","message":"This is a test message for verification.","hp_field":""}'
```

Expected: `{"success":true,"message":"Thank you for your message..."}`

### 10. Test Newsletter (after env vars are set)

```bash
curl -X POST https://terrnix-backend.onrender.com/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test-newsletter@example.com","hp_field":""}'
```

Expected: `{"success":true,"message":"Thank you for subscribing!..."}`

### 11. Test Admin Endpoint

```bash
curl https://terrnix-backend.onrender.com/api/admin/lead-stats \
  -H "X-Admin-Token: YOUR_ADMIN_API_TOKEN"
```

Expected: `{"success":true,"stats":{"totalLeads":2,...}}`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Render logs; ensure `backend/package.json` exists |
| 404 on all endpoints | Verify **Root Directory** is set to `backend` |
| CORS errors | Check `ALLOWED_ORIGIN` env var matches frontend URL |
| Email not sending | Verify `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS` |
| Brevo not syncing | Verify `BREVO_API_KEY` |
| Lead storage fails | Check disk permissions; `data/` folder auto-created |

---

## Post-Reconfiguration Checklist

- [ ] Render deploy succeeds
- [ ] `/health` returns 200
- [ ] `/api/health/integrations` returns 200
- [ ] `/api/factors/status` returns 200
- [ ] `/api/chat` works (test via frontend)
- [ ] `/api/carbon/calculate` works
- [ ] `/api/contact` saves lead + sends email
- [ ] `/api/subscribe` saves lead + syncs to Brevo
- [ ] `/api/admin/lead-stats` works with token
- [ ] Zoho email received
- [ ] Brevo contact appears
- [ ] Lead file has entries

---

## Future Deployments

After this reconfiguration, every push to `main` branch will auto-deploy.

To disable auto-deploy:
1. Render Dashboard → Service → Settings
2. Toggle **Auto-Deploy** to OFF
3. Use Manual Deploy when ready
