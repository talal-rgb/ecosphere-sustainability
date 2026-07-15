# Terrnix Lead Capture Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Infrastructure

---

## Philosophy

Lead capture is the bridge between assessment completion and business value. Every participant becomes a qualified lead. The experience must balance data collection with conversion optimisation.

**Core Principles:**
1. **Minimal friction:** Only require what's essential
2. **Clear value:** Explain why each field matters
3. **Transparent consent:** Separate, explicit opt-ins
4. **Instant gratification:** Results delivered immediately
5. **Quality scoring:** Automatically grade lead potential

---

## Lead Capture Flow

```
Assessment Complete
       │
       ▼
┌─────────────────────┐
│   Results Screen    │  ← Score displayed, value established
│   (Preview)         │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Lead Form         │  ← "Enter details to unlock full report"
│   (Required fields) │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Consent Checkboxes│  ← Required + optional, both unchecked
│   (Dual consent)    │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Submit            │  ← Validation, loading state
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Full Results      │  ← Report, certificate, recommendations
│   (Unlocked)        │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Email Delivery    │  ← Async, non-blocking
│   (Brevo)           │
└─────────────────────┘
```

---

## Form Fields

### Required Fields

| Field | Type | Validation | Purpose |
|-------|------|------------|---------|
| Full Name | text | Min 2 chars, max 100 | Personalise certificate, report, emails |
| Email | email | Valid format, MX check | Deliver results, certificate, report |

### Optional Fields

| Field | Type | Validation | Purpose |
|-------|------|------------|---------|
| Company | text | Max 100 | Contextualise recommendations, qualify lead |
| Job Title | text | Max 100 | Understand role, tailor content |
| Industry | select | From list | Industry-specific recommendations, benchmarking |
| Country | select | ISO 3166 | Regional compliance context, localise content |

### Field Order

```
1. Full Name *          ← First (personal)
2. Email Address *      ← Second (delivery)
3. Company              ← Third (context)
4. Job Title            ← Fourth (role)
5. Industry             ← Fifth (segmentation)
6. Country              ← Sixth (localisation)
```

**Rationale:** Required fields first to minimise abandonment. Optional fields ordered by business value.

---

## Form UI

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Unlock Your Full Results                                   │
│                                                             │
│  Enter your details to receive your personalised report,   │
│  verified certificate, and actionable recommendations.     │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Full Name *                                                │
│  [Tallal Belkheiri                    ]                    │
│                                                             │
│  Email Address *                                            │
│  [tallal@terrnix.com                  ]                    │
│                                                             │
│  Company (optional)                                         │
│  [Terrnix                             ]                    │
│                                                             │
│  Job Title (optional)                                       │
│  [Founder                             ]                    │
│                                                             │
│  Industry (optional)                                        │
│  [▼ Technology                        ]                    │
│                                                             │
│  Country (optional)                                         │
│  [▼ Morocco                           ]                    │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  [ ] I agree to receive my personalised assessment results │
│    and verified certificate. I have read and agree to the  │
│    [Privacy Policy]. *                                      │
│                                                             │
│  [ ] I would like to receive Terrnix Sustainability        │
│    Intelligence and product updates. (Optional)            │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  [Unlock My Results]                                        │
│                                                             │
│  🔒 Your information is secure. We never share your data.  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Input Styling

```css
.assessment-input {
  width: 100%;
  background: rgba(30, 41, 59, 0.6);        /* slate-800/60 */
  border: 1px solid rgba(71, 85, 105, 0.5);  /* slate-600/50 */
  border-radius: 0.75rem;                     /* rounded-xl */
  padding: 0.75rem 1rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease-out;
}

.assessment-input:focus {
  outline: none;
  border-color: rgba(16, 185, 129, 0.5);     /* emerald-500/50 */
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.assessment-input::placeholder {
  color: rgba(100, 116, 139, 1);             /* slate-500 */
}

.assessment-input--error {
  border-color: rgba(239, 68, 68, 0.5);      /* red-500/50 */
}

.assessment-input--error:focus {
  border-color: rgba(239, 68, 68, 0.8);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

### Validation Messages

```css
.assessment-error {
  color: rgb(248, 113, 113);                /* red-400 */
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
```

**Error Messages:**
| Field | Error | Message |
|-------|-------|---------|
| Full Name | Empty | "Please enter your full name" |
| Full Name | Too short | "Name must be at least 2 characters" |
| Email | Empty | "Please enter your email address" |
| Email | Invalid format | "Please enter a valid email address" |
| Email | MX check fails | "Please enter a valid email domain" |
| Consent | Unchecked | "You must agree to receive your results" |

---

## Consent Flow

### Checkbox 1: Results Delivery (Required)

```
[ ] I agree to receive my personalised assessment results and verified
    certificate. I have read and agree to the [Privacy Policy]. *
```

- **State:** Required, unchecked by default
- **Purpose:** Legal basis for processing (contractual necessity)
- **Consequence if unchecked:** Form cannot be submitted
- **Links:** Privacy Policy (opens in new tab)

### Checkbox 2: Newsletter (Optional)

```
[ ] I would like to receive Terrnix Sustainability Intelligence and
    product updates. (Optional)
```

- **State:** Optional, unchecked by default
- **Purpose:** Marketing consent (legitimate interest with consent)
- **Consequence if unchecked:** User still receives results, no newsletter
- **Consequence if checked:** Added to Brevo newsletter list with tag

### Key Requirements

1. **Never pre-check:** Both checkboxes must be unchecked by default
2. **Never bundle:** Results delivery and newsletter are separate
3. **Never require newsletter:** User can get results without marketing consent
4. **Always link Privacy Policy:** Visible, clickable link near consent
5. **Store verbatim text:** Exact consent text stored with timestamp

---

## Lead Scoring

### Scoring Model

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Assessment Completed | 30 | Fixed value |
| Score > 70 | 20 | If overall score > 70 |
| Company Provided | 15 | If company field filled |
| Industry Provided | 10 | If industry selected |
| Job Title (Director+) | 15 | If title contains "director", "ceo", "cfo", "cto", "vp", "head", "chief" |
| Newsletter Consent | 10 | If newsletter checkbox checked |
| Calculator Clicked | 5 | If user clicked calculator link |
| Consultation Clicked | 10 | If user clicked consultation CTA |
| Report Downloaded | 5 | If user downloaded report |
| Certificate Downloaded | 5 | If user downloaded certificate |

**Lead Score Tiers:**
| Score | Tier | Action |
|-------|------|--------|
| 80–100 | Hot | Immediate sales follow-up |
| 60–79 | Warm | Nurture with targeted content |
| 40–59 | Cool | Add to newsletter, monitor |
| 0–39 | Cold | Newsletter only |

### Lead Score Calculation

```javascript
function calculateLeadScore(participant, results, interactions = {}) {
  let score = 0;
  
  // Assessment completed (30)
  score += 30;
  
  // Score > 70 (20)
  if (results.overall.score > 70) score += 20;
  
  // Company provided (15)
  if (participant.company?.trim()) score += 15;
  
  // Industry provided (10)
  if (participant.industry) score += 10;
  
  // Job title (15)
  const seniorTitles = ['director', 'ceo', 'cfo', 'cto', 'vp', 'head', 'chief', 'president', 'manager'];
  if (seniorTitles.some(t => participant.jobTitle?.toLowerCase().includes(t))) score += 15;
  
  // Newsletter consent (10)
  if (participant.newsletterConsent) score += 10;
  
  // Interactions
  if (interactions.calculatorClicked) score += 5;
  if (interactions.consultationClicked) score += 10;
  if (interactions.reportDownloaded) score += 5;
  if (interactions.certificateDownloaded) score += 5;
  
  return Math.min(100, score);
}
```

---

## Lead Capture Class

```javascript
class LeadCapture {
  constructor(config) {
    this.config = config;
    this.form = null;
    this.validator = new LeadValidator();
  }
  
  render(container) {
    container.innerHTML = this.buildFormHTML();
    this.form = container.querySelector('form');
    this.attachEventListeners();
  }
  
  buildFormHTML() {
    return `
      <div class="assessment-lead-capture">
        <h2 class="text-2xl font-bold text-white mb-2">Unlock Your Full Results</h2>
        <p class="text-slate-400 mb-8">Enter your details to receive your personalised report, verified certificate, and actionable recommendations.</p>
        
        <form id="leadCaptureForm" novalidate>
          <div class="mb-4">
            <label for="leadName" class="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
            <input type="text" id="leadName" name="name" required
              class="assessment-input w-full"
              placeholder="Your full name"
              autocomplete="name">
            <div class="assessment-error hidden" id="leadNameError"></div>
          </div>
          
          <div class="mb-4">
            <label for="leadEmail" class="block text-sm font-medium text-slate-300 mb-1">Email Address *</label>
            <input type="email" id="leadEmail" name="email" required
              class="assessment-input w-full"
              placeholder="your@email.com"
              autocomplete="email">
            <div class="assessment-error hidden" id="leadEmailError"></div>
          </div>
          
          <div class="mb-4">
            <label for="leadCompany" class="block text-sm font-medium text-slate-300 mb-1">Company (optional)</label>
            <input type="text" id="leadCompany" name="company"
              class="assessment-input w-full"
              placeholder="Your company"
              autocomplete="organization">
          </div>
          
          <div class="mb-4">
            <label for="leadJobTitle" class="block text-sm font-medium text-slate-300 mb-1">Job Title (optional)</label>
            <input type="text" id="leadJobTitle" name="jobTitle"
              class="assessment-input w-full"
              placeholder="Your job title"
              autocomplete="organization-title">
          </div>
          
          <div class="mb-4">
            <label for="leadIndustry" class="block text-sm font-medium text-slate-300 mb-1">Industry (optional)</label>
            <select id="leadIndustry" name="industry" class="assessment-input w-full">
              <option value="">Select industry</option>
              ${this.buildIndustryOptions()}
            </select>
          </div>
          
          <div class="mb-6">
            <label for="leadCountry" class="block text-sm font-medium text-slate-300 mb-1">Country (optional)</label>
            <select id="leadCountry" name="country" class="assessment-input w-full">
              <option value="">Select country</option>
              ${this.buildCountryOptions()}
            </select>
          </div>
          
          <div class="mb-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div class="flex items-start gap-3 mb-3">
              <input type="checkbox" id="leadConsent" name="consent" required
                class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20">
              <label for="leadConsent" class="text-slate-300 text-sm leading-relaxed">
                I agree to receive my personalised assessment results and verified certificate.
                I have read and agree to the <a href="/privacy-policy/" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline">Privacy Policy</a>. *
              </label>
            </div>
            <div class="assessment-error hidden" id="leadConsentError"></div>
            
            <div class="flex items-start gap-3">
              <input type="checkbox" id="leadNewsletter" name="newsletter"
                class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20">
              <label for="leadNewsletter" class="text-slate-400 text-sm leading-relaxed">
                I would like to receive Terrnix Sustainability Intelligence and product updates. (Optional)
              </label>
            </div>
          </div>
          
          <button type="submit" id="leadSubmitBtn"
            class="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            Unlock My Results
          </button>
          
          <p class="text-slate-500 text-xs text-center mt-4">
            🔒 Your information is secure. We never share your data with third parties.
          </p>
        </form>
        
        <div class="hidden mt-6" id="leadSuccess">
          <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Your results are ready! Check your inbox for your report and certificate.</span>
            </div>
          </div>
        </div>
        
        <div class="hidden mt-6" id="leadError">
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span id="leadErrorText">Something went wrong. Please try again.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  attachEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    const inputs = this.form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });
  }
  
  validateField(field) {
    const result = this.validator.validate(field);
    
    if (!result.valid) {
      this.showError(field, result.error);
      return false;
    }
    
    this.clearError(field);
    return true;
  }
  
  validateForm() {
    const requiredFields = this.form.querySelectorAll('[required]');
    let valid = true;
    
    requiredFields.forEach(field => {
      if (!this.validateField(field)) valid = false;
    });
    
    return valid;
  }
  
  showError(field, message) {
    field.classList.add('assessment-input--error');
    const errorEl = document.getElementById(`${field.id}Error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }
  
  clearError(field) {
    field.classList.remove('assessment-input--error');
    const errorEl = document.getElementById(`${field.id}Error`);
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) return;
    
    const submitBtn = document.getElementById('leadSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Unlocking...';
    
    try {
      const data = this.collectFormData();
      const result = await this.submit(data);
      
      if (result.success) {
        this.showSuccess();
        this.emit('lead-submitted', { leadId: result.leadId, data });
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      this.showErrorMessage(error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock My Results';
    }
  }
  
  collectFormData() {
    return {
      name: this.form.querySelector('#leadName').value.trim(),
      email: this.form.querySelector('#leadEmail').value.trim(),
      company: this.form.querySelector('#leadCompany').value.trim() || null,
      jobTitle: this.form.querySelector('#leadJobTitle').value.trim() || null,
      industry: this.form.querySelector('#leadIndustry').value || null,
      country: this.form.querySelector('#leadCountry').value || null,
      consent: this.form.querySelector('#leadConsent').checked,
      newsletterConsent: this.form.querySelector('#leadNewsletter').checked,
      consentTimestamp: new Date().toISOString()
    };
  }
  
  async submit(data) {
    const response = await fetch('/api/assessment/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  showSuccess() {
    this.form.classList.add('hidden');
    document.getElementById('leadSuccess').classList.remove('hidden');
  }
  
  showErrorMessage(message) {
    const errorEl = document.getElementById('leadError');
    const errorText = document.getElementById('leadErrorText');
    errorText.textContent = message;
    errorEl.classList.remove('hidden');
  }
  
  buildIndustryOptions() {
    const industries = [
      'Agriculture', 'Automotive', 'Banking', 'Chemicals', 'Construction',
      'Energy', 'Financial Services', 'Food & Beverage', 'Healthcare',
      'Manufacturing', 'Mining', 'Pharmaceuticals', 'Real Estate',
      'Retail', 'Technology', 'Telecommunications', 'Transportation',
      'Utilities', 'Other'
    ];
    return industries.map(i => `<option value="${i.toLowerCase().replace(/\s+/g, '-')}">${i}</option>`).join('');
  }
  
  buildCountryOptions() {
    // ISO 3166 country list
    const countries = [
      { code: 'MA', name: 'Morocco' },
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
      { code: 'ES', name: 'Spain' },
      { code: 'IT', name: 'Italy' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'BE', name: 'Belgium' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'EG', name: 'Egypt' },
      { code: 'ZA', name: 'South Africa' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'KE', name: 'Kenya' },
      { code: 'GH', name: 'Ghana' },
      { code: 'CI', name: "Côte d'Ivoire" },
      { code: 'SN', name: 'Senegal' },
      { code: 'TN', name: 'Tunisia' }
    ];
    return countries.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
  }
  
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`assessment:${event}`, { detail: data }));
  }
}
```

---

## Lead Validator

```javascript
class LeadValidator {
  validate(field) {
    const value = field.value.trim();
    const name = field.name;
    
    switch (name) {
      case 'name':
        return this.validateName(value);
      case 'email':
        return this.validateEmail(value);
      case 'consent':
        return this.validateConsent(field.checked);
      default:
        return { valid: true };
    }
  }
  
  validateName(value) {
    if (!value) return { valid: false, error: 'Please enter your full name' };
    if (value.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
    if (value.length > 100) return { valid: false, error: 'Name must be less than 100 characters' };
    return { valid: true };
  }
  
  validateEmail(value) {
    if (!value) return { valid: false, error: 'Please enter your email address' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true };
  }
  
  validateConsent(checked) {
    if (!checked) return { valid: false, error: 'You must agree to receive your results' };
    return { valid: true };
  }
}
```

---

## Backend API

### Submit Lead

```http
POST /api/assessment/lead
Content-Type: application/json

{
  "assessmentId": "carbon-accounting-readiness",
  "name": "Tallal Belkheiri",
  "email": "tallal@terrnix.com",
  "company": "Terrnix",
  "jobTitle": "Founder",
  "industry": "technology",
  "country": "MA",
  "consent": true,
  "newsletterConsent": false,
  "consentTimestamp": "2026-07-15T14:35:00Z",
  "sourceUrl": "https://terrnix.com/assessments/carbon-accounting-readiness/",
  "utmSource": "linkedin",
  "utmMedium": "social",
  "utmCampaign": "carbon-assessment",
  "score": 72,
  "maturityLevel": "Practitioner",
  "certificateId": "TRX-CAR-20260715-A7F42K"
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "lead-uuid",
  "leadScore": 85,
  "tier": "hot"
}
```

### Lead Record

```javascript
{
  leadId: 'uuid',
  discipline: 'Assessment Participant',
  assessmentId: 'carbon-accounting-readiness',
  assessmentTitle: 'Carbon Accounting Readiness Assessment',
  name: 'Tallal Belkheiri',
  email: 'tallal@terrnix.com',
  company: 'Terrnix',
  jobTitle: 'Founder',
  industry: 'technology',
  country: 'MA',
  score: 72,
  maturityLevel: 'Practitioner',
  categoryScores: { governance: 80, data: 65, reporting: 70, targets: 75, engagement: 60 },
  certificateId: 'TRX-CAR-20260715-A7F42K',
  certificateType: 'achievement',
  certificateDownloaded: false,
  reportDownloaded: false,
  newsletterConsent: false,
  consentTimestamp: '2026-07-15T14:35:00Z',
  sourceUrl: 'https://terrnix.com/assessments/carbon-accounting-readiness/',
  utmSource: 'linkedin',
  utmMedium: 'social',
  utmCampaign: 'carbon-assessment',
  leadScore: 85,
  leadTier: 'hot',
  submissionTimestamp: '2026-07-15T14:35:00Z',
  interactions: {
    calculatorClicked: false,
    consultationClicked: false,
    reportDownloaded: false,
    certificateDownloaded: false
  }
}
```

---

## Brevo Integration

### Contact Creation

```javascript
async function createBrevoContact(lead) {
  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      email: lead.email,
      attributes: {
        FIRSTNAME: lead.name.split(' ')[0],
        LASTNAME: lead.name.split(' ').slice(1).join(' '),
        COMPANY: lead.company,
        JOB_TITLE: lead.jobTitle,
        INDUSTRY: lead.industry,
        COUNTRY: lead.country,
        ASSESSMENT_TAKEN: lead.assessmentTitle,
        ASSESSMENT_SCORE: lead.score,
        MATURITY_LEVEL: lead.maturityLevel,
        CERTIFICATE_ID: lead.certificateId,
        LEAD_SCORE: lead.leadScore,
        LEAD_TIER: lead.leadTier,
        NEWSLETTER_CONSENT: lead.newsletterConsent,
        CONSENT_DATE: lead.consentTimestamp
      },
      listIds: [2], // Assessment Participants list
      updateEnabled: true
    })
  });
  
  if (lead.newsletterConsent) {
    // Add to newsletter list
    await addToNewsletterList(lead.email);
  }
  
  return response.json();
}
```

---

## Privacy and Compliance

### GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Lawful basis | Consent (Art. 6(1)(a)) for marketing; Contractual necessity (Art. 6(1)(b)) for results |
| Separate consent | Two distinct checkboxes |
| Consent record | Timestamp + exact text stored |
| Right to access | `/privacy/request` form |
| Right to erasure | `/privacy/delete-request` form |
| Data retention | 2 years for assessment data; until withdrawn for newsletter |

### Data Retention

| Data Type | Retention | Deletion Trigger |
|-----------|-----------|------------------|
| Assessment responses | 2 years | Automatic after 2 years |
| Lead record | 2 years | Automatic after 2 years |
| Certificate record | 5 years | Automatic after 5 years |
| Newsletter consent | Until withdrawn | Manual or on unsubscribe |
| IP hash | 30 days | Automatic after 30 days |

---

## Testing

### Unit Tests
```javascript
describe('LeadCapture', () => {
  test('validates required fields', () => {
    const capture = new LeadCapture(config);
    expect(capture.validator.validateName('')).toEqual({ valid: false, error: 'Please enter your full name' });
    expect(capture.validator.validateEmail('')).toEqual({ valid: false, error: 'Please enter your email address' });
  });
  
  test('calculates lead score correctly', () => {
    const participant = { company: 'Terrnix', industry: 'technology', jobTitle: 'Founder', newsletterConsent: true };
    const results = { overall: { score: 85 } };
    const score = calculateLeadScore(participant, results);
    expect(score).toBe(100); // 30 + 20 + 15 + 10 + 15 + 10
  });
  
  test('requires consent checkbox', () => {
    expect(capture.validator.validateConsent(false)).toEqual({ valid: false, error: 'You must agree to receive your results' });
    expect(capture.validator.validateConsent(true)).toEqual({ valid: true });
  });
});
```

---

## Implementation Checklist

- [ ] LeadCapture class implemented
- [ ] LeadValidator class implemented
- [ ] Form renders all fields
- [ ] Real-time validation on blur
- [ ] Submit button disabled during submission
- [ ] Loading state on submit
- [ ] Success message displayed
- [ ] Error handling
- [ ] Dual consent checkboxes (both unchecked by default)
- [ ] Privacy Policy link
- [ ] Lead score calculation
- [ ] Backend API `/api/assessment/lead`
- [ ] Brevo integration
- [ ] GDPR compliance
- [ ] Data retention policies
- [ ] Deletion request mechanism
