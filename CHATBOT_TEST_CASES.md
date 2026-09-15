# Chatbot V2 Test Cases
**Date:** 2026-06-17
**Version:** 2.0-draft
**Target:** 90%+ acceptable responses
**Total Cases:** 100

---

## Category A: Carbon Accounting (20 cases)

### A1. Scope 1 (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 1 | "What is Scope 1?" | Definition, examples (fuel, fleet, process), reduction strategies | Educational |
| 2 | "How do I calculate Scope 1?" | Activity data needed, emission factors, formula | Calculator |
| 3 | "What emission factor should I use for diesel?" | EPA/DEFRA factor, source citation, units | Educational |
| 4 | "My Scope 1 is 500 tonnes — is that high?" | Benchmark by industry, context, next steps | Calculator |
| 5 | "How do I reduce Scope 1 emissions?" | Fuel switching, efficiency, electrification, examples | Educational |

### A2. Scope 2 (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 6 | "What is Scope 2?" | Definition, location vs market-based, dual reporting | Educational |
| 7 | "What's the difference between location-based and market-based?" | Grid average vs contractual, when to use each | Educational |
| 8 | "My electricity is from France — what's the factor?" | France grid factor (~0.05 kg/kWh), IEA source | Calculator |
| 9 | "Should I buy RECs for Scope 2?" | RECs and market-based method, quality criteria, limitations | Educational |
| 10 | "How do I get Scope 2 to zero?" | 100% renewable, PPAs, green tariffs, on-site solar | Educational |

### A3. Scope 3 (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 11 | "What is Scope 3?" | Definition, 15 categories, upstream/downstream, typical % of total | Educational |
| 12 | "Which Scope 3 category is usually the biggest?" | Category 1 (purchased goods), why, examples | Educational |
| 13 | "How do I collect Scope 3 data from suppliers?" | Survey templates, spend-based fallback, prioritization | Educational |
| 14 | "My Scope 3 is 90% of total — is that normal?" | Yes for manufacturing/retail, benchmarks, action plan | Calculator |
| 15 | "Does SBTi require Scope 3 targets?" | Yes if >40% of total, ambition criteria, timeline | Regulatory |

### A4. GHG Protocol (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 16 | "What is the GHG Protocol?" | WRI/WBCSD standard, Corporate Standard, scopes, principles | Educational |
| 17 | "What's the difference between GHG Protocol and ISO 14064?" | GHG Protocol for corporate, ISO for project/verification level | Educational |
| 18 | "Do I need to report all 15 Scope 3 categories?" | Materiality assessment, focus on significant categories | Regulatory |
| 19 | "What GWP values should I use?" | IPCC AR6 GWP100, methane 28-36, when to use GWP20 | Educational |
| 20 | "How often should I update my carbon footprint?" | Annual minimum, after major changes, SBTi requirements | Regulatory |

---

## Category B: ESG Reporting (20 cases)

### B1. CSRD (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 21 | "What is CSRD?" | EU directive, 50,000 companies, double materiality, ESRS | Educational |
| 22 | "Does CSRD apply to my company?" | Size thresholds, EU presence, phased timeline | Regulatory |
| 23 | "What is double materiality?" | Financial + impact materiality, examples, vs single materiality | Educational |
| 24 | "When is my CSRD deadline?" | Phase-in dates by company type | Regulatory |
| 25 | "What are ESRS standards?" | Cross-cutting + topical, E1-E5, S1-S4, G1-G2 | Educational |

### B2. ISSB (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 26 | "What is ISSB?" | IFRS Foundation, S1/S2, global baseline, 20+ jurisdictions | Educational |
| 27 | "What's the difference between CSRD and ISSB?" | Double vs single materiality, EU vs global, ESRS vs IFRS | Educational |
| 28 | "Do I need to report Scope 3 under ISSB?" | If material, assessment criteria, safe harbor provisions | Regulatory |
| 29 | "What is IFRS S2?" | Climate disclosures, TCFD-aligned, 4 pillars, metrics | Educational |
| 30 | "Which countries have adopted ISSB?" | UK, Australia, Japan, Nigeria, Singapore, etc. | Regulatory |

### B3. TCFD/TNFD (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 31 | "What is TCFD?" | FSB task force, 4 pillars, governance/strategy/risk/metrics | Educational |
| 32 | "Is TCFD still relevant?" | Consolidated into ISSB S2, but principles remain foundational | Educational |
| 33 | "What is TNFD?" | Nature-related disclosures, LEAP approach, 4 pillars | Educational |
| 34 | "What's the difference between TCFD and TNFD?" | Climate vs nature, similar structure, different metrics | Educational |
| 35 | "Do I need to report on biodiversity?" | TNFD voluntary, CSRD E4 mandatory for some, emerging expectation | Regulatory |

### B4. GRI/SBTi (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 36 | "What is GRI?" | Global Reporting Initiative, double materiality, 10,000+ reporters | Educational |
| 37 | "Should I use GRI or ISSB?" | GRI for impact, ISSB for financial, many use both | Educational |
| 38 | "What is SBTi?" | Science Based Targets, 1.5°C alignment, 7,000+ companies | Educational |
| 39 | "How do I set a science-based target?" | Commit, develop, submit, validate, announce, disclose | Educational |
| 40 | "What's the difference between near-term and net-zero targets?" | 5-10 years vs 2050, 90-95% reduction requirement | Educational |

---

## Category C: Calculator Support (20 cases)

### C1. Input Help (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 41 | "How do I use the calculator?" | Step-by-step guide, what data is needed, tips | Calculator |
| 42 | "What units should I use for fuel?" | Litres, gallons, kg, MJ — with conversion guidance | Calculator |
| 43 | "I don't know my electricity consumption" | Estimation methods, utility bill guidance, benchmarks | Calculator |
| 44 | "What if I have multiple locations?" | Consolidation approach, separate calculations, tools | Calculator |
| 45 | "Can I save my progress?" | Auto-save feature, export options, session persistence | Calculator |

### C2. Output Interpretation (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 46 | "Why is my Scope 3 so high?" | Analyze calculator output, identify top categories, explain drivers | Calculator |
| 47 | "What does tCO2e mean?" | Tonnes CO2 equivalent, GWP concept, why used | Educational |
| 48 | "Is 10,000 tonnes total a lot?" | Benchmark by industry, company size context, percentile | Calculator |
| 49 | "What is carbon intensity?" | Definition, tCO2e/revenue or tCO2e/employee, benchmarking | Calculator |
| 50 | "Why are my Scope 2 emissions zero?" | Check renewable procurement, market-based method, RECs | Calculator |

### C3. PDF Report (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 51 | "What does my PDF report show?" | Explain 9-page structure, key sections, how to read | PDF |
| 52 | "How was my total calculated?" | Methodology summary, factors used, data sources | PDF |
| 53 | "What are the recommendations based on?" | Top emission sources, sector benchmarks, reduction levers | PDF |
| 54 | "Can I share this report with my auditor?" | Yes, methodology aligns with GHG Protocol, assurance readiness | PDF |
| 55 | "How do I update my report?" | Re-run calculator, edit inputs, regenerate PDF | PDF |

### C4. Export/Data (5 cases)

| # | Prompt | Expected Response Elements | Type |
|---|--------|---------------------------|------|
| 56 | "Can I export to Excel?" | CSV export available, format explanation, next steps | Calculator |
| 57 | "What format is the JSON export?" | Schema description, field definitions, use cases | Calculator |
| 58 | "How do I import last year's data?" | Not yet supported, manual entry, future feature | Calculator |
| 59 | "Can I compare year-over-year?" | Not yet in UI, workaround suggestions, roadmap | Calculator |
| 60 | "Is my data secure?" | Client-side only, no server storage, encrypted localStorage | Calculator |

---

## Category D: Academy Recommendations (10 cases)

| # | Prompt | Expected Recommendation | Type |
|---|--------|------------------------|------|
| 61 | "I want to learn about carbon accounting" | Scope 1, 2, 3 guides + GHG Protocol guide | Academy |
| 62 | "What should I read about CSRD?" | CSRD Omnibus Guide + ESG Reporting Guide | Academy |
| 63 | "I'm new to sustainability — where do I start?" | Beginner path: GHG Protocol → Scope 1 → Scope 2 → Scope 3 | Academy |
| 64 | "What guide covers emission factors?" | GHG Protocol Guide + Calculator methodology | Academy |
| 65 | "I need to understand Scope 3 categories" | Scope 3 Guide + GHG Protocol Technical Guidance | Academy |
| 66 | "What about ESG frameworks?" | ESG Reporting Guide + GRI vs ISSB comparison | Academy |
| 67 | "How do I set a net-zero target?" | SBTi Guide + Net Zero Strategy Guide (planned) | Academy |
| 68 | "Tell me about carbon pricing" | Carbon Pricing Guide (planned) + EU ETS section | Academy |
| 69 | "What guides do you have on energy?" | Energy Economics Guide (planned) + LCOE article | Academy |
| 70 | "Are there guides for my industry?" | Sector-specific guides (planned) + general guides | Academy |

---

## Category E: Quiz Recommendations (10 cases)

| # | Prompt | Expected Recommendation | Type |
|---|--------|------------------------|------|
| 71 | "Test my carbon knowledge" | Carbon Readiness Quiz | Quiz |
| 72 | "Am I ready for CSRD?" | ESG Maturity Quiz (planned) + CSRD checklist | Quiz |
| 73 | "How much do I know about ESG?" | ESG Maturity Quiz (planned) | Quiz |
| 74 | "I want to check my sustainability knowledge" | Carbon Readiness Quiz (general) | Quiz |
| 75 | "What quiz should I take first?" | Carbon Readiness Quiz (beginner-friendly) | Quiz |
| 76 | "Are there advanced quizzes?" | Yes, with difficulty levels, category-specific | Quiz |
| 77 | "Can I retake the quiz?" | Yes, unlimited attempts, track progress | Quiz |
| 78 | "What happens after I complete a quiz?" | Score breakdown, recommendations, next steps | Quiz |
| 79 | "I scored 40% — what does that mean?" | Beginner level, suggested learning path, encouragement | Quiz |
| 80 | "I scored 90% — what's next?" | Advanced topics, certification paths, community | Quiz |

---

## Category F: Lead Qualification (10 cases)

| # | Prompt | Expected Behavior | Type |
|---|--------|-------------------|------|
| 81 | "My company needs help with carbon accounting" | Soft qualification: size, industry, timeline | Lead |
| 82 | "We have to report under CSRD next year" | Identify urgency, offer detailed assessment | Lead |
| 83 | "How much does Terrnix cost?" | Explain free tools, mention enterprise options | Lead |
| 84 | "Can Terrnix help us set SBTi targets?" | Yes, describe services, offer consultation | Lead |
| 85 | "We're a 500-person manufacturing company" | Record size + industry, suggest relevant services | Lead |
| 86 | "I need a sustainability consultant" | Position Terrnix capabilities, offer intro call | Lead |
| 87 | "What services does Terrnix offer?" | List services, focus on user's expressed needs | Lead |
| 88 | "Can I talk to someone?" | Offer contact form, mention response time | Lead |
| 89 | "We're just starting our sustainability journey" | Beginner resources, gradual engagement, no pressure | Lead |
| 90 | "We need this done by Q4" | Urgency signal, prioritize actionable next steps | Lead |

---

## Category G: Edge Cases & Error Handling (10 cases)

| # | Prompt | Expected Behavior | Type |
|---|--------|-------------------|------|
| 91 | "asdfghjkl" | "I didn't understand. Try asking about carbon, ESG, or regulations." | Error |
| 92 | "Tell me a joke" | Friendly deflection, return to sustainability topics | Error |
| 93 | "What is the weather today?" | "I'm a sustainability assistant. Try asking about climate policy!" | Error |
| 94 | "Who is the president?" | "I focus on sustainability. Ask me about carbon accounting or ESG!" | Error |
| 95 | "[Empty message]" | Ignore or prompt: "What would you like to know?" | Error |
| 96 | "Scope 4 emissions" | "Scope 4 isn't a GHG Protocol category. Did you mean avoided emissions?" | Error |
| 97 | "CSRD applies to US companies, right?" | Clarify: only if EU subsidiary or listed on EU exchange | Correction |
| 98 | "I can offset all my emissions, right?" | Correct: offsets for residual only, reduction first | Correction |
| 99 | "Carbon neutral is the same as net zero" | Clarify difference, explain reduction requirements | Correction |
| 100 | "Tell me everything about sustainability" | "That's a big topic! Let's start with one area — carbon, ESG, energy, or regulations?" | Clarification |

---

## Scoring Rubric

### Response Quality Levels

| Score | Label | Criteria |
|-------|-------|----------|
| 3 | Excellent | Accurate, complete, personalized, actionable, with follow-up |
| 2 | Acceptable | Accurate and helpful, may lack personalization or depth |
| 1 | Partial | Contains correct information but incomplete or off-topic |
| 0 | Unacceptable | Incorrect, irrelevant, or unhelpful |

### Target

- **90%+ responses scored 2 or 3**
- **0% responses scored 0**
- **Average score ≥ 2.0**

### Test Execution

```javascript
// Automated test runner
async function runTests() {
  const results = [];
  
  for (const testCase of testCases) {
    const response = await chatbot.generateResponse(testCase.prompt);
    const score = evaluateResponse(response, testCase.expected);
    results.push({ prompt: testCase.prompt, score, response });
  }
  
  const acceptableRate = results.filter(r => r.score >= 2).length / results.length;
  console.log(`Acceptable rate: ${(acceptableRate * 100).toFixed(1)}%`);
  
  return results;
}
```

---

## Test Results Template

| Category | Cases | Score 3 | Score 2 | Score 1 | Score 0 | Acceptable % |
|----------|-------|---------|---------|---------|---------|--------------|
| Carbon Accounting | 20 | | | | | |
| ESG Reporting | 20 | | | | | |
| Calculator Support | 20 | | | | | |
| Academy Recommendations | 10 | | | | | |
| Quiz Recommendations | 10 | | | | | |
| Lead Qualification | 10 | | | | | |
| Edge Cases | 10 | | | | | |
| **TOTAL** | **100** | | | | | |

---

*Document Version: 2.0-draft*
*Next: CHATBOT_V2_ROADMAP.md*
