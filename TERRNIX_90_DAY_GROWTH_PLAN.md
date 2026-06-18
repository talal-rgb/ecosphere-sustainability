# Terrnix 90-Day Growth Plan

**Version:** 1.0  
**Date:** 2026-06-18  
**Status:** Approved  
**Review Cycle:** Weekly KPI Dashboard + Monthly Content Review

---

## Executive Summary

**Starting Point (June 2026):**
- Site architecture: Hub-and-spoke (Carbon Accounting, ESG Reporting, Tools, Resources)
- Content: 10 articles published, scored, tracked
- Calculator: Carbon footprint calculator live
- PDF Reporting: v3 merged, 9 pages verified
- KPI Dashboard: Merged, awaiting secrets verification
- Content Learning System: Merged, scoring engine live
- Security: Phase 2 deployed (SRI, rate limiting, encryption)

**90-Day Goal:** Become a top-10 ranked sustainability intelligence platform with measurable lead generation.

---

## Phase 1: Foundation (Days 1-30) — July 2026

### Theme: Verify, Optimize, Publish

**Objective:** Establish reliable data pipeline, optimize existing content, publish high-impact guides.

---

### Traffic Targets

| Metric | Current | Day 30 Target | Growth |
|--------|---------|---------------|--------|
| Organic Sessions/Week | ~50-100 | 300 | 3-6x |
| Total Users/Week | ~100-200 | 500 | 2.5-5x |
| Returning User Rate | ~15% | 25% | +10pp |
| Impressions/Week | ~1,000 | 5,000 | 5x |
| Clicks/Week | ~20-40 | 150 | 3.75x |

### Ranking Targets

| Keyword | Current Position | Day 30 Target |
|---------|-----------------|---------------|
| carbon accounting | Not ranked | Page 3-4 (pos 25-40) |
| scope 3 emissions | Not ranked | Page 2-3 (pos 15-30) |
| carbon footprint calculator | Not ranked | Page 2-3 (pos 15-30) |
| esg reporting | Not ranked | Page 3-4 (pos 25-40) |
| csrd omnibus | Not ranked | Page 1-2 (pos 5-20) |

### Lead Targets

| Metric | Current | Day 30 Target |
|--------|---------|---------------|
| Calculator Runs/Week | ~5-10 | 30 |
| PDF Downloads/Week | ~0-2 | 10 |
| Contact Forms/Week | ~0-1 | 3 |
| Qualified Leads/Week | ~0 | 2 |
| Conversion Rate | ~0.5% | 1.5% |

### Content Targets

| Metric | Current | Day 30 Target |
|--------|---------|---------------|
| Articles Published | 10 | 14 (+4) |
| Articles in "Double Down" | 0 | 2 |
| Content Score Average | N/A | 55+ |
| Data Quality Grade A/B | 0% | 50% |

### Product Targets

| Metric | Current | Day 30 Target |
|--------|---------|---------------|
| Calculator Completion Rate | ~40% | 55% |
| PDF Report Generation | Working | Optimized |
| Quiz Completion Rate | N/A | 40% |
| Mobile UX Score | ~70 | 85 |

---

### Phase 1 Initiatives

#### Initiative 1.1: Verify KPI Dashboard (Week 1)
**Effort:** Low (1-2 days)  
**Impact:** Critical — enables all data-driven decisions  
**ROI:** Infinite (without data, we're flying blind)  
**Dependencies:** Tallal completes SETUP_KPI_SECRETS_GUIDE.md

**Actions:**
- [ ] Configure GA4 service account
- [ ] Configure GSC service account
- [ ] Add 4 GitHub secrets
- [ ] Run manual workflow_dispatch
- [ ] Verify dashboard updates with real data
- [ ] Confirm Data Quality Score calculates

**Success Criteria:**
- Dashboard shows real numbers (not "-")
- Data Quality Grade ≥ B for 50% of articles
- No secrets leaked in commits

---

#### Initiative 1.2: Optimize Existing Content (Weeks 1-2)
**Effort:** Medium (3-4 days)  
**Impact:** High — quick wins on existing assets  
**ROI:** 3-5x (low effort, existing traffic potential)  
**Dependencies:** KPI Dashboard verified

**Actions:**
- [ ] Audit all 10 articles with ContentScoringEngine
- [ ] Fix "At Risk" articles (title tags, meta descriptions, internal links)
- [ ] Add calculators/CTAs to high-traffic guides
- [ ] Improve page speed (Core Web Vitals)
- [ ] Add schema markup to all hub pages

**Target Articles:**
| Article | Action | Expected Impact |
|---------|--------|-----------------|
| /carbon-accounting/ | Add calculator embed, improve title | +50% traffic |
| /scope-3-emissions/ | Expand examples, add template CTA | +30% traffic |
| /carbon-footprint-calculator/ | Optimize for "carbon footprint calculator" keyword | +100% traffic |
| /esg-reporting/ | Add CSRD checklist download | +40% leads |

**Success Criteria:**
- 4 articles moved to "Maintain" or "Double Down"
- Average content score ≥ 55
- Page speed score ≥ 80

---

#### Initiative 1.3: Publish High-Impact Content (Weeks 2-4)
**Effort:** High (5-7 days)  
**Impact:** Very High — new ranking opportunities  
**ROI:** 5-10x (compounding over 60-90 days)  
**Dependencies:** Content optimized first

**New Articles (scored ≥ 70):**

| # | Article | Keyword | Score | Traffic Potential | Lead Potential |
|---|---------|---------|-------|-------------------|----------------|
| 1 | Carbon Footprint Calculator Guide | carbon footprint calculator | 91 | Very High | Very High |
| 2 | GHG Protocol Complete Guide | ghg protocol | 65 | Medium | Medium |
| 3 | CSRD Reporting Checklist | csrd reporting checklist | 78 | High | High |
| 4 | ESG Software Comparison | esg reporting software | 78 | High | Very High |

**Success Criteria:**
- 4 articles published with scorecards
- All articles have Data Quality Grade ≥ B
- 2 articles reach "Double Down" within 30 days

---

#### Initiative 1.4: Technical SEO Foundation (Weeks 2-3)
**Effort:** Medium (2-3 days)  
**Impact:** High — unlocks all content potential  
**ROI:** 2-4x (multiplier on all content efforts)  
**Dependencies:** None

**Actions:**
- [ ] Submit updated sitemap to Google
- [ ] Fix crawl errors in Search Console
- [ ] Implement breadcrumb schema
- [ ] Add FAQ schema to calculator page
- [ ] Optimize images (WebP, lazy loading)
- [ ] Fix mobile responsiveness issues

**Success Criteria:**
- 0 crawl errors
- Mobile usability score 100%
- Image optimization saves > 500KB per page

---

### Phase 1 Summary

| Category | Day 30 Target | Key Initiatives |
|----------|---------------|-----------------|
| Traffic | 300 organic sessions/week | 1.1, 1.2, 1.3 |
| Ranking | Page 2-3 for 3+ keywords | 1.2, 1.3, 1.4 |
| Leads | 3 contact forms/week | 1.2, 1.3 |
| Content | 14 articles, 2 Double Down | 1.2, 1.3 |
| Product | 55% calculator completion | 1.2, 1.4 |

**Total Expected Effort:** 11-16 days  
**Highest ROI:** Initiative 1.1 (KPI verification) — unlocks everything else

---

## Phase 2: Acceleration (Days 31-60) — August 2026

### Theme: Scale, Convert, Automate

**Objective:** Scale content production, improve conversion rates, automate reporting.

---

### Traffic Targets

| Metric | Day 30 | Day 60 Target | Growth |
|--------|--------|---------------|--------|
| Organic Sessions/Week | 300 | 750 | 2.5x |
| Total Users/Week | 500 | 1,200 | 2.4x |
| Returning User Rate | 25% | 30% | +5pp |
| Impressions/Week | 5,000 | 15,000 | 3x |
| Clicks/Week | 150 | 400 | 2.7x |

### Ranking Targets

| Keyword | Day 30 | Day 60 Target |
|---------|--------|---------------|
| carbon accounting | Page 3-4 | Page 2 (pos 10-20) |
| scope 3 emissions | Page 2-3 | Page 1-2 (pos 5-15) |
| carbon footprint calculator | Page 2-3 | Page 1 (pos 1-10) |
| esg reporting | Page 3-4 | Page 2 (pos 10-20) |
| csrd omnibus | Page 1-2 | Page 1 (pos 1-5) |
| sustainability intelligence | Not ranked | Page 2-3 (pos 15-30) |

### Lead Targets

| Metric | Day 30 | Day 60 Target |
|--------|--------|---------------|
| Calculator Runs/Week | 30 | 75 |
| PDF Downloads/Week | 10 | 25 |
| Contact Forms/Week | 3 | 8 |
| Qualified Leads/Week | 2 | 5 |
| Conversion Rate | 1.5% | 2.5% |

### Content Targets

| Metric | Day 30 | Day 60 Target |
|--------|--------|---------------|
| Articles Published | 14 | 20 (+6) |
| Articles in "Double Down" | 2 | 5 |
| Content Score Average | 55+ | 65+ |
| Data Quality Grade A/B | 50% | 80% |

### Product Targets

| Metric | Day 30 | Day 60 Target |
|--------|--------|---------------|
| Calculator Completion Rate | 55% | 65% |
| PDF Report Generation | Optimized | Enhanced (branded) |
| Quiz Completion Rate | 40% | 50% |
| Mobile UX Score | 85 | 90 |

---

### Phase 2 Initiatives

#### Initiative 2.1: Content Cluster Expansion (Weeks 5-6)
**Effort:** High (7-10 days)  
**Impact:** Very High — topical authority building  
**ROI:** 8-15x (clusters rank together)  
**Dependencies:** Phase 1 content performing

**New Clusters:**

**Cluster A: Carbon Accounting Deep Dive**
| Article | Keyword | Score |
|---------|---------|-------|
| Scope 1 vs Scope 2 vs Scope 3 | scope 1 vs scope 2 vs scope 3 | 72 |
| Carbon Accounting for SMEs | carbon accounting small business | 63 |
| Emission Factors Database | emission factors database | 58 |

**Cluster B: ESG Reporting**
| Article | Keyword | Score |
|---------|---------|-------|
| GRI vs SASB vs TCFD | gri vs sasb vs tcfd | 68 |
| ESG Data Collection Guide | esg data collection | 62 |
| Sustainability Report Template | sustainability report template | 62 |

**Success Criteria:**
- 6 articles published in clusters
- Internal linking structure complete
- 1 cluster reaches "Double Down" status

---

#### Initiative 2.2: Conversion Rate Optimization (Weeks 5-7)
**Effort:** Medium (4-5 days)  
**Impact:** High — multiplies all traffic  
**ROI:** 4-8x (same traffic, more leads)  
**Dependencies:** KPI Dashboard tracking conversions

**Actions:**
- [ ] A/B test calculator CTA buttons
- [ ] Add exit-intent popup for PDF download
- [ ] Implement progressive profiling on forms
- [ ] Add social proof to calculator page
- [ ] Create calculator result sharing (social)
- [ ] Email nurture sequence for PDF downloaders

**Success Criteria:**
- Calculator completion rate ≥ 65%
- PDF download rate ≥ 3% of visitors
- Contact form rate ≥ 1% of visitors

---

#### Initiative 2.3: News Intelligence Engine MVP (Weeks 6-7)
**Effort:** High (5-7 days)  
**Impact:** Medium-High — fresh content, authority  
**ROI:** 3-6x (news drives returning visitors)  
**Dependencies:** Content Learning System verified

**Actions:**
- [ ] Build news ingestion pipeline (RSS + APIs)
- [ ] Implement auto-scoring for news relevance
- [ ] Create human approval workflow
- [ ] Publish 2-3 news articles/week
- [ ] Add news section to homepage

**Success Criteria:**
- 8-12 news articles published
- News section drives 10% of traffic
- Average news article score ≥ 50

---

#### Initiative 2.4: Backlink Building (Weeks 5-8)
**Effort:** Medium (ongoing, 2-3 days/week)  
**Impact:** High — authority signal  
**ROI:** 5-10x (compounding)  
**Dependencies:** High-quality content published

**Actions:**
- [ ] Guest post on sustainability blogs (2-3)
- [ ] Submit calculator to tool directories
- [ ] Create shareable infographic (emissions by industry)
- [ ] Reach out to universities for resource links
- [ ] HARO responses for expert quotes

**Success Criteria:**
- 10+ new referring domains
- 5+ high-authority backlinks (DA 50+)
- Domain Authority increases by 5+

---

### Phase 2 Summary

| Category | Day 60 Target | Key Initiatives |
|----------|---------------|-----------------|
| Traffic | 750 organic sessions/week | 2.1, 2.3, 2.4 |
| Ranking | Page 1 for 1+ keyword | 2.1, 2.4 |
| Leads | 8 contact forms/week | 2.2, 2.1 |
| Content | 20 articles, 5 Double Down | 2.1, 2.3 |
| Product | 65% calculator completion | 2.2 |

**Total Expected Effort:** 18-25 days  
**Highest ROI:** Initiative 2.2 (CRO) — multiplies all traffic

---

## Phase 3: Authority (Days 61-90) — September 2026

### Theme: Dominate, Monetize, Scale

**Objective:** Achieve top rankings, maximize lead generation, prepare for paid features.

---

### Traffic Targets

| Metric | Day 60 | Day 90 Target | Growth |
|--------|--------|---------------|--------|
| Organic Sessions/Week | 750 | 1,500 | 2x |
| Total Users/Week | 1,200 | 2,500 | 2.1x |
| Returning User Rate | 30% | 35% | +5pp |
| Impressions/Week | 15,000 | 40,000 | 2.7x |
| Clicks/Week | 400 | 900 | 2.25x |

### Ranking Targets

| Keyword | Day 60 | Day 90 Target |
|---------|--------|---------------|
| carbon accounting | Page 2 | Page 1 (pos 1-10) |
| scope 3 emissions | Page 1-2 | Page 1 (pos 1-5) |
| carbon footprint calculator | Page 1 | Page 1 (pos 1-3) |
| esg reporting | Page 2 | Page 1 (pos 5-10) |
| csrd omnibus | Page 1 | Page 1 (pos 1-3) |
| sustainability intelligence | Page 2-3 | Page 1-2 (pos 5-15) |

### Lead Targets

| Metric | Day 60 | Day 90 Target |
|--------|--------|---------------|
| Calculator Runs/Week | 75 | 150 |
| PDF Downloads/Week | 25 | 50 |
| Contact Forms/Week | 8 | 15 |
| Qualified Leads/Week | 5 | 10 |
| Conversion Rate | 2.5% | 3.5% |

### Content Targets

| Metric | Day 60 | Day 90 Target |
|--------|--------|---------------|
| Articles Published | 20 | 28 (+8) |
| Articles in "Double Down" | 5 | 10 |
| Content Score Average | 65+ | 75+ |
| Data Quality Grade A/B | 80% | 95% |

### Product Targets

| Metric | Day 60 | Day 90 Target |
|--------|--------|---------------|
| Calculator Completion Rate | 65% | 70% |
| PDF Report Generation | Enhanced | Premium tier ready |
| Quiz Completion Rate | 50% | 60% |
| Mobile UX Score | 90 | 95 |

---

### Phase 3 Initiatives

#### Initiative 3.1: Premium Content & Gating (Weeks 9-10)
**Effort:** High (7-10 days)  
**Impact:** Very High — lead quality improvement  
**ROI:** 10-20x (qualified leads worth more)  
**Dependencies:** Strong traffic base

**Actions:**
- [ ] Create premium PDF templates (gated)
- [ ] Build email course: "30-Day Carbon Reduction Plan"
- [ ] Add "Compare Your Emissions" feature
- [ ] Create industry-specific calculators
- [ ] Launch webinar series (monthly)

**Premium Content:**
| Content | Gating | Lead Value |
|---------|--------|------------|
| Carbon Reduction Playbook | Email required | High |
| ESG Readiness Assessment | Company info required | Very High |
| Industry Benchmark Report | Full contact required | Very High |
| Monthly Sustainability Briefing | Newsletter signup | Medium |

**Success Criteria:**
- 20+ premium downloads/week
- 50% of leads from gated content
- Email list grows to 500+

---

#### Initiative 3.2: International SEO (Weeks 9-11)
**Effort:** Medium (4-6 days)  
**Impact:** High — untapped markets  
**ROI:** 5-10x (EU sustainability regulations driving demand)  
**Dependencies:** English content ranking well

**Actions:**
- [ ] Translate top 5 articles to French (EU market)
- [ ] Translate top 5 articles to German (DACH market)
- [ ] Add hreflang tags
- [ ] Create EU-specific content (CSRD focus)
- [ ] Target "nachhaltigkeit" (German sustainability)

**Success Criteria:**
- 10% of traffic from EU
- 1 article ranks in French/German
- EU leads identified

---

#### Initiative 3.3: Partnership & Integration (Weeks 10-12)
**Effort:** Medium (5-7 days)  
**Impact:** High — authority + distribution  
**ROI:** 6-12x (partner traffic + backlinks)  
**Dependencies:** Strong brand recognition

**Actions:**
- [ ] Partner with sustainability certification body
- [ ] Integrate with popular carbon accounting tools
- [ ] Create co-branded calculator with NGO
- [ ] Guest expert series (interviews)
- [ ] Affiliate program for consultants

**Success Criteria:**
- 2+ partnerships active
- 10% traffic from partner referrals
- 5+ co-branded assets

---

#### Initiative 3.4: Advanced Analytics & AI (Weeks 11-12)
**Effort:** High (7-10 days)  
**Impact:** Medium-High — competitive advantage  
**ROI:** 4-8x (automation saves time)  
**Dependencies:** Data pipeline mature

**Actions:**
- [ ] Predictive content scoring (ML-based)
- [ ] Automated content brief generation
- [ ] Chatbot v2 with document Q&A
- [ ] Personalized calculator recommendations
- [ ] Automated A/B test suggestions

**Success Criteria:**
- Content predictions 70%+ accurate
- Chatbot handles 50% of queries
- Personalization increases conversion 20%

---

### Phase 3 Summary

| Category | Day 90 Target | Key Initiatives |
|----------|---------------|-----------------|
| Traffic | 1,500 organic sessions/week | 3.1, 3.2, 3.3 |
| Ranking | Page 1 for 4+ keywords | 3.1, 3.2 |
| Leads | 15 contact forms/week | 3.1, 3.3 |
| Content | 28 articles, 10 Double Down | 3.1, 3.2 |
| Product | 70% calculator completion | 3.1, 3.4 |

**Total Expected Effort:** 23-33 days  
**Highest ROI:** Initiative 3.1 (Premium Content) — highest lead quality

---

## 90-Day Summary

### Traffic Trajectory

```
Week 0:    ~100 organic sessions/week
Week 4:    ~300 organic sessions/week  (3x)
Week 8:    ~750 organic sessions/week  (7.5x)
Week 12:   ~1,500 organic sessions/week (15x)
```

### Lead Trajectory

```
Week 0:    ~0-1 leads/week
Week 4:    ~3 leads/week
Week 8:    ~8 leads/week
Week 12:   ~15 leads/week
```

### Content Trajectory

```
Week 0:    10 articles
Week 4:    14 articles (+4)
Week 8:    20 articles (+6)
Week 12:   28 articles (+8)
```

---

## Initiative Priority Matrix

| Initiative | Effort | Impact | ROI | Phase | Priority |
|------------|--------|--------|-----|-------|----------|
| 1.1 Verify KPI Dashboard | Low | Critical | ∞ | 1 | 🔴 P0 |
| 1.2 Optimize Content | Medium | High | 3-5x | 1 | 🔴 P0 |
| 1.3 Publish High-Impact | High | Very High | 5-10x | 1 | 🟠 P1 |
| 1.4 Technical SEO | Medium | High | 2-4x | 1 | 🟡 P2 |
| 2.1 Content Clusters | High | Very High | 8-15x | 2 | 🟠 P1 |
| 2.2 CRO | Medium | High | 4-8x | 2 | 🔴 P0 |
| 2.3 News Engine | High | Medium-High | 3-6x | 2 | 🟡 P2 |
| 2.4 Backlinks | Medium | High | 5-10x | 2 | 🟠 P1 |
| 3.1 Premium Content | High | Very High | 10-20x | 3 | 🔴 P0 |
| 3.2 International SEO | Medium | High | 5-10x | 3 | 🟡 P2 |
| 3.3 Partnerships | Medium | High | 6-12x | 3 | 🟠 P1 |
| 3.4 Advanced Analytics | High | Medium-High | 4-8x | 3 | 🟢 P3 |

---

## Dependencies & Risks

### Critical Path
```
1.1 Verify KPI Dashboard → 1.2 Optimize Content → 2.2 CRO → 3.1 Premium Content
```

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google algorithm update | Medium | High | Diversify traffic sources |
| Competitor launches similar tool | Medium | High | Differentiate with data quality |
| GA/GSC API changes | Low | Medium | Monitor Google announcements |
| Content production bottleneck | Medium | Medium | Batch writing, templates |
| Technical debt slows development | Medium | High | Refactor before Phase 3 |
| Lead quality poor | Low | High | Progressive profiling, gating |

### Resource Requirements

| Resource | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| Development | 5 days | 8 days | 12 days |
| Content Writing | 6 days | 12 days | 15 days |
| SEO/Analytics | 3 days | 5 days | 6 days |
| Design | 2 days | 3 days | 5 days |
| **Total** | **16 days** | **28 days** | **38 days** |

---

## Weekly Review Checklist

Every Monday (after KPI Dashboard update):

- [ ] Review traffic vs target
- [ ] Review ranking changes
- [ ] Review lead count and quality
- [ ] Review content performance scores
- [ ] Identify "Double Down" opportunities
- [ ] Flag "At Risk" content for optimization
- [ ] Adjust weekly priorities based on data

## Monthly Review Checklist

First of each month:

- [ ] Run ContentScoringEngine on all articles
- [ ] Update lifecycle states
- [ ] Plan content calendar for next month
- [ ] Review ROI of initiatives
- [ ] Re-prioritize based on performance
- [ ] Update this plan if needed

---

## Success Metrics (Day 90)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Organic traffic | 1,500 sessions/week | GA4 |
| Keyword rankings | 4+ on Page 1 | GSC |
| Leads | 15/week | Form submissions |
| Content | 28 articles | Content registry |
| Calculator usage | 150 runs/week | Event tracking |
| PDF downloads | 50/week | Event tracking |
| Domain Authority | 40+ | Moz/Ahrefs |
| Data Quality | 95% Grade A/B | ContentScoringEngine |

---

*Plan created: 2026-06-18*  
*Next review: Weekly (Mondays) + Monthly (1st of month)*  
*Owner: Terrnix AI + Tallal*
