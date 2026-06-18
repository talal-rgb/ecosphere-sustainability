# Content Performance Tracking System

## Overview
Every article has a measurable business outcome. This system tracks performance, assigns lifecycle states, and drives data-driven content decisions.

## Metrics Tracked

### SEO Metrics
| Metric | Source | Frequency | Purpose |
|--------|--------|-----------|---------|
| Impressions | Google Search Console | Daily | Visibility |
| Clicks | Google Search Console | Daily | Traffic |
| CTR | Calculated (Clicks/Impressions) | Daily | Relevance |
| Position | Google Search Console | Daily | Ranking |

### Engagement Metrics
| Metric | Source | Frequency | Purpose |
|--------|--------|-----------|---------|
| Users | Google Analytics | Daily | Reach |
| Sessions | Google Analytics | Daily | Engagement depth |
| Bounce Rate | Google Analytics | Daily | Content quality |
| Avg. Session Duration | Google Analytics | Daily | Content value |
| Pages per Session | Google Analytics | Daily | Site exploration |

### Conversion Metrics
| Metric | Source | Frequency | Purpose |
|--------|--------|-----------|---------|
| Calculator Conversions | Event tracking | Daily | Tool usage |
| PDF Downloads | Event tracking | Daily | Lead gen |
| Quiz Completions | Event tracking | Daily | Engagement |
| Contact Form Submissions | Event tracking | Daily | Leads |
| Newsletter Signups | Event tracking | Daily | Audience building |

## Article Scorecard

### Scoring Formula
```
Overall Score = (Traffic × 0.25) + (Leads × 0.30) + (Engagement × 0.20) + (Relevance × 0.25)

Where:
- Traffic = normalized monthly users (0-100)
- Leads = normalized conversions (0-100)
- Engagement = normalized avg session duration + pages/session (0-100)
- Relevance = business alignment score (0-100)
```

### Traffic Score (0-100)
| Monthly Users | Score |
|---------------|-------|
| 0-10 | 5 |
| 11-50 | 15 |
| 51-100 | 30 |
| 101-500 | 50 |
| 501-1000 | 70 |
| 1001-5000 | 85 |
| 5000+ | 100 |

### Leads Score (0-100)
| Monthly Conversions | Score |
|---------------------|-------|
| 0 | 0 |
| 1-2 | 20 |
| 3-5 | 40 |
| 6-10 | 60 |
| 11-20 | 80 |
| 21+ | 100 |

### Engagement Score (0-100)
```
Engagement = (Avg Session Duration / 300s × 50) + (Pages per Session / 3 × 50)
Capped at 100
```

### Relevance Score (0-100)
| Criteria | Weight | Score |
|----------|--------|-------|
| Target keyword in title | 20% | 0 or 20 |
| Internal links to tools | 20% | 0-20 |
| Calculator/CTA present | 20% | 0 or 20 |
| Related to core offering | 20% | 0-20 |
| Update freshness | 20% | 0-20 |

## Content Lifecycle States

### State Definitions

#### 🚀 Double Down
- **Criteria**: Score ≥ 75, Traffic ≥ 100/mo, Conversions ≥ 5/mo
- **Action**: Expand, update, promote, create cluster content
- **Frequency**: Weekly review

#### ✅ Maintain
- **Criteria**: Score 50-74, Traffic 20-100/mo, Conversions 1-4/mo
- **Action**: Keep fresh, minor updates, monitor
- **Frequency**: Monthly review

#### ⚠️ At Risk
- **Criteria**: Score 30-49 OR declining 2+ months
- **Action**: Audit, optimize, A/B test title/meta
- **Frequency**: Bi-weekly review

#### 🔧 Consolidate
- **Criteria**: Score < 30, Traffic < 20/mo, similar content exists
- **Action**: Merge into stronger piece, 301 redirect
- **Frequency**: Monthly review

#### 🌅 Sunset
- **Criteria**: Score < 20, Traffic < 10/mo for 90+ days, no conversions
- **Action**: Remove or archive, redirect to hub
- **Frequency**: Quarterly review

## Article Registry

### Template
```markdown
| URL | Title | Published | Keyword | Score | State | Last Review |
|-----|-------|-----------|---------|-------|-------|-------------|
```

### Current Articles

| URL | Title | Published | Target Keyword | Score | State | Last Review |
|-----|-------|-----------|----------------|-------|-------|-------------|
| /carbon-accounting/ | Carbon Accounting Hub | 2026-06-07 | carbon accounting | TBD | 🆕 New | 2026-06-18 |
| /carbon-accounting/scope-1-emissions/ | Scope 1 Emissions Guide | 2026-06-07 | scope 1 emissions | TBD | 🆕 New | 2026-06-18 |
| /carbon-accounting/scope-2-emissions/ | Scope 2 Emissions Guide | 2026-06-08 | scope 2 emissions | TBD | 🆕 New | 2026-06-18 |
| /carbon-accounting/scope-3-emissions/ | Scope 3 Emissions Guide | 2026-06-08 | scope 3 emissions | TBD | 🆕 New | 2026-06-18 |
| /carbon-accounting/carbon-footprint-calculator/ | Carbon Footprint Calculator | 2026-06-07 | carbon footprint calculator | TBD | 🆕 New | 2026-06-18 |
| /esg-reporting/ | ESG Reporting Hub | 2026-06-08 | esg reporting | TBD | 🆕 New | 2026-06-18 |
| /esg-reporting/csrd-omnibus-guide/ | CSRD Omnibus Guide | 2026-06-08 | csrd omnibus | TBD | 🆕 New | 2026-06-18 |
| /sustainability-intelligence/ | Sustainability Intelligence Hub | 2026-06-07 | sustainability intelligence | TBD | 🆕 New | 2026-06-18 |
| /tools/ | Tools Hub | 2026-06-08 | sustainability tools | TBD | 🆕 New | 2026-06-18 |
| /resources/ | Resources Hub | 2026-06-07 | sustainability resources | TBD | 🆕 New | 2026-06-18 |

## Monthly Review Process

### Week 1: Data Collection
1. Export GSC data (impressions, clicks, CTR, position)
2. Export GA data (users, sessions, bounce rate, duration)
3. Export conversion events (calculator, PDF, quiz, contact)
4. Update article registry with latest metrics

### Week 2: Scoring & Analysis
1. Calculate scores for all articles
2. Assign lifecycle states
3. Identify trends (improving/declining)
4. Flag articles needing action

### Week 3: Action Planning
1. **Double Down**: Plan expansions, clusters, promotions
2. **At Risk**: Plan optimizations, A/B tests
3. **Consolidate**: Identify merge targets
4. **Sunset**: Plan redirects or removals

### Week 4: Execution
1. Implement planned changes
2. Update content calendar
3. Document learnings
4. Prepare next month's hypotheses

## Data Collection Templates

### GSC Export Template
```csv
URL,Query,Impressions,Clicks,CTR,Position,Date
```

### GA Export Template
```csv
URL,Users,Sessions,BounceRate,AvgSessionDuration,PagesPerSession,Date
```

### Conversion Tracking Template
```csv
URL,CalculatorStarts,CalculatorCompletions,PDFDownloads,QuizStarts,QuizCompletions,ContactForms,NewsletterSignups,Date
```

## Tools & Integration

### Required Setup
- [ ] Google Search Console API access
- [ ] Google Analytics 4 API access
- [ ] Event tracking for conversions (GTM or direct)
- [ ] Automated data pipeline (optional: Google Sheets + Apps Script)

### Recommended Tools
- **Free**: Google Sheets + Apps Script + GSC/GA APIs
- **Paid**: Ahrefs/Semrush for keyword tracking, Screaming Frog for audits

## Success Metrics

### System Health
- [ ] 100% articles tracked within 30 days of publish
- [ ] Monthly reviews completed on schedule
- [ ] All articles have assigned lifecycle state
- [ ] Action items from reviews executed within 30 days

### Business Outcomes
- [ ] 20% of articles in "Double Down" state within 6 months
- [ ] 0 articles in "Sunset" state without documented decision
- [ ] Month-over-month conversion rate improvement
- [ ] Increasing average article score over time

## Next Steps

1. **Immediate**: Set up GSC and GA data export process
2. **Week 1**: Collect baseline data for all existing articles
3. **Week 2**: Calculate initial scores and assign states
4. **Week 3**: Execute first round of optimizations
5. **Ongoing**: Monthly reviews, continuous improvement

---

*Last updated: 2026-06-18*
*Next review: 2026-07-18*
