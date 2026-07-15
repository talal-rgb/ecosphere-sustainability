# Terrnix Assessment Platform Architecture

**Status:** ARCHITECTURE SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0

---

## Overview

Replace the existing trivia quiz with a professional, JSON-configurable Sustainability Assessment Platform.

**Key Principles:**
- JSON-driven: every assessment defined in structured data, not code
- Modular: separate files for UI, scoring, certificates, reports, analytics
- Accessible: keyboard navigation, screen reader support, focus management
- Privacy-first: clear consent, separate marketing opt-in, GDPR-aware
- Mobile-first: responsive design, touch-friendly, performance-optimised

---

## File Structure

```
assets/
  js/
    assessment/
      core.js              # Assessment engine: load, render, navigate
      scoring.js           # Score calculation, maturity levels, breakdowns
      ui.js                # DOM manipulation, progress bar, transitions
      certificate.js       # PDF certificate generation (jsPDF)
      report.js            # PDF assessment report generation (jsPDF)
      lead-capture.js      # Form handling, validation, submission
      analytics.js         # GA4 event tracking
      verification.js      # Certificate verification logic
      utils.js             # Helpers: formatDate, generateId, debounce
    vendor/
      jspdf.umd.min.js     # jsPDF library (self-hosted)
      html2canvas.min.js   # html2canvas for jsPDF (self-hosted)
      qrcode.min.js        # QR code generation (self-hosted)
  css/
    assessment.css         # Assessment-specific styles
  images/
    terrnix-logo.png       # High-res logo for certificates
    signature.png          # Authorised signature image
data/
  assessments/
    carbon-readiness.json      # Carbon Accounting Readiness Assessment
    esg-maturity.json          # ESG Maturity Assessment
    csrd-readiness.json        # CSRD Readiness Assessment
    cbam-readiness.json        # CBAM Readiness Assessment
    sustainability-leadership.json  # Sustainability Leadership Assessment
certificate/
  verify.html                # Certificate verification page
  index.html                 # Redirect to main site
```

---

## Assessment JSON Schema

```json
{
  "id": "carbon-readiness",
  "title": "Carbon Accounting Readiness Assessment",
  "description": "Evaluate your organisation's carbon accounting maturity across governance, data collection, reporting, and strategy.",
  "estimatedTime": "8 minutes",
  "version": "1.0",
  "categories": [
    {
      "id": "governance",
      "name": "Governance & Accountability",
      "description": "Board oversight, carbon ownership, and accountability structures",
      "weight": 0.20
    },
    {
      "id": "data",
      "name": "Carbon Data Collection",
      "description": "Scope 1, 2, and 3 data coverage, quality, and verification",
      "weight": 0.25
    },
    {
      "id": "reporting",
      "name": "Reporting & Disclosure",
      "description": "Alignment with GHG Protocol, CSRD, ISSB, CDP, and other frameworks",
      "weight": 0.20
    },
    {
      "id": "targets",
      "name": "Targets & Strategy",
      "description": "Science-based targets, net-zero commitments, and decarbonisation plans",
      "weight": 0.20
    },
    {
      "id": "engagement",
      "name": "Stakeholder Engagement",
      "description": "Supplier engagement, internal communication, and external transparency",
      "weight": 0.15
    }
  ],
  "maturityLevels": [
    { "min": 0, "max": 49, "label": "Foundation", "description": "Early stage. Basic awareness but limited formal processes." },
    { "min": 50, "max": 69, "label": "Developing", "description": "Some processes in place. Significant gaps remain." },
    { "min": 70, "max": 84, "label": "Practitioner", "description": "Mature processes. Most core elements operational." },
    { "min": 85, "max": 100, "label": "Advanced", "description": "Leading practice. Comprehensive, verified, and continuously improving." }
  ],
  "certificateThresholds": [
    { "min": 0, "max": 49, "type": "completion", "label": "Certificate of Completion" },
    { "min": 50, "max": 69, "type": "achievement", "label": "Foundation Achievement" },
    { "min": 70, "max": 84, "type": "achievement", "label": "Practitioner Achievement" },
    { "min": 85, "max": 100, "type": "achievement", "label": "Advanced Achievement" }
  ],
  "questions": [
    {
      "id": "q1",
      "text": "Does your organisation have a board-level committee or designated director accountable for carbon emissions?",
      "category": "governance",
      "type": "single",
      "options": [
        { "value": 0, "label": "No formal accountability", "score": 0 },
        { "value": 1, "label": "One person has this as part of their role", "score": 25 },
        { "value": 2, "label": "Dedicated sustainability director or team", "score": 50 },
        { "value": 3, "label": "Board-level committee with regular reporting", "score": 100 }
      ],
      "required": true
    }
  ],
  "recommendations": [
    {
      "condition": "category:governance < 50",
      "priority": 1,
      "title": "Establish board-level carbon accountability",
      "description": "Assign a director or create a committee with clear carbon accountability and quarterly reporting to the board.",
      "resources": [
        { "type": "article", "title": "Board-Level ESG Oversight", "url": "/sustainability-intelligence/2026/06/esg-board-oversight/" },
        { "type": "tool", "title": "Carbon Footprint Calculator", "url": "/carbon-accounting/carbon-footprint-calculator/" }
      ]
    }
  ],
  "relatedTools": [
    { "title": "Carbon Footprint Calculator", "url": "/carbon-accounting/carbon-footprint-calculator/" },
    { "title": "Scope 3 Guide", "url": "/carbon-accounting/scope-3-emissions/" }
  ],
  "relatedArticles": [
    { "title": "GHG Protocol Scope 3 Revisions 2026", "url": "/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/" }
  ],
  "consultationCTA": {
    "title": "Book a Carbon Accounting Consultation",
    "description": "Speak with a Terrnix expert about your carbon accounting challenges.",
    "url": "#contact"
  }
}
```

---

## Core Modules

### 1. assessment/core.js

**Responsibilities:**
- Load assessment JSON
- Manage assessment state (current question, answers, progress)
- Render question screens
- Handle navigation (previous, next, review, submit)
- Save/restore session (localStorage with encryption)

**State Object:**
```javascript
{
  assessmentId: 'carbon-readiness',
  startedAt: '2026-07-15T14:30:00Z',
  answers: { q1: 2, q2: 1, ... },
  currentQuestion: 5,
  completed: false,
  participant: null, // populated after lead capture
  sessionId: 'uuid'
}
```

### 2. assessment/scoring.js

**Responsibilities:**
- Calculate category scores (weighted average)
- Calculate overall score
- Determine maturity level
- Identify strengths (top 2 categories)
- Identify gaps (bottom 2 categories)
- Generate priority recommendations
- Map scores to recommended actions

**Scoring Algorithm:**
```javascript
// Category score = weighted average of question scores
// Overall score = sum(category score * category weight)
// Maturity level = lookup in maturityLevels array
```

### 3. assessment/certificate.js

**Responsibilities:**
- Generate professional PDF certificate using jsPDF
- A4 landscape format
- Include: logo, participant name, assessment title, date, score, maturity level, unique ID, verification URL, QR code, disclaimer
- No browser print dialog
- Filename: `terrnix-certificate-{assessment-id}-{name}-{date}.pdf`

**Certificate ID Format:**
```
TRX-{assessment-code}-{YYYYMMDD}-{random}
Example: TRX-CAR-20260715-A7F42K
```

### 4. assessment/report.js

**Responsibilities:**
- Generate multi-page PDF assessment report
- Cover page, executive summary, category charts, strengths, gaps, recommendations, roadmap, tools, articles, CTA, methodology, disclaimer
- Use jsPDF with autoTable for structured layout
- Filename: `terrnix-assessment-report-{assessment-id}-{name}-{date}.pdf`

### 5. assessment/lead-capture.js

**Responsibilities:**
- Render participant details form
- Validate inputs (name required, email required + valid format)
- Optional fields: company, job title, country
- Separate newsletter checkbox (unchecked by default)
- Privacy Policy link
- Submit to backend API
- Store consent timestamp

**Form Fields:**
```
Full Name* [text]
Email Address* [email]
Company [text]
Job Title [text]
Country [select]

[ ] I agree to receive my personalised assessment results and certificate of achievement.
   [Privacy Policy]

[ ] Yes, I would like to receive Terrnix sustainability intelligence and product updates.
   (Optional. You can unsubscribe at any time.)

[Submit Assessment]
```

### 6. assessment/analytics.js

**Events:**
```javascript
// Assessment lifecycle
event: 'assessment_view', params: { assessment_id, assessment_name, source, utm_campaign }
event: 'assessment_start', params: { assessment_id, assessment_name }
event: 'assessment_question_answered', params: { assessment_id, question_id, question_number, category }
event: 'assessment_details_submitted', params: { assessment_id, has_newsletter_consent }
event: 'assessment_complete', params: { assessment_id, score, maturity_level, duration_seconds }

// Downloads
event: 'assessment_report_download', params: { assessment_id, score }
event: 'assessment_certificate_download', params: { assessment_id, score, certificate_type }

// Engagement
event: 'assessment_consultation_click', params: { assessment_id, cta_location }
event: 'assessment_newsletter_consent', params: { assessment_id, consent_granted }
event: 'assessment_tool_click', params: { assessment_id, tool_title }
event: 'assessment_article_click', params: { assessment_id, article_title }
```

### 7. assessment/verification.js

**Responsibilities:**
- Parse certificate ID from URL
- Verify ID exists in database
- Display: status, participant name (first name + last initial), assessment name, issue date, score/level
- Do NOT expose email address
- Return 404 for invalid IDs

**Verification Page:**
```
/certificate/verify/?id=TRX-CAR-20260715-A7F42K
```

---

## Backend API Endpoints

```
POST /api/assessment/submit
  Body: { assessmentId, answers, participant, consent, sourceUrl, utmParams, sessionId }
  Response: { success, score, maturityLevel, categoryScores, certificateId, reportUrl }

POST /api/assessment/lead
  Body: { assessmentId, name, email, company, jobTitle, country, newsletterConsent, consentTimestamp, sourceUrl, utmParams }
  Response: { success, leadId }

GET /api/certificate/verify?id=TRX-CAR-20260715-A7F42K
  Response: { valid, participantName, assessmentName, issueDate, score, maturityLevel }

POST /api/email/assessment-results
  Body: { leadId, certificateId, reportUrl }
  Response: { success, messageId }
```

---

## Data Storage

### Lead Record
```javascript
{
  leadId: 'uuid',
  discipline: 'Assessment Participant',
  assessmentId: 'carbon-readiness',
  assessmentTitle: 'Carbon Accounting Readiness Assessment',
  name: 'Tallal Belkheiri',
  email: 'tallal@example.com',
  company: 'Terrnix',
  jobTitle: 'Founder',
  country: 'Morocco',
  score: 72,
  maturityLevel: 'Practitioner',
  categoryScores: { governance: 80, data: 65, reporting: 70, targets: 75, engagement: 60 },
  certificateId: 'TRX-CAR-20260715-A7F42K',
  certificateType: 'achievement',
  certificateDownloaded: false,
  reportDownloaded: false,
  newsletterConsent: true,
  consentTimestamp: '2026-07-15T14:35:00Z',
  sourceUrl: 'https://terrnix.com/?utm_source=linkedin&utm_campaign=carbon-assessment',
  utmSource: 'linkedin',
  utmMedium: 'social',
  utmCampaign: 'carbon-assessment',
  submissionTimestamp: '2026-07-15T14:35:00Z'
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create assessment JSON schema and first assessment (Carbon Accounting Readiness)
- [ ] Build core.js: load, render, navigate
- [ ] Build scoring.js: calculate scores and maturity
- [ ] Build ui.js: progress bar, question cards, results screen
- [ ] Add keyboard navigation and accessibility

### Phase 2: Lead Capture (Week 1)
- [ ] Build lead-capture.js: form, validation, submission
- [ ] Add newsletter checkbox (unchecked by default)
- [ ] Add Privacy Policy link
- [ ] Backend: `/api/assessment/submit` and `/api/assessment/lead`

### Phase 3: Certificates (Week 2)
- [ ] Build certificate.js: jsPDF A4 landscape certificate
- [ ] Add Terrnix logo, signature, disclaimer
- [ ] Generate unique certificate ID
- [ ] Build verification page `/certificate/verify/`

### Phase 4: Reports (Week 2)
- [ ] Build report.js: multi-page PDF report
- [ ] Cover page, charts, recommendations, roadmap
- [ ] Separate download buttons for report and certificate

### Phase 5: Email & Analytics (Week 3)
- [ ] Integrate Brevo for result emails
- [ ] Build analytics.js: all GA4 events
- [ ] Verify events in production

### Phase 6: Additional Assessments (Week 4)
- [ ] Create ESG Maturity Assessment JSON
- [ ] Create CSRD Readiness Assessment JSON
- [ ] Create CBAM Readiness Assessment JSON
- [ ] Create Sustainability Leadership Assessment JSON

---

## Technology Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| PDF Generation | jsPDF + html2canvas | Self-hosted, no external dependencies, A4 landscape support |
| QR Codes | qrcode.js | Self-hosted, lightweight |
| Charts | Chart.js (already loaded) | Reuse existing dependency |
| Analytics | GA4 gtag.js | Already integrated |
| Email | Brevo API | Already integrated |
| Backend | Existing Render backend | Reuse `/api/contact` pattern |
| Storage | Backend database + localStorage | Encrypted localStorage for session |

---

## Accessibility Checklist

- [ ] All interactive elements have visible focus indicators
- [ ] `aria-label` on option buttons
- [ ] `role="progressbar"` on progress bar with `aria-valuenow`
- [ ] Live region for score announcements
- [ ] Keyboard navigation: Tab, Enter, Space, Arrow keys
- [ ] Focus moved to next question on navigation
- [ ] Skip link to main content
- [ ] Color not sole indicator (icons + text for correct/wrong)
- [ ] `alt` text on all images
- [ ] `aria-describedby` linking inputs to help text
- [ ] Reduced motion support (`prefers-reduced-motion`)
- [ ] WCAG 2.1 AA compliance target

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Assessment JSON load | < 100ms |
| PDF generation | < 3s |
| Total JS payload (assessment) | < 50KB gzipped |

---

## Security Considerations

- Certificate IDs: 8-character random alphanumeric (62^8 = 218 trillion combinations)
- Rate limiting: max 5 assessments per IP per hour
- Email validation: MX record check
- XSS prevention: sanitize all user input before DOM insertion
- CSRF tokens for form submission
- Encrypt localStorage session data
- No PII in certificate verification response
