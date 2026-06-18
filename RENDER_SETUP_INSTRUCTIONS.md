# Terrnix Backend — Render/VPS Setup Instructions

**Date:** 2026-06-18
**Applies to:** Render.com Web Service or any VPS with Node.js

---

## Quick Start

### 1. Deploy Backend to Render

If not already deployed:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: `talal-rgb/ecosphere-sustainability`
4. Configure:
   - **Name:** `terrnix-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Runtime:** Node

### 2. Add Environment Variables

In Render dashboard → Your Service → **Environment** → **Add Environment Variable**

| Variable | Value | How to Get |
|----------|-------|------------|
| `ZOHO_SMTP_HOST` | `smtp.zoho.com` | Zoho Mail settings |
| `ZOHO_SMTP_PORT` | `587` | Zoho Mail settings |
| `ZOHO_SMTP_USER` | `notifications@terrnix.com` | Your Zoho email |
| `ZOHO_SMTP_PASS` | *(app password)* | Zoho → Security → App Passwords |
| `CONTACT_TO_EMAIL` | `tallal@terrnix.com` | Where you want notifications |
| `BREVO_API_KEY` | *(API key)* | Brevo Dashboard → SMTP & API → API Keys |
| `BREVO_LIST_ID` | `4` | Brevo Dashboard → Contacts → Lists |
| `NODE_ENV` | `production` | Set manually |

**⚠️ CRITICAL:** Never commit these values to git. Use Render's environment variable UI only.

---

## Zoho Mail Setup (Step by Step)

### Step 1: Create App-Specific Password

1. Log in to [mail.zoho.com](https://mail.zoho.com)
2. Click your profile → **My Account**
3. Go to **Security** → **App-Specific Passwords**
4. Click **Generate**
5. App Name: `Terrnix Backend`
6. Copy the generated password
7. Paste into Render's `ZOHO_SMTP_PASS` environment variable

### Step 2: Verify SMTP Access

Your Zoho account must have SMTP enabled (enabled by default on paid plans; may need activation on free plans).

---

## Brevo Setup (Step by Step)

### Step 1: Create Account

1. Go to [brevo.com](https://www.brevo.com)
2. Sign up with your Terrnix email
3. Verify your account

### Step 2: Get API Key

1. Dashboard → **SMTP & API** → **API Keys**
2. Click **Create a new API key**
3. Name: `Terrnix Website`
4. Copy the key
5. Paste into Render's `BREVO_API_KEY`

### Step 3: Create Contact List

1. Dashboard → **Contacts** → **Lists**
2. Click **Add a new list**
3. Name: `Terrnix Newsletter`
4. Note the List ID (usually a small number like `4` or `5`)
5. Paste into Render's `BREVO_LIST_ID`

### Step 4: Enable Double Opt-In (Recommended)

1. Dashboard → **Contacts** → **Settings** → **Subscription**
2. Enable **Double opt-in confirmation**
3. Customize confirmation email
4. Set redirect URL: `https://terrnix.com/`

---

## Verification

After deploying with environment variables:

### Test Contact Form

1. Go to `https://terrnix.com/contact/`
2. Fill and submit the form
3. Check your `CONTACT_TO_EMAIL` inbox
4. You should receive an email within 30 seconds

### Test Newsletter Signup

1. Go to `https://terrnix.com/`
2. Enter email in newsletter form
3. Check Brevo Dashboard → Contacts
4. Contact should appear in your list
5. Check your `CONTACT_TO_EMAIL` inbox for notification

### Test Rate Limiting

Submit contact form 4+ times quickly → should get "Too many requests" error.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| No emails received | SMTP credentials wrong | Check ZOHO_SMTP_USER and ZOHO_SMTP_PASS |
| "SMTP not configured" in logs | Environment vars missing | Add all vars in Render dashboard |
| Brevo contacts not added | BREVO_API_KEY wrong | Regenerate key in Brevo dashboard |
| CORS errors | Origin not allowed | Check `terrnix.com` is in CORS whitelist |
| "Too many requests" | Rate limit hit | Wait 1 hour for contact limit reset |

---

## Local Development

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

**Never commit `.env`:**
```bash
echo ".env" >> .gitignore
```

---

*Setup complete. Forms will now send emails and sync to Brevo.*
