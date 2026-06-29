# Terrnix Analytics Events Specification

**Version:** 1.0  
**Date:** 2026-06-29  
**Status:** Ready for implementation  
**GA4 Event Limit:** 500 distinct events per property (we use 13)

---

## Event Inventory

| # | Event Name | Trigger | Parameters | Business Purpose |
|---|-----------|---------|------------|------------------|
| 1 | `article_view` | Article page load | `article_title`, `article_url`, `article_category`, `page_location`, `page_title` | Track which articles drive traffic |
| 2 | `calculator_start` | Click calculator CTA | `calculator_type`, `cta_location` | Measure calculator engagement |
| 3 | `calculator_complete` | Calculator finished | `calculator_type`, `result_value` | Track calculator completions |
| 4 | `pdf_download` | Click PDF link | `pdf_name`, `pdf_location` | Track lead magnet downloads |
| 5 | `quiz_start` | Click quiz CTA | `quiz_name`, `cta_location` | Measure quiz engagement |
| 6 | `quiz_complete` | Quiz finished | `quiz_name`, `quiz_score` | Track quiz completions |
| 7 | `quiz_lead_submit` | Email captured in quiz | `quiz_name`, `email_domain` | Track lead generation from quizzes |
| 8 | `contact_submit` | Contact form submitted | `form_type`, `page_location` | Track consultation requests |
| 9 | `newsletter_signup` | Newsletter form submitted | `signup_location`, `page_location` | Track newsletter growth |
| 10 | `consultation_cta_click` | Click consultation button | `cta_text`, `cta_location`, `page_location` | Track CTA effectiveness |
| 11 | `linkedin_click` | Click LinkedIn/social link | `link_url`, `link_location` | Track social traffic |
| 12 | `scroll_depth_50` | Scroll past 50% | `page_location`, `page_title`, `scroll_percentage` | Measure content engagement |
| 13 | `scroll_depth_90` | Scroll past 90% | `page_location`, `page_title`, `scroll_percentage` | Measure full-read rate |

---

## Event Details

### 1. article_view

**When:** Automatically fires when a page with `og:type = article` loads.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `article_title` | string | "GHG Protocol Scope 3 Revisions 2026" | `meta[property="og:title"]` |
| `article_url` | string | "/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/" | `window.location.pathname` |
| `article_category` | string | "Policy" | `meta[property="article:section"]` |
| `page_location` | string | "https://terrnix.com/..." | `window.location.href` |
| `page_title` | string | "GHG Protocol Scope 3..." | `document.title` |

**Business Question:** Which intelligence articles attract the most views?

---

### 2. calculator_start

**When:** User clicks a calculator CTA button.

**Implementation:** Add `data-track="calculator_start"` to calculator CTA links.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `calculator_type` | string | "carbon_footprint" | `data-calculator-type` attribute |
| `cta_location` | string | "article_body" | `data-cta-location` attribute |

**Business Question:** How many users start the calculator from articles vs. homepage?

---

### 3. calculator_complete

**When:** User completes calculator and sees results.

**Implementation:** Call `window.trackCalculatorComplete(type, value)` from calculator logic.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `calculator_type` | string | "carbon_footprint" | Calculator instance |
| `result_value` | number | 1250.5 | Calculator output (tonnes CO2e) |

**Business Question:** What is the calculator completion rate?

---

### 4. pdf_download

**When:** User clicks a PDF download link.

**Implementation:** Add `data-track="pdf_download"` to PDF links, or auto-track all `.pdf` links.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `pdf_name` | string | "carbon-report-2026.pdf" | `data-pdf-name` or URL |
| `pdf_location` | string | "/sustainability-intelligence/..." | `data-pdf-location` or current page |

**Business Question:** Which PDFs are most downloaded? Which articles drive PDF downloads?

---

### 5. quiz_start

**When:** User clicks a quiz CTA button.

**Implementation:** Add `data-track="quiz_start"` to quiz CTA links.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `quiz_name` | string | "csrd_readiness" | `data-quiz-name` attribute |
| `cta_location` | string | "sidebar" | `data-cta-location` attribute |

**Business Question:** How many users start quizzes from articles vs. tools page?

---

### 6. quiz_complete

**When:** User finishes quiz and sees results.

**Implementation:** Call `window.trackQuizComplete(name, score)` from quiz logic.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `quiz_name` | string | "csrd_readiness" | Quiz instance |
| `quiz_score` | number | 75 | Quiz result (percentage) |

**Business Question:** What is the quiz completion rate? Average scores?

---

### 7. quiz_lead_submit

**When:** User submits email in quiz lead capture form.

**Implementation:** Call `window.trackQuizLeadSubmit(name, domain)` from quiz logic.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `quiz_name` | string | "csrd_readiness" | Quiz instance |
| `email_domain` | string | "company.com" | Extracted from email |

**Business Question:** How many leads does the quiz generate per week?

---

### 8. contact_submit

**When:** Contact form is successfully submitted.

**Implementation:** Add `data-track="contact_submit"` to contact forms.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `form_type` | string | "consultation_request" | `data-form-type` attribute |
| `page_location` | string | "/contact/" | `window.location.pathname` |

**Business Question:** How many consultation requests per week? Which pages drive them?

---

### 9. newsletter_signup

**When:** Newsletter signup form is submitted.

**Implementation:** Add `data-track="newsletter_signup"` to newsletter forms.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `signup_location` | string | "sidebar" | `data-signup-location` attribute |
| `page_location` | string | "/sustainability-intelligence/..." | `window.location.pathname` |

**Business Question:** Which pages drive the most newsletter signups?

---

### 10. consultation_cta_click

**When:** User clicks any consultation CTA button.

**Implementation:** Add `data-track="consultation_cta_click"` to consultation buttons.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `cta_text` | string | "Request a Consultation" | Button text content |
| `cta_location` | string | "article_footer" | `data-cta-location` attribute |
| `page_location` | string | "/sustainability-intelligence/..." | `window.location.pathname` |

**Business Question:** Which CTAs and locations drive the most consultation clicks?

---

### 11. linkedin_click

**When:** User clicks a LinkedIn (or Twitter/X) link.

**Implementation:** Auto-tracks all links to linkedin.com, twitter.com, x.com.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `link_url` | string | "https://linkedin.com/..." | Link href |
| `link_location` | string | "/sustainability-intelligence/..." | Current page |

**Business Question:** How much traffic do we send to LinkedIn? Which articles drive social engagement?

---

### 12. scroll_depth_50

**When:** User scrolls past 50% of page height.

**Implementation:** Auto-tracked via scroll listener. Fires once per page.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `page_location` | string | "/sustainability-intelligence/..." | `window.location.pathname` |
| `page_title` | string | "GHG Protocol Scope 3..." | `document.title` |
| `scroll_percentage` | number | 50 | Fixed value |

**Business Question:** What percentage of readers engage with at least half the article?

---

### 13. scroll_depth_90

**When:** User scrolls past 90% of page height.

**Implementation:** Auto-tracked via scroll listener. Fires once per page.

**Parameters:**

| Parameter | Type | Example | Source |
|-----------|------|---------|--------|
| `page_location` | string | "/sustainability-intelligence/..." | `window.location.pathname` |
| `page_title` | string | "GHG Protocol Scope 3..." | `document.title` |
| `scroll_percentage` | number | 90 | Fixed value |

**Business Question:** What percentage of readers read the full article? (Proxy for content quality)

---

## Data Attributes Reference

Add these `data-*` attributes to HTML elements to enable tracking:

### Calculator CTAs
```html
<a href="/carbon-accounting/carbon-footprint-calculator/"
   data-track="calculator_start"
   data-calculator-type="carbon_footprint"
   data-cta-location="article_body">
  Calculate Your Footprint →
</a>
```

### Quiz CTAs
```html
<a href="/tools/"
   data-track="quiz_start"
   data-quiz-name="csrd_readiness"
   data-cta-location="sidebar">
  Take the Quiz →
</a>
```

### PDF Downloads
```html
<a href="/downloads/report.pdf"
   data-track="pdf_download"
   data-pdf-name="carbon-report-2026.pdf"
   data-pdf-location="article_body">
  Download Report
</a>
```

### Contact Forms
```html
<form action="/api/contact" data-track="contact_submit" data-form-type="consultation_request">
  <!-- form fields -->
</form>
```

### Newsletter Forms
```html
<form action="/api/newsletter" data-track="newsletter_signup" data-signup-location="sidebar">
  <!-- form fields -->
</form>
```

### Consultation CTAs
```html
<a href="/contact/"
   data-track="consultation_cta_click"
   data-cta-location="article_footer">
  Request a Consultation
</a>
```

---

## GA4 Custom Dimensions Setup

After deploying analytics, create these custom dimensions in GA4:

| Dimension Name | Scope | Event Parameter | Description |
|---------------|-------|-----------------|-------------|
| Article Title | Event | `article_title` | Title of intelligence article |
| Article Category | Event | `article_category` | Category (Policy, Strategy, etc.) |
| Calculator Type | Event | `calculator_type` | Type of calculator used |
| Quiz Name | Event | `quiz_name` | Name of quiz taken |
| CTA Location | Event | `cta_location` | Where CTA appeared (article_body, sidebar, etc.) |

**How to create:** GA4 → Admin → Custom definitions → Create custom dimensions

---

## Conversion Events

Mark these events as conversions in GA4:

| Event | Conversion Name | Value |
|-------|----------------|-------|
| `contact_submit` | Consultation Request | €500 |
| `quiz_lead_submit` | Quiz Lead | €200 |
| `newsletter_signup` | Newsletter Subscriber | €50 |
| `calculator_complete` | Calculator Completion | €100 |
| `pdf_download` | PDF Download | €75 |

**How to set:** GA4 → Admin → Conversions → New conversion event

---

*Specification created: 2026-06-29*  
*Next update: After analytics deployment and 7 days of data collection*
