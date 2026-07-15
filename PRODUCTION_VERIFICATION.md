# Terrnix Assessment Platform Production Verification

**Status:** NOT STARTED  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Quality Assurance

---

## Verification Philosophy

Nothing is complete until production is verified. Every feature must pass through: Implemented → Committed → Pushed → Deployed → Production Verified.

**Verification Principles:**
1. **Automated where possible:** Unit tests, visual regression, performance budgets
2. **Manual where necessary:** UX flow, mobile devices, accessibility
3. **Documented always:** Every test has evidence
4. **Signed off formally:** No implicit approvals

---

## Pre-Deployment Checklist

| # | Item | Status | Evidence |
|---|------|--------|----------|
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

## Test Suite: 110 Tests

### Category 1: Desktop Chrome (31 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 1.1 | Navigate to assessment landing page | Page loads with title, meta, OG tags | PENDING | |
| 1.2 | Verify SEO elements | Canonical, schema, breadcrumb present | PENDING | |
| 1.3 | Click "Start Assessment" | Intro screen displays with benefits | PENDING | |
| 1.4 | Click "Start" on intro | First question displays, progress bar at 0% | PENDING | |
| 1.5 | Answer first question | Option selected, "Next" enabled | PENDING | |
| 1.6 | Click "Next" | Second question displays, progress advances | PENDING | |
| 1.7 | Click "Previous" | Returns to first question, answer retained | PENDING | |
| 1.8 | Complete all questions | Review screen displays with all answers | PENDING | |
| 1.9 | Click "Edit" on review | Jumps to that question | PENDING | |
| 1.10 | Click "Submit" | Lead capture form displays | PENDING | |
| 1.11 | Submit form without name | Validation error: "Please enter your full name" | PENDING | |
| 1.12 | Submit form without email | Validation error: "Please enter your email address" | PENDING | |
| 1.13 | Submit form with invalid email | Validation error: "Please enter a valid email address" | PENDING | |
| 1.14 | Submit form without consent | Validation error: "You must agree to receive your results" | PENDING | |
| 1.15 | Submit valid form | Results screen displays with score and maturity | PENDING | |
| 1.16 | Verify newsletter checkbox unchecked | Checkbox not checked by default | PENDING | |
| 1.17 | Verify score calculation | Score matches manual calculation | PENDING | |
| 1.18 | Verify maturity level | Level matches score range | PENDING | |
| 1.19 | Verify category breakdown | All categories displayed with scores | PENDING | |
| 1.20 | Verify radar chart | Chart renders with 5 axes | PENDING | |
| 1.21 | Verify strengths | Top 2 categories highlighted | PENDING | |
| 1.22 | Verify gaps | Bottom 2 categories highlighted | PENDING | |
| 1.23 | Verify recommendations | 5 actions displayed with priority | PENDING | |
| 1.24 | Click "Download Report" | PDF downloads, filename correct | PENDING | |
| 1.25 | Click "Download Certificate" | PDF downloads, filename correct | PENDING | |
| 1.26 | Verify no print dialog | Browser print dialog does NOT open | PENDING | |
| 1.27 | Open certificate PDF | A4 landscape, all elements present | PENDING | |
| 1.28 | Verify certificate fields | Name, date, score, level, ID, QR code all correct | PENDING | |
| 1.29 | Scan QR code | Opens verification page with correct ID | PENDING | |
| 1.30 | Open report PDF | Multi-page, all sections present | PENDING | |
| 1.31 | Click consultation CTA | Navigates to contact section | PENDING | |

### Category 2: Desktop Edge/Firefox (3 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 2.1 | Repeat Chrome tests 1.1–1.31 | All pass | PENDING | |
| 2.2 | Verify PDF download in Edge | PDF opens correctly | PENDING | |
| 2.3 | Verify PDF download in Firefox | PDF opens correctly | PENDING | |

### Category 3: Mobile (8 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 3.1 | Navigate to assessment on mobile | Layout adapts to mobile screen | PENDING | |
| 3.2 | Tap "Start Assessment" | First question displays, readable | PENDING | |
| 3.3 | Answer question by tapping | Option selected, visual feedback | PENDING | |
| 3.4 | Scroll through questions | Smooth scrolling, no layout issues | PENDING | |
| 3.5 | Complete assessment | Form and results readable on mobile | PENDING | |
| 3.6 | Download certificate | PDF downloads to device | PENDING | |
| 3.7 | Download report | PDF downloads to device | PENDING | |
| 3.8 | Tap consultation CTA | Contact section visible | PENDING | |

### Category 4: Certificate Verification (5 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 4.1 | Visit verification URL with valid ID | Certificate details displayed | PENDING | |
| 4.2 | Verify no email exposed | Only first name + initial shown | PENDING | |
| 4.3 | Visit verification URL with invalid ID | "Certificate not found" message | PENDING | |
| 4.4 | Visit verification URL with missing ID | Error or redirect | PENDING | |
| 4.5 | Verify QR code links to correct URL | URL contains certificate ID | PENDING | |

### Category 5: Lead Capture (9 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 5.1 | Submit assessment | Lead record created in backend | PENDING | |
| 5.2 | Verify lead fields | All required fields present | PENDING | |
| 5.3 | Verify score stored | Score matches assessment result | PENDING | |
| 5.4 | Verify maturity level stored | Level matches score | PENDING | |
| 5.5 | Verify certificate ID stored | ID matches certificate | PENDING | |
| 5.6 | Verify consent timestamp | Timestamp recorded | PENDING | |
| 5.7 | Verify newsletter consent false | Not subscribed when unchecked | PENDING | |
| 5.8 | Verify newsletter consent true | Subscribed when checked | PENDING | |
| 5.9 | Verify UTM parameters | Source, medium, campaign stored | PENDING | |

### Category 6: Email (8 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 6.1 | Complete assessment | Confirmation email received within 5 minutes | PENDING | |
| 6.2 | Verify email subject | "Your Terrnix assessment results and certificate" | PENDING | |
| 6.3 | Verify email content | Name, score, maturity, links present | PENDING | |
| 6.4 | Click certificate link | Opens certificate download | PENDING | |
| 6.5 | Click report link | Opens report download | PENDING | |
| 6.6 | Click consultation CTA | Opens contact page | PENDING | |
| 6.7 | Verify no newsletter when unchecked | No welcome email received | PENDING | |
| 6.8 | Verify newsletter when checked | Welcome email received | PENDING | |

### Category 7: Analytics (10 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 7.1 | View assessment | `assessment_view` event fires | PENDING | |
| 7.2 | Start assessment | `assessment_start` event fires | PENDING | |
| 7.3 | Answer question | `assessment_progress` event fires | PENDING | |
| 7.4 | Submit details | `participant_details` event fires | PENDING | |
| 7.5 | Complete assessment | `assessment_complete` event fires | PENDING | |
| 7.6 | Download report | `report_download` event fires | PENDING | |
| 7.7 | Download certificate | `certificate_download` event fires | PENDING | |
| 7.8 | Click consultation | `consultation_click` event fires | PENDING | |
| 7.9 | Check newsletter | `newsletter_consent` event fires | PENDING | |
| 7.10 | Verify in GA4 Real-Time | Events appear within 1 minute | PENDING | |

### Category 8: Accessibility (8 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 8.1 | Tab through options | Each option receives focus | PENDING | |
| 8.2 | Select option with Enter | Option selected | PENDING | |
| 8.3 | Navigate with arrow keys | Previous/Next work | PENDING | |
| 8.4 | Screen reader announces question | Question text read aloud | PENDING | |
| 8.5 | Screen reader announces score | Score read aloud on results | PENDING | |
| 8.6 | Focus indicator visible | Clear focus ring on all elements | PENDING | |
| 8.7 | Colour not sole indicator | Icons + text for correct/wrong | PENDING | |
| 8.8 | Form labels associated | Screen reader reads labels | PENDING | |

### Category 9: Performance (6 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 9.1 | First Contentful Paint | < 1.5 seconds | PENDING | |
| 9.2 | Largest Contentful Paint | < 2.5 seconds | PENDING | |
| 9.3 | Time to Interactive | < 3.5 seconds | PENDING | |
| 9.4 | Cumulative Layout Shift | < 0.1 | PENDING | |
| 9.5 | PDF generation time | < 2 seconds | PENDING | |
| 9.6 | Total JS payload | < 50KB gzipped (initial) | PENDING | |

### Category 10: Security (6 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 10.1 | XSS attempt in name | Sanitized, no script execution | PENDING | |
| 10.2 | XSS attempt in email | Rejected or sanitized | PENDING | |
| 10.3 | SQL injection attempt | Rejected by backend | PENDING | |
| 10.4 | Rate limiting | Max 5 assessments per hour per IP | PENDING | |
| 10.5 | Certificate ID randomness | IDs not predictable | PENDING | |
| 10.6 | No email in verification | Email not exposed | PENDING | |

### Category 11: Console Errors (6 tests)

| # | Test | Expected Result | Status | Evidence |
|---|------|----------------|--------|----------|
| 11.1 | Load assessment page | No console errors | PENDING | |
| 11.2 | Start assessment | No console errors | PENDING | |
| 11.3 | Navigate questions | No console errors | PENDING | |
| 11.4 | Submit form | No console errors | PENDING | |
| 11.5 | Download PDFs | No console errors | PENDING | |
| 11.6 | View results | No console warnings | PENDING | |

---

## Automated Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

**Coverage Targets:**
| Metric | Target |
|--------|--------|
| Statements | > 80% |
| Branches | > 75% |
| Functions | > 85% |
| Lines | > 80% |

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Test backend API
npm run test:api
```

### Visual Regression

```bash
# Run visual regression tests
npm run test:visual

# Update baselines
npm run test:visual -- --update
```

### Performance Tests

```bash
# Lighthouse CI
npm run lighthouse

# WebPageTest
npm run webpagetest
```

---

## Manual Testing Protocol

### Device Matrix

| Device | OS | Browser | Priority |
|--------|-----|---------|----------|
| Desktop | Windows 11 | Chrome 120 | Critical |
| Desktop | Windows 11 | Edge 120 | High |
| Desktop | macOS Sonoma | Safari 17 | High |
| Desktop | macOS Sonoma | Chrome 120 | High |
| Tablet | iPadOS 17 | Safari | Medium |
| Tablet | Android 14 | Chrome | Medium |
| Mobile | iOS 17 | Safari | Critical |
| Mobile | Android 14 | Chrome | Critical |

### Testing Steps

1. **Clear cache and cookies**
2. **Open browser DevTools**
3. **Navigate to assessment landing page**
4. **Complete full assessment flow**
5. **Document any issues with screenshots**
6. **Check console for errors**
7. **Verify GA4 events in real-time report**
8. **Download and inspect PDFs**
9. **Test certificate verification**
10. **Check email delivery**

---

## Sign-Off Process

### Roles and Responsibilities

| Role | Name | Responsibility |
|------|------|---------------|
| Developer | | Code quality, unit tests |
| QA Tester | | Manual testing, bug reports |
| Product Owner | | Feature completeness, UX approval |
| Security Reviewer | | Security audit, penetration test |
| Performance Engineer | | Load testing, optimisation |

### Sign-Off Criteria

The Assessment Platform is production-ready when:

- [ ] All 110 tests pass
- [ ] Unit test coverage > 80%
- [ ] Lighthouse score > 90 (all categories)
- [ ] No critical or high bugs open
- [ ] Security audit passed
- [ ] Performance budget met
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] GA4 events verified in real-time
- [ ] Email delivery tested
- [ ] Certificate verification tested
- [ ] Load test: 100 concurrent users
- [ ] Documentation complete

### Sign-Off Form

```
TERRNIX ASSESSMENT PLATFORM PRODUCTION SIGN-OFF

Assessment: Carbon Accounting Readiness Assessment
Version: 1.0.0
Date: ___________

DEVELOPER SIGN-OFF
Name: _________________________
Signature: _____________________
Date: ___________
All unit tests pass: [ ] Yes [ ] No
Code review complete: [ ] Yes [ ] No

QA SIGN-OFF
Name: _________________________
Signature: _____________________
Date: ___________
All manual tests pass: [ ] Yes [ ] No
No critical bugs: [ ] Yes [ ] No
No high bugs: [ ] Yes [ ] No

PRODUCT OWNER SIGN-OFF
Name: _________________________
Signature: _____________________
Date: ___________
Feature complete per spec: [ ] Yes [ ] No
UX approved: [ ] Yes [ ] No

SECURITY SIGN-OFF
Name: _________________________
Signature: _____________________
Date: ___________
Security audit passed: [ ] Yes [ ] No
Penetration test passed: [ ] Yes [ ] No

PERFORMANCE SIGN-OFF
Name: _________________________
Signature: _____________________
Date: ___________
Performance budget met: [ ] Yes [ ] No
Load test passed: [ ] Yes [ ] No

FINAL APPROVAL
Name: _________________________
Signature: _____________________
Date: ___________
Approved for production: [ ] Yes [ ] No
```

---

## Post-Deployment Monitoring

### First 24 Hours

| Check | Frequency | Owner |
|-------|-----------|-------|
| Error logs | Every 2 hours | Developer |
| GA4 events | Every 4 hours | Product |
| Email delivery | Every 4 hours | Product |
| Certificate verification | Every 8 hours | QA |
| User feedback | Daily | Product |

### First Week

| Check | Frequency | Owner |
|-------|-----------|-------|
| Conversion funnel | Daily | Product |
| Lead quality | Daily | Sales |
| Performance metrics | Daily | Developer |
| Bug reports | Daily | QA |

### Ongoing

| Check | Frequency | Owner |
|-------|-----------|-------|
| Monthly review | Monthly | Product |
| Quarterly audit | Quarterly | Security |
| Annual penetration test | Annual | Security |

---

## Rollback Plan

### Trigger Conditions

- Critical bug affecting > 10% of users
- Security vulnerability discovered
- Performance degradation > 50%
- Data loss or corruption

### Rollback Steps

1. **Stop deployment** (if rolling)
2. **Revert to previous version**
   ```bash
   git revert HEAD
   git push origin main
   ```
3. **Verify rollback**
   - Check production URL
   - Verify core functionality
   - Confirm no data loss
4. **Communicate**
   - Notify team
   - Update status page
   - Email affected users (if necessary)
5. **Post-mortem**
   - Document root cause
   - Create prevention plan
   - Schedule fix deployment

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-15 | Terrnix AI | Initial creation |
