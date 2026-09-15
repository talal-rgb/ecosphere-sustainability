# Chatbot V2 Week 2 — Test Plan
**Date:** 2026-06-17
**Status:** Planned
**Target:** 50+ tests, 8.2+/10 average score

---

## Test Categories

### 1. Follow-up Questions (10 tests)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 1.1 | "What is Scope 2?" then "What about Scope 3?" | Detects follow-up, explains Scope 3 |
| 1.2 | "Explain Scope 1" then "How do I reduce it?" | Maintains Scope 1 context |
| 1.3 | "What is CSRD?" then "What about ESRS?" | Links ESRS to CSRD |
| 1.4 | "Tell me about net zero" then "What is SBTi?" | Maintains strategy context |
| 1.5 | "How does calculator work?" then "Can I export PDF?" | Maintains calculator context |
| 1.6 | "What are emission factors?" then "Where do they come from?" | Deepens explanation |
| 1.7 | "Explain double materiality" then "Give me an example" | Provides example |
| 1.8 | "What is Scope 3?" then "Why is it difficult?" | Explains difficulty |
| 1.9 | "How do I start?" then "What about ESG?" | Switches to ESG path |
| 1.10 | "What is GHG Protocol?" then "Is it mandatory?" | Answers yes/no |

### 2. Memory Tests (10 tests)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 2.1 | Ask 3 carbon questions | Topics tracked: scope1, scope2, scope3 |
| 2.2 | Ask beginner question then advanced | Maturity upgrades to intermediate |
| 2.3 | Use calculator then ask "Explain my results" | Detects calculator data |
| 2.4 | Ask about CSRD twice | TopicsDiscussed size = 1 (deduped) |
| 2.5 | 10 messages | History length = 10 (max) |
| 2.6 | Ask about manufacturing | Industry inferred: manufacturing |
| 2.7 | Ask about "my company has 500 employees" | Size inferred: large |
| 2.8 | Ask "I'm new to this" then "I have a baseline" | Maturity: intermediate |
| 2.9 | View guide then ask question | Guides viewed tracked |
| 2.10 | Clear memory then ask question | Fresh start, no context |

### 3. PDF Interpretation (10 tests)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 3.1 | "Explain my PDF report" (no data) | Explains 9-page structure |
| 3.2 | "Explain my PDF report" (with data) | Interprets specific results |
| 3.3 | "What is on page 3?" | Explains Scope 1 breakdown |
| 3.4 | "How do I use this report?" | Provides usage tips |
| 3.5 | "What does Executive Summary show?" | Explains section |
| 3.6 | "Why is Scope 3 my highest?" | Explains with data |
| 3.7 | "What are the recommendations?" | Lists prioritized actions |
| 3.8 | "Is this audit-ready?" | Disclaimer: educational only |
| 3.9 | "Can I submit this to regulators?" | Disclaimer: not compliance |
| 3.10 | "What methodology was used?" | Explains GHG Protocol alignment |

### 4. Quiz Recommendations (10 tests)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 4.1 | Ask 3 carbon questions | Recommends Carbon Readiness Quiz |
| 4.2 | Ask 3 ESG questions | Recommends ESG Maturity Quiz |
| 4.3 | Ask 3 strategy questions | Recommends Strategy Quiz |
| 4.4 | Ask 1 carbon question | No recommendation (too early) |
| 4.5 | Ask carbon then ESG questions | Recommends both over time |
| 4.6 | Take quiz then ask more | No duplicate recommendation |
| 4.7 | Ask 10 unrelated questions | No recommendation |
| 4.8 | Ask about calculator then quiz | Quiz recommendation relevant |
| 4.9 | Beginner questions | Quiz recommended at right time |
| 4.10 | Advanced questions | Quiz still recommended |

### 5. Lead Qualification (10 tests)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 5.1 | "I work in manufacturing" | Industry: manufacturing |
| 5.2 | "My company has 1000+ employees" | Size: enterprise |
| 5.3 | "I'm new to carbon accounting" | Maturity: beginner |
| 5.4 | "I've set science-based targets" | Maturity: advanced |
| 5.5 | 5 messages + calculator | Engagement score > 30 |
| 5.6 | 10 messages + guides | Engagement score > 50 |
| 5.7 | High engagement | isQualifiedLead = true |
| 5.8 | Low engagement | isQualifiedLead = false |
| 5.9 | No explicit questions asked | All inferred from conversation |
| 5.10 | Clear memory | Profile reset |

### 6. Confidence Levels (10 tests)

| # | Prompt | Expected Confidence |
|---|--------|---------------------|
| 6.1 | "What is Scope 1?" | High (GHG Protocol) |
| 6.2 | "What is CSRD?" | High (regulatory) |
| 6.3 | "How does calculator work?" | High (Terrnix feature) |
| 6.4 | "Why is my Scope 3 high?" | Medium (depends on data) |
| 6.5 | "What should I do first?" | Medium (general guidance) |
| 6.6 | "Can you guarantee accuracy?" | Low (limited info) |
| 6.7 | "What if I'm unsure?" | Medium (general guidance) |
| 6.8 | "Is this GHG Protocol aligned?" | High (established standard) |
| 6.9 | "What are ESRS standards?" | High (regulatory framework) |
| 6.10 | Unknown question | Low (unknown context) |

---

## Test Implementation

### Automated Tests

```javascript
// test-chatbot-week2.js
const assert = require('assert');

// Test 1.1: Follow-up detection
function testFollowUp() {
  SessionMemory.clear();
  TerrnixChatbot.handleMessage("What is Scope 2?");
  const response = TerrnixChatbot.handleMessage("What about Scope 3?");
  assert(response.text.includes("Scope 3"), "Should explain Scope 3");
  console.log("✓ Test 1.1 passed");
}

// Test 2.1: Topic tracking
function testTopicTracking() {
  SessionMemory.clear();
  TerrnixChatbot.handleMessage("What is Scope 1?");
  TerrnixChatbot.handleMessage("What is Scope 2?");
  TerrnixChatbot.handleMessage("What is Scope 3?");
  assert(SessionMemory.topicsDiscussed.size === 3, "Should track 3 topics");
  console.log("✓ Test 2.1 passed");
}

// Test 3.1: PDF structure (no data)
function testPDFStructure() {
  SessionMemory.clear();
  const response = TerrnixChatbot.handleMessage("Explain my PDF report");
  assert(response.text.includes("9-page"), "Should mention 9 pages");
  assert(response.text.includes("educational"), "Should include disclaimer");
  console.log("✓ Test 3.1 passed");
}

// Test 4.1: Quiz recommendation
function testQuizRecommendation() {
  SessionMemory.clear();
  TerrnixChatbot.handleMessage("What is Scope 1?");
  TerrnixChatbot.handleMessage("What is Scope 2?");
  TerrnixChatbot.handleMessage("What is Scope 3?");
  const response = TerrnixChatbot.handleMessage("How do I calculate emissions?");
  assert(response.text.includes("Quiz"), "Should recommend quiz");
  console.log("✓ Test 4.1 passed");
}

// Test 5.1: Industry inference
function testIndustryInference() {
  SessionMemory.clear();
  LeadQualification.clear();
  TerrnixChatbot.handleMessage("I work in manufacturing");
  assert(LeadQualification.getProfile().industry === "manufacturing", "Should infer manufacturing");
  console.log("✓ Test 5.1 passed");
}

// Test 6.1: Confidence level
function testConfidenceHigh() {
  SessionMemory.clear();
  const response = TerrnixChatbot.handleMessage("What is Scope 1?");
  assert(response.confidence.level === "High", "Should be High confidence");
  assert(response.text.includes("Confidence: High"), "Should include confidence text");
  console.log("✓ Test 6.1 passed");
}
```

---

## Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Follow-up context | 90% | Correctly detect previous topic |
| Memory accuracy | 95% | Correct topic tracking |
| PDF explanation | 100% | Include disclaimer |
| Quiz relevance | 80% | Recommendations are relevant |
| Lead scoring | 100% | No PII, no explicit questions |
| Confidence coverage | 100% | All responses include confidence |
| Average score | ≥8.2/10 | Manual evaluation |

---

## Test Execution

```bash
# Run all tests
node test-chatbot-week2.js

# Expected output:
# ✓ Test 1.1 passed
# ✓ Test 1.2 passed
# ...
# ✓ Test 6.10 passed
# 
# Results: 60/60 passed (100%)
```

---

*Document Date: 2026-06-17*
*Status: Planned → Execution*
