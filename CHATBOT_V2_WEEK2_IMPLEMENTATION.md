# Chatbot V2 Week 2 — Implementation Plan
**Date:** 2026-06-17
**Status:** IN PROGRESS
**Target:** 8.2+/10 average response quality

---

## Overview

Week 2 builds on Week 1's foundation by adding:
1. **Session Memory** — Conversation context, topic persistence, calculator awareness
2. **Confidence Levels** — Trust indicators on every response
3. **PDF Report Assistant** — Explain structure, interpret results
4. **Quiz Recommendations** — Topic-based suggestions
5. **Soft Lead Qualification** — Engagement tracking without aggression

---

## 1. Session Memory

### 1.1 Architecture

```javascript
// Session memory — in-memory only, no persistent storage
const sessionMemory = {
  // Conversation history (last 10 exchanges)
  history: [
    { role: 'user', text: '...', intent: 'carbon', topic: 'scope1', timestamp: Date },
    { role: 'bot', text: '...', confidence: 'high', timestamp: Date }
  ],
  
  // Detected topics (deduplicated set)
  topicsDiscussed: new Set(['scope1', 'ghg-protocol']),
  
  // User maturity level
  maturity: 'beginner', // 'beginner' | 'intermediate' | 'advanced'
  
  // Calculator context (read-only snapshot)
  calculatorContext: {
    hasData: false,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    total: 0,
    topSource: null,
    percentages: { scope1: 0, scope2: 0, scope3: 0 }
  },
  
  // Previous question references
  lastIntent: 'carbon',
  lastTopic: 'scope1',
  lastQuestionType: 'definition', // 'definition' | 'comparison' | 'how-to' | 'why'
  
  // Engagement tracking (for lead qualification)
  engagement: {
    messageCount: 0,
    topicsExplored: 0,
    calculatorUsed: false,
    guidesViewed: [],
    quizInterest: false
  }
};
```

### 1.2 Features

| Feature | Description |
|---------|-------------|
| History tracking | Last 10 exchanges for context |
| Topic persistence | Remember what user asked about |
| Follow-up detection | "What about Scope 3?" → knows previous was Scope 2 |
| Maturity inference | Track complexity of questions to infer level |
| Calculator awareness | Know if user has calculator data |

### 1.3 Privacy

- **No persistent storage** — All data lost on page refresh
- **No PII** — No names, emails, company names stored
- **Read-only calculator** — Never writes to calculator state
- **Anonymized engagement** — Only counts, no identifiers

---

## 2. Confidence Levels

### 2.1 Specification

Every response includes:

```
Confidence: High | Medium | Low
Reason: [Brief explanation]
```

### 2.2 Criteria

| Level | Criteria | Examples |
|-------|----------|----------|
| **High** | Established standards, direct from knowledge base | "Based on GHG Protocol Corporate Standard" |
| **Medium** | Depends on assumptions, general guidance | "Depends on company-specific boundaries" |
| **Low** | Limited data, estimates, or user-specific | "Based on limited information provided" |

### 2.3 Implementation

```javascript
function calculateConfidence(intent, topic, hasContext, knowledgeDepth) {
  if (knowledgeDepth === 'established_standard' && hasContext) {
    return { level: 'High', reason: 'Based on established GHG Protocol guidance' };
  }
  if (knowledgeDepth === 'general_guidance') {
    return { level: 'Medium', reason: 'Depends on company-specific assumptions' };
  }
  return { level: 'Low', reason: 'Insufficient information available' };
}
```

### 2.4 UI Display

```html
<div class="confidence-badge confidence-high">
  <span class="confidence-label">Confidence: High</span>
  <span class="confidence-reason">Based on GHG Protocol guidance</span>
</div>
```

---

## 3. PDF Report Assistant

### 3.1 Capabilities

| Capability | Description |
|------------|-------------|
| Structure explanation | Explain 9-page layout without user data |
| Result interpretation | Explain user's specific numbers |
| Top contributor analysis | Identify highest emission sources |
| Methodology explanation | Explain calculation approach |
| Recommendation guidance | Help users act on recommendations |

### 3.2 Safety Constraints

| Constraint | Enforcement |
|------------|-------------|
| No regulatory compliance claims | Template filters out compliance language |
| No audit readiness claims | Explicit disclaimer on all PDF help |
| Educational only | All explanations marked as guidance |

### 3.3 Response Types

**No calculator data:**
> "The Terrnix PDF report has 9 pages: Cover, Executive Summary, Scope 1/2/3 breakdowns, Methodology, Factors, Recommendations, Disclaimer. Generate a report from the calculator and I can explain your specific results."

**With calculator data:**
> "Your report shows Scope 3 at 75% of total emissions. This is typical for service companies. The top contributor is Category 1 (Purchased Goods). Here are reduction recommendations..."

---

## 4. Quiz Recommendations

### 4.1 Available Quizzes

| Quiz | Trigger Topics | Description |
|------|---------------|-------------|
| Carbon Readiness | scope1, scope2, scope3, ghg-protocol | Test carbon accounting knowledge |
| ESG Maturity | csrd, esrs, issb, gri, double-materiality | Test ESG reporting knowledge |
| Sustainability Strategy | net-zero, sbti, decarbonization, carbon-pricing | Test strategy knowledge |

### 4.2 Recommendation Logic

```javascript
function recommendQuiz(topicsDiscussed, maturity) {
  if (topicsDiscussed.has('scope1') || topicsDiscussed.has('scope2') || topicsDiscussed.has('scope3')) {
    return { quiz: 'carbon-readiness', reason: 'Based on your carbon accounting questions' };
  }
  if (topicsDiscussed.has('csrd') || topicsDiscussed.has('esrs')) {
    return { quiz: 'esg-maturity', reason: 'Based on your ESG reporting questions' };
  }
  return null; // No recommendation if not relevant
}
```

### 4.3 Delivery

- **Soft suggestion** — "Would you like to test your knowledge with the Carbon Readiness Quiz?"
- **Contextual** — Only recommend after 3+ related topics
- **Non-blocking** — Never gate answers behind quizzes

---

## 5. Soft Lead Qualification

### 5.1 Captured Data

| Field | Source | Storage |
|-------|--------|---------|
| Industry | Inferred from questions | Session only |
| Company size | Inferred from questions | Session only |
| Reporting maturity | Tracked from topics | Session only |
| Engagement score | Calculated from behavior | Session only |

### 5.2 Inference Rules

| Signal | Inference |
|--------|-----------|
| Asks about manufacturing | Industry: manufacturing |
| Asks about employee commuting | Company size: large |
| Asks about CSRD applicability | Reporting maturity: beginner |
| Explores 5+ topics | Engagement: high |
| Uses calculator | Engagement: high |

### 5.3 Qualification Score

```javascript
function calculateLeadScore(engagement) {
  let score = 0;
  score += engagement.messageCount * 2;
  score += engagement.topicsExplored * 5;
  score += engagement.calculatorUsed ? 20 : 0;
  score += engagement.guidesViewed.length * 3;
  score += engagement.quizInterest ? 10 : 0;
  return Math.min(score, 100); // Cap at 100
}
```

### 5.4 Privacy

- **No explicit questions** — Never ask "What's your company size?"
- **No PII** — No names, emails, phone numbers
- **Session only** — All data lost on refresh
- **Transparent** — User can see what's tracked

---

## 6. Module Structure

```
assets/js/chatbot/
├── knowledge.json          # Week 1 — Structured knowledge
├── templates.js            # Week 1 — Response templates
├── intentDetector.js       # Week 1 — Intent classification
├── topicDetector.js        # Week 1 — Topic identification
├── calculator-bridge.js    # Week 1 — Calculator integration
├── academy-bridge.js       # Week 1 — Academy recommendations
├── responseBuilder.js      # Week 1 — Response assembly
├── sessionMemory.js        # Week 2 — Session memory
├── confidence.js           # Week 2 — Confidence levels
├── pdfAssistant.js         # Week 2 — PDF report assistant
├── quizRecommender.js      # Week 2 — Quiz recommendations
├── leadQualification.js    # Week 2 — Soft lead qualification
└── index.js                # Week 2 — Main controller (updated)
```

---

## 7. Integration Flow

```
User Input
    ↓
Intent Detection (Week 1)
    ↓
Topic Detection (Week 1)
    ↓
Session Memory Update (Week 2)
    ↓
Context Enrichment (Week 2)
    ↓
Response Building (Week 1 + Week 2)
    ↓
Confidence Calculation (Week 2)
    ↓
Quiz Recommendation (Week 2, if relevant)
    ↓
Lead Score Update (Week 2)
    ↓
Response Delivery
```

---

## 8. Testing Plan

### 8.1 Test Categories

| Category | Count | Description |
|----------|-------|-------------|
| Follow-up questions | 10 | Test memory persistence |
| Memory tests | 10 | Test topic tracking, maturity |
| PDF interpretation | 10 | Test with/without calculator data |
| Quiz recommendations | 10 | Test relevance, timing |
| Lead qualification | 10 | Test inference, scoring |
| **Total** | **50** | |

### 8.2 Success Criteria

| Criterion | Target |
|-----------|--------|
| Follow-up context | 90% correctly detect previous topic |
| Memory accuracy | 95% correct topic tracking |
| PDF explanation | 100% include disclaimer |
| Quiz relevance | 80% recommendations are relevant |
| Lead scoring | 100% no PII, no explicit questions |
| Confidence coverage | 100% of responses include confidence |
| **Average score** | **≥8.2/10** |

---

## 9. Deliverables

| Deliverable | Status |
|-------------|--------|
| CHATBOT_V2_WEEK2_IMPLEMENTATION.md | ✅ This document |
| CHATBOT_WEEK2_TEST_PLAN.md | Pending |
| CHATBOT_WEEK2_TEST_RESULTS.md | Pending |
| sessionMemory.js | Pending |
| confidence.js | Pending |
| pdfAssistant.js | Pending |
| quizRecommender.js | Pending |
| leadQualification.js | Pending |
| Updated index.js | Pending |
| test-chatbot-week2.js | Pending |

---

## 10. Approval Gate

**Do not start Week 3 until:**
- [ ] 50+ tests pass
- [ ] Average score ≥8.2/10
- [ ] 0 critical issues
- [ ] Manual evaluation complete
- [ ] PR reviewed and approved

---

*Document Date: 2026-06-17*
*Status: Week 2 Planning Complete → Implementation*
