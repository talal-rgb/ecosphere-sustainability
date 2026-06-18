# Setup KPI Secrets Guide

**Objective:** Move KPI Dashboard from MERGED → VERIFIED  
**Status:** MERGED (commit e711175)  
**Next:** VERIFIED (requires secrets + manual run)

**⚠️ CRITICAL: Do NOT enable scheduled automation until manual run succeeds.**

---

## Prerequisites

- [ ] Access to Google Cloud Console (console.cloud.google.com)
- [ ] Access to Google Analytics 4 property
- [ ] Access to Google Search Console property
- [ ] Admin access to GitHub repository settings
- [ ] PR #27 merged to main (commit e711175)

---

## Step 1: Create Google Cloud Service Account

### 1.1 Go to Google Cloud Console
1. Open https://console.cloud.google.com
2. Select your project (or create one for Terrnix)
3. Navigate to **IAM & Admin** → **Service Accounts**

### 1.2 Create Service Account
1. Click **+ CREATE SERVICE ACCOUNT**
2. **Service account name:** `terrnix-kpi-dashboard`
3. **Service account ID:** `terrnix-kpi-dashboard` (auto-filled)
4. **Description:** "Service account for Terrnix KPI Dashboard automation"
5. Click **CREATE AND CONTINUE**

### 1.3 Grant Roles
Skip this step for now (we'll grant specific API access later)
1. Click **CONTINUE**
2. Click **DONE**

### 1.4 Create Key
1. Find `terrnix-kpi-dashboard` in the list
2. Click on it → **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. **Save the downloaded JSON file securely** — this is your `GA_CREDENTIALS` and `GSC_CREDENTIALS`

### 1.5 Extract Service Account Email
Open the JSON file and note the `client_email` field. It looks like:
```
terrnix-kpi-dashboard@your-project.iam.gserviceaccount.com
```

---

## Step 2: Grant GA4 Access

### 2.1 Get GA4 Property ID
1. Go to https://analytics.google.com
2. Select your Terrnix property
3. Click the gear icon (Admin) at bottom left
4. Click **Property Settings**
5. Note the **Property ID** (e.g., `123456789`)
6. This is your `GA_PROPERTY_ID`

### 2.2 Add Service Account to GA4
1. In GA4 Admin, click **Property Access Management**
2. Click **+** → **Add users**
3. Enter the service account email from Step 1.5
4. Role: **Viewer** (minimum required)
5. Click **Add**

### 2.3 Verify Access
1. Go to https://ga-dev-tools.google/ga4/query-explorer/
2. Sign in with the service account (or test via API)
3. Select your property
4. Run a test query — should return data

---

## Step 3: Grant Search Console Access

### 3.1 Add Service Account to GSC
1. Go to https://search.google.com/search-console
2. Select your terrnix.com property
3. Click **Settings** (gear icon)
4. Click **Users and permissions**
5. Click **ADD USER**
6. Enter the service account email from Step 1.5
7. Permission: **Full** (required for API access)
8. Click **ADD**

### 3.2 Verify Site URL
Confirm your site URL in Search Console:
- Domain property: `sc-domain:terrnix.com`
- URL-prefix property: `https://terrnix.com`

Note which format you use — this is your `GSC_SITE_URL`

### 3.3 Verify API Access
Test via API Explorer or wait for workflow run to confirm.

---

## Step 4: Create GitHub Secrets

### 4.1 Navigate to Repository Settings
1. Go to https://github.com/talal-rgb/ecosphere-sustainability
2. Click **Settings** tab
3. In left sidebar, click **Secrets and variables** → **Actions**

### 4.2 Add GA_CREDENTIALS
1. Click **New repository secret**
2. **Name:** `GA_CREDENTIALS`
3. **Value:** Paste the ENTIRE contents of the JSON key file from Step 1.4
4. Click **Add secret**

### 4.3 Add GA_PROPERTY_ID
1. Click **New repository secret**
2. **Name:** `GA_PROPERTY_ID`
3. **Value:** Your GA4 Property ID from Step 2.1 (e.g., `123456789`)
4. Click **Add secret**

### 4.4 Add GSC_CREDENTIALS
1. Click **New repository secret**
2. **Name:** `GSC_CREDENTIALS`
3. **Value:** Paste the ENTIRE contents of the SAME JSON key file (same as GA_CREDENTIALS)
4. Click **Add secret**

### 4.5 Add GSC_SITE_URL
1. Click **New repository secret**
2. **Name:** `GSC_SITE_URL`
3. **Value:** `https://terrnix.com` (or your exact Search Console property URL)
4. Click **Add secret**

### 4.6 Verify Secrets
Your secrets list should show:
- ✅ `GA_CREDENTIALS`
- ✅ `GA_PROPERTY_ID`
- ✅ `GSC_CREDENTIALS`
- ✅ `GSC_SITE_URL`

---

## Step 5: Move Workflow to .github/workflows/

### 5.1 Create Workflow File
1. In your local repo (main branch):
```bash
git checkout main
git pull
```

2. Create the workflow directory if needed:
```bash
mkdir -p .github/workflows
```

3. Create `.github/workflows/weekly-kpi-update.yml` with the content from `WORKFLOWS_TO_ADD.md`

### 5.2 Keep if: false (DO NOT REMOVE YET)
The workflow MUST have this line:
```yaml
jobs:
  kpi-update:
    if: false  # ← KEEP THIS for now
```

This ensures scheduled runs are disabled until we verify manually.

### 5.3 Commit
```bash
git add .github/workflows/weekly-kpi-update.yml
git commit -m "chore: Add KPI workflow (disabled until verified)"
git push
```

---

## Step 6: Manual Verification Run

### 6.1 Trigger workflow_dispatch
1. Go to https://github.com/talal-rgb/ecosphere-sustainability/actions
2. Find **Weekly KPI Dashboard Update**
3. Click **Run workflow**
4. Leave inputs empty (optional: specify week_ending date)
5. Click **Run workflow**

### 6.2 Monitor Run
1. Click into the running workflow
2. Check each step:
   - ✅ Checkout repository
   - ✅ Setup Node.js
   - ✅ Verify secrets configured (should pass)
   - ✅ Install dependencies
   - ✅ Fetch GA Data (should show data)
   - ✅ Fetch GSC Data (should show data)
   - ✅ Check for data files (should pass)
   - ✅ Update Dashboard
   - ✅ Commit Updated Dashboard
   - ✅ Create Summary Issue

### 6.3 Expected Output
```
📊 Fetching GA data: 2026-06-11 to 2026-06-18
✅ GA data fetched successfully
   Organic Sessions: [number]
   Total Users: [number]
   Calculator Runs: [number]

🔍 Fetching GSC data: 2026-06-11 to 2026-06-18
✅ GSC data fetched successfully
   Impressions: [number]
   Clicks: [number]
   CTR: [number]%
   Avg Position: [number]
   Keywords tracked: 20

📝 Updating KPI Dashboard...
✅ Dashboard updated successfully
```

---

## Step 7: Verify Results

### 7.1 Check Dashboard Updated
1. Go to https://github.com/talal-rgb/ecosphere-sustainability/blob/main/TERRNIX_KPI_DASHBOARD.md
2. Verify:
   - [ ] **Last Updated** shows today's date
   - [ ] **Traffic** section has numbers (not "-")
   - [ ] **SEO** section has numbers
   - [ ] **Product** section has numbers
   - [ ] **Data Quality** section shows grade

### 7.2 Check No Secrets Leaked
1. Review the commit that updated the dashboard
2. Verify NO credential data appears in the diff
3. Verify ONLY markdown tables were updated

### 7.3 Check GitHub Issue Created
1. Go to https://github.com/talal-rgb/ecosphere-sustainability/issues
2. Find new issue: "📊 Weekly KPI Update - Week Ending [date]"
3. Verify:
   - [ ] Issue created automatically
   - [ ] Links to dashboard and content performance
   - [ ] Has action item checklist
   - [ ] Has `kpi`, `weekly`, `dashboard` labels

### 7.4 Check Data Quality Score
1. In the dashboard, find **Data Quality Score** section
2. Verify:
   - [ ] Overall Score is calculated
   - [ ] Grade is shown (A, B, C, D, or F)
   - [ ] Articles with Issues count shown
   - [ ] No "Data Quality Issue" state articles (or flagged if real issues)

---

## Step 8: Enable Scheduled Automation (ONLY AFTER MANUAL SUCCESS)

### 8.1 Remove if: false
Edit `.github/workflows/weekly-kpi-update.yml`:
```yaml
jobs:
  kpi-update:
    # REMOVE THIS LINE: if: false
    runs-on: ubuntu-latest
```

### 8.2 Commit
```bash
git add .github/workflows/weekly-kpi-update.yml
git commit -m "feat: Enable weekly KPI dashboard automation"
git push
```

### 8.3 Verify Schedule
1. Go to https://github.com/talal-rgb/ecosphere-sustainability/actions
2. Click **Weekly KPI Dashboard Update**
3. Verify **Scheduled** shows: `0 8 * * 1` (Monday 8 AM UTC)

---

## Troubleshooting

### GA Data Fetch Fails
| Symptom | Cause | Fix |
|---------|-------|-----|
| `UNAUTHENTICATED` | Service account not added to GA4 | Step 2.2 |
| `Permission denied` | Wrong role (needs Viewer+) | Step 2.2 |
| `Property not found` | Wrong Property ID | Step 2.1 |

### GSC Data Fetch Fails
| Symptom | Cause | Fix |
|---------|-------|-----|
| `403 Forbidden` | Service account not added to GSC | Step 3.1 |
| `Site not found` | Wrong GSC_SITE_URL format | Step 3.2 |
| `Insufficient permissions` | Role is "Restricted" not "Full" | Step 3.1 |

### Dashboard Not Updating
| Symptom | Cause | Fix |
|---------|-------|-----|
| No commit | No data files created | Check GA/GSC fetch steps |
| Empty values | APIs returned zero data | Normal for new sites |
| Issue not created | Workflow failed before issue step | Check logs |

---

## Security Checklist

- [ ] Service account has MINIMUM required permissions (Viewer for GA, Full for GSC)
- [ ] JSON key file stored ONLY in GitHub secrets (never committed)
- [ ] No credentials in workflow logs (GitHub auto-redacts secrets)
- [ ] Temp credential files deleted after use (scripts handle this)
- [ ] Service account email not sensitive (safe to share)

---

## Verification Summary

| Step | Task | Status |
|------|------|--------|
| 1 | Google Cloud service account created | ⬜ |
| 2 | GA4 access granted | ⬜ |
| 3 | GSC access granted | ⬜ |
| 4 | GitHub secrets created (4 total) | ⬜ |
| 5 | Workflow added to .github/workflows/ | ⬜ |
| 6 | Manual workflow_dispatch run | ⬜ |
| 7 | Dashboard updated correctly | ⬜ |
| 7 | No secrets leaked | ⬜ |
| 7 | GitHub issue created | ⬜ |
| 7 | Data Quality Score calculated | ⬜ |
| 8 | Scheduled automation enabled | ⬜ |

**When all steps complete: Update status to VERIFIED**

---

*Guide created: 2026-06-18*  
*Target: VERIFIED status after manual run succeeds*
