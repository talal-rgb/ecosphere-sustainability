# Terrnix Assessment Analytics Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Infrastructure

---

## Philosophy

Analytics transform assessment data into business intelligence. Every event must be actionable, privacy-respecting, and verifiable in GA4.

**Core Principles:**
1. **Complete visibility:** Track every meaningful interaction
2. **Privacy-first:** No PII in events, anonymise where possible
3. **Actionable:** Events map to business decisions
4. **Verifiable:** Every event tested in GA4 real-time
5. **Future-proof:** Schema supports AI and ML enhancements

---

## Event Taxonomy

### Assessment Lifecycle Events

| Event | Trigger | Parameters | Priority |
|-------|---------|------------|----------|
| `assessment_view` | Landing page loaded | `assessment_id`, `assessment_name`, `source`, `utm_campaign` | Required |
| `assessment_start` | User clicks "Start" | `assessment_id`, `assessment_name` | Required |
| `assessment_progress` | Question answered | `assessment_id`, `question_id`, `question_number`, `category`, `progress_pct` | Required |
| `assessment_complete` | Results calculated | `assessment_id`, `score`, `maturity_level`, `duration_seconds`, `completion_rate` | Required |
| `assessment_abandon` | User leaves mid-assessment | `assessment_id`, `last_question`, `progress_pct`, `time_spent` | Required |

### Conversion Events

| Event | Trigger | Parameters | Priority |
|-------|---------|------------|----------|
| `participant_details` | Lead form submitted | `assessment_id`, `has_newsletter_consent`, `lead_score`, `lead_tier` | Required |
| `certificate_download` | Certificate PDF downloaded | `assessment_id`, `score`, `certificate_type` | Required |
| `report_download` | Report PDF downloaded | `assessment_id`, `score` | Required |
| `consultation_click` | CTA clicked | `assessment_id`, `cta_location`, `consultation_type` | Required |

### Engagement Events

| Event | Trigger | Parameters | Priority |
|-------|---------|------------|----------|
| `newsletter_consent` | Checkbox toggled | `assessment_id`, `consent_granted` | Required |
| `recommended_article_click` | Article link clicked | `assessment_id`, `article_id`, `article_title` | Required |
| `recommended_calculator_click` | Calculator link clicked | `assessment_id`, `calculator_id`, `calculator_title` | Required |
| `recommended_service_click` | Service link clicked | `assessment_id`, `service_id`, `service_title` | Required |
| `share_click` | Share button clicked | `assessment_id`, `share_method` | Required |
| `share_copy_link` | Link copied | `assessment_id` | Optional |

### Navigation Events

| Event | Trigger | Parameters | Priority |
|-------|---------|------------|----------|
| `assessment_previous` | Previous clicked | `assessment_id`, `from_question`, `to_question` | Optional |
| `assessment_review` | Review screen shown | `assessment_id`, `questions_reviewed` | Optional |
| `assessment_lead_form_view` | Lead form displayed | `assessment_id` | Optional |

---

## GA4 Configuration

### Custom Dimensions

| Dimension Name | Scope | Description |
|---------------|-------|-------------|
| `assessment_id` | Event | Assessment identifier |
| `assessment_name` | Event | Assessment display name |
| `maturity_level` | Event | Result maturity level |
| `industry` | User | Participant industry |
| `lead_tier` | User | Hot/Warm/Cool/Cold |
| `certificate_type` | Event | Completion/Achievement |

### Custom Metrics

| Metric Name | Unit | Description |
|------------|------|-------------|
| `assessment_score` | Integer | Overall score (0-100) |
| `assessment_duration` | Seconds | Time to complete |
| `lead_score` | Integer | Calculated lead score (0-100) |
| `questions_answered` | Integer | Number of questions answered |

### Event Parameters (All Events)

```javascript
// Base parameters included in every event
const baseParams = {
  assessment_id: config.id,
  assessment_name: config.metadata.title,
  assessment_version: config.version,
  timestamp: new Date().toISOString(),
  session_id: getSessionId(),
  source_url: window.location.href
};
```

---

## Analytics Class

```javascript
class AssessmentAnalytics {
  constructor(config) {
    this.config = config;
    this.enabled = this.checkGA4();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }
  
  checkGA4() {
    return typeof gtag !== 'undefined' && typeof gtag === 'function';
  }
  
  generateSessionId() {
    return 'sess-' + Math.random().toString(36).substring(2, 15);
  }
  
  // Base tracking method
  track(eventName, params = {}) {
    if (!this.enabled) {
      console.warn('GA4 not available, event not tracked:', eventName);
      return;
    }
    
    const eventParams = {
      ...this.getBaseParams(),
      ...params
    };
    
    gtag('event', eventName, eventParams);
    
    // Debug log in development
    if (window.location.hostname === 'localhost') {
      console.log('[Analytics]', eventName, eventParams);
    }
  }
  
  getBaseParams() {
    return {
      assessment_id: this.config.id,
      assessment_name: this.config.metadata.title,
      assessment_version: this.config.version,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    };
  }
  
  // Assessment lifecycle events
  trackView(source = null, utm = {}) {
    this.track('assessment_view', {
      source: source || document.referrer || 'direct',
      utm_source: utm.source || null,
      utm_medium: utm.medium || null,
      utm_campaign: utm.campaign || null,
      utm_content: utm.content || null
    });
  }
  
  trackStart() {
    this.track('assessment_start', {
      start_time: new Date().toISOString()
    });
  }
  
  trackProgress(questionId, questionNumber, category, progressPct) {
    this.track('assessment_progress', {
      question_id: questionId,
      question_number: questionNumber,
      category: category,
      progress_pct: Math.round(progressPct)
    });
  }
  
  trackComplete(score, maturityLevel, durationSeconds, completionRate) {
    this.track('assessment_complete', {
      score: score,
      maturity_level: maturityLevel,
      duration_seconds: Math.round(durationSeconds),
      completion_rate: Math.round(completionRate)
    });
  }
  
  trackAbandon(lastQuestion, progressPct, timeSpent) {
    this.track('assessment_abandon', {
      last_question: lastQuestion,
      progress_pct: Math.round(progressPct),
      time_spent_seconds: Math.round(timeSpent / 1000)
    });
  }
  
  // Conversion events
  trackParticipantDetails(hasNewsletterConsent, leadScore, leadTier) {
    this.track('participant_details', {
      has_newsletter_consent: hasNewsletterConsent,
      lead_score: leadScore,
      lead_tier: leadTier
    });
  }
  
  trackCertificateDownload(score, certificateType) {
    this.track('certificate_download', {
      score: score,
      certificate_type: certificateType
    });
  }
  
  trackReportDownload(score) {
    this.track('report_download', {
      score: score
    });
  }
  
  trackConsultationClick(location, consultationType) {
    this.track('consultation_click', {
      cta_location: location,
      consultation_type: consultationType
    });
  }
  
  // Engagement events
  trackNewsletterConsent(consentGranted) {
    this.track('newsletter_consent', {
      consent_granted: consentGranted
    });
  }
  
  trackArticleClick(articleId, articleTitle) {
    this.track('recommended_article_click', {
      article_id: articleId,
      article_title: articleTitle
    });
  }
  
  trackCalculatorClick(calculatorId, calculatorTitle) {
    this.track('recommended_calculator_click', {
      calculator_id: calculatorId,
      calculator_title: calculatorTitle
    });
  }
  
  trackServiceClick(serviceId, serviceTitle) {
    this.track('recommended_service_click', {
      service_id: serviceId,
      service_title: serviceTitle
    });
  }
  
  trackShareClick(method) {
    this.track('share_click', {
      share_method: method
    });
  }
  
  trackShareCopyLink() {
    this.track('share_copy_link', {});
  }
  
  // Navigation events
  trackPrevious(fromQuestion, toQuestion) {
    this.track('assessment_previous', {
      from_question: fromQuestion,
      to_question: toQuestion
    });
  }
  
  trackReview(questionsReviewed) {
    this.track('assessment_review', {
      questions_reviewed: questionsReviewed
    });
  }
  
  trackLeadFormView() {
    this.track('assessment_lead_form_view', {});
  }
  
  // Utility
  getDuration() {
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}
```

---

## UTM Parameter Capture

### URL Parsing

```javascript
function parseUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
    content: params.get('utm_content'),
    term: params.get('utm_term')
  };
}

// Store in session for persistence
function storeUtmParams() {
  const utms = parseUtmParams();
  if (utms.source) {
    sessionStorage.setItem('assessment_utm', JSON.stringify(utms));
  }
}

// Retrieve stored UTMs
function getStoredUtmParams() {
  try {
    return JSON.parse(sessionStorage.getItem('assessment_utm')) || {};
  } catch {
    return {};
  }
}
```

### UTM Attribution in Lead Record

```javascript
{
  utmSource: 'linkedin',
  utmMedium: 'social',
  utmCampaign: 'carbon-assessment-july',
  utmContent: 'flagship-post',
  utmTerm: null
}
```

---

## Funnel Analysis

### Assessment Funnel

```
1. assessment_view          → 100% (baseline)
2. assessment_start         → 65% (35% drop-off)
3. assessment_progress (50%) → 55% (10% drop-off)
4. assessment_progress (100%)→ 48% (7% drop-off)
5. participant_details      → 42% (6% drop-off)
6. assessment_complete      → 40% (2% drop-off)
7. certificate_download     → 15% (25% drop-off)
8. report_download          → 12% (3% drop-off)
9. consultation_click       → 3% (9% drop-off)
```

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Start rate | > 60% | < 50% |
| Completion rate | > 45% | < 35% |
| Lead capture rate | > 40% | < 30% |
| Certificate download rate | > 15% | < 10% |
| Consultation click rate | > 3% | < 1% |

---

## Dashboard Queries

### GA4 Exploration Queries

**1. Assessment Performance Overview**
```
Dimensions: assessment_name, maturity_level
Metrics: assessment_complete (count), assessment_score (average)
Filter: event_name = "assessment_complete"
```

**2. Lead Quality by Source**
```
Dimensions: source, lead_tier
Metrics: participant_details (count), lead_score (average)
Filter: event_name = "participant_details"
```

**3. Conversion Funnel**
```
Steps: assessment_view → assessment_start → assessment_complete → participant_details → certificate_download
```

**4. Content Engagement**
```
Dimensions: article_title, calculator_title
Metrics: recommended_article_click (count), recommended_calculator_click (count)
```

---

## Privacy and Compliance

### Data Minimisation

| What We Track | What We Don't Track |
|---------------|---------------------|
| Assessment ID | Participant name |
| Score (0-100) | Email address |
| Maturity level | Company name |
| Question number | Job title |
| Category name | Industry |
| Duration | Country |
| UTM parameters | IP address (hashed) |

### Anonymisation

```javascript
// Hash IP address for fraud prevention
async function hashIp(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## Testing

### GA4 Real-Time Verification

```javascript
// Verify events in GA4 real-time report
class AnalyticsVerifier {
  constructor() {
    this.events = [];
    this.setupListener();
  }
  
  setupListener() {
    // Intercept gtag calls
    const originalGtag = window.gtag;
    window.gtag = (...args) => {
      if (args[0] === 'event') {
        this.events.push({
          event: args[1],
          params: args[2],
          timestamp: new Date().toISOString()
        });
      }
      originalGtag.apply(window, args);
    };
  }
  
  verify(eventName, expectedParams = {}) {
    const event = this.events.find(e => e.event === eventName);
    if (!event) return { found: false, error: `Event ${eventName} not found` };
    
    const missing = Object.keys(expectedParams).filter(key => 
      event.params[key] !== expectedParams[key]
    );
    
    return {
      found: true,
      params: event.params,
      missing: missing.length > 0 ? missing : null
    };
  }
  
  getEvents() {
    return this.events;
  }
  
  clear() {
    this.events = [];
  }
}
```

### Test Cases

```javascript
describe('AssessmentAnalytics', () => {
  let analytics;
  let verifier;
  
  beforeEach(() => {
    analytics = new AssessmentAnalytics(mockConfig);
    verifier = new AnalyticsVerifier();
  });
  
  afterEach(() => {
    verifier.clear();
  });
  
  test('tracks assessment_view with correct params', () => {
    analytics.trackView('linkedin', { campaign: 'carbon-assessment' });
    const result = verifier.verify('assessment_view', { assessment_id: 'carbon-accounting-readiness' });
    expect(result.found).toBe(true);
    expect(result.params.source).toBe('linkedin');
  });
  
  test('tracks assessment_complete with score', () => {
    analytics.trackComplete(72, 'Practitioner', 480, 100);
    const result = verifier.verify('assessment_complete', { score: 72, maturity_level: 'Practitioner' });
    expect(result.found).toBe(true);
    expect(result.params.duration_seconds).toBe(480);
  });
  
  test('tracks certificate_download', () => {
    analytics.trackCertificateDownload(72, 'achievement');
    const result = verifier.verify('certificate_download', { score: 72, certificate_type: 'achievement' });
    expect(result.found).toBe(true);
  });
  
  test('does not track when GA4 unavailable', () => {
    analytics.enabled = false;
    analytics.trackStart();
    expect(verifier.getEvents()).toHaveLength(0);
  });
});
```

---

## Implementation Checklist

- [ ] GA4 measurement ID configured
- [ ] AssessmentAnalytics class implemented
- [ ] All required events tracked
- [ ] Custom dimensions configured in GA4
- [ ] Custom metrics configured in GA4
- [ ] UTM parameter capture implemented
- [ ] UTM storage in sessionStorage
- [ ] Funnel analysis configured
- [ ] Real-time verification working
- [ ] Debug logging in development
- [ ] Privacy-compliant (no PII in events)
- [ ] IP address hashing
- [ ] Event batching (optional)
- [ ] Error handling for GA4 failures
