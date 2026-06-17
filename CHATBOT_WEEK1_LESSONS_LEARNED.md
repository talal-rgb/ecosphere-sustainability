# Chatbot V2 Week 1 — Lessons Learned
**Date:** 2026-06-17
**Status:** Week 1 MERGED → Week 2 Planning

---

## 1. Lowest-Scoring Prompts

| Rank | Prompt | Score | Category |
|------|--------|-------|----------|
| 1 | Can you guarantee my emissions are accurate? | 6/10 | Safety |
| 2 | Difference between Scope 2 and Scope 3? | 6/10 | Carbon Accounting |
| 3 | Why is Scope 3 difficult to measure? | 5/10 | Carbon Accounting |
| 4 | Does ISSB replace GRI? | 5/10 | ESG/Regulatory |
| 5 | Why is my Scope 3 higher than Scope 1? | 4/10 | Calculator |
| 6 | Is this calculator GHG Protocol aligned? | 3/10 | Calculator |
| 7 | What is double materiality? | 4/10 | ESG/Regulatory |
| 8 | Explain my PDF report. | 4/10 | Terrnix Features |

---

## 2. Root Causes

### 2.1 Missing Knowledge Topics

| Missing Topic | Impact | Prompts Affected |
|---------------|--------|------------------|
| ESRS standards | User gets fallback | #10 |
| GRI framework | Cannot compare ISSB vs GRI | #11 |
| Terrnix capabilities | Cannot answer "what can you do" | #13 |
| Double materiality (standalone) | Buried in CSRD response | #12 |
| PDF report structure | No general explanation | #15 |

**Root Cause:** Knowledge base focused on domain topics (carbon, ESG) but missed:
- Meta-topics (what Terrnix is, what it offers)
- Comparative topics (A vs B)
- Procedural topics (how to start, what to do first)
- Structural topics (what the PDF contains)

### 2.2 Missing Response Templates

| Missing Template | Impact | Prompts Affected |
|------------------|--------|------------------|
| Comparison (A vs B) | Cannot answer difference questions | #2, #11 |
| Yes/No direct answer | Cannot answer direct questions | #7 |
| Beginner learning path | Cannot guide new users | #16 |
| Conceptual + calculator hybrid | Wrong context detection | #5 |
| Uncertainty guidance | Generic disclaimer only | #20 |

**Root Cause:** Templates designed for educational explanations but not for:
- Decision support (which should I choose?)
- Direct answers (yes/no)
- Process guidance (where do I start?)
- Context-aware responses (conceptual vs personal data)

### 2.3 Intent Detection Gaps

| Intent Not Detected | Example | Result |
|---------------------|---------|--------|
| Comparison | "Difference between A and B" | Falls back to single-topic |
| Yes/No | "Is X aligned with Y?" | Returns generic explanation |
| Beginner guidance | "Where should I start?" | Fallback |
| Capability query | "What can Terrnix do?" | Fallback |
| Uncertainty | "What if I'm unsure?" | Generic disclaimer |

**Root Cause:** Intent categories focused on topic (carbon, ESG, calculator) but missed:
- Question type (comparison, yes/no, guidance)
- User maturity (beginner vs advanced)
- Context (conceptual vs personal data)

### 2.4 Session Memory Requirements Discovered

| Requirement | Discovered In | Why Needed |
|-------------|---------------|------------|
| Calculator context awareness | #5, #15 | Distinguish "why is Scope 3 high" (conceptual) from "explain my Scope 3" (personal data) |
| Conversation history | #2, #11 | Follow-up questions need context ("What about Scope 3?" after Scope 2 explanation) |
| User maturity tracking | #16, #17 | Beginners need different guidance than advanced users |
| Topic persistence | #12 | If user asks about CSRD, next question likely about ESRS or double materiality |

**Root Cause:** Without memory, every prompt is treated as isolated. Cannot:
- Detect follow-up questions
- Personalize based on prior interactions
- Maintain conversation flow

### 2.5 PDF Assistant Requirements Discovered

| Requirement | Discovered In | Description |
|-------------|---------------|-------------|
| PDF structure explanation | #15 | Explain what the 9 pages contain without user data |
| Section interpretation | #15 | Help users understand Executive Summary, Methodology, Recommendations |
| Result explanation | #5 | Explain user's specific numbers ("Your Scope 3 is 80% because...") |
| Report navigation | — | Guide users to relevant sections based on their questions |

**Root Cause:** Current calculator-bridge only reads totals. Cannot explain:
- What each page means
- Why numbers are what they are
- How to act on recommendations

---

## 3. Missing Knowledge

### 3.1 Topics to Add

| Topic | Priority | Content |
|-------|----------|---------|
| ESRS standards | High | Structure, mandatory vs topical, alignment with GRI/ISSB |
| GRI framework | High | Purpose, scope, relationship to ISSB |
| Double materiality (standalone) | High | Definition, both dimensions, examples |
| Terrnix capabilities | High | Feature list, use cases, value proposition |
| PDF report structure | Medium | 9-page breakdown, what's in each section |
| Emission factor examples | Medium | Specific values for common fuels |
| Uncertainty/accuracy | Medium | What affects accuracy, how to improve |
| Industry benchmarks | Low | Sector averages for comparison |

### 3.2 Knowledge Gaps by Domain

| Domain | Gap | Impact |
|--------|-----|--------|
| Carbon Accounting | No comparison topics | Cannot answer "A vs B" |
| ESG/Regulatory | No standalone double materiality | Buried in CSRD |
| ESG/Regulatory | No GRI | Cannot compare frameworks |
| Terrnix Features | No capability overview | Cannot answer "what can you do" |
| Safety | No uncertainty guidance | Generic disclaimers |

---

## 4. Missing Templates

### 4.1 Templates to Add

| Template | Priority | Use Case |
|----------|----------|----------|
| Comparison | High | "Difference between A and B" |
| Yes/No | High | "Is X aligned with Y?" |
| Beginner path | High | "Where should I start?" |
| Learning path | High | "Recommend a path for X" |
| Uncertainty guidance | Medium | "What if I'm unsure?" |
| PDF explanation | Medium | "Explain my report" (no data) |
| Confidence indicator | High | All responses |

### 4.2 Template Improvements

| Current Template | Issue | Improvement |
|------------------|-------|-------------|
| Educational | Too long for simple questions | Add "brief" variant |
| Calculator help | Only explains features | Add "how to interpret results" |
| Regulatory | Always includes full disclaimer | Add "brief" variant for known users |
| Safety | Generic disclaimer | Add specific uncertainty factors |

---

## 5. Memory Requirements Discovered

### 5.1 Session Memory (Week 2)

| Requirement | Type | Use Case |
|-------------|------|----------|
| Calculator state | Read-only | Explain user's specific results |
| Conversation history | Array | Follow-up questions, context |
| Detected topics | Set | Avoid repeating, build on prior |
| User maturity | Enum | Beginner vs advanced guidance |
| Confidence history | Array | Track when user needed clarification |

### 5.2 Persistent Memory (Week 3)

| Requirement | Type | Use Case |
|-------------|------|----------|
| User preferences | Object | Preferred topics, maturity level |
| Past interactions | Array | Personalized recommendations |
| Quiz scores | Object | Targeted learning suggestions |
| Lead qualification | Object | Track engagement, readiness |

### 5.3 Memory Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Session-only in Week 2 | Privacy-first, no PII storage |
| Read-only calculator bridge | Never write to calculator state |
| Topic persistence | Improve conversation flow |
| Maturity tracking | Personalize without PII |

---

## 6. PDF Assistant Requirements Discovered

### 6.1 Functional Requirements

| Requirement | Priority | Description |
|-------------|----------|-------------|
| PDF structure explanation | High | Explain 9-page layout without user data |
| Section interpretation | High | Help users understand each section |
| Result explanation | High | Explain user's specific numbers |
| Recommendation guidance | Medium | Help users act on recommendations |
| Methodology explanation | Medium | Explain calculation approach |
| Factor transparency | Medium | Show which factors were used |

### 6.2 Technical Requirements

| Requirement | Priority | Description |
|-------------|----------|-------------|
| PDF data reader | High | Extract data from calculator state |
| Section navigator | Medium | Guide users to relevant pages |
| Chart interpreter | Medium | Explain what charts show |
| Benchmark comparator | Low | Compare to industry averages |

### 6.3 Integration Points

| Integration | Description |
|-------------|-------------|
| Calculator bridge | Read user's emission data |
| Knowledge base | Explain methodology, factors |
| Templates | Format explanations |
| Session memory | Track which sections user has seen |

---

## 7. Confidence Levels Requirement

### 7.1 Specification

Every chatbot response must include a confidence indicator:

```
Confidence: High | Medium | Low
Reason: [Brief explanation]
```

### 7.2 Confidence Criteria

| Level | Criteria | Example |
|-------|----------|---------|
| **High** | Direct from knowledge base, established standards | "Based on GHG Protocol Corporate Standard" |
| **Medium** | Depends on assumptions, general guidance | "Depends on company-specific boundaries" |
| **Low** | Limited data, estimates, or user-specific | "Based on limited information provided" |

### 7.3 Implementation

| Component | Change |
|-----------|--------|
| Response builder | Add confidence field to all responses |
| Templates | Include confidence section |
| Knowledge base | Tag entries with confidence level |
| UI | Display confidence badge |

### 7.4 Benefits

| Benefit | Description |
|---------|-------------|
| Trust | Users know when to verify |
| Transparency | Clear about limitations |
| Safety | Reduces overconfidence risk |
| Education | Teaches users about uncertainty |

---

## 8. Week 2 Priorities

### 8.1 Priority Order

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Session memory | Medium | High |
| 2 | Confidence levels | Low | High |
| 3 | PDF report assistant | Medium | Medium |
| 4 | Quiz recommendations | Low | Medium |
| 5 | Soft lead qualification | Medium | Medium |

### 8.2 Week 2 Success Criteria

| Criterion | Target |
|-----------|--------|
| Session memory | Conversation history, topic persistence, calculator context |
| Confidence levels | 100% of responses include confidence indicator |
| PDF assistant | Explain structure, interpret results, guide navigation |
| Quiz recommendations | Suggest quizzes based on conversation topics |
| Lead qualification | Track engagement without aggressive data capture |

### 8.3 Week 2 Test Plan

| Test | Description |
|------|-------------|
| Memory persistence | Follow-up questions maintain context |
| Confidence accuracy | High/Medium/Low correctly assigned |
| PDF explanation | No-data and with-data scenarios |
| Quiz recommendation | Relevant quizzes suggested |
| Lead tracking | Engagement scored, no PII required |

---

## 9. Key Takeaways

### 9.1 What Worked

| Approach | Result |
|----------|--------|
| Structured knowledge base | Accurate definitions, consistent responses |
| Template system | Readable, consistent formatting |
| Calculator bridge | Real-time data integration |
| Safety-first design | Appropriate disclaimers, no overconfidence |
| Test-driven development | 43/43 automated tests pass |

### 9.2 What Didn't Work

| Approach | Issue |
|----------|-------|
| Isolated prompts | No conversation context |
| Topic-only intents | Missed question types (comparison, yes/no) |
| Generic templates | Not adaptable to user maturity |
| No confidence indicator | Users can't assess reliability |

### 9.3 Lessons for Week 2

| Lesson | Application |
|--------|-------------|
| Memory is essential | Implement session memory first |
| Question type matters | Detect comparison, yes/no, guidance intents |
| User maturity varies | Track and personalize |
| Confidence builds trust | Add to every response |
| PDF needs explanation | Not just data, but interpretation |

---

## 10. Files for Week 2

| File | Purpose |
|------|---------|
| CHATBOT_V2_WEEK2_IMPLEMENTATION.md | Detailed Week 2 plan |
| assets/js/chatbot/sessionMemory.js | Session memory module |
| assets/js/chatbot/confidence.js | Confidence level module |
| assets/js/chatbot/pdfAssistant.js | PDF report assistant |
| assets/js/chatbot/quizRecommender.js | Quiz recommendation engine |
| assets/js/chatbot/leadQualification.js | Soft lead qualification |
| test-chatbot-week2.js | Week 2 automated tests |

---

*Document Date: 2026-06-17*
*Status: Week 1 Complete → Week 2 Planning*
*Next: CHATBOT_V2_WEEK2_IMPLEMENTATION.md*
