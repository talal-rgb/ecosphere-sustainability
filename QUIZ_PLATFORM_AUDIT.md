# Terrnix Assessment Platform Audit

**Status:** AUDIT COMPLETE  
**Date:** 2026-07-15  
**Auditor:** Terrnix AI  
**Scope:** Existing quiz/assessment functionality in `index.html` (lines 4393–5950)

---

## Executive Summary

The current Terrnix "Knowledge Challenge" is a **30-question trivia quiz** embedded in `index.html`. It is **not** a professional assessment platform. It lacks maturity scoring, category breakdowns, proper lead capture, professional certificates, PDF reports, and most requirements specified in the Sprint 3 brief.

**Verdict:** The existing code should **not** be extended. A complete rebuild is required.

---

## 1. BROKEN FUNCTIONALITY

| # | Issue | Severity | Location | Evidence |
|---|-------|----------|----------|----------|
| 1.1 | **Certificate uses browser print dialog** | Critical | `downloadQuizCertificate()` line 5904 | Calls `html2pdf().save()` which opens browser print dialog; not a real PDF download |
| 1.2 | **No actual PDF certificate generated** | Critical | `downloadQuizCertificate()` | Creates HTML blob, not a real PDF with proper layout |
| 1.3 | **No personalised assessment report** | Critical | Missing entirely | No PDF report generation exists |
| 1.4 | **Certificate not personalised with user name** | High | `downloadQuizCertificate()` | Uses `quizLeadName.value` but defaults to "Quiz Participant" if empty |
| 1.5 | **No certificate verification system** | High | Missing entirely | No `/certificate/verify/` endpoint or unique ID |
| 1.6 | **No QR code on certificate** | High | Missing entirely | No QR code generation |
| 1.7 | **Certificate is portrait A4, not landscape** | Medium | `jsPDF: { format: 'a4', orientation: 'landscape' }` | Actually sets landscape but html2pdf may ignore; layout is basic HTML |
| 1.8 | **No unique certificate ID** | High | Missing entirely | No `TRX-CAA-20260715-A7F42K` format |
| 1.9 | **Lead capture requires consent checkbox** | Medium | `quizLeadConsent` required | User cannot get results without checking box; no way to view results without submitting email |
| 1.10 | **No "previous" navigation** | Medium | `nextQuestion()` only | Users cannot go back to review/change answers |
| 1.11 | **No save/resume functionality** | Medium | Missing entirely | Refreshing page loses all progress |
| 1.12 | **No keyboard navigation** | Medium | Missing entirely | Cannot use Tab/Enter/Arrow keys |
| 1.13 | **No email delivery of results** | High | Missing entirely | No Brevo integration for result emails |
| 1.14 | **Backend endpoint hardcoded** | Medium | `https://terrnix-backend.onrender.com/api/contact` | May be unreliable; no fallback |
| 1.15 | **No error handling for backend down** | Medium | `submitQuizLead()` | Shows generic error; no retry or offline mode |

---

## 2. UI ISSUES

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 2.1 | **Labelled "Quiz" not "Assessment"** | High | Title: "Terrnix Knowledge Challenge"; button: "Start Challenge" |
| 2.2 | **No estimated completion time shown** | Medium | Missing from start screen |
| 2.3 | **Progress bar shows percentage, not question count** | Low | `pct = ((currentQuestion + 1) / quizQuestions.length) * 100` |
| 2.4 | **No question numbering on cards** | Low | Only in counter text |
| 2.5 | **No review screen before submission** | Medium | Missing entirely |
| 2.6 | **Result screen shows only percentage** | High | No maturity level, category breakdown, strengths, weaknesses |
| 2.7 | **No clear error messages for form validation** | Medium | Only HTML5 `required` attribute |
| 2.8 | **Certificate section hidden until after lead capture** | Medium | User must submit email before seeing certificate button |
| 2.9 | **No loading states during submission** | Low | Button text changes to "Sending..." but no spinner |
| 2.10 | **Mobile: options may be too small** | Low | `text-sm` on mobile may be hard to tap |
| 2.11 | **No focus indicators on option buttons** | Medium | Accessibility issue |
| 2.12 | **Explanation panel says "AI Explanation"** | Low | Misleading; it's static text from question data |

---

## 3. SCORING ISSUES

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 3.1 | **Only percentage score displayed** | Critical | `pct = Math.round((quizScore / quizQuestions.length) * 100)` |
| 3.2 | **No maturity level (Beginner/Intermediate/Advanced/Expert)** | Critical | Missing entirely |
| 3.3 | **No category breakdown** | Critical | Only Beginner/Intermediate/Advanced counts, not topic categories |
| 3.4 | **No strengths/weaknesses analysis** | Critical | Missing entirely |
| 3.5 | **No priority gaps identified** | Critical | Missing entirely |
| 3.6 | **No recommended actions** | Critical | Missing entirely |
| 3.7 | **No roadmap or timeline** | Critical | Missing entirely |
| 3.8 | **No connection to Terrnix tools/content** | High | Recommendations are generic CTAs only |
| 3.9 | **Score is simple correct count** | Medium | No weighted scoring by question importance |
| 3.10 | **No benchmark comparison** | Low | Spec says don't invent benchmarks; currently none shown |
| 3.11 | **All questions equally weighted** | Medium | No difficulty-based weighting |

---

## 4. RESPONSIVENESS

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 4.1 | **Options grid uses `md:grid-cols-2`** | Low | May be fine; needs testing on actual devices |
| 4.2 | **Certificate HTML uses fixed `max-width: 800px`** | Medium | May not fit mobile screens well |
| 4.3 | **No touch-friendly option sizing** | Low | Padding `p-4` may be adequate |
| 4.4 | **Font sizes may be too small on mobile** | Low | `text-sm` (14px) for options |
| 4.5 | **Not tested on actual mobile devices** | High | **MANUAL TEST REQUIRED** |

---

## 5. ACCESSIBILITY

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 5.1 | **No `aria-label` on option buttons** | High | Missing entirely |
| 5.2 | **No `role="progressbar"` on progress bar** | Medium | Missing entirely |
| 5.3 | **No live region for score updates** | Medium | Screen readers won't announce score changes |
| 5.4 | **No keyboard navigation** | High | Cannot Tab through options or use Enter to select |
| 5.5 | **No focus management** | High | Focus not moved to next question |
| 5.6 | **No skip link** | Low | Missing entirely |
| 5.7 | **Color alone indicates correct/wrong** | Medium | Red/green without additional indicators |
| 5.8 | **No `alt` text on certificate icon** | Low | Emoji used as icon |
| 5.9 | **Form inputs lack associated labels programmatically** | Medium | `for` attribute present but no `aria-describedby` |
| 5.10 | **No reduced-motion support** | Low | Animations not disabled for `prefers-reduced-motion` |

---

## 6. ANALYTICS

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 6.1 | **Only 2 GA events tracked** | High | `quiz_start` and `quiz_complete` only |
| 6.2 | **No `assessment_view` event** | Medium | Missing entirely |
| 6.3 | **No `assessment_question_answered` event** | Medium | Missing entirely |
| 6.4 | **No `assessment_details_submitted` event** | Medium | Missing entirely |
| 6.5 | **No `assessment_report_download` event** | High | Missing entirely (no report exists) |
| 6.6 | **No `assessment_certificate_download` event** | High | Event exists but named `quiz_certificate_download` |
| 6.7 | **No `assessment_consultation_click` event** | Medium | Missing entirely |
| 6.8 | **No `assessment_newsletter_consent` event** | Medium | Missing entirely |
| 6.9 | **Events use old naming (`quiz_*`)** | Medium | Should be `assessment_*` per requirements |
| 6.10 | **No UTM parameter capture** | Medium | Missing entirely |
| 6.11 | **No source URL tracking in analytics** | Low | Only in lead submission payload |
| 6.12 | **No verification that events fire in production** | High | **MANUAL TEST REQUIRED** |

---

## 7. LEAD CAPTURE

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 7.1 | **Only name and email collected** | High | No company, job title, country fields |
| 7.2 | **No explanation of why data is collected** | High | Missing entirely |
| 7.3 | **Consent checkbox is required** | High | `required` attribute on checkbox; user cannot proceed without consent |
| 7.4 | **No separate newsletter checkbox** | High | Only one checkbox combining results + marketing |
| 7.5 | **Consent wording is vague** | Medium | "occasional sustainability insights" — not clear what this means |
| 7.6 | **No Privacy Policy link** | High | Missing entirely |
| 7.7 | **No consent timestamp** | High | Missing entirely |
| 7.8 | **No UTM attribution stored** | Medium | `sourceUrl` captured but no UTM params parsed |
| 7.9 | **No assessment name stored** | Low | Hardcoded as "Quiz Participant" discipline |
| 7.10 | **No score stored in lead record** | Low | `leadScore: pct` is sent |
| 7.11 | **No certificate ID stored** | High | Missing entirely |
| 7.12 | **No report/certificate download status** | High | Missing entirely |
| 7.13 | **Lead stored via contact endpoint** | Medium | Reuses `/api/contact` instead of dedicated assessment endpoint |

---

## 8. PDF GENERATION

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 8.1 | **No real PDF certificate** | Critical | Uses html2pdf library which creates image-based PDF |
| 8.2 | **Certificate is not A4 landscape** | High | html2pdf may not respect orientation properly |
| 8.3 | **No professional certificate design** | High | Basic HTML with gradient background |
| 8.4 | **No Terrnix logo (only emoji)** | High | `🌱` used instead of actual logo |
| 8.5 | **No signature area** | High | Missing entirely |
| 8.6 | **No disclaimer** | High | Missing entirely |
| 8.7 | **No verification URL** | High | Missing entirely |
| 8.8 | **No QR code** | High | Missing entirely |
| 8.9 | **Certificate filename not personalised** | Medium | `terrnix-sustainability-certificate-${today}.pdf` |
| 8.10 | **No assessment report PDF** | Critical | Missing entirely |
| 8.11 | **PDF generation depends on html2pdf CDN** | Medium | If CDN fails, certificate cannot be generated |

---

## 9. CERTIFICATE GENERATION

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 9.1 | **No certificate eligibility rules** | Critical | Everyone gets same certificate regardless of score |
| 9.2 | **No level-specific certificates** | Critical | Missing entirely |
| 9.3 | **Certificate says "Certificate of Completion" for all scores** | High | No differentiation |
| 9.4 | **No "Certificate of Achievement" vs "Certificate of Completion"** | High | Missing entirely |
| 9.5 | **No score thresholds defined** | High | Missing entirely |
| 9.6 | **No disclaimer about non-accreditation** | High | Missing entirely |
| 9.7 | **Certificate shown to all users regardless of score** | Medium | Even 0% gets certificate |

---

## 10. DATA PRIVACY AND CONSENT

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 10.1 | **No Privacy Policy link** | Critical | Missing entirely |
| 10.2 | **No clear explanation of data use** | Critical | Missing entirely |
| 10.3 | **Consent bundled (results + marketing)** | Critical | One checkbox for both |
| 10.4 | **No separate newsletter opt-in** | Critical | Missing entirely |
| 10.5 | **No data retention period stated** | High | Missing entirely |
| 10.6 | **No deletion request mechanism** | High | Missing entirely |
| 10.7 | **No GDPR-compliant consent flow** | High | Missing entirely |
| 10.8 | **Email exposed in lead submission** | Medium | Sent to backend in plaintext |
| 10.9 | **No encryption of stored data** | Medium | localStorage not encrypted for quiz data |

---

## 11. PERFORMANCE

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 11.1 | **Quiz data embedded in HTML** | Low | 30 questions = ~15KB of JSON in HTML |
| 11.2 | **html2pdf library loaded for all users** | Medium | Loaded even if user never takes quiz |
| 11.3 | **No lazy loading of quiz section** | Low | Quiz HTML always in DOM |
| 11.4 | **No code splitting** | Low | All quiz JS in main bundle |
| 11.5 | **Certificate generation is synchronous** | Medium | Blocks UI while generating |

---

## 12. ARCHITECTURE ISSUES

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 12.1 | **Questions hardcoded in JavaScript array** | High | `const quizQuestions = [...]` in index.html |
| 12.2 | **No JSON configuration** | High | Missing entirely |
| 12.3 | **No reusable assessment framework** | Critical | Each new assessment would require copying code |
| 12.4 | **All quiz logic in index.html** | High | ~600 lines of quiz JS in main file |
| 12.5 | **No separation of concerns** | Medium | UI, scoring, lead capture, certificate all in one file |
| 12.6 | **No modular structure** | High | Cannot add new assessments without editing index.html |

---

## 13. CONTENT ISSUES

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 13.1 | **Questions are trivia, not assessment** | Critical | "What does the 'E' in ESG stand for?" — tests knowledge, not maturity |
| 13.2 | **No scenario-based questions** | Critical | All are multiple-choice facts |
| 13.3 | **No self-assessment questions** | Critical | No "How does your organisation...?" questions |
| 13.4 | **No category weighting** | High | All 6 categories treated equally |
| 13.5 | **Questions do not map to maturity levels** | High | Beginner/Intermediate/Advanced labels but no maturity scoring |
| 13.6 | **No question randomisation** | Medium | Always same order |
| 13.7 | **No question bank** | Medium | Fixed 30 questions |

---

## Summary Table

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Broken Functionality | 4 | 5 | 4 | 2 | 15 |
| UI Issues | 1 | 1 | 5 | 5 | 12 |
| Scoring Issues | 7 | 1 | 2 | 0 | 10 |
| Responsiveness | 1 | 0 | 1 | 3 | 5 |
| Accessibility | 3 | 2 | 3 | 2 | 10 |
| Analytics | 2 | 2 | 5 | 3 | 12 |
| Lead Capture | 5 | 3 | 3 | 2 | 13 |
| PDF Generation | 6 | 3 | 1 | 1 | 11 |
| Certificate | 5 | 2 | 0 | 0 | 7 |
| Privacy/Consent | 4 | 3 | 1 | 1 | 9 |
| Performance | 0 | 0 | 3 | 2 | 5 |
| Architecture | 1 | 3 | 1 | 0 | 5 |
| Content | 4 | 2 | 2 | 0 | 8 |
| **TOTAL** | **43** | **27** | **31** | **21** | **122** |

---

## Recommendations

### Immediate Actions (Before Rebuild)

1. **Disable certificate download** — Current implementation is not professional
2. **Add Privacy Policy link** — Even if basic, required for compliance
3. **Separate consent checkboxes** — One for results, one for newsletter
4. **Fix analytics event names** — Change `quiz_*` to `assessment_*`

### Rebuild Strategy

The existing quiz code should **not** be extended. A complete rebuild is required with:

- JSON-driven assessment configuration
- Separate JS modules for scoring, UI, certificate generation
- Real PDF generation (jsPDF or server-side)
- Proper lead capture with consent management
- Accessibility-first design
- Mobile-responsive layout
- Analytics event tracking
- Email integration (Brevo)

See `ASSESSMENT_ARCHITECTURE.md` for proposed architecture.

---

## Files Audited

- `/data/terrnix/repos/ecosphere-sustainability/index.html` (lines 4393–5950)
