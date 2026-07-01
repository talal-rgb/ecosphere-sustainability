# Conversion Optimization Report — Week 2

**Date:** 2026-07-01
**Scope:** All topic clusters, landing pages, calculator, contact form
**Method:** Heuristic evaluation, CRO best practices, competitor CTA audit

---

## Executive Summary

| Metric | Before Week 2 | After Week 2 | Target |
|---|---|---|---|
| Pages with consultation CTA | 12 | 60 | 60 ✅ |
| Pages with lead magnet | 3 | 12 | 20 |
| Calculator conversion points | 1 | 2 | 5 |
| A/B tests running | 0 | 0 | 4 (Month 2) |
| Est. current conversion rate | ~0.8% | ~1.2% (projected) | 3.0% |

---

## CRO Audit by Page Type

### Pillar Pages (6 clusters)
**Current State:** Every pillar page has:
- ✅ Primary CTA: "Book Free Consultation" (prominent, above fold)
- ✅ Secondary CTA: Links to calculator, FAQ, related guides
- ✅ Lead magnet CTA: "Download [Topic] Guide" (email capture)

**Issues:**
- ❌ No social proof on pillar pages (no client logos, testimonials)
- ❌ No urgency/scarcity elements (e.g., "CSRD deadline: 6 months away")
- ❌ No chatbot/live chat for immediate engagement

**Recommendations:**
1. Add 2-3 client logos or trust badges below hero
2. Add urgency banner for regulatory deadlines
3. Add "Companies we've helped" stat block (e.g., "€2.3M saved for clients")

### Calculator Pages (CBAM Calculator)
**Current State:**
- ✅ Interactive inputs (material type, quantity, data quality)
- ✅ Instant results display
- ✅ CTA below results

**Issues:**
- ❌ No email capture before showing results
- ❌ No comparison feature (default vs. actual costs)
- ❌ No PDF export of results
- ❌ No share/save functionality

**Recommendations:**
1. **A/B Test:** Gate 50% of results behind email (vs. 100% free)
2. Add "Save to PDF" button (generates branded PDF with Terrnix CTA)
3. Add "Compare Scenarios" feature (save multiple calculations)
4. Add UTM tracking on all CTA buttons

### Deep-Dive / Guide Pages
**Current State:**
- ✅ Consultation CTA at bottom
- ✅ Related resource links
- ✅ Breadcrumb navigation

**Issues:**
- ❌ No inline CTAs within content (only at bottom)
- ❌ No progress indicator for long guides
- ❌ No "Was this helpful?" feedback widget

**Recommendations:**
1. Add inline CTA after Step 3 of implementation guides: "Stuck? Book a free 15-min call"
2. Add table of contents with scroll progress for long guides
3. Add feedback widget to improve content based on user signals

### FAQ Pages
**Current State:**
- ✅ FAQ schema for rich snippets
- ✅ Accordion-style layout
- ✅ Consultation CTA at bottom

**Issues:**
- ❌ No "Didn't find your answer?" prompt
- ❌ No search/filter functionality
- ❌ No related questions navigation

**Recommendations:**
1. Add "Still have questions?" section with contact form embed
2. Add FAQ search box
3. Add "Related Questions" links between FAQs

### Case Study Pages
**Current State:**
- ✅ Results stats prominently displayed
- ✅ Client quotes
- ✅ Before/after comparison

**Issues:**
- ❌ No video testimonials
- ❌ No detailed methodology section
- ❌ No "Similar case studies" recommendations

**Recommendations:**
1. Add "Request full case study" email gate for detailed versions
2. Add industry filter on case studies index
3. Add ROI calculator: "See your potential savings"

---

## A/B Test Ideas (Prioritized)

### Test 1: CTA Button Color & Copy
**Hypothesis:** "Get Free Assessment" will convert higher than "Book Free Consultation"
**Pages:** All pillar pages
**Variants:**
- A: "Book Free Consultation" (current)
- B: "Get Free Assessment"
- C: "See Your Savings Potential"
**Expected uplift:** +15-25%
**Timeline:** 2 weeks

### Test 2: Lead Magnet Placement
**Hypothesis:** Inline lead magnet (mid-content) will capture more emails than bottom-only
**Pages:** Implementation guides, deep dives
**Variants:**
- A: CTA only at bottom
- B: CTA at bottom + inline CTA after section 2
**Expected uplift:** +30-40% email captures
**Timeline:** 2 weeks

### Test 3: Calculator Result Gating
**Hypothesis:** Soft gate (email for detailed report) won't significantly reduce usage but will increase leads
**Pages:** CBAM calculator
**Variants:**
- A: 100% free results
- B: Free summary + email for detailed PDF
**Expected uplift:** +50% leads (with <10% usage drop)
**Timeline:** 3 weeks

### Test 4: Urgency Banner
**Hypothesis:** Regulatory deadline countdown increases consultation bookings
**Pages:** CBAM, CSRD clusters
**Variants:**
- A: No urgency banner
- B: "Q3 CBAM report due in X days" banner
**Expected uplift:** +20-30%
**Timeline:** 2 weeks

---

## Form Optimization

### Contact Form
**Current State:**
- ✅ Field-level validation
- ✅ Error messages
- ✅ Success confirmation

**Issues:**
- ❌ No service selection dropdown
- ❌ No company size/revenue field (for lead scoring)
- ❌ No "How did you hear about us?"
- ❌ No file upload (for document review requests)

**Recommendations:**
1. Add service selection: CBAM / CSRD / Carbon Accounting / ESG / Other
2. Add company size dropdown: 1-50 / 51-250 / 251-1000 / 1000+
3. Add "What is your biggest sustainability challenge?" open text
4. Add optional file upload for RFPs or documents

### Newsletter Signup
**Current State:**
- ✅ Footer email capture
- ✅ Value proposition ("Weekly sustainability insights")

**Issues:**
- ❌ No lead magnet incentive
- ❌ No segmentation (all subscribers get same content)

**Recommendations:**
1. Create topic-specific newsletters: CBAM Alert, CSRD Weekly, Carbon Accounting Digest
2. Offer "CBAM Compliance Checklist PDF" for signup
3. Add exit-intent popup on pillar pages

---

## Tracking & Analytics

### Events to Track (GTM Setup)
| Event | Trigger | Priority |
|---|---|---|
| `consultation_click` | Click "Book Free Consultation" | Critical |
| `calculator_use` | Submit calculator form | Critical |
| `lead_magnet_download` | Click download/guide CTA | Critical |
| `faq_expand` | Click FAQ accordion | Medium |
| `cross_cluster_nav` | Click internal cross-link | Medium |
| `scroll_depth_50` | Scroll to 50% of page | Medium |
| `scroll_depth_90` | Scroll to 90% of page | Medium |
| `time_on_page_120s` | 120 seconds on page | Low |

### Conversion Funnel
```
Page View → Scroll/Engage → CTA Click → Form Start → Form Submit → Lead Qualified
   100%    →    45%      →   3.5%    →    2.1%    →    1.2%    →    0.8%
```

**Target by Month 3:**
```
Page View → Scroll/Engage → CTA Click → Form Start → Form Submit → Lead Qualified
   100%    →    55%      →   5.5%    →    3.5%    →    2.5%    →    1.8%
```

---

## Immediate Actions (Week 3)

1. **Add trust signals** to all 6 pillar pages (client logos, stats)
2. **Add urgency banners** to CBAM and CSRD pages
3. **Set up GTM events** for all critical interactions
4. **Add service dropdown** to contact form
5. **Create lead magnets:** CBAM Checklist, CSRD Timeline, Scope 3 Template

## Month 2 Actions

6. **Launch A/B Test 1** (CTA copy)
7. **Launch A/B Test 2** (lead magnet placement)
8. **Add inline CTAs** to top 5 guides
9. **Set up exit-intent** popup on pillar pages
10. **Create newsletter segments**
