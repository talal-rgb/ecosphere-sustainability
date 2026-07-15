# Terrnix Assessment Engine Architecture

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Platform Architecture

---

## Philosophy

The Assessment Engine is Terrnix's flagship lead generation asset. Every decision reinforces professional credibility comparable to Deloitte, McKinsey, BCG, or the Big Four.

**Core Principles:**
1. **Data-driven:** Zero business logic in JavaScript. All behaviour configured via JSON.
2. **Reusable:** New assessments require only a JSON file. Zero code changes.
3. **Premium UX:** Executive-grade experience from landing to results.
4. **Privacy-first:** Secure tokens for sharing. No PII in URLs.
5. **Performance:** Sub-2-second load. Lazy-loaded dependencies.
6. **Accessible:** WCAG 2.1 AA compliance.
7. **SEO-optimised:** Every assessment landing page is indexable.
8. **AI-ready:** Structured data enables future AI recommendation enhancements.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ASSESSMENT LANDING                        │
│  /assessments/{slug}/                                            │
│  SEO-optimised, meta, OG, schema, FAQ                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ASSESSMENT ENGINE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Core      │  │   State     │  │      Event Bus          │  │
│  │  (loader)   │  │  (manager)  │  │   (pub/sub)             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                     │                 │
│         ▼                ▼                     ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    UI       │  │  Scoring    │  │   Recommendation        │  │
│  │  (renderer) │  │   Engine    │  │      Engine             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                     │                 │
│         ▼                ▼                     ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Lead      │  │   PDF       │  │      Analytics          │  │
│  │  Capture    │  │  Engine     │  │     (GA4)               │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                     │                 │
│         ▼                ▼                     ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Share     │  │ Certificate │  │      Verification       │  │
│  │   (token)   │  │   Engine    │  │       System            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                            │
│  POST /api/assessment/submit                                     │
│  POST /api/assessment/lead                                       │
│  GET  /api/assessment/result/:token                              │
│  GET  /api/certificate/verify/:id                                │
│  POST /api/email/assessment-results                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Design

### 1. Assessment Core (`assets/js/assessment/core.js`)

**Responsibility:** Load assessment configuration, orchestrate flow, manage lifecycle.

**Public API:**
```javascript
class AssessmentEngine {
  constructor(containerId, options = {})
  
  async load(assessmentSlug)           // Load JSON config
  async start()                        // Begin assessment
  answer(questionId, value)            // Record answer
  previous()                           // Navigate back
  next()                               // Navigate forward
  review()                             // Show review screen
  submit(answers)                      // Calculate results
  
  // Events
  on(event, callback)                  // Subscribe
  off(event, callback)                 // Unsubscribe
  emit(event, data)                    // Publish
}
```

**Events:**
```javascript
'loaded'        // Assessment config loaded
'started'       // User clicked Start
'question'      // Question displayed {questionId, index, total}
'answered'      // Answer recorded {questionId, value, category}
'navigated'     // Navigation occurred {from, to, direction}
'review'        // Review screen shown
'submitting'    // Submission in progress
'completed'     // Results calculated {score, maturity, categories}
'lead-capture'  // Lead form displayed
'lead-submitted' // Lead captured {leadId, consent}
'report-download' // Report PDF requested
'certificate-download' // Certificate PDF requested
'share'         // Share URL generated {token}
'error'         // Error occurred {type, message}
```

**State Machine:**
```
IDLE → LOADING → INTRO → QUESTION → REVIEW → LEAD_CAPTURE → RESULTS → COMPLETE
         ↑_________|←previous()    |←review()    |←submit()    |←download
```

### 2. State Manager (`assets/js/assessment/state.js`)

**Responsibility:** Immutable state management with localStorage persistence.

```javascript
class AssessmentState {
  get()                    // Get current state
  set(path, value)         // Immutable update
  persist()                // Save to localStorage (encrypted)
  restore()                // Load from localStorage
  clear()                  // Remove persisted state
  
  // State shape
  {
    assessment: { id, slug, title, version },
    participant: { name, email, company, industry, country, jobTitle },
    answers: { [questionId]: value },
    progress: { current, total, percentage },
    results: { score, maturity, categories, strengths, gaps },
    meta: { startedAt, completedAt, duration, sourceUrl, utm }
  }
}
```

**Encryption:**
- Algorithm: AES-256-GCM via Web Crypto API
- Key: Derived from session ID + timestamp
- Data: All answers and participant info
- Expiry: 7 days

### 3. UI Renderer (`assets/js/assessment/ui.js`)

**Responsibility:** Render all screens. Pure functions. No business logic.

**Screens:**
```javascript
renderIntro(config)           // Landing screen
renderProgress(current, total) // Progress bar
renderQuestion(question, index, total) // Question card
renderReview(answers, questions) // Review screen
renderLeadCapture(config)     // Participant form
renderResults(results, config) // Results dashboard
renderLoading()               // Loading state
renderError(message)          // Error state
```

**Design System:**
- Typography: Inter (sans-serif) for UI, Georgia (serif) for reports
- Colours: Terrnix emerald (#059669), slate (#0f172a), white
- Spacing: 8px base grid
- Border radius: 12px cards, 8px buttons, 9999px pills
- Shadows: 0 4px 6px -1px rgba(0,0,0,0.1)
- Transitions: 200ms ease-out

### 4. Scoring Engine (`assets/js/assessment/scoring.js`)

**Responsibility:** Calculate scores, maturity levels, strengths, gaps.

```javascript
class ScoringEngine {
  calculate(answers, config)     // Full calculation
  
  // Returns:
  {
    overall: 72,                    // 0-100
    maturity: 'practitioner',       // from config
    categories: {
      governance: { score: 80, weight: 0.20, weighted: 16.0 },
      data: { score: 65, weight: 0.25, weighted: 16.25 },
      // ...
    },
    strengths: ['governance', 'reporting'],
    gaps: ['engagement', 'data'],
    percentile: 68,                 // vs all completions
    benchmark: {                    // vs industry (if available)
      industry: 'manufacturing',
      average: 58,
      topQuartile: 78
    }
  }
}
```

**Scoring Algorithm:**
```javascript
// 1. Normalise each answer to 0-100
answerScore = (selectedOption.value / maxOptionValue) * 100

// 2. Calculate category score (weighted average)
categoryScore = sum(answerScore * questionWeight) / sum(questionWeights)

// 3. Calculate overall score (weighted categories)
overallScore = sum(categoryScore * category.weight)

// 4. Determine maturity level
maturity = config.maturityLevels.find(l => overallScore >= l.min && overallScore <= l.max)

// 5. Identify strengths (top 2 categories)
strengths = categories.sort((a,b) => b.score - a.score).slice(0, 2)

// 6. Identify gaps (bottom 2 categories)
gaps = categories.sort((a,b) => a.score - b.score).slice(0, 2)
```

### 5. Recommendation Engine (`assets/js/assessment/recommendations.js`)

**Responsibility:** Generate contextual recommendations based on scores, industry, and gaps.

```javascript
class RecommendationEngine {
  generate(results, config, participant = {})  // Generate all recommendations
  
  // Returns:
  {
    priority: [/* top 5 actions */],
    quickWins: [/* immediate actions */],
    articles: [/* related intelligence */],
    calculators: [/* related tools */],
    services: [/* consultation/services */],
    regulations: [/* applicable regulations */],
    roadmap: {
      days30: [/* actions */],
      days60: [/* actions */],
      days90: [/* actions */]
    }
  }
}
```

**Rule Engine:**
```javascript
// Rules defined in JSON, evaluated in priority order
{
  "rules": [
    {
      "id": "scope3-manufacturing",
      "priority": 1,
      "conditions": [
        { "field": "categories.scope3.score", "operator": "<", "value": 50 },
        { "field": "participant.industry", "operator": "in", "value": ["manufacturing", "automotive"] }
      ],
      "actions": {
        "recommendations": ["scope3-supplier-engagement", "cbam-readiness"],
        "articles": ["scope-3-supplier-engagement-2026", "cbam-definitive-phase-july-2026"],
        "calculators": ["carbon-footprint-calculator"],
        "consultation": "scope-3-consultation"
      }
    }
  ]
}
```

### 6. PDF Engine (`assets/js/assessment/pdf.js`)

**Responsibility:** Generate professional PDFs (report and certificate).

```javascript
class PDFEngine {
  async generateReport(results, recommendations, config)  // Multi-page report
  async generateCertificate(results, participant, config)  // A4 landscape certificate
  
  // Lazy-loaded dependencies
  async loadDependencies() {
    // Load jsPDF, html2canvas, qrcode on first use
  }
}
```

**Lazy Loading:**
```javascript
// Only load when user clicks download
const pdfEngine = new PDFEngine();
// Dependencies not loaded yet

button.addEventListener('click', async () => {
  await pdfEngine.loadDependencies(); // ~150KB gzipped
  await pdfEngine.generateReport(...);
});
```

### 7. Certificate Engine (`assets/js/assessment/certificate.js`)

**Responsibility:** Generate premium certificates with verification.

```javascript
class CertificateEngine {
  generate(results, participant, config)     // Returns PDF blob
  generateId(assessmentCode)                  // TRX-CAR-20260715-A7F42K
  generateQR(url)                             // Returns data URL
  verify(id)                                  // Call backend API
}
```

### 8. Lead Capture (`assets/js/assessment/lead-capture.js`)

**Responsibility:** Form handling, validation, submission, consent management.

```javascript
class LeadCapture {
  render(config)                    // Render form
  validate(data)                    // Return {valid, errors}
  calculateLeadScore(data, results) // Return 0-100 lead score
  submit(data, results)             // POST to backend
  
  // Lead score factors:
  // - Assessment completed: +30
  // - Score > 70: +20
  // - Company provided: +15
  // - Industry provided: +10
  // - Job title (director+): +15
  // - Newsletter consent: +10
  // - Calculator clicked: +5
  // - Consultation clicked: +10
}
```

### 9. Analytics (`assets/js/assessment/analytics.js`)

**Responsibility:** Track all events with GA4.

```javascript
class AssessmentAnalytics {
  track(event, params)              // Send to GA4
  
  // All events:
  assessment_view(params)
  assessment_start(params)
  assessment_progress(params)       // {question, total, percentage}
  assessment_complete(params)       // {score, maturity, duration}
  participant_details(params)       // {has_newsletter_consent}
  certificate_download(params)      // {score, type}
  report_download(params)           // {score}
  consultation_click(params)        // {location}
  newsletter_consent(params)        // {granted}
  recommended_article_click(params) // {article_id}
  recommended_calculator_click(params) // {calculator_id}
  share_click(params)               // {method}
}
```

### 10. Share System (`assets/js/assessment/share.js`)

**Responsibility:** Generate secure shareable URLs.

```javascript
class ShareSystem {
  async generateToken(results, participant)  // POST to backend, get token
  
  // Token format: 32-character random string
  // URL: /assessments/{slug}/result?t={token}
  
  // Token contains (server-side):
  // - Assessment ID
  // - Score (anonymised ranges: 0-49, 50-69, 70-84, 85-100)
  // - Maturity level
  // - Category scores (anonymised)
  // - Recommendations
  // - Timestamp
  // - Expiry: 90 days
  
  // Token does NOT contain:
  // - Name
  // - Email
  // - Company
  // - Any PII
}
```

---

## File Structure

```
assets/
  js/
    assessment/
      core.js              # AssessmentEngine class
      state.js             # AssessmentState class
      ui.js                # UI renderer functions
      scoring.js           # ScoringEngine class
      recommendations.js   # RecommendationEngine class
      pdf.js               # PDFEngine class
      certificate.js       # CertificateEngine class
      lead-capture.js      # LeadCapture class
      analytics.js         # AssessmentAnalytics class
      share.js             # ShareSystem class
      utils.js             # Helpers, validators, formatters
      index.js             # Module exports, initialisation
    vendor/
      jspdf.umd.min.js     # Lazy-loaded
      html2canvas.min.js   # Lazy-loaded
      qrcode.min.js        # Lazy-loaded
      chart.umd.min.js     # Already loaded globally
  css/
    assessment.css         # Assessment-specific styles
  images/
    terrnix-logo.png       # 300x100px, transparent
    signature.png          # 200x80px
    watermark.png          # Subtle background watermark
data/
  assessments/
    carbon-accounting-readiness.json
    esg-maturity.json
    csrd-readiness.json
    cbam-readiness.json
    net-zero-readiness.json
    scope-3-readiness.json
    energy-transition.json
    iso14064-readiness.json
    supply-chain-sustainability.json
assessments/
  index.html             # Assessment directory listing
  carbon-accounting-readiness/
    index.html           # Landing page (SEO-optimised)
  esg-maturity/
    index.html           # Landing page
certificate/
  verify.html            # Verification page
```

---

## Assessment JSON Contract

Every assessment JSON must conform to the schema defined in `ASSESSMENT_JSON_SCHEMA.md`.

**Key Requirements:**
- `id`: Unique identifier (kebab-case)
- `slug`: URL-friendly identifier
- `version`: Semantic versioning
- `categories`: 3-7 categories with weights summing to 1.0
- `questions`: 15-30 questions mapped to categories
- `maturityLevels`: 3-5 levels with score ranges
- `recommendations`: Rule-based recommendation pool
- `certificateRules`: Thresholds for certificate types
- `reportSections`: Ordered list of report sections
- `relatedContent`: Articles, calculators, services

---

## Performance Budget

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | < 1.0s | 1.5s |
| Largest Contentful Paint | < 1.5s | 2.5s |
| Time to Interactive | < 2.0s | 3.5s |
| Cumulative Layout Shift | < 0.05 | 0.1 |
| Total JS (initial) | < 30KB | 50KB |
| Total JS (with lazy deps) | < 200KB | 300KB |
| JSON load | < 100ms | 200ms |
| PDF generation | < 2s | 5s |

---

## Security Model

| Layer | Implementation |
|-------|---------------|
| Data at rest | AES-256-GCM encrypted localStorage |
| Data in transit | HTTPS only |
| Token generation | crypto.getRandomValues(), 256-bit |
| Token expiry | 90 days |
| Rate limiting | 5 assessments/hour/IP |
| Input sanitisation | DOMPurify for all user input |
| XSS prevention | CSP headers, no inline scripts |
| PII exposure | No PII in URLs, tokens, or verification |

---

## SEO Strategy

Every assessment landing page includes:

```html
<!-- Meta -->
<title>{title} | Terrnix Sustainability Assessment</title>
<meta name="description" content="{description}">
<meta name="keywords" content="{keywords}">

<!-- Open Graph -->
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{ogImage}">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{ogImage}">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "{title}",
  "description": "{description}",
  "educationalLevel": "{difficulty}",
  "timeRequired": "{estimatedDuration}",
  "about": {
    "@type": "Thing",
    "name": "Sustainability Assessment"
  }
}
</script>

<!-- Canonical -->
<link rel="canonical" href="https://terrnix.com/assessments/{slug}/">

<!-- Breadcrumb -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://terrnix.com/"},
    {"@type": "ListItem", "position": 2, "name": "Assessments", "item": "https://terrnix.com/assessments/"},
    {"@type": "ListItem", "position": 3, "name": "{title}", "item": "https://terrnix.com/assessments/{slug}/"}
  ]
}
</script>
```

---

## Future AI Integration

The architecture supports future AI enhancements without rewrites:

| Feature | Integration Point | Status |
|---------|------------------|--------|
| AI-generated recommendations | Replace rule engine with LLM API call | Planned |
| Dynamic question adaptation | Adjust question difficulty based on answers | Planned |
| Natural language report | Generate executive summary with AI | Planned |
| Benchmark comparison | AI-analysed industry benchmarks | Planned |
| Chatbot follow-up | Terrnix AI answers assessment questions | Planned |

**AI Integration Design:**
```javascript
// Future: AI recommendation enhancement
class AIRecommendationEngine extends RecommendationEngine {
  async generate(results, config, participant) {
    // 1. Get rule-based recommendations
    const base = super.generate(results, config, participant);
    
    // 2. Enhance with AI (if enabled)
    if (config.ai.enabled) {
      const aiSuggestions = await this.fetchAIRecommendations({
        scores: results.categories,
        industry: participant.industry,
        gaps: results.gaps,
        context: config.ai.context
      });
      base.priority = this.mergeRecommendations(base.priority, aiSuggestions);
    }
    
    return base;
  }
}
```

---

## Implementation Order

| Step | Module | Dependencies | Est. Effort |
|------|--------|-------------|-------------|
| 1 | JSON Schema + First Assessment | None | 4h |
| 2 | Core Engine + State Manager | None | 6h |
| 3 | UI Renderer | Core, State | 8h |
| 4 | Scoring Engine | Core | 4h |
| 5 | Lead Capture | UI | 4h |
| 6 | Recommendation Engine | Scoring | 6h |
| 7 | Results Page | UI, Scoring, Recommendations | 8h |
| 8 | PDF Engine (Report) | Scoring, Recommendations | 8h |
| 9 | Certificate Engine | Scoring | 6h |
| 10 | Analytics | All | 4h |
| 11 | Share System | Backend | 4h |
| 12 | Email Integration | Backend | 4h |
| 13 | Landing Page (SEO) | All | 6h |
| 14 | Production Verification | All | 8h |
| **Total** | | | **90h** |

---

## Success Criteria

The Assessment Platform is production-ready when:

- [ ] All 110 production tests pass
- [ ] Lighthouse score > 90 (Performance, Accessibility, SEO, Best Practices)
- [ ] GA4 events verified in real-time
- [ ] PDF generation < 2 seconds
- [ ] Mobile experience rated excellent
- [ ] WCAG 2.1 AA compliance verified
- [ ] Security audit passed
- [ ] Load test: 100 concurrent assessments
- [ ] First assessment generates > 50 leads in first week
- [ ] User feedback: "This feels professional"
