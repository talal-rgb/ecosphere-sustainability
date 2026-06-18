# Workflows to Add Manually

These workflow files must be added to `.github/workflows/` after the PR is merged.

## 1. weekly-kpi-update.yml

```yaml
name: Weekly KPI Dashboard Update

# DISABLED BY DEFAULT — Enable after configuring secrets:
#   GA_CREDENTIALS, GA_PROPERTY_ID, GSC_CREDENTIALS, GSC_SITE_URL
# To enable: Remove the 'if: false' line below after secrets are configured.

on:
  schedule:
    # Run every Monday at 8:00 AM UTC
    - cron: '0 8 * * 1'
  workflow_dispatch:
    inputs:
      week_ending:
        description: 'Week ending date (YYYY-MM-DD)'
        required: false
        type: string

jobs:
  kpi-update:
    # REMOVE THIS LINE TO ENABLE after secrets are configured
    if: false

    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Verify secrets configured
        id: check-secrets
        run: |
          MISSING=""
          if [ -z "${{ secrets.GA_CREDENTIALS }}" ]; then MISSING="$MISSING GA_CREDENTIALS"; fi
          if [ -z "${{ secrets.GA_PROPERTY_ID }}" ]; then MISSING="$MISSING GA_PROPERTY_ID"; fi
          if [ -z "${{ secrets.GSC_CREDENTIALS }}" ]; then MISSING="$MISSING GSC_CREDENTIALS"; fi
          if [ -z "${{ secrets.GSC_SITE_URL }}" ]; then MISSING="$MISSING GSC_SITE_URL"; fi

          if [ -n "$MISSING" ]; then
            echo "❌ Missing secrets:$MISSING"
            echo "configured=false" >> $GITHUB_OUTPUT
            exit 1
          else
            echo "✅ All secrets configured"
            echo "configured=true" >> $GITHUB_OUTPUT
          fi

      - name: Install dependencies
        if: steps.check-secrets.outputs.configured == 'true'
        run: |
          npm install googleapis @google-analytics/data

      - name: Fetch GA Data
        id: ga
        if: steps.check-secrets.outputs.configured == 'true'
        run: |
          node scripts/fetch-ga-data.js
        env:
          GA_CREDENTIALS: ${{ secrets.GA_CREDENTIALS }}
          GA_PROPERTY_ID: ${{ secrets.GA_PROPERTY_ID }}
        continue-on-error: true

      - name: Fetch GSC Data
        id: gsc
        if: steps.check-secrets.outputs.configured == 'true'
        run: |
          node scripts/fetch-gsc-data.js
        env:
          GSC_CREDENTIALS: ${{ secrets.GSC_CREDENTIALS }}
          GSC_SITE_URL: ${{ secrets.GSC_SITE_URL }}
        continue-on-error: true

      - name: Check for data files
        id: check-data
        run: |
          if [ -f ".ga-data.json" ] || [ -f ".gsc-data.json" ]; then
            echo "has_data=true" >> $GITHUB_OUTPUT
          else
            echo "⚠️ No data files found. Skipping dashboard update."
            echo "has_data=false" >> $GITHUB_OUTPUT
          fi

      - name: Update Dashboard
        if: steps.check-data.outputs.has_data == 'true'
        run: |
          node scripts/update-dashboard.js
        env:
          WEEK_ENDING: ${{ github.event.inputs.week_ending }}

      - name: Commit Updated Dashboard
        if: steps.check-data.outputs.has_data == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add TERRNIX_KPI_DASHBOARD.md
          git diff --staged --quiet || git commit -m "Update KPI dashboard for week ending $(date +%Y-%m-%d)"
          git push

      - name: Create Summary Issue
        if: steps.check-data.outputs.has_data == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const weekEnding = new Date().toISOString().split('T')[0];

            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `📊 Weekly KPI Update - Week Ending ${weekEnding}`,
              body: `## Weekly KPI Dashboard Updated\n\nPlease review the updated dashboard and add insights.\n\n### Quick Links:\n- [KPI Dashboard](TERRNIX_KPI_DASHBOARD.md)\n- [Content Performance](CONTENT_PERFORMANCE.md)\n\n### Action Items to Review:\n- [ ] Traffic trends\n- [ ] SEO performance\n- [ ] Product metrics\n- [ ] Business conversions\n- [ ] Content updates needed`,
              labels: ['kpi', 'weekly', 'dashboard']
            });
```

## 2. monthly-content-review.yml

```yaml
name: Monthly Content Review

on:
  schedule:
    # Run on the 1st of every month at 9:00 AM UTC
    - cron: '0 9 1 * *'
  workflow_dispatch:
    inputs:
      review_type:
        description: 'Review type'
        required: true
        default: 'full'
        type: choice
        options:
          - full
          - quick
          - sunset-check

jobs:
  content-review:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm install -g @google/searchconsole
          npm install googleapis
      
      - name: Run Content Scoring
        id: scoring
        run: |
          node scripts/content-review.js
        env:
          GSC_CREDENTIALS: ${{ secrets.GSC_CREDENTIALS }}
          GA_CREDENTIALS: ${{ secrets.GA_CREDENTIALS }}
        continue-on-error: true
      
      - name: Generate Report
        run: |
          echo "# Monthly Content Review - $(date +%Y-%m-%d)" > CONTENT_REVIEW_$(date +%Y-%m).md
          echo "" >> CONTENT_REVIEW_$(date +%Y-%m).md
          echo "## Summary" >> CONTENT_REVIEW_$(date +%Y-%m).md
          echo "- Total articles tracked: $(grep -c '^|' CONTENT_PERFORMANCE.md)" >> CONTENT_REVIEW_$(date +%Y-%m).md
          echo "- Reviews completed: $(date)" >> CONTENT_REVIEW_$(date +%Y-%m).md
      
      - name: Create Issue for Action Items
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const reportPath = `CONTENT_REVIEW_${new Date().toISOString().slice(0, 7)}.md`;
            
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `📊 Monthly Content Review - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
              body: `## Content Review Complete\n\nPlease review the attached report and assign action items.\n\n### Next Steps:\n- [ ] Review "Double Down" articles for expansion\n- [ ] Audit "At Risk" articles\n- [ ] Plan consolidations\n- [ ] Execute sunsets\n\nReport: ${reportPath}`,
              labels: ['content-review', 'monthly', 'seo']
            });
      
      - name: Commit Report
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add CONTENT_REVIEW_*.md
          git diff --staged --quiet || git commit -m "Add monthly content review report"
          git push
```

## Setup Instructions

1. After PR #27 is merged, create `.github/workflows/` directory if it doesn't exist
2. Copy the two workflow files above into that directory
3. Commit and push directly to main (these are workflow files, safe to add)
4. Configure GitHub secrets:
   - `GA_CREDENTIALS` - Google Analytics service account JSON
   - `GA_PROPERTY_ID` - GA4 property ID
   - `GSC_CREDENTIALS` - Search Console service account JSON
   - `GSC_SITE_URL` - `https://terrnix.com`
5. Remove `if: false` from weekly-kpi-update.yml to enable automation
