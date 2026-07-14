# Event Tracking Verification Report
**Date:** 2026-07-14  
**Scope:** Production event firing for 5 critical events  
**Method:** Code audit + trigger analysis + GA4 reception assessment  
**Status:** ⚠️ PARTIAL — 2 events confirmed firing, 3 events MISSING or BROKEN

---

## Executive Summary

| Event | Code Present | Trigger | GA4 Reception | Status |
|-------|-------------|---------|---------------|--------|
| `calculator_complete` | ✅ Yes | Calculator result display | 🔴 **UNVERIFIED** | ⚠️ Needs fix |
| `contact_submit` | ✅ Yes | Form success callback | 🟡 **LIKELY** | ⚠️ Needs verification |
| `newsletter_signup` | ✅ Yes | Form success callback | 🟡 **LIKELY** | ⚠️ Needs verification |
| `quiz_complete` | ❌ **NO** | Quiz results display | 🔴 **NONE** | 🔴 MISSING |
| `pdf_download` | ❌ **NO** | PDF export button | 🔴 **NONE** | 🔴 MISSING |

---

## Detailed Findings

### 1. `calculator_complete` — ⚠️ PARTIALLY BROKEN

**Trigger:** `window.trackCalculatorComplete('carbon_footprint', total.toFixed(2))`  
**Location:** `index.html:4262-4263`  
**Context:** Called when calculator results panel is displayed

**Code:**
```javascript
if (window.trackCalculatorComplete) {
  window.trackCalculatorComplete('carbon_footprint', total.toFixed(2));
}
```

**Issue:** The function `trackCalculatorComplete` is defined in `analytics.js` and exposed globally. However:
- The analytics.js `enabled` flag is set to `true` and GA4 ID `G-MVBZJTV3S9` is configured
- BUT: `trackCalculatorComplete` calls `trackEvent()` which checks `CONFIG.enabled`
- The `trackEvent` function in analytics.js only fires if `CONFIG.enabled === true`
- **Risk:** If analytics.js fails to load or `enabled` is toggled off, no event fires

**GA4 Reception Status:** 🔴 UNVERIFIED
- No test evidence from GA4 DebugView or real-time reports
- The event name sent is `calculator_complete` with params `calculator_type` and `result_value`
- **Cannot confirm** GA4 is receiving this event without live testing

**Recommended Fix:**
```javascript
// Add fallback direct gtag call
if (window.trackCalculatorComplete) {
  window.trackCalculatorComplete('carbon_footprint', total.toFixed(2));
} else if (window.gtag) {
  window.gtag('event', 'calculator_complete', {
    calculator_type: 'carbon_footprint',
    result_value: total.toFixed(2)
  });
}
```

**Key Event / Conversion Status:** NOT MARKED AS KEY EVENT  
**Action Required:** Mark `calculator_complete` as a key event in GA4 Admin > Key Events

---

### 2. `contact_submit` — 🟡 LIKELY WORKING (NEEDS VERIFICATION)

**Trigger:** Form success callback after API response  
**Location:** `index.html:6848-6854` (API client path) and `6887-6893` (fallback fetch path)

**Code:**
```javascript
if (window.terrnixTrack) {
  window.terrnixTrack('contact_submit', {
    form_type: 'consultation_request',
    page_location: window.location.pathname,
    discipline: disciplineName
  });
}
```

**Analysis:**
- `window.terrnixTrack` is the exposed `trackEvent` function from analytics.js
- Called in BOTH success paths (apiClient AND fallback fetch)
- Event name: `contact_submit`
- Parameters: `form_type`, `page_location`, `discipline`

**GA4 Reception Status:** 🟡 LIKELY
- Code structure is correct
- Called after confirmed success (`data.success === true`)
- **Cannot confirm** without live form submission test in GA4 DebugView

**Key Event / Conversion Status:** NOT MARKED AS KEY EVENT  
**Action Required:** Mark `contact_submit` as a key event in GA4

**Duplicate Firing Risk:** LOW  
- Only fires on success, not on error
- Both API paths have the tracking call, but only one path executes per submission

---

### 3. `newsletter_signup` — 🟡 LIKELY WORKING (NEEDS VERIFICATION)

**Trigger:** Form success callback after API response  
**Location:** `index.html:6919-6924` (API client path) and `6940-6945` (fallback fetch path)

**Code:**
```javascript
if (window.terrnixTrack) {
  window.terrnixTrack('newsletter_signup', {
    signup_location: 'homepage_footer',
    page_location: window.location.pathname
  });
}
```

**Analysis:**
- Same pattern as `contact_submit`
- Called in BOTH success paths
- Event name: `newsletter_signup`
- Parameters: `signup_location`, `page_location`

**GA4 Reception Status:** 🟡 LIKELY
- Code structure correct
- **Cannot confirm** without live test

**Key Event / Conversion Status:** NOT MARKED AS KEY EVENT  
**Action Required:** Mark `newsletter_signup` as a key event in GA4

---

### 4. `quiz_complete` — 🔴 MISSING

**Trigger:** Quiz results display (`showResults()` function)  
**Location:** `index.html:6113-6140` (showResults function)

**Finding:**
- The `showResults()` function displays quiz results but **DOES NOT call any tracking function**
- `window.trackQuizComplete` is defined in `analytics.js` but **never invoked** in the quiz logic
- No `terrnixTrack` call for `quiz_complete` anywhere in the quiz flow

**Missing Code:**
```javascript
// Should be added at the end of showResults():
if (window.trackQuizComplete) {
  window.trackQuizComplete('sustainability_quiz', pct);
}
// OR direct fallback:
if (window.gtag) {
  window.gtag('event', 'quiz_complete', {
    quiz_name: 'sustainability_quiz',
    quiz_score: pct
  });
}
```

**GA4 Reception Status:** 🔴 NONE — Event never fires

**Key Event / Conversion Status:** NOT APPLICABLE (event doesn't fire)

---

### 5. `pdf_download` — 🔴 MISSING

**Trigger:** PDF export button click  
**Location:** `index.html:4599-4601`

**Finding:**
- The "Export PDF" button calls `window.print()` — a browser print dialog
- **No tracking call** is made for `pdf_download`
- The `analytics.js` has `initPDFTracking()` which listens for clicks on `a[href$=".pdf"]` or `[data-track="pdf_download"]`
- But the actual PDF button is a `<button id="exportPDF">` with NO `data-track="pdf_download"` attribute
- The PDF is generated via `window.print()`, not an actual PDF download

**Missing Implementation:**
```javascript
// Add to exportPDF click handler:
document.getElementById('exportPDF').addEventListener('click', () => {
  // Track before opening print dialog
  if (window.terrnixTrack) {
    window.terrnixTrack('pdf_download', {
      pdf_name: 'carbon-footprint-report',
      pdf_location: window.location.pathname
    });
  }
  window.print();
});
```

**GA4 Reception Status:** 🔴 NONE — Event never fires

**Key Event / Conversion Status:** NOT APPLICABLE

---

## Summary Table

| # | Event | Code | Trigger | Fires? | GA4 Confirmed | Key Event | Action |
|---|-------|------|---------|--------|---------------|-----------|--------|
| 1 | calculator_complete | ✅ | Result display | 🟡 Conditional | 🔴 No | 🔴 No | Add fallback + verify |
| 2 | contact_submit | ✅ | Form success | 🟡 Likely | 🔴 No | 🔴 No | Verify in DebugView |
| 3 | newsletter_signup | ✅ | Form success | 🟡 Likely | 🔴 No | 🔴 No | Verify in DebugView |
| 4 | quiz_complete | ❌ | Results display | 🔴 Never | 🔴 No | 🔴 No | **ADD TRACKING** |
| 5 | pdf_download | ❌ | Button click | 🔴 Never | 🔴 No | 🔴 No | **ADD TRACKING** |

---

## Required Actions (Priority Order)

### P0 — Fix Missing Events
1. **Add `quiz_complete` tracking** to `showResults()` function
2. **Add `pdf_download` tracking** to `exportPDF` click handler

### P1 — Verify GA4 Reception
3. **Test all 5 events** in GA4 DebugView with real interactions
4. **Mark all 5 events as Key Events** in GA4 Admin

### P2 — Harden Event Firing
5. **Add fallback `gtag()` calls** for all events (not just `terrnixTrack`)
6. **Add `data-track` attributes** to all interactive elements for declarative tracking

---

## Test Protocol for Production Verification

1. Open terrnix.com in incognito window
2. Open browser DevTools > Network tab
3. Filter for `google-analytics` or `collect`
4. Perform each action:
   - Complete carbon calculator → check for `calculator_complete` event
   - Submit contact form → check for `contact_submit` event
   - Sign up for newsletter → check for `newsletter_signup` event
   - Complete quiz → check for `quiz_complete` event
   - Click Export PDF → check for `pdf_download` event
5. Verify each event appears in GA4 Real-Time > Events (within 1-2 minutes)
6. Verify each event appears in GA4 DebugView (if using GA4 Debug extension)

**Do NOT mark tracking as complete until all 5 events are confirmed in GA4.**

---

*Report prepared: 2026-07-14*  
*Next verification: After code fixes deployed*
