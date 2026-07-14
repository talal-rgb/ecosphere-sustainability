# Terrnix Executive KPI Report
**Report Date:** 2026-07-14 (Week 28)  
**Data Period:** 2026-07-07 to 2026-07-14 (Last 7 Days)  
**Report Type:** Weekly KPI — Post-Verification Baseline  
**Prepared by:** Terrnix AI

---

## ✅ Operational Status

| System | Status | Notes |
|--------|--------|-------|
| Google Analytics 4 | 🟢 Operational | Data flowing, 4 users tracked this week |
| Google Search Console | 🟢 Operational | API authenticated, data fetching successfully |
| KPI Dashboard | 🟢 Populated with live data | Auto-updated via GitHub Actions |
| Weekly Automation | 🟢 Fully operational | Workflow enabled, commits successful |
| GSC API Diagnostic | 🟢 Verified | `sc-domain:terrnix.com` with `siteOwner` permission |

---

## 📊 TRAFFIC

| Metric | This Week | Target (Day 30) | Gap | Trend |
|--------|-----------|-----------------|-----|-------|
| **Users** | 4 | 500/week | -99.2% | 🆕 Baseline |
| **Sessions** | — | — | — | 🆕 Baseline |
| **Organic Users** | 0 | 300/week | -100% | 🆕 Baseline |
| **Returning Users** | — | — | — | 🆕 Baseline |

**Traffic Sources:**
| Source | Sessions | % of Total |
|--------|----------|------------|
| Direct | 3 | 75.0% |
| Organic Social | 1 | 25.0% |
| **Organic Search** | **0** | **0%** |

**Analysis:**
- Site is receiving minimal traffic (4 users/week)
- Zero organic search traffic detected
- All current traffic is direct or social
- This is expected for a newly launched/verified property

---

## 🔍 SEO

| Metric | This Week | Target (Day 30) | Gap | Trend |
|--------|-----------|-----------------|-----|-------|
| **Clicks** | 0 | 150/week | -100% | 🆕 Baseline |
| **Impressions** | 52 | 5,000/week | -99.0% | 🆕 Baseline |
| **CTR** | 0.00% | 3.0% | -3.0pp | 🆕 Baseline |
| **Average Position** | 7.3 | — | — | 🆕 Baseline |

**Top Queries:** No query-level data returned this period (0 keywords tracked with clicks)

**Top Landing Pages:** No landing page data available

**Analysis:**
- 52 impressions across the week = ~7 impressions/day
- Average position 7.3 suggests some rankings exist but not on page 1
- Zero clicks indicates poor visibility or low search volume for ranked terms
- Site is indexed but not yet competitive for target keywords

---

## 🛠️ PRODUCT

| Metric | This Week | Target (Day 30) | Gap | Trend |
|--------|-----------|-----------------|-----|-------|
| **Calculator Usage** | 0 runs | 30/week | -100% | 🆕 Baseline |
| **Contact Forms** | 0 submissions | 3/week | -100% | 🆕 Baseline |
| **Newsletter Signups** | 0 | — | — | 🆕 Baseline |
| **Quiz Completions** | 0 | — | — | 🆕 Baseline |
| **PDF Downloads** | 0 | 10/week | -100% | 🆕 Baseline |

**Analysis:**
- No product engagement events tracked this week
- Events may not be firing correctly OR traffic is too low to generate events
- Recommend verifying event tracking implementation

---

## 📝 CONTENT

| Article | Traffic | Conversions | State |
|---------|---------|-------------|-------|
| /carbon-accounting/ | — | — | 🆕 New |
| /carbon-accounting/scope-1-emissions/ | — | — | 🆕 New |
| /carbon-accounting/scope-2-emissions/ | — | — | 🆕 New |
| /carbon-accounting/scope-3-emissions/ | — | — | 🆕 New |
| /carbon-accounting/carbon-footprint-calculator/ | — | — | 🆕 New |
| /esg-reporting/ | — | — | 🆕 New |
| /esg-reporting/csrd-omnibus-guide/ | — | — | 🆕 New |
| /sustainability-intelligence/ | — | — | 🆕 New |
| /tools/ | — | — | 🆕 New |
| /resources/ | — | — | 🆕 New |

**Best Performing Articles:** None yet — insufficient data

**Lowest Performing Articles:** All articles — insufficient data

**Pages Not Yet Indexed:** Unable to determine from current data

---

## 🎯 90-Day Growth Plan Comparison

### Phase 1 Targets (Day 30: ~2026-07-18)

| Metric | Current | Day 30 Target | % to Target | Status |
|--------|---------|---------------|-------------|--------|
| Organic Sessions/Week | 0 | 300 | 0% | 🔴 Critical Gap |
| Total Users/Week | 4 | 500 | 0.8% | 🔴 Critical Gap |
| Impressions/Week | 52 | 5,000 | 1.0% | 🔴 Critical Gap |
| Clicks/Week | 0 | 150 | 0% | 🔴 Critical Gap |
| Calculator Runs/Week | 0 | 30 | 0% | 🔴 Critical Gap |
| Contact Forms/Week | 0 | 3 | 0% | 🔴 Critical Gap |
| Articles Published | 10 | 14 | 71% | 🟡 On Track |

**Assessment:**
- Traffic and engagement metrics are at baseline (near zero)
- This is expected for a site in early growth phase
- Content foundation is in place (10 articles published)
- The KPI pipeline is now verified and operational — this was the critical blocker

---

## 🔥 Top 5 Highest-ROI Actions (Next 2 Weeks)

### 1. Verify & Fix Event Tracking Implementation
**Effort:** Low (1 day)  
**Impact:** Critical — enables product metrics  
**ROI:** Infinite (no data = no optimization possible)

**Actions:**
- Verify GA4 event tags are firing for calculator_start, calculator_complete, contact_submit
- Test events in GA4 DebugView
- Add missing events if needed

**Why first:** Without event data, we cannot measure product engagement or conversion funnels.

---

### 2. Submit Sitemap & Request Indexing
**Effort:** Low (2-3 hours)  
**Impact:** High — unlocks organic traffic  
**ROI:** 10-20x

**Actions:**
- Submit updated sitemap.xml to Google Search Console
- Request indexing for all 10 hub/guide pages
- Verify mobile usability in GSC

**Why second:** Pages must be indexed before they can rank. Current impressions (52/week) suggest limited index coverage.

---

### 3. Optimize Title Tags & Meta Descriptions
**Effort:** Medium (2 days)  
**Impact:** High — improves CTR from search  
**ROI:** 5-10x

**Actions:**
- Audit all 10 articles for keyword-optimized titles
- Add compelling meta descriptions (150-160 chars)
- Include target keywords in H1 tags
- Focus on: carbon accounting, scope 3 emissions, carbon footprint calculator, esg reporting

**Why third:** With avg position 7.3, improving CTR could double traffic even without ranking improvements.

---

### 4. Publish High-Impact Content (1-2 Articles)
**Effort:** High (3-4 days)  
**Impact:** Very High — new ranking opportunities  
**ROI:** 8-15x (compounding)

**Priority Articles:**
| Article | Keyword | Score | Why Now |
|---------|---------|-------|---------|
| Carbon Footprint Calculator Guide | carbon footprint calculator | 91 | Highest score, direct tool tie-in |
| CSRD Reporting Checklist | csrd reporting checklist | 78 | Regulatory urgency in EU |

**Why fourth:** Content is the engine of organic growth. These two articles have the highest scores in the content plan.

---

### 5. Build Initial Backlinks (3-5 Links)
**Effort:** Medium (3-5 days)  
**Impact:** High — authority signal for rankings  
**ROI:** 5-10x (compounding over 60-90 days)

**Actions:**
- Submit calculator to 3-5 tool directories (e.g., Product Hunt, AlternativeTo)
- Share articles on LinkedIn sustainability groups
- Reach out to 5 sustainability blogs for guest post opportunities
- Respond to 3 HARO queries related to sustainability/carbon accounting

**Why fifth:** Backlinks are the primary ranking factor. Even a few quality links can significantly improve domain authority.

---

## 📋 Action Priority Matrix

| Priority | Action | Effort | Impact | Timeline | Owner |
|----------|--------|--------|--------|----------|-------|
| P0 | Fix event tracking | Low | Critical | This week | Tallal + Dev |
| P0 | Submit sitemap | Low | High | This week | Tallal |
| P1 | Optimize titles/meta | Medium | High | Week 2 | Terrnix AI |
| P1 | Publish 2 articles | High | Very High | Week 2 | Tallal |
| P2 | Build backlinks | Medium | High | Week 2-3 | Tallal |

---

## 🎯 Success Criteria (Next Check: 2026-07-28)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Organic impressions | 500+/week | GSC API |
| Organic clicks | 10+/week | GSC API |
| Total users | 50+/week | GA4 API |
| Calculator events firing | Yes | GA4 DebugView |
| Articles published | 12 (2 new) | Content registry |
| Sitemap submitted | Yes | GSC manual check |

---

## 🔄 Automation Status

| Workflow | Status | Schedule | Last Run |
|----------|--------|----------|----------|
| Weekly KPI Dashboard Update | 🟢 Enabled | Mondays 8 AM UTC | 2026-07-14 |
| GSC API Diagnostic | 🟢 Available | Manual | 2026-07-14 |
| GA Auth Test | 🟢 Available | Manual | — |

**Next Scheduled Run:** Monday, 2026-07-21 at 08:00 UTC

---

*Report generated: 2026-07-14 14:55 CET*  
*Data sources: Google Analytics 4, Google Search Console API*  
*Dashboard: [TERRNIX_KPI_DASHBOARD.md](TERRNIX_KPI_DASHBOARD.md)*
