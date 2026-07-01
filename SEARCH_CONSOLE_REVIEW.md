# Search Console Review

**Date:** 2026-07-02
**Status:** Search Console data not yet available for new cluster pages
**Note:** This report provides a framework for review once indexation data is available.

---

## Current Indexation Status (Estimated)

| Page Category | URLs | Est. Indexation | Est. Time to Index |
|---|---|---|---|
| Homepage | 1 | ✅ Likely indexed | Already indexed |
| Pre-Week 2 hubs | 8 | ✅ Likely indexed | Already indexed |
| Pre-Week 2 articles | 6 | ✅ Likely indexed | Already indexed |
| Week 2 clusters (new) | 27 | ❌ Not yet indexed | 2-14 days |
| Utility pages | 5 | ⚠️ Partial | Variable |
| Test pages | 3 | ❌ Should not index | Block immediately |

---

## Indexation Monitoring Framework

### Week 1 After Submit (Target: 2026-07-09)
Check Google Search Console for:

| Metric | Target | Action if Below Target |
|---|---|---|
| Indexed pages | 40+ | Check Coverage report for exclusions |
| Valid pages | 45+ | Fix errors in Coverage report |
| Excluded pages | <5 | Investigate why excluded |
| Crawl errors | 0 | Fix 404s, server errors |

### Week 2 After Submit (Target: 2026-07-16)

| Metric | Target | Action if Below Target |
|---|---|---|
| Indexed pages | 47+ | Build internal links to unindexed pages |
| Impressions | 100+ | Check keyword targeting, titles |
| Average position | <50 | Improve content depth, add backlinks |
| CTR | >2% | Improve meta descriptions, titles |

### Month 1 After Submit (Target: 2026-08-02)

| Metric | Target | Action if Below Target |
|---|---|---|
| Indexed pages | 49+ | Full indexation expected |
| Total impressions | 1,000+ | Expand keyword targeting |
| Average position | <30 | Build backlinks, improve content |
| CTR | >3% | A/B test titles and descriptions |
| Clicks | 30+ | Optimize high-impression, low-CTR pages |

---

## Coverage Issues to Monitor

### Potential Exclusion Reasons

| Issue | Likely Affected Pages | Prevention |
|---|---|---|
| Discovered — currently not indexed | New cluster pages | Submit sitemap, build internal links |
| Crawled — currently not indexed | Thin pages | Expand content >300 words |
| Duplicate without user-selected canonical | None expected | All pages have canonicals |
| Soft 404 | None expected | All pages have content |
| Server error (5xx) | None expected | Static hosting |
| Blocked by robots.txt | Test pages | Intentional — verify blocked |
| Blocked by noindex tag | None yet | Add to test pages |

---

## Performance Monitoring Setup

### Queries to Track (Priority Order)

| Query | Target Page | Current Position | Month 1 Target | Month 3 Target |
|---|---|---|---|---|
| cbam compliance guide | /cbam/ | — | 30-50 | 10-20 |
| cbam certificate cost calculator | /cbam/certificate-cost-calculator/ | — | 20-40 | 5-15 |
| csrd implementation guide | /csrd/implementation-guide/ | — | 30-50 | 15-25 |
| scope 3 supplier engagement | /ghg-protocol/scope-3-deep-dive/ | — | 20-40 | 10-20 |
| esg framework comparison | /esg-reporting-hub/framework-comparison/ | — | 30-50 | 15-25 |
| iso 14064 verification | /iso-14064/verification-guide/ | — | 20-40 | 10-20 |
| product carbon footprint guide | /carbon-footprinting/product-carbon-footprint/ | — | 30-50 | 15-25 |

### Pages to Monitor for Indexation

| Page | Priority | Expected Index Date |
|---|---|---|
| /cbam/ | Critical | 2026-07-05 |
| /csrd/ | Critical | 2026-07-05 |
| /ghg-protocol/ | Critical | 2026-07-05 |
| /carbon-footprinting/ | Critical | 2026-07-05 |
| /esg-reporting-hub/ | Critical | 2026-07-05 |
| /iso-14064/ | Critical | 2026-07-05 |
| /cbam/certificate-cost-calculator/ | High | 2026-07-07 |
| /csrd/implementation-guide/ | High | 2026-07-07 |
| /ghg-protocol/scope-3-deep-dive/ | High | 2026-07-07 |
| All FAQ pages | Medium | 2026-07-10 |
| All industry examples | Medium | 2026-07-10 |

---

## Crawl Budget Optimization

### Current State
- 53 total HTML pages
- 3 test pages (should be excluded)
- 49 valid pages for indexation
- Static site = fast crawl, no server load concerns

### Recommendations
1. **Block test pages** — free up crawl budget for content
2. **Prioritize pillar pages** in sitemap (higher priority values)
3. **Update sitemap weekly** during active content periods
4. **Add `lastmod`** dates to signal fresh content

---

## Action Items for Tallal

### Immediate (This Week)
- [ ] Log into Google Search Console
- [ ] Submit updated sitemap.xml
- [ ] Request indexing for /cbam/, /csrd/, /ghg-protocol/, /carbon-footprinting/, /esg-reporting-hub/, /iso-14064/
- [ ] Check Coverage report for any existing issues
- [ ] Verify test pages are not indexed (remove if they are)

### Weekly (Ongoing)
- [ ] Check Index > Coverage for new exclusions
- [ ] Check Performance > Queries for impression data
- [ ] Note any crawl errors
- [ ] Track indexation of new URLs

### Monthly
- [ ] Review query performance and rankings
- [ ] Identify pages with high impressions but low CTR
- [ ] Optimize titles and descriptions for underperforming pages
- [ ] Compare actual vs. projected traffic

---

## Expected Data Timeline

| Date | Expected Data |
|---|---|
| 2026-07-05 | First indexation of pillar pages |
| 2026-07-09 | Coverage report shows new URLs |
| 2026-07-16 | First impression data available |
| 2026-07-23 | Meaningful query data (100+ impressions) |
| 2026-08-02 | Month 1 benchmark data complete |
| 2026-10-02 | Month 3 target evaluation |
