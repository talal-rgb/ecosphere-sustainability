# Chatbot V2 Implementation Plan — 3-Week Sprint
**Date:** 2026-06-17
**Status:** DESIGN → Pending Approval → Implementation
**Target:** Chatbot V2 = VERIFIED within 3 weeks

---

## Executive Summary

Compress the 8-week V2 roadmap into a **3-week production sprint**.

| Week | Theme | Deliverables |
|------|-------|-------------|
| 1 | **Foundation + Intelligence** | Knowledge base extraction, response templates, calculator guidance, Academy recommendations |
| 2 | **Context + Conversion** | Session memory, PDF assistant, quiz recommendations, soft lead qualification |
| 3 | **Validation + Deploy** | 100 test cases, fix weak responses, production deploy, live verification |

**Current State:** 4/10 (static FAQ bot)
**Target State:** 8/10 (contextual Sustainability Intelligence Assistant)
**Acceptance:** 90%+ test pass rate before deploy

---

## Week 1: Foundation + Intelligence

### Day 1-2: Foundation

**Task 1.1 — Extract Knowledge Base**
- [ ] Create `assets/js/chatbot/` directory
- [ ] Extract all 49 `genResponse()` patterns into `knowledge.json`
- [ ] Structure by domain: carbon, esg, strategy, terrnix
- [ ] Add metadata: topic, difficulty, relatedGuides, relatedQuizzes
- [ ] Validate JSON schema

**Task 1.2 — Create Response Templates**
- [ ] Implement 7 response templates:
  1. `educational` — Definition + why it matters + key facts + Terrnix link
  2. `regulatory` — Applies to + deadline + requirements + action
  3. `calculator` — Acknowledge data + explain output + benchmark + actions
  4. `pdf` — Acknowledge report + highlight findings + methodology + next steps
  5. `academy` — Based on interest + guide recommendation + why + link
  6. `quiz` — Based on topic + quiz recommendation + what it covers + link
  7. `lead` — Soft qualification + value proposition + no-pressure CTA
- [ ] Add skill level adaptation (beginner/intermediate/advanced)
- [ ] Add confidence scoring per response

**Task 1.3 — Refactor Chatbot Controller**
- [ ] Create `chatbot/index.js` — main controller
- [ ] Create `chatbot/intentDetector.js` — classify user intent
- [ ] Create `chatbot/topicDetector.js` — identify sustainability topic
- [ ] Create `chatbot/responseBuilder.js` — assemble response from template + knowledge
- [ ] Wire into existing `sendChat()` — no UI changes yet

**Deliverable:** Bot responds using new template system with structured knowledge

---

### Day 3-4: Better Sustainability Responses

**Task 1.4 — Expand Knowledge Coverage**
- [ ] Add missing topics from test case gaps:
  - Carbon neutral vs net zero (detailed comparison)
  - Scope 3 reduction strategies (not just definition)
  - Supplier engagement approaches
  - Carbon intensity metrics
  - Year-over-year comparison methodology
  - Industry benchmarks (manufacturing, retail, services, tech)
- [ ] Add 20+ new response patterns
- [ ] Improve existing responses with:
  - Specific numbers (not just ranges)
  - Current regulation deadlines
  - Terrnix-specific connections

**Task 1.5 — Add Follow-up Suggestions**
- [ ] After every response, generate 2-3 contextual follow-up questions
- [ ] Store suggestion click tracking (anonymous)
- [ ] Example: After "What is Scope 3?" → suggest "How do I calculate it?", "Which category is biggest?", "Does SBTi require it?"

**Task 1.6 — Improve Error Handling**
- [ ] Unknown intent: "I didn't understand. Try asking about carbon accounting, ESG reporting, or how to use the calculator."
- [ ] Off-topic: "I'm your sustainability assistant. Ask me about emissions, regulations, or Terrnix features!"
- [ ] Correction handling: "You're right — [correction]. Thanks for keeping me accurate!"

**Deliverable:** Bot covers 18/20 top questions with depth and accuracy

---

### Day 5-7: Calculator Guidance + Academy Recommendations

**Task 1.7 — Calculator Bridge**
- [ ] Create `chatbot/calculator-bridge.js`
- [ ] Read calculator state from DOM (scope inputs, totals, charts)
- [ ] Anonymize data: store only percentages and ratios, never absolute values with company context
- [ ] Add calculator-specific responses:
  - "How do I use the calculator?" → Step-by-step guide
  - "What units should I use?" → Unit guidance with conversions
  - "Why is my Scope 3 so high?" → Analyze top categories from calculator
  - "Is 10,000 tonnes a lot?" → Benchmark by industry

**Task 1.8 — Academy Recommendation Engine**
- [ ] Create `chatbot/academy-index.json` — all guides with topics, levels, URLs
- [ ] Map topics to guides:
  - scope-1,2,3 → respective guides
  - csrd → CSRD Omnibus Guide
  - net-zero → Net Zero Strategy Guide (when available)
  - general → GHG Protocol Guide
- [ ] Trigger recommendations:
  - After 2+ messages on same topic
  - When user asks "Where can I learn more?"
  - When user scores low on quiz (if taken)
- [ ] Format: "Based on your interest in [topic], I recommend [Guide] — [description]. [URL]"

**Task 1.9 — UI Enhancements**
- [ ] Add suggestion chips below bot responses
- [ ] Add "Quick Actions" button row (Calculator, Academy, Quiz, Contact)
- [ ] Add typing indicator animation (already exists, verify)
- [ ] Add message timestamp

**Deliverable:** Bot integrates with calculator and recommends Academy content

---

## Week 2: Context + Conversion

### Day 8-10: Session Memory

**Task 2.1 — Implement Session Memory**
- [ ] Create `chatbot/memory.js` — ChatbotMemory class
- [ ] Layer 1: Context Memory (last 3 turns, 5-min expiry)
- [ ] Layer 2: Session Memory (tab lifetime, all messages, topics, calculator used)
- [ ] Layer 3: Persistent Memory (encryptedStorage, 90 days, topic preferences, skill levels)

**Task 2.2 — Contextual Understanding**
- [ ] Pronoun resolution: "it", "that", "those" → resolve to last mentioned topic
- [ ] Follow-up detection: "How do I calculate it?" → knows "it" = previously discussed topic
- [ ] Topic continuity: If user asks 3 Scope 3 questions, maintain Scope 3 context
- [ ] Session summary: "Earlier you asked about Scope 3. Here's more on that..."

**Task 2.3 — Skill Level Tracking**
- [ ] Infer skill from question complexity:
  - "What is Scope 1?" → Beginner
  - "What's the difference between location-based and market-based?" → Intermediate
  - "How does SBTi treat Scope 3 for financial institutions?" → Advanced
- [ ] Adapt response detail accordingly
- [ ] Store in persistent memory

**Deliverable:** Bot remembers conversation context and adapts to user skill level

---

### Day 11-12: PDF Report Assistant

**Task 2.4 — PDF Bridge**
- [ ] Create `chatbot/pdf-bridge.js`
- [ ] Detect when user generates PDF (listen for generation event)
- [ ] Store PDF metadata: total emissions, scope split, top category, intensity
- [ ] NEVER store: company name, revenue, employee count

**Task 2.5 — PDF-Specific Responses**
- [ ] "What does my report show?" → Summarize their specific report
- [ ] "How was my total calculated?" → Explain methodology, factors used
- [ ] "What are the recommendations based on?" → Link to their top emission sources
- [ ] "Can I share this with my auditor?" → Yes, GHG Protocol aligned
- [ ] "How do I update my report?" → Re-run calculator, regenerate

**Task 2.6 — Report Insights**
- [ ] Auto-highlight after PDF generation:
  - "Your report is ready! Your top emission source is [Scope 3 - Purchased Goods]."
  - "Your carbon intensity is [X] tCO2e/€M — here's how that compares to industry average."
  - "Based on your profile, I recommend reading [Guide]."

**Deliverable:** Bot interprets and explains generated PDF reports

---

### Day 13-14: Quiz Recommendations + Lead Qualification

**Task 2.7 — Quiz Recommendation Engine**
- [ ] Create `chatbot/quiz-index.json` — all quizzes with topics, difficulty, URLs
- [ ] Trigger recommendations:
  - After educational discussion: "Test your knowledge with [Quiz]"
  - When user asks "Am I ready for [topic]?" → Suggest relevant quiz
  - When user scores low on knowledge indicators
- [ ] Post-quiz follow-up:
  - Score <50%: "Great start! I recommend [Beginner Guide]."
  - Score 50-80%: "Solid foundation! Try [Intermediate Guide]."
  - Score >80%: "Excellent! You're ready for [Advanced Topic]."

**Task 2.8 — Soft Lead Qualification**
- [ ] Create `chatbot/lead-qualifier.js`
- [ ] Detect signals:
  - "My company..." → Ask size and industry
  - "We need to report..." → Ask framework and timeline
  - "How much does Terrnix cost?" → Explain tiers, offer assessment
  - "Can you help us...?" → Offer detailed discussion
- [ ] Ask 2-3 soft questions max, then offer value
- [ ] Store anonymous hints in persistent memory (no PII)
- [ ] CTA: "Would you like a more detailed assessment? No pressure."

**Task 2.9 — Lead Scoring (Anonymous)**
- [ ] Score based on behavior:
  - Calculator used: +10
  - PDF generated: +15
  - Academy guide clicked: +5
  - Quiz taken: +5
  - 5+ messages: +10
  - Asked about pricing/services: +20
- [ ] Score >50: High intent → stronger CTA
- [ ] Score 20-50: Medium intent → suggest resources
- [ ] Score <20: Low intent → educational focus

**Deliverable:** Bot recommends quizzes and softly qualifies leads

---

## Week 3: Validation + Deploy

### Day 15-17: Run 100 Test Cases

**Task 3.1 — Automated Test Runner**
- [ ] Create `test-chatbot-v2.js`
- [ ] Load all 100 test cases from CHATBOT_TEST_CASES.md
- [ ] Run each prompt through chatbot
- [ ] Score response against expected elements
- [ ] Generate report: pass/fail per category, overall percentage

**Task 3.2 — Manual Review**
- [ ] Review all score 0 and score 1 responses
- [ ] Identify root causes:
  - Missing knowledge → add to knowledge.json
  - Wrong template → fix template logic
  - No calculator context → fix bridge
  - Memory failure → debug memory layer
- [ ] Document patterns in failures

**Task 3.3 — Fix Weak Responses**
- [ ] Fix all score 0 responses (critical)
- [ ] Improve score 1 responses to score 2 (acceptable)
- [ ] Target: 0 score 0, <10% score 1
- [ ] Re-run tests after fixes
- [ ] Iterate until 90%+ acceptable

**Deliverable:** 90%+ test pass rate documented

---

### Day 18-19: Production Deploy

**Task 3.4 — Pre-Deploy Checklist**
- [ ] All tests pass (90%+)
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] No regression in existing features (calculator, PDF, quiz)
- [ ] Security review: no new XSS vectors, no PII leakage
- [ ] Performance: response time <500ms per message

**Task 3.5 — Deploy**
- [ ] Merge PR to main
- [ ] Verify CDN cache invalidation
- [ ] Verify all pages load correctly
- [ ] Verify chatbot loads on all pages

**Task 3.6 — Live Verification**
- [ ] Test 10 real conversations on production
- [ ] Verify calculator integration works
- [ ] Verify PDF assistant works
- [ ] Verify Academy recommendations link correctly
- [ ] Verify quiz recommendations work
- [ ] Verify memory persists across page navigations
- [ ] Verify no PII in localStorage

**Deliverable:** Chatbot V2 live and verified

---

### Day 20-21: Buffer + Polish

**Task 3.7 — Buffer for Fixes**
- [ ] Address any production issues
- [ ] Quick wins from user feedback (if any)
- [ ] Performance optimization if needed
- [ ] Documentation update

**Task 3.8 — Handoff Documentation**
- [ ] Update CHATBOT_V2_ROADMAP.md with actual implementation notes
- [ ] Document known limitations
- [ ] Document next phase (Backend AI) requirements
- [ ] Update MEMORY.md with V2 status

**Deliverable:** Chatbot V2 = VERIFIED

---

## Daily Standup Format

Each day, report:
1. What was completed yesterday
2. What is planned today
3. Any blockers

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Scope creep | Strict daily task list, no additions without removing something |
| Test failures | Daily testing, fix immediately, not at end |
| Calculator integration breaks | Feature flag, fallback to old behavior |
| Performance issues | Profile early, optimize templates |
| Memory privacy concerns | Daily privacy audit, no PII ever |

---

## Approval Gates

| Gate | When | Criteria |
|------|------|----------|
| Week 1 Complete | Day 7 | Templates work, calculator guidance functional, Academy links correct |
| Week 2 Complete | Day 14 | Memory works, PDF assistant functional, lead qualification soft and non-intrusive |
| Pre-Deploy | Day 19 | 90%+ test pass, no regressions, security verified |
| Production Verified | Day 21 | Live site tested, all features work, no critical bugs |

---

## Success Criteria

| Metric | Current | Week 1 | Week 2 | Week 3 (Target) |
|--------|---------|--------|--------|-----------------|
| Knowledge coverage | 14/20 | 17/20 | 18/20 | 18/20 |
| Calculator integration | 0% | 80% | 100% | 100% |
| PDF support | 0% | 0% | 100% | 100% |
| Contextual memory | No | No | Yes | Yes |
| Academy recommendations | No | Yes | Yes | Yes |
| Quiz recommendations | No | No | Yes | Yes |
| Lead qualification | No | No | Yes | Yes |
| Test pass rate | ~60% | 70% | 85% | **90%+** |
| Response time | Instant | <300ms | <500ms | <500ms |

---

## Files to Create/Modify

### New Files
```
assets/js/chatbot/
├── index.js
├── knowledge.json
├── memory.js
├── intentDetector.js
├── topicDetector.js
├── responseBuilder.js
├── templates.js
├── calculator-bridge.js
├── pdf-bridge.js
├── academy-bridge.js
├── quiz-bridge.js
├── lead-qualifier.js
├── academy-index.json
└── quiz-index.json

test-chatbot-v2.js
```

### Modified Files
```
index.html — Update chatbot script imports
assets/js/main.js — Add chatbot initialization
```

---

## Notes

- **No backend AI in this sprint** — client-side only
- **No UI redesign** — work within existing chat UI
- **Privacy is non-negotiable** — daily audit for PII
- **Test-driven** — write test case, implement, verify
- **Deploy early and often** — merge to main weekly, not at end

---

*Plan Version: 3W-1.0*
*Status: Ready for approval*
*Target: Chatbot V2 = VERIFIED by 2026-07-08*
