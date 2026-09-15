# Chatbot Current State Audit
**Date:** 2026-06-17
**Branch:** agent/chatbot-v2-audit-20260617
**Scope:** index.html chatbot implementation

---

## 1. Architecture Overview

```
User Input → sendChat() → callClaudeAPI() [disabled] → genResponse() → formatChatText() → DOM
                ↓
        Fallback: local knowledge base (49 conditionals)
                ↓
        saveChatHistory() → encryptedStorage → localStorage
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `sendChat()` | Line ~5217 | Entry point, handles user input |
| `callClaudeAPI()` | Line ~5230 | API caller (currently disabled, always falls back) |
| `genResponse()` | Line ~5420 | Main response generator (49 keyword conditionals) |
| `formatChatText()` | Line ~5305 | Output formatting (escapeHtml + bold + newlines) |
| `escapeHtml()` | Line ~5298 | XSS prevention via textContent |
| `saveChatHistory()` | Line ~5355 | Persistent storage with encryptedStorage fallback |
| `renderChatHistory()` | Line ~5375 | Restore previous session on load |

---

## 2. Current Prompt / System Instructions

**No formal system prompt exists.** The chatbot uses a hardcoded `genResponse()` function with 49 keyword-matching conditionals. Each conditional returns a static string with markdown-style `**bold**` formatting.

### Current "Persona" (implied by responses)
- Name: "Terrnix AI"
- Role: "Sustainability intelligence assistant"
- Tone: Professional, informative, encyclopedic
- No memory of previous questions within a session (each message independent)

---

## 3. Current Capabilities

### A. Knowledge Domains (from genResponse conditionals)

| Domain | Topics Covered | Response Quality |
|--------|---------------|------------------|
| Carbon Accounting | Scope 1/2/3, emission factors, GHG Protocol, carbon footprint | ⭐⭐⭐ Good definitions |
| ESG & Governance | ESG overview, TCFD, TNFD, CSRD, ISSB, GRI, SBTi, board oversight | ⭐⭐⭐ Good definitions |
| Energy & Economics | LCOE, NPV/IRR, solar, wind, green hydrogen, storage | ⭐⭐⭐ Good definitions |
| Climate Regulations | CBAM, EU ETS, SEC climate rule, Paris Agreement | ⭐⭐⭐ Good definitions |
| Nature & Biodiversity | TNFD, nature-positive | ⭐⭐ Basic |
| General Greetings | Hello, thanks, who are you | ⭐⭐⭐ Functional |

### B. UI Features

| Feature | Status | Notes |
|---------|--------|-------|
| Chat interface | ✅ | Dark theme, emerald accents |
| Typing indicator | ✅ | Animated dots |
| Quick-ask buttons | ✅ | 4 preset questions |
| Message history | ✅ | Last 50 messages, encryptedStorage |
| Clear chat | ✅ | Removes history + resets UI |
| Mobile responsive | ✅ | Max-width 95% on small screens |

### C. Security Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| XSS prevention | ✅ | `escapeHtml()` via `textContent` |
| No innerHTML with user data | ✅ | User input escaped before DOM insertion |
| Encrypted storage | ✅ | Uses `encryptedStorage` when available |
| API key removal | ✅ | Client-side API calls disabled per Security Phase 1 |

---

## 4. Current Limitations

### Critical Limitations

| # | Limitation | Impact | Severity |
|---|-----------|--------|----------|
| 1 | **No contextual memory** | Each message treated independently; cannot reference previous Q&A | 🔴 High |
| 2 | **No calculator integration** | Cannot read calculator inputs/outputs; cannot explain user-specific results | 🔴 High |
| 3 | **No PDF report understanding** | Cannot interpret generated PDFs; cannot explain report contents | 🔴 High |
| 4 | **Static responses only** | 49 hardcoded strings; no dynamic content generation | 🔴 High |
| 5 | **No lead qualification** | No detection of company size, industry, maturity | 🟡 Medium |
| 6 | **No Academy/Quiz recommendations** | Cannot link to relevant guides or suggest quizzes | 🟡 Medium |
| 7 | **No follow-up questions** | Cannot ask clarifying questions to improve answers | 🟡 Medium |
| 8 | **Limited Scope 3 depth** | Single response covers all 15 categories superficially | 🟡 Medium |
| 9 | **No emission factor lookup** | Cannot show specific factors used in calculator | 🟡 Medium |
| 10 | **No multi-turn conversations** | Cannot guide users through step-by-step processes | 🟡 Medium |

### Technical Limitations

| # | Limitation | Details |
|---|-----------|---------|
| 11 | `callClaudeAPI()` disabled | Always falls back to local knowledge base |
| 12 | No backend AI endpoint | No server-side processing for complex queries |
| 13 | Response length fixed | Cannot adapt detail level to user need |
| 14 | No confidence scoring | Cannot indicate uncertainty or suggest quizzes |
| 15 | No analytics | No tracking of common questions or response quality |

---

## 5. Top 20 User Questions (Inferred from Content)

Based on the knowledge base structure, likely top questions:

1. "What is Scope 1/2/3?" ✅ Covered
2. "How do I calculate my carbon footprint?" ⚠️ Generic, not calculator-specific
3. "What is CSRD?" ✅ Covered
4. "What is ESG?" ✅ Covered
5. "What is the GHG Protocol?" ✅ Covered
6. "What is carbon neutral vs net zero?" ⚠️ Partial (carbon neutral only)
7. "What are emission factors?" ✅ Covered
8. "What is LCOE?" ✅ Covered
9. "What is SBTi?" ✅ Covered
10. "What is CBAM?" ✅ Covered
11. "What is green hydrogen?" ✅ Covered
12. "What is double materiality?" ✅ Covered
13. "What is TNFD?" ✅ Covered
14. "What is ISSB?" ✅ Covered
15. "How do I reduce Scope 3?" ❌ Not covered (only defines Scope 3)
16. "What does my PDF report mean?" ❌ Not covered
17. "Why is my Scope 3 so high?" ❌ Not covered
18. "What should I read next?" ❌ Not covered
19. "Am I ready for CSRD?" ❌ Not covered
20. "What quiz should I take?" ❌ Not covered

**Coverage: 14/20 (70%)** — Missing calculator support, PDF interpretation, recommendations, readiness assessment.

---

## 6. Response Quality Gaps

### Gap Analysis

| User Intent | Current Response | Desired Response | Gap |
|-------------|-----------------|------------------|-----|
| "Why is my Scope 3 high?" | Generic Scope 3 definition | Analyze calculator output, identify drivers, suggest actions | 🔴 Critical |
| "Explain my PDF report" | N/A | Parse report data, explain totals, highlight hotspots | 🔴 Critical |
| "What should I do next?" | N/A | Recommend Academy articles based on interest | 🔴 Critical |
| "Am I ready for CSRD?" | CSRD definition | Quiz-style assessment, maturity score | 🟡 High |
| "How do I reduce emissions?" | Generic definition | Sector-specific reduction levers | 🟡 High |
| "What is my carbon intensity?" | N/A | Calculate from calculator data | 🟡 High |
| "Compare my emissions to peers" | N/A | Benchmark data, percentile ranking | 🟡 High |
| "What regulation applies to me?" | Regulation definitions | Jurisdiction + sector + size filtering | 🟡 High |

---

## 7. Missing Capabilities for V2

### Must-Have (P0)

1. **Calculator Integration** — Read calculator state, explain outputs, answer "why" questions
2. **PDF Report Assistant** — Parse generated report, explain sections, highlight insights
3. **Contextual Memory** — Remember previous questions within session for follow-ups
4. **Academy Recommendations** — Suggest relevant guides based on user queries
5. **Quiz Recommendations** — Suggest quizzes when knowledge gaps detected

### Should-Have (P1)

6. **Lead Qualification** — Soft detection of company profile, offer detailed assessment
7. **Step-by-Step Guides** — Walk users through processes (e.g., "How do I set a science-based target?")
8. **Emission Factor Lookup** — Show specific factors used in calculations
9. **Benchmarking** — Compare user data to industry averages
10. **Confidence Scoring** — Indicate response certainty, suggest verification

### Nice-to-Have (P2)

11. **Multi-language Support** — French, German, Spanish responses
12. **Voice Input/Output** — Speech-to-text, text-to-speech
13. **Proactive Suggestions** — "Based on your industry, you might also want to know..."
14. **Analytics Dashboard** — Track common questions, response quality, user satisfaction

---

## 8. Current UI Assessment

### Strengths
- Clean, dark-themed design consistent with site
- Emerald accent color reinforces sustainability brand
- Quick-ask buttons reduce friction for common questions
- Encrypted storage for privacy (Security Phase 2)
- Mobile responsive

### Weaknesses
- No indication of bot capabilities/limitations
- No feedback mechanism (thumbs up/down)
- No "typing" state for long responses (currently instant)
- No suggestion chips after responses
- Chat history not visually distinguished by session

---

## 9. Knowledge Source Analysis

### Current Sources
- Hardcoded strings in `genResponse()` (49 patterns)
- No external API calls (disabled for security)
- No database or CMS integration
- No real-time data (emission factors, regulations)

### Source Freshness
- Emission factor references: "2024 IPCC/EPA factors" — static, not dynamically updated
- Regulation references: Current as of mid-2026 knowledge cutoff
- Technology cost data: Static LCOE ranges
- No automated content updates possible

---

## 10. Recommendations for V2 Architecture

### Immediate (Phase 1)
1. Extract knowledge base from `genResponse()` into structured JSON
2. Add session memory (last 5 exchanges)
3. Add calculator state reading
4. Add Academy article links to responses

### Short-term (Phase 2)
5. Implement response templates (educational, regulatory, calculator, etc.)
6. Add PDF report parsing
7. Add quiz recommendation logic
8. Add soft lead qualification

### Long-term (Phase 3)
9. Backend AI endpoint for complex queries
10. Real-time emission factor database
11. User preference learning
12. Analytics and A/B testing

---

## Audit Summary

| Metric | Score | Notes |
|--------|-------|-------|
| Knowledge Coverage | 6/10 | Good definitions, poor interactivity |
| Calculator Integration | 1/10 | None |
| PDF Support | 0/10 | None |
| Memory/Context | 2/10 | Persistent storage only, no session context |
| Recommendations | 0/10 | None |
| Lead Qualification | 0/10 | None |
| UI/UX | 7/10 | Clean but limited features |
| Security | 9/10 | XSS prevented, encrypted storage |
| **Overall** | **4/10** | **Solid foundation, major gaps in interactivity** |

---

*Auditor: Terrnix AI Agent*
*Next Step: Create CHATBOT_KNOWLEDGE_BASE.md for V2 structure*
