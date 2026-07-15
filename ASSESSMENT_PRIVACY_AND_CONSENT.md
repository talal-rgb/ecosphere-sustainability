# Terrnix Assessment Privacy and Consent Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0

---

## Principles

1. **Transparency:** Clearly explain why each data field is collected.
2. **Separation:** Assessment delivery and marketing consent are separate.
3. **Voluntariness:** Never require marketing consent to receive results.
4. **Minimisation:** Collect only data necessary for the stated purpose.
5. **Accountability:** Document consent, enable deletion, respect choices.

---

## Data Collection Fields

### Required Fields

| Field | Purpose | Storage | Retention |
|-------|---------|---------|-----------|
| Full Name | Personalise certificate and report | Backend database | 2 years |
| Email Address | Deliver results, certificate, report | Backend database + Brevo | 2 years |

### Optional Fields

| Field | Purpose | Storage | Retention |
|-------|---------|---------|-----------|
| Company | Contextualise assessment, tailor recommendations | Backend database | 2 years |
| Job Title | Understand participant role for content improvement | Backend database | 2 years |
| Country | Regional compliance context, localise content | Backend database | 2 years |

### Automatically Collected

| Field | Purpose | Storage | Retention |
|-------|---------|---------|-----------|
| Assessment ID | Identify which assessment was taken | Backend database | 2 years |
| Assessment Answers | Generate personalised results | Backend database | 2 years |
| Score | Determine maturity level and certificate | Backend database | 2 years |
| Category Scores | Generate report breakdown | Backend database | 2 years |
| Maturity Level | Display on certificate and report | Backend database | 2 years |
| Certificate ID | Enable verification | Backend database | 2 years |
| Report Download Status | Track engagement | Backend database | 2 years |
| Certificate Download Status | Track engagement | Backend database | 2 years |
| Newsletter Consent | Track marketing permission | Backend database + Brevo | Until withdrawn |
| Consent Timestamp | Prove when consent was given | Backend database | Until withdrawn |
| Source URL | Understand traffic sources | Backend database | 2 years |
| UTM Parameters | Attribute marketing campaigns | Backend database | 2 years |
| Submission Timestamp | Record completion time | Backend database | 2 years |
| IP Address (hashed) | Fraud prevention, rate limiting | Backend database (hashed) | 30 days |

---

## Consent Flow

### Step 1: Assessment Completion

User completes all assessment questions. Results are calculated client-side but **not displayed**.

### Step 2: Results Request Screen

**Heading:** "Enter Your Details to Receive Your Results"

**Explanation Text:**
```
Enter your name and email to receive your personalised assessment results 
and certificate of achievement. Your information is used only to deliver 
your results and will not be shared with third parties.
```

**Form Fields:**
```
Full Name * [________________________]

Email Address * [________________________]

Company [________________________] (optional)

Job Title [________________________] (optional)

Country [▼ Select country] (optional)
```

### Step 3: Consent Checkboxes

**Checkbox 1: Results Delivery (Required)**
```
[ ] I agree to receive my personalised assessment results, certificate, 
    and report via email. I have read and agree to the [Privacy Policy].
```
- **State:** Required, unchecked by default
- **Purpose:** Legal basis for processing (contractual necessity)
- **Consequence if unchecked:** Cannot submit form, cannot receive results

**Checkbox 2: Newsletter (Optional)**
```
[ ] Yes, I would like to receive Terrnix sustainability intelligence 
    and product updates. (Optional. You can unsubscribe at any time.)
```
- **State:** Optional, unchecked by default
- **Purpose:** Marketing consent (legitimate interest with consent)
- **Consequence if unchecked:** User still receives results, no newsletter
- **Consequence if checked:** Added to Brevo newsletter list with tag

### Step 4: Submit

**Button:** "Get My Results"

**Below button:**
```
By submitting, you agree to our [Privacy Policy] and [Terms of Service].
Your data is processed in accordance with GDPR and applicable laws.
```

---

## Privacy Policy Requirements

### Required Sections

1. **What Data We Collect**
   - List all fields (required and optional)
   - Explain automatic collection

2. **Why We Collect It**
   - Results delivery
   - Certificate generation
   - Report generation
   - Platform improvement (anonymised)
   - Marketing (only with consent)

3. **How We Use It**
   - Email delivery via Brevo
   - Certificate verification
   - Analytics (anonymised)
   - No sale to third parties

4. **How Long We Keep It**
   - Assessment data: 2 years
   - Newsletter consent: Until withdrawn
   - IP hashes: 30 days

5. **Your Rights**
   - Access your data
   - Correct your data
   - Delete your data
   - Withdraw consent
   - Export your data
   - Lodge a complaint

6. **How to Exercise Your Rights**
   - Email: privacy@terrnix.com
   - Form: /privacy/request
   - Response time: 30 days

7. **Data Processors**
   - Brevo (email delivery)
   - Google Analytics (anonymised)
   - Hosting provider (Render)

8. **International Transfers**
   - Data stored in EU (if applicable)
   - Brevo may process in EU/US
   - Standard Contractual Clauses apply

9. **Cookies**
   - Essential cookies only for assessment
   - Analytics cookies with consent

10. **Contact**
    - Data controller: Terrnix
    - Email: privacy@terrnix.com
    - Address: [Company address]

---

## Consent Storage

### Backend Record

```javascript
{
  consentId: 'uuid',
  leadId: 'uuid',
  assessmentId: 'carbon-readiness',
  
  // Results delivery consent
  resultsConsent: true,
  resultsConsentTimestamp: '2026-07-15T14:35:00Z',
  resultsConsentMethod: 'checkbox',
  resultsConsentText: 'I agree to receive my personalised assessment results...',
  
  // Newsletter consent
  newsletterConsent: false,
  newsletterConsentTimestamp: null,
  newsletterConsentMethod: 'checkbox',
  newsletterConsentText: 'Yes, I would like to receive Terrnix sustainability intelligence...',
  
  // Withdrawal
  withdrawnAt: null,
  withdrawnReason: null
}
```

### Brevo Contact

```
Email: participant@example.com
Attributes:
  - FIRSTNAME: Tallal
  - LASTNAME: Belkheiri
  - COMPANY: Terrnix
  - ASSESSMENT_TAKEN: Carbon Accounting Readiness
  - ASSESSMENT_SCORE: 72
  - MATURITY_LEVEL: Practitioner
  - NEWSLETTER_CONSENT: false
  - CONSENT_DATE: 2026-07-15
Lists:
  - Assessment Participants (always)
  - Newsletter Subscribers (only if newsletterConsent=true)
```

---

## Deletion Request Mechanism

### User-Initiated Deletion

**Method 1: Email**
```
To: privacy@terrnix.com
Subject: Data Deletion Request

I request deletion of all personal data associated with my email: 
[email address].

Signed: [Name]
Date: [Date]
```

**Method 2: Online Form**
```
URL: /privacy/delete-request
Fields:
  - Email Address * [________________________]
  - Request Type: [▼ Delete all data / Delete assessment data only]
  - Reason (optional) [________________________]
  - Confirm: [ ] I understand this action cannot be undone
  
  [Submit Request]
```

### Automated Deletion

| Data Type | Retention | Deletion Trigger |
|-----------|-----------|------------------|
| Assessment responses | 2 years | Automatic after 2 years |
| Lead record | 2 years | Automatic after 2 years |
| Certificate record | 5 years | Automatic after 5 years |
| Newsletter consent | Until withdrawn | Manual or on unsubscribe |
| IP hash | 30 days | Automatic after 30 days |
| Analytics data | 26 months | Google Analytics default |

### Deletion Process

1. User submits deletion request
2. Verify identity via email confirmation
3. Within 30 days:
   - Delete from backend database
   - Delete from Brevo (if newsletter subscriber)
   - Delete certificate verification record
   - Log deletion for compliance
4. Send confirmation email
5. Certificate becomes unverifiable (shows "Expired")

---

## Certificate Verification Privacy

### What Is Public

```
Certificate ID: TRX-CAR-20260715-A7F42K
Status: Valid
Participant: Tallal B. (first name + last initial only)
Assessment: Carbon Accounting Readiness Assessment
Issue Date: 15 July 2026
Score: 72/100
Maturity Level: Practitioner Achievement
```

### What Is NOT Public

- Full name
- Email address
- Company
- Job title
- Country
- Assessment answers
- Detailed category scores

---

## Compliance Checklist

### GDPR (EU/UK)

- [ ] Lawful basis: Consent (Article 6(1)(a)) for marketing; Contractual necessity (Article 6(1)(b)) for results
- [ ] Consent is freely given, specific, informed, unambiguous (Article 7)
- [ ] Separate consent for different purposes (Article 7(4))
- [ ] Right to access (Article 15)
- [ ] Right to rectification (Article 16)
- [ ] Right to erasure (Article 17)
- [ ] Right to restrict processing (Article 18)
- [ ] Right to data portability (Article 20)
- [ ] Privacy by design (Article 25)
- [ ] Data protection impact assessment (Article 35) — if high risk
- [ ] Records of processing activities (Article 30)

### ePrivacy Directive (EU)

- [ ] No cookies without consent (except essential)
- [ ] Clear cookie information

### CAN-SPAM (US)

- [ ] Accurate header information
- [ ] Clear subject lines
- [ ] Physical address in emails
- [ ] Unsubscribe mechanism
- [ ] Honor opt-out requests within 10 days

### CASL (Canada)

- [ ] Express consent for commercial emails
- [ ] Clear sender identification
- [ ] Unsubscribe mechanism

---

## Implementation Checklist

- [ ] Privacy Policy page created at `/privacy-policy/`
- [ ] Terms of Service page created at `/terms-of-service/`
- [ ] Consent form with two separate checkboxes
- [ ] Results checkbox required, unchecked by default
- [ ] Newsletter checkbox optional, unchecked by default
- [ ] Privacy Policy link in form
- [ ] Consent text stored verbatim in backend
- [ ] Consent timestamp recorded
- [ ] Deletion request form at `/privacy/delete-request/`
- [ ] Deletion confirmation email
- [ ] Automatic data retention enforcement
- [ ] Certificate verification shows only public data
- [ ] Brevo contact attributes include consent status
- [ ] Analytics anonymises IP addresses
- [ ] Cookie banner for non-essential cookies
- [ ] Data processing agreement with Brevo
- [ ] Data processing agreement with Google Analytics
