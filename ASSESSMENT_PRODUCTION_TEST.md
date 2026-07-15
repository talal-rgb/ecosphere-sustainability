# Terrnix Assessment Platform Production Verification Checklist

**Status:** NOT STARTED  
**Date:** 2026-07-15  
**Version:** 1.0

---

## Pre-Deployment Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | All assessment JSON files validated | PENDING | |
| 2 | All JavaScript modules load without errors | PENDING | |
| 3 | jsPDF library loads correctly | PENDING | |
| 4 | QR code library loads correctly | PENDING | |
| 5 | Chart.js available for report charts | PENDING | |
| 6 | Backend API endpoints respond | PENDING | |
| 7 | Brevo API key configured | PENDING | |
| 8 | GA4 measurement ID configured | PENDING | |
| 9 | Certificate verification page deployed | PENDING | |
| 10 | Privacy Policy page updated | PENDING | |

---

## Desktop Testing (Chrome)

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Navigate to assessment section | Assessment loads with title and description | PENDING | |
| 2 | Click "Start Assessment" | First question displays, progress bar at 0% | PENDING | |
| 3 | Answer first question | Option selected, "Next" button enabled | PENDING | |
| 4 | Click "Next" | Second question displays, progress bar advances | PENDING | |
| 5 | Click "Previous" | Returns to first question, answer retained | PENDING | |
| 6 | Complete all questions | Review screen displays with all answers | PENDING | |
| 7 | Click "Submit" | Participant details form displays | PENDING | |
| 8 | Submit form without name | Validation error: "Full name is required" | PENDING | |
| 9 | Submit form without email | Validation error: "Email address is required" | PENDING | |
| 10 | Submit form with invalid email | Validation error: "Please enter a valid email" | PENDING | |
| 11 | Submit form without consent checkbox | Validation error: "You must agree to receive results" | PENDING | |
| 12 | Submit valid form | Results screen displays with score and maturity | PENDING | |
| 13 | Verify newsletter checkbox is unchecked | Checkbox not checked by default | PENDING | |
| 14 | Check newsletter checkbox | Checkbox checked, consent stored separately | PENDING | |
| 15 | Verify score calculation | Score matches manual calculation | PENDING | |
| 16 | Verify maturity level | Level matches score range | PENDING | |
| 17 | Verify category breakdown | All categories displayed with scores | PENDING | |
| 18 | Verify strengths | Top 2 categories highlighted | PENDING | |
| 19 | Verify gaps | Bottom 2 categories highlighted | PENDING | |
| 20 | Verify recommendations | 5 actions displayed with priority | PENDING | |
| 21 | Click "Download Report" | PDF downloads, filename correct | PENDING | |
| 22 | Click "Download Certificate" | PDF downloads, filename correct | PENDING | |
| 23 | Verify no print dialog | Browser print dialog does NOT open | PENDING | |
| 24 | Open certificate PDF | A4 landscape, all elements present | PENDING | |
| 25 | Verify certificate fields | Name, date, score, level, ID, QR code all correct | PENDING | |
| 26 | Scan QR code | Opens verification page with correct ID | PENDING | |
| 27 | Open report PDF | Multi-page, all sections present | PENDING | |
| 28 | Verify report fields | Name, date, score, charts, recommendations all correct | PENDING | |
| 29 | Click consultation CTA | Navigates to contact section | PENDING | |
| 30 | Click tool link | Opens correct tool page | PENDING | |
| 31 | Click article link | Opens correct article page | PENDING | |

---

## Desktop Testing (Edge/Firefox)

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Repeat Chrome tests 1-31 | All pass | PENDING | |
| 2 | Verify PDF download in Edge | PDF opens correctly | PENDING | |
| 3 | Verify PDF download in Firefox | PDF opens correctly | PENDING | |

---

## Mobile Testing (Android Chrome / iPhone Safari)

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Navigate to assessment | Layout adapts to mobile screen | PENDING | |
| 2 | Tap "Start Assessment" | First question displays, readable | PENDING | |
| 3 | Answer question by tapping | Option selected, visual feedback | PENDING | |
| 4 | Scroll through questions | Smooth scrolling, no layout issues | PENDING | |
| 5 | Complete assessment | Form and results readable on mobile | PENDING | |
| 6 | Download certificate | PDF downloads to device | PENDING | |
| 7 | Download report | PDF downloads to device | PENDING | |
| 8 | Tap consultation CTA | Contact section visible | PENDING | |

---

## Certificate Verification Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Visit verification URL with valid ID | Certificate details displayed | PENDING | |
| 2 | Verify no email exposed | Only first name + initial shown | PENDING | |
| 3 | Visit verification URL with invalid ID | "Certificate not found" message | PENDING | |
| 4 | Visit verification URL with missing ID | Error or redirect | PENDING | |
| 5 | Verify QR code links to correct URL | URL contains certificate ID | PENDING | |

---

## Lead Capture Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Submit assessment | Lead record created in backend | PENDING | |
| 2 | Verify lead fields | All required fields present | PENDING | |
| 3 | Verify score stored | Score matches assessment result | PENDING | |
| 4 | Verify maturity level stored | Level matches score | PENDING | |
| 5 | Verify certificate ID stored | ID matches certificate | PENDING | |
| 6 | Verify consent timestamp | Timestamp recorded | PENDING | |
| 7 | Verify newsletter consent false | Not subscribed when unchecked | PENDING | |
| 8 | Verify newsletter consent true | Subscribed when checked | PENDING | |
| 9 | Verify UTM parameters | Source, medium, campaign stored | PENDING | |

---

## Email Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Complete assessment | Confirmation email received within 5 minutes | PENDING | |
| 2 | Verify email subject | "Your Terrnix assessment results and certificate" | PENDING | |
| 3 | Verify email content | Name, score, maturity, links present | PENDING | |
| 4 | Click certificate link | Opens certificate download | PENDING | |
| 5 | Click report link | Opens report download | PENDING | |
| 6 | Click consultation CTA | Opens contact page | PENDING | |
| 7 | Verify no newsletter when unchecked | No welcome email received | PENDING | |
| 8 | Verify newsletter when checked | Welcome email received | PENDING | |

---

## Analytics Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | View assessment | `assessment_view` event fires | PENDING | |
| 2 | Start assessment | `assessment_start` event fires | PENDING | |
| 3 | Answer question | `assessment_question_answered` event fires | PENDING | |
| 4 | Submit details | `assessment_details_submitted` event fires | PENDING | |
| 5 | Complete assessment | `assessment_complete` event fires | PENDING | |
| 6 | Download report | `assessment_report_download` event fires | PENDING | |
| 7 | Download certificate | `assessment_certificate_download` event fires | PENDING | |
| 8 | Click consultation | `assessment_consultation_click` event fires | PENDING | |
| 9 | Check newsletter | `assessment_newsletter_consent` event fires | PENDING | |
| 10 | Verify in GA4 Real-Time | Events appear within 1 minute | PENDING | |

---

## Accessibility Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Tab through options | Each option receives focus | PENDING | |
| 2 | Select option with Enter | Option selected | PENDING | |
| 3 | Navigate with arrow keys | Previous/Next work | PENDING | |
| 4 | Screen reader announces question | Question text read aloud | PENDING | |
| 5 | Screen reader announces score | Score read aloud on results | PENDING | |
| 6 | Focus indicator visible | Clear focus ring on all elements | PENDING | |
| 7 | Color not sole indicator | Icons + text for correct/wrong | PENDING | |
| 8 | Form labels associated | Screen reader reads labels | PENDING | |

---

## Performance Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | First Contentful Paint | < 1.5 seconds | PENDING | |
| 2 | Largest Contentful Paint | < 2.5 seconds | PENDING | |
| 3 | Time to Interactive | < 3.5 seconds | PENDING | |
| 4 | Cumulative Layout Shift | < 0.1 | PENDING | |
| 5 | PDF generation time | < 3 seconds | PENDING | |
| 6 | Total JS payload | < 50KB gzipped | PENDING | |

---

## Security Testing

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | XSS attempt in name | Sanitized, no script execution | PENDING | |
| 2 | XSS attempt in email | Rejected or sanitized | PENDING | |
| 3 | SQL injection attempt | Rejected by backend | PENDING | |
| 4 | Rate limiting | Max 5 assessments per hour per IP | PENDING | |
| 5 | Certificate ID randomness | IDs not predictable | PENDING | |
| 6 | No email in verification | Email not exposed | PENDING | |

---

## Console Error Check

| # | Test | Expected Result | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Load assessment page | No console errors | PENDING | |
| 2 | Start assessment | No console errors | PENDING | |
| 3 | Navigate questions | No console errors | PENDING | |
| 4 | Submit form | No console errors | PENDING | |
| 5 | Download PDFs | No console errors | PENDING | |
| 6 | View results | No console warnings | PENDING | |

---

## Summary

| Category | Tests | Passed | Failed | Pending |
|----------|-------|--------|--------|---------|
| Pre-Deployment | 10 | 0 | 0 | 10 |
| Desktop (Chrome) | 31 | 0 | 0 | 31 |
| Desktop (Edge/Firefox) | 3 | 0 | 0 | 3 |
| Mobile | 8 | 0 | 0 | 8 |
| Certificate Verification | 5 | 0 | 0 | 5 |
| Lead Capture | 9 | 0 | 0 | 9 |
| Email | 8 | 0 | 0 | 8 |
| Analytics | 10 | 0 | 0 | 10 |
| Accessibility | 8 | 0 | 0 | 8 |
| Performance | 6 | 0 | 0 | 6 |
| Security | 6 | 0 | 0 | 6 |
| Console Errors | 6 | 0 | 0 | 6 |
| **TOTAL** | **110** | **0** | **0** | **110** |

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | | | PENDING |
| QA Tester | | | PENDING |
| Product Owner | | | PENDING |

**Status Definitions:**
- PENDING: Not yet tested
- PASS: Test passed
- FAIL: Test failed (blocker)
- N/A: Not applicable
- MANUAL: Requires manual testing

**Do not mark as VERIFIED until all 110 tests pass.**
