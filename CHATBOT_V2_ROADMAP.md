# Chatbot V2 Implementation Roadmap
**Date:** 2026-06-17
**Version:** 2.0-draft
**Status:** Architecture & Audit Phase — NOT YET IMPLEMENTED

---

## Executive Summary

Transform the Terrnix chatbot from a **static FAQ bot** (49 keyword conditionals) into a **Sustainability Intelligence Assistant** with contextual memory, calculator integration, PDF interpretation, and personalized recommendations.

**Current State:** 4/10 — Solid foundation, major interactivity gaps
**Target State:** 8/10 — Intelligent, contextual, integrated assistant

---

## Deliverables Status

| # | Deliverable | Status | File |
|---|-------------|--------|------|
| 1 | Current State Audit | ✅ Complete | `CHATBOT_CURRENT_STATE_AUDIT.md` |
| 2 | Knowledge Base | ✅ Complete | `CHATBOT_KNOWLEDGE_BASE.md` |
| 3 | Memory System Design | ✅ Complete | `CHATBOT_MEMORY_SYSTEM.md` |
| 4 | Test Cases | ✅ Complete | `CHATBOT_TEST_CASES.md` |
| 5 | Implementation Roadmap | ✅ Complete | `CHATBOT_V2_ROADMAP.md` (this file) |

---

## Phase Breakdown

### Phase 0: Foundation (Week 1)
**Goal:** Prepare codebase for V2 architecture

**Tasks:**
- [ ] Extract `genResponse()` knowledge base into `chatbot/knowledge.json`
- [ ] Create `chatbot/` directory structure
- [ ] Implement `ChatbotMemory` class (3 layers)
- [ ] Add calculator state observer (read-only)
- [ ] Add unit test framework for chatbot

**Files:**
```
assets/js/chatbot/
├── knowledge.json          # Structured knowledge base
├── memory.js               # ChatbotMemory class
├── responses.js            # Response generator
├── templates.js            # Response templates
├── calculator-bridge.js    # Calculator integration
├── pdf-bridge.js           # PDF report integration
├── academy-bridge.js       # Academy recommendations
├── quiz-bridge.js          # Quiz recommendations
├── lead-qualifier.js       # Soft lead qualification
└── index.js                # Main chatbot controller
```

**Risk:** Low — refactoring only, no functional changes

---

### Phase 1: Context & Memory (Week 2)
**Goal:** Enable contextual conversations

**Tasks:**
- [ ] Implement Layer 1: Context Memory (last 3 turns)
- [ ] Implement Layer 2: Session Memory (tab lifetime)
- [ ] Implement Layer 3: Persistent Memory (encryptedStorage, 90 days)
- [ ] Add follow-up question detection
- [ ] Add pronoun resolution ("it", "that", "those")
- [ ] Add topic tracking across session

**Test Cases:** A1-A5 (Scope 1 follow-ups)
**Success Criteria:** Bot correctly resolves "How do I calculate it?" after "What is Scope 3?"

**Risk:** Low — client-side only, no backend changes

---

### Phase 2: Calculator Integration (Week 3)
**Goal:** Bot can read and explain calculator outputs

**Tasks:**
- [ ] Create calculator state observer
- [ ] Store anonymized calculator context in session memory
- [ ] Add calculator-specific response templates
- [ ] Implement "Why is my X so high?" analysis
- [ ] Add benchmark comparison (industry averages)
- [ ] Add reduction action suggestions based on calculator data

**Test Cases:** C1-C4 (Calculator support)
**Success Criteria:** User asks "Why is my Scope 3 high?" → Bot references actual calculator data

**Risk:** Medium — requires calculator state access, privacy considerations

---

### Phase 3: PDF Report Assistant (Week 4)
**Goal:** Bot can interpret generated PDF reports

**Tasks:**
- [ ] Store PDF generation metadata in session memory
- [ ] Add PDF structure awareness (9 pages, sections)
- [ ] Implement "Explain my report" response template
- [ ] Add key finding highlights (total, top scope, intensity)
- [ ] Add methodology explanation
- [ ] Add priority area identification

**Test Cases:** C3 (PDF questions)
**Success Criteria:** User asks "What does my report show?" → Bot explains their specific report

**Risk:** Medium — requires PDF metadata storage

---

### Phase 4: Academy & Quiz Recommendations (Week 5)
**Goal:** Bot suggests relevant content based on user interests

**Tasks:**
- [ ] Create Academy content index (title, URL, topics, level)
- [ ] Create Quiz index (name, URL, topics, difficulty)
- [ ] Implement topic-to-content mapping
- [ ] Add recommendation engine (based on session topics + persistent preferences)
- [ ] Add "Would you like to learn more?" prompts
- [ ] Track click-through rates (anonymous)

**Test Cases:** D (Academy), E (Quiz)
**Success Criteria:** After discussing Scope 3, bot recommends Scope 3 Guide

**Risk:** Low — content mapping only, no algorithmic complexity

---

### Phase 5: Lead Qualification (Week 6)
**Goal:** Soft detection of high-intent users

**Tasks:**
- [ ] Implement qualification trigger detection
- [ ] Add 2-3 soft qualification questions
- [ ] Store anonymous qualification hints in persistent memory
- [ ] Add "Would you like a detailed assessment?" prompt
- [ ] Integrate with contact form (pre-fill if available)
- [ ] Add lead scoring (anonymous, based on behavior)

**Test Cases:** F (Lead qualification)
**Success Criteria:** User mentions "my company" → Bot asks soft qualifying questions

**Risk:** Low — no PII storage, fully anonymous

---

### Phase 6: Response Framework & Templates (Week 7)
**Goal:** Structured, consistent, high-quality responses

**Tasks:**
- [ ] Implement 7 response templates:
  1. Educational Question
  2. Regulatory Question
  3. Calculator Question
  4. PDF Report Question
  5. Academy Recommendation
  6. Quiz Recommendation
  7. Lead Qualification
- [ ] Add skill level adaptation (beginner/intermediate/advanced)
- [ ] Add confidence scoring
- [ ] Add "I don't know" handling with suggestions
- [ ] Add correction handling (when user corrects bot)

**Test Cases:** All 100 cases
**Success Criteria:** 90%+ acceptable responses

**Risk:** Medium — complex logic, extensive testing needed

---

### Phase 7: Testing & Optimization (Week 8)
**Goal:** Validate 90%+ acceptable response rate

**Tasks:**
- [ ] Run all 100 test cases
- [ ] Score responses, identify failures
- [ ] Iterate on failed cases
- [ ] Add edge case handling
- [ ] Performance optimization (response time <500ms)
- [ ] Mobile responsiveness check

**Success Criteria:**
- 90%+ responses scored ≥2
- 0% responses scored 0
- Average response time <500ms

**Risk:** Low — testing phase only

---

### Phase 8: Backend AI Integration (Future — Post-V2)
**Goal:** Enable complex, dynamic responses for edge cases

**Tasks:**
- [ ] Design backend AI endpoint (`/api/chat`)
- [ ] Implement prompt engineering for sustainability domain
- [ ] Add context injection (calculator data, memory)
- [ ] Add response caching
- [ ] Add rate limiting
- [ ] Add cost monitoring

**Dependencies:**
- Backend infrastructure (Render/Heroku)
- AI API integration (Claude/GPT)
- Security review (API key management)

**Risk:** High — backend complexity, cost, security

---

## Implementation Order

```
Week 1:  Phase 0 — Foundation
Week 2:  Phase 1 — Context & Memory
Week 3:  Phase 2 — Calculator Integration
Week 4:  Phase 3 — PDF Assistant
Week 5:  Phase 4 — Academy & Quiz
Week 6:  Phase 5 — Lead Qualification
Week 7:  Phase 6 — Response Framework
Week 8:  Phase 7 — Testing & Optimization

Future:  Phase 8 — Backend AI
```

**Total V2 Timeline:** 8 weeks
**Backend AI:** Additional 4-6 weeks (separate project)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Calculator integration breaks existing functionality | Medium | High | Extensive testing, feature flags |
| Memory system impacts performance | Low | Medium | Size limits, lazy loading |
| Response quality below 90% | Medium | High | More test cases, template refinement |
| Privacy concerns with memory | Low | High | No PII, encrypted, auto-expire |
| Scope creep | High | Medium | Strict phase gates, MVP focus |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Knowledge coverage | 14/20 questions | 18/20 questions | Test case pass rate |
| Calculator integration | 0% | 100% | Can explain calculator outputs |
| PDF support | 0% | 100% | Can interpret generated reports |
| Contextual memory | No | Yes | Follow-up question accuracy |
| Academy recommendations | No | Yes | Click-through rate >10% |
| Quiz recommendations | No | Yes | Quiz starts from bot >5% |
| Lead qualification | No | Yes | Qualified leads identified |
| Response acceptability | ~60% | 90%+ | 100-test case evaluation |
| User satisfaction | Unknown | >4/5 | Post-chat rating (future) |

---

## Resource Requirements

### Development
- 1 Frontend Developer (chatbot logic, UI)
- 0.5 Backend Developer (Phase 8 only)
- 0.5 Sustainability Expert (content review, test case validation)

### Infrastructure
- No additional hosting (client-side only for V2)
- Backend AI: Render/Heroku + AI API costs (~$50-200/month)

### Content
- Academy content index (existing guides)
- Quiz index (existing + planned)
- Industry benchmark data (for calculator comparisons)

---

## Approval Gates

| Gate | Criteria | Approver |
|------|----------|----------|
| Architecture Review | All 5 deliverables approved | Tallal |
| Phase 3 Complete | Calculator + PDF integration working | Tallal |
| Phase 7 Complete | 90%+ test pass rate | Tallal |
| Production Deploy | All tests pass, no regressions | Tallal |

---

## Next Steps

1. **Await approval** of architecture documents (this set)
2. **Create Phase 0 PR** — Foundation refactoring
3. **Weekly demos** — Show progress per phase
4. **User testing** — 5-10 real users after Phase 7

---

*Document Version: 2.0-draft*
*Status: Ready for review*
