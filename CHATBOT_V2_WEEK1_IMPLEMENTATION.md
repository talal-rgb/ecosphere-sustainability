# Chatbot V2 — Week 1 Implementation Plan
**Date:** 2026-06-17
**Branch:** agent/chatbot-v2-week1-20260617
**Scope:** Foundation + Intelligence (NO memory, NO PDF, NO quiz, NO lead qualification)

---

## Approved Scope

1. ✅ Knowledge base structure (`knowledge.json`)
2. ✅ 7 response templates
3. ✅ Calculator guidance bridge (read-only, anonymized)
4. ✅ Academy recommendations
5. ✅ Basic sustainability assistant behavior

## Explicitly NOT in Week 1

- ❌ Persistent memory (Layer 3)
- ❌ PDF assistant
- ❌ Quiz integration
- ❌ Lead qualification
- ❌ Aggressive data capture
- ❌ Backend AI

---

## Deliverables

| # | Deliverable | File |
|---|-------------|------|
| 1 | Week 1 Implementation Plan | `CHATBOT_V2_WEEK1_IMPLEMENTATION.md` (this file) |
| 2 | Structured Knowledge Base | `assets/js/chatbot/knowledge.json` |
| 3 | Response Templates | `assets/js/chatbot/templates.js` |
| 4 | Intent & Topic Detection | `assets/js/chatbot/intentDetector.js` |
| 5 | Response Builder | `assets/js/chatbot/responseBuilder.js` |
| 6 | Calculator Bridge | `assets/js/chatbot/calculator-bridge.js` |
| 7 | Academy Bridge | `assets/js/chatbot/academy-bridge.js` |
| 8 | Chatbot Controller | `assets/js/chatbot/index.js` |
| 9 | Updated index.html | `index.html` (script imports) |
| 10 | Test Results | `CHATBOT_WEEK1_TEST_RESULTS.md` |

---

## File Structure

```
assets/js/chatbot/
├── knowledge.json          # Structured knowledge base
├── templates.js            # 7 response templates
├── intentDetector.js       # Classify user intent
├── topicDetector.js        # Identify sustainability topic
├── responseBuilder.js      # Assemble response from template + knowledge
├── calculator-bridge.js    # Read calculator state (anonymized)
├── academy-bridge.js       # Academy content index + recommendations
└── index.js                # Main chatbot controller
```

---

## Implementation Steps

### Step 1: Knowledge Base (`knowledge.json`)

Extract from current `genResponse()` into structured JSON:

```json
{
  "version": "2.0-week1",
  "domains": {
    "carbon-accounting": {
      "topics": ["scope-1", "scope-2", "scope-3", "ghg-protocol", "emission-factors"],
      "responses": {
        "scope-1": {
          "definition": "...",
          "examples": ["..."],
          "reduction": ["..."],
          "terrnixLink": "/carbon-accounting/scope-1-emissions/"
        }
      }
    },
    "esg-reporting": { ... },
    "sustainability-strategy": { ... },
    "terrnix-features": { ... }
  }
}
```

### Step 2: Response Templates (`templates.js`)

7 templates with skill level adaptation:

1. **educational** — Definition + why it matters + key facts + Terrnix link
2. **regulatory** — Applies to + deadline + requirements + action
3. **calculator** — Acknowledge data + explain output + benchmark + actions
4. **academy** — Based on interest + guide recommendation + why + link
5. **safety** — Disclaimer + limitation + suggestion to consult expert
6. **clarification** — "Did you mean...?" + options
7. **fallback** — "I didn't understand" + suggested topics

### Step 3: Intent Detection (`intentDetector.js`)

Classify user message into:
- `educational` — "What is X?"
- `calculator-help` — "How do I use the calculator?"
- `calculator-explain` — "Why is my X high?"
- `academy-request` — "Where can I learn more?"
- `safety-concern` — "Is this advice reliable?"
- `greeting` — "Hello"
- `fallback` — Unknown

### Step 4: Topic Detection (`topicDetector.js`)

Identify sustainability topic from keywords:
- scope-1, scope-2, scope-3, ghg-protocol, emission-factors
- csrd, esrs, issb, tcfd, tnfd, gri, sbti
- net-zero, decarbonization, carbon-pricing
- energy, renewables, lcoe
- calculator, pdf, academy, quiz

### Step 5: Calculator Bridge (`calculator-bridge.js`)

**Read-only, anonymized:**
- Read calculator inputs from DOM
- Extract: scope percentages, top category, intensity ratios
- NEVER store: company name, revenue, employee count, absolute values
- Provide contextual responses based on calculator state

### Step 6: Academy Bridge (`academy-bridge.js`)

- Index all Academy guides with topics, levels, URLs
- Map user topics to relevant guides
- Trigger: explicit request OR 2+ messages on same topic
- Format: "Based on your interest in [topic], I recommend [Guide] — [description]. [URL]"

### Step 7: Controller (`index.js`)

```javascript
function handleUserMessage(message) {
  const intent = detectIntent(message);
  const topic = detectTopic(message);
  const template = selectTemplate(intent);
  const knowledge = getKnowledge(topic);
  const calculatorContext = getCalculatorContext(); // if available
  
  const response = buildResponse(template, knowledge, calculatorContext);
  
  if (shouldRecommendAcademy(intent, topic)) {
    response.academyRecommendation = getAcademyRecommendation(topic);
  }
  
  return response;
}
```

---

## Testing Requirements

### Minimum 30 Prompts

| Category | Count | Examples |
|----------|-------|----------|
| Scope 1/2/3 questions | 10 | "What is Scope 1?", "How do I calculate Scope 2?", "Why is Scope 3 high?" |
| Calculator explanation | 5 | "How do I use the calculator?", "What units for fuel?", "Is 10,000 tonnes a lot?" |
| ESG/CSRD questions | 5 | "What is CSRD?", "Does CSRD apply to me?", "What is double materiality?" |
| Academy recommendations | 5 | "Where can I learn more?", "What guide covers Scope 3?" |
| Safety/disclaimer | 5 | "Is this advice reliable?", "Can I use this for audit?", "What are the limitations?" |

### Scoring

| Score | Criteria |
|-------|----------|
| 2 (Acceptable) | Accurate, helpful, on-topic |
| 1 (Partial) | Contains correct info but incomplete or slightly off |
| 0 (Unacceptable) | Incorrect, irrelevant, or unhelpful |

### Target

- **90%+ acceptable (score 2)**
- **0% unacceptable (score 0)**
- **Average score ≥ 1.8**

---

## Approval Gate

**Do NOT proceed to Week 2 until:**

1. Week 1 code passes all tests
2. Test results documented in `CHATBOT_WEEK1_TEST_RESULTS.md`
3. Code reviewed and approved
4. PR merged to main

---

## Timeline

| Day | Tasks |
|-----|-------|
| 1 | Knowledge base extraction, directory structure |
| 2 | Intent detection, topic detection, templates |
| 3 | Calculator bridge, Academy bridge |
| 4 | Controller integration, UI wiring |
| 5 | Testing (30+ prompts), fixes |
| 6 | Documentation, PR creation |
| 7 | Buffer / review |

---

## Status

**Chatbot V2 = DESIGN → LOCAL/PR after Week 1 implementation**

---

*Plan Version: Week1-1.0*
*Status: Ready for implementation*
