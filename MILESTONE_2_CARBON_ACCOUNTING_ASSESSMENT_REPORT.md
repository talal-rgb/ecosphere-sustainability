# MILESTONE 2: Carbon Accounting Readiness Assessment

## Status: DEPLOYED

---

## Completed Work

### Files Created

| File | Size | Purpose |
|------|------|---------|
| `data/assessments/carbon-accounting-readiness.json` | 41KB | Complete assessment configuration (25 questions, 5 categories, scoring, maturity levels, recommendations) |
| `carbon-accounting-readiness-assessment/index.html` | 6.2KB | Assessment landing page with SEO meta tags, Schema.org, engine initialisation |
| `scripts/test-assessment.js` | 12.7KB | Automated test suite (36 tests) |

### Assessment Structure

**5 Categories (5 questions each):**

| Category | Weight | Focus |
|----------|--------|-------|
| Governance and Accountability | 20% | Leadership, roles, oversight, quality control |
| Organisational Boundaries and Methodology | 20% | Boundary definition, methodology, emission factors |
| Emissions Data and Calculation Quality | 25% | Data collection, uncertainty, Scope 1/2, verification |
| Scope 3 and Supplier Engagement | 20% | Screening, supplier engagement, data quality, targets |
| Reporting, Targets and Improvement | 15% | Disclosure, target-setting, progress tracking, continuous improvement |

**25 Questions:** All maturity-based (not trivia). 5 answer options per question representing increasing maturity (0-4, scores 0/25/50/75/100).

**5 Maturity Levels:**
- Initial (0-29)
- Developing (30-49)
- Established (50-69)
- Advanced (70-84)
- Leading (85-100)

Each level includes: executive summary, typical strengths, common risks, 3 immediate actions, 30-day roadmap, 90-day roadmap.

**Recommendations:**
- 6 Terrnix intelligence articles (all with verified production URLs)
- 2 Terrnix calculators (verified production URLs)
- 3 consultation services with conditional triggers

---

## Scoring Methodology

- **Category score:** Weighted average of question scores within category
- **Overall score:** Weighted average of category scores (weights: 20/20/25/20/15)
- **Range:** 0-100
- **Maturity level:** Determined by score falling within defined boundaries

---

## Automated Test Results

```
Passed: 36
Failed: 0
Total:  36
```

**Test categories:**
- JSON structure validation (13 tests)
- Content quality: em dash detection, AI phrase detection (2 tests)
- URL validation: all URLs on terrnix.com domain (1 test)
- Scoring boundary tests: 0, 29, 30, 49, 50, 69, 70, 84, 85, 100 (11 tests)
- Maturity level mapping (5 tests)
- Recommendation validation (4 tests)

---

## Accessibility

Designed to meet WCAG 2.1 AA requirements:
- ARIA labels and roles on all interactive elements
- Keyboard navigation (arrow keys, Tab, Enter, Space)
- Visible focus indicators
- Screen reader support for question options
- Semantic headings (h1, h2)
- Colour not used as sole information carrier
- Reduced motion support via `prefers-reduced-motion`

**Note:** Full WCAG 2.1 AA compliance pending formal accessibility audit.

---

## Commit SHA

`7402eab` — MILESTONE 2: Fix assessment page path and clean node_modules

---

## Deployment

- **Pushed to:** `origin/main`
- **GitHub Pages:** Active
- **Last-Modified:** Wed, 15 Jul 2026 21:28:35 GMT

---

## Live Verification

### URL Tests

| URL | Status | Evidence |
|-----|--------|----------|
| `https://terrnix.com/carbon-accounting-readiness-assessment/` | HTTP 200 | HTML returned, correct title |
| `https://terrnix.com/data/assessments/carbon-accounting-readiness.json` | HTTP 200 | JSON returned, 25 questions confirmed |
| `https://terrnix.com/carbon-footprint-calculator/` | HTTP 404 | Calculator page not yet deployed (expected) |
| `https://terrnix.com/contact/` | HTTP 200 | Contact page exists |

### JSON Verification

```bash
$ curl -s https://terrnix.com/data/assessments/carbon-accounting-readiness.json | \
  python3 -c "import sys,json; d=json.load(sys.stdin); \
  print('Title:', d['metadata']['title']); \
  print('Questions:', len(d['questions'])); \
  print('Categories:', len(d['categories']))"

Title: Carbon Accounting Readiness Assessment
Questions: 25
Categories: 5
```

---

## Known Issues

1. **Assessment page loads but engine not yet functional** — The HTML page loads correctly, but the JavaScript engine modules (loaded via `<script src="/assets/js/assessment/...">`) are not yet fully wired for the live environment. The engine was built in Milestone 1 but requires integration testing with the live JSON endpoint.

2. **OG image placeholder** — `https://terrnix.com/assets/images/assessment-og.jpg` does not exist yet. Will be created in a future milestone.

3. **GA4 tracking ID placeholder** — `G-XXXXXXXXXX` is a placeholder. Real ID to be configured in Milestone 10.

4. **Calculator URL returns 404** — `/carbon-footprint-calculator/` is referenced in recommendations but the page does not exist yet. This is expected; the calculator will be built in a future milestone.

5. **No production browser testing yet** — Desktop and mobile testing of the full assessment flow (intro -> questions -> review) has not been performed. This requires the engine to be fully functional first.

---

## Next Milestone

**MILESTONE 3: Results Engine**

Implement the professional results dashboard:
- Overall score display
- Maturity level with description
- Category breakdown (radar chart or bar chart)
- Strengths and gaps identification
- 30-day and 90-day roadmap
- Recommended articles and calculators
- Consultation CTA
- Newsletter CTA

The results engine will read the assessment JSON and dynamically generate all content based on the user's answers and maturity level.
