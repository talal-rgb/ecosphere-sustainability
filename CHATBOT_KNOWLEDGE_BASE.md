# Chatbot V2 Knowledge Base
**Date:** 2026-06-17
**Version:** 2.0-draft
**Scope:** Structured knowledge for Sustainability Intelligence Assistant

---

## A. Carbon Accounting Domain

### A1. Scope 1 Emissions

**Definition:** Direct GHG emissions from sources owned or controlled by the organization.

**Categories:**
- Stationary combustion (fuel in boilers, furnaces, generators)
- Mobile combustion (company vehicles, fleet)
- Process emissions (chemical reactions, cement, steel)
- Fugitive emissions (refrigerant leaks, methane venting)

**Key Facts:**
- Most straightforward to measure (direct control)
- All organizations must report under GHG Protocol
- Reduction: fuel switching, efficiency, electrification

**Terrnix Calculator Integration:**
- Input: fuel type, quantity, unit
- Factors: EPA 2024, IPCC AR6 GWP100
- Output: tCO2e by subcategory

**Academy Links:**
- `/carbon-accounting/scope-1-emissions/`
- `/carbon-accounting/ghg-protocol-guide/`

---

### A2. Scope 2 Emissions

**Definition:** Indirect emissions from purchased electricity, steam, heating, cooling.

**Methods:**
- **Location-based:** Average grid emission factor
- **Market-based:** Contractual emission factor (RECs, PPAs)

**Key Facts:**
- Dual reporting required by GHG Protocol
- Grid factors vary 30x by country (Norway 0.02, India 0.71 kg/kWh)
- Reduction: renewable procurement, on-site generation

**Terrnix Calculator Integration:**
- Input: kWh by country/region
- Factors: IEA 2024 (80+ countries)
- Output: tCO2e location-based and market-based

**Academy Links:**
- `/carbon-accounting/scope-2-emissions/`

---

### A3. Scope 3 Emissions

**Definition:** All other indirect value chain emissions (15 categories).

**Upstream (8):**
1. Purchased goods & services
2. Capital goods
3. Fuel & energy-related
4. Upstream transport
5. Waste
6. Business travel
7. Employee commuting
8. Upstream leased assets

**Downstream (7):**
9. Downstream transport
10. Processing of sold products
11. Use of sold products
12. End-of-life treatment
13. Downstream leased assets
14. Franchises
15. Investments

**Key Facts:**
- Typically 70-90% of total emissions
- SBTi requires targets if >40% of total
- Calculation: spend-based, activity-based, hybrid

**Terrnix Calculator Integration:**
- Input: spend by category, transport km, waste tonnes
- Factors: EEIO, DEFRA, EPA
- Output: tCO2e by category

**Academy Links:**
- `/carbon-accounting/scope-3-emissions/`

---

### A4. Emission Factors

**Definition:** Coefficients converting activity data to CO2e.

**Sources:**
| Source | Coverage | Update Frequency |
|--------|----------|------------------|
| IPCC AR6 | GWP100 values | 2021 (next: ~2028) |
| IEA | Country grid factors | Annual |
| EPA GHG Hub | US-specific | Annual |
| DEFRA/BEIS | UK-specific | Annual |
| GaBi/Sphera | LCA databases | Quarterly |

**Terrnix Database:**
- 15,000+ factors
- Updated annually
- Covers 80+ countries

---

### A5. GHG Protocol

**Standards:**
- Corporate Standard (Scope 1, 2, 3)
- Scope 2 Guidance (dual reporting)
- Scope 3 Technical Guidance (15 categories)
- Product Standard (LCA-based)
- Project Protocol (reductions)

**Principles:**
Relevance, Completeness, Consistency, Transparency, Accuracy

**Academy Links:**
- `/carbon-accounting/ghg-protocol-guide/`

---

## B. ESG Reporting Domain

### B1. CSRD (Corporate Sustainability Reporting Directive)

**Overview:** EU mandatory ESG disclosure framework
**Applies to:** 50,000+ companies (expanded from 11,700 under NFRD)
**Materiality:** Double materiality (financial + impact)
**Standards:** ESRS (European Sustainability Reporting Standards)

**Timeline:**
- 2024: Large public-interest entities
- 2025: Other large undertakings
- 2026-2028: Listed SMEs, non-EU companies with EU subsidiaries

**Key Requirements:**
- Cross-cutting standards (ESRS 1-2)
- Topical standards: E1-E5 (Environment), S1-S4 (Social), G1-G2 (Governance)
- Limited assurance by 2025, reasonable assurance by 2028

**Academy Links:**
- `/esg-reporting/csrd-omnibus-guide/`

---

### B2. ESRS (European Sustainability Reporting Standards)

**Structure:**
- ESRS 1: General Requirements
- ESRS 2: General Disclosures
- E1: Climate Change
- E2: Pollution
- E3: Water & Marine Resources
- E4: Biodiversity
- E5: Resource Use & Circular Economy
- S1: Own Workforce
- S2: Workers in Value Chain
- S3: Affected Communities
- S4: Consumers & End-Users
- G1: Business Conduct

---

### B3. ISSB (International Sustainability Standards Board)

**Standards:**
- IFRS S1: General Sustainability-related Disclosures
- IFRS S2: Climate-related Disclosures

**Materiality:** Single (financial materiality only)
**Alignment:** TCFD four pillars
**Adoption:** 20+ jurisdictions committed

**Key Disclosures:**
- Scope 1, 2, 3 emissions (where material)
- Climate transition plans
- Resilience analysis
- Governance & strategy

---

### B4. Double Materiality

**Definition:** Assessment of both:
1. **Financial materiality:** How sustainability affects company value
2. **Impact materiality:** How company affects people/environment

**Used by:** CSRD, GRI Standards
**Contrast:** ISSB uses single materiality (financial only)

---

## C. Sustainability Strategy Domain

### C1. Net Zero

**Definition:** Reducing emissions 90-95% before neutralizing residuals with offsets.

**Pathways:**
- SBTi Net-Zero Standard (2050 or sooner)
- Race to Zero campaign
- Corporate Net-Zero Standard (launched 2021)

**Key Distinction:**
- Carbon neutral = balance via offsets (can maintain emissions)
- Net zero = deep reductions + residual offsetting

---

### C2. Decarbonization Levers

**Energy:**
- Renewable procurement (PPAs, green tariffs)
- On-site generation (solar, wind)
- Energy efficiency (building retrofits, process optimization)
- Electrification (heat pumps, EVs)

**Industrial:**
- Green hydrogen (steel, chemicals, cement)
- CCUS (cement, steel, power)
- Circular economy (material recycling)

**Transport:**
- Fleet electrification
- Sustainable aviation fuel (SAF)
- Modal shift (rail vs. road)

---

### C3. Supplier Engagement

**Approaches:**
1. **Tier 1 focus:** Direct suppliers only
2. **Supply chain mapping:** Multi-tier visibility
3. **Collaborative programs:** Joint reduction initiatives
4. **Procurement incentives:** Carbon in supplier scorecards

**Challenges:**
- Data availability
- Supplier capacity
- Cost allocation
- Verification

---

## D. Terrnix Features Domain

### D1. Carbon Calculator

**Capabilities:**
- Scope 1: Stationary, mobile, fugitive
- Scope 2: Location-based, market-based (80+ countries)
- Scope 3: All 15 categories
- Visualization: Charts by scope and category
- Export: JSON, CSV, PDF (9-page report)

**Emission Factors:**
- EPA 2024 (US)
- IEA 2024 (global grids)
- IPCC AR6 GWP100
- DEFRA/BEIS (UK)

**User Flow:**
1. Enter company info
2. Input activity data by scope
3. Review real-time totals
4. Generate PDF report
5. Export data

---

### D2. PDF Report

**Structure (9 pages):**
1. Cover
2. Executive Summary
3. Scope 1 Breakdown
4. Scope 2 Breakdown
5. Scope 3 Breakdown
6. Methodology
7. Emission Factors Used
8. Recommendations
9. Disclaimer

**Key Metrics:**
- Total tCO2e
- Scope split (%)
- Intensity metrics (tCO2e/revenue, tCO2e/employee)
- Year-over-year comparison (if historical data)

---

### D3. Academy Content

**Available Guides:**
| Guide | URL | Level |
|-------|-----|-------|
| Scope 1 Emissions | `/carbon-accounting/scope-1-emissions/` | Beginner |
| Scope 2 Emissions | `/carbon-accounting/scope-2-emissions/` | Beginner |
| Scope 3 Emissions | `/carbon-accounting/scope-3-emissions/` | Intermediate |
| GHG Protocol Guide | `/carbon-accounting/ghg-protocol-guide/` | Beginner |
| CSRD Omnibus Guide | `/esg-reporting/csrd-omnibus-guide/` | Intermediate |

**Planned:**
- ESG Reporting Guide
- Carbon Pricing Guide
- Net Zero Strategy Guide

---

### D4. Quiz

**Available Quizzes:**
- Carbon Readiness Quiz (30 questions)
- ESG Maturity Quiz (planned)
- Sustainability Strategy Quiz (planned)

**Categories:**
- Energy (5 questions)
- ESG (5 questions)
- Carbon Accounting (5 questions)
- GHG Protocol (5 questions)
- Regulations (5 questions)
- Carbon Pricing (5 questions)

**Scoring:**
- Beginner/Intermediate/Advanced difficulty
- Category breakdown
- Recommendations based on score

---

## E. Response Templates

### E1. Educational Question Template

```
[Definition — 1-2 sentences]

[Why it matters — 1 sentence]

[Key details — 2-3 bullet points]

[Terrnix connection — 1 sentence with link]

[Next step suggestion — 1 sentence]
```

### E2. Calculator Question Template

```
[Acknowledge user's data — "Based on your inputs..."]

[Explain the specific output]

[Compare to benchmark if available]

[Suggest 2-3 reduction actions]

[Link to relevant Academy guide]
```

### E3. PDF Report Question Template

```
[Acknowledge report generation]

[Highlight key finding — total, top scope, intensity]

[Explain methodology briefly]

[Identify 2-3 priority areas]

[Suggest next steps — target setting, reduction plan, deeper analysis]
```

### E4. Academy Recommendation Template

```
[Based on your interest in [topic]...]

[I recommend: [Guide Name] — [1-line description]]

[Link: [URL]]

[Why this helps: [1 sentence]]

[Would you like to take the [Quiz Name] to test your knowledge?]
```

### E5. Quiz Recommendation Template

```
[Based on our conversation, you seem interested in [topic].]

[Test your knowledge with the [Quiz Name].]

[It covers: [2-3 topics]]

[Link: [URL]]

[Would you like to try it now?]
```

### E6. Lead Qualification Template (Soft)

```
[That's a great question about [topic].]

[Many companies in [industry/size] find [specific challenge] difficult.]

[Terrnix offers [relevant service] that could help.]

[Would you like a more detailed assessment? No pressure — just exploring.]
```

---

## F. Memory System Design

### F1. Session Memory

**Stored per session:**
```json
{
  "sessionId": "uuid",
  "startedAt": "timestamp",
  "messages": [
    {"role": "user", "text": "...", "timestamp": "..."},
    {"role": "ai", "text": "...", "timestamp": "..."}
  ],
  "topicsDiscussed": ["scope-3", "csrd"],
  "calculatorUsed": true,
  "pdfGenerated": false,
  "academyClicks": ["/carbon-accounting/scope-3-emissions/"],
  "quizTaken": null
}
```

### F2. Persistent Memory (encryptedStorage)

**Stored long-term:**
```json
{
  "userId": "anonymous|authenticated",
  "preferredTopics": ["carbon-accounting", "esg-reporting"],
  "calculatorHistory": [
    {"date": "...", "total": 1234.5, "scopes": {"s1": 100, "s2": 400, "s3": 734.5}}
  ],
  "pdfReportsGenerated": 3,
  "academyArticlesRead": ["..."],
  "quizzesCompleted": ["carbon-readiness"],
  "averageQuizScore": 78,
  "leadQualification": {
    "companySize": null,
    "industry": null,
    "reportingRequirements": [],
    "maturityLevel": null
  }
}
```

### F3. Privacy Rules

- **NEVER store:** Names, emails, phone numbers, addresses
- **NEVER store:** Specific emission values with company identifiers
- **Store only:** Aggregated patterns, preferences, anonymous usage
- **Retention:** 90 days for session memory, 1 year for persistent
- **Encryption:** AES-GCM via encryptedStorage

---

## G. Lead Qualification Triggers

### G1. Explicit Signals

| Signal | Question to Ask |
|--------|----------------|
| "My company..." | "What industry are you in?" |
| "We need to report..." | "Are you preparing for CSRD, SEC, or other frameworks?" |
| "How do we start?" | "What is your company's approximate size?" |
| "Can Terrnix help?" | "Would you like a more detailed assessment?" |

### G2. Implicit Signals

| Behavior | Inference |
|----------|-----------|
| Calculator used + PDF generated | High intent, possibly preparing for reporting |
| Multiple Scope 3 questions | Complex supply chain, likely large enterprise |
| CSRD/ISSB questions | Regulatory deadline approaching |
| Quiz score <50% | Early in sustainability journey |
| Quiz score >80% | Advanced user, potential advocate |

### G3. Qualification Flow

```
User asks about [topic]
    ↓
Bot provides helpful answer
    ↓
If topic is complex OR user mentions company:
    "Many companies find [topic] challenging. 
     Would you like a more detailed assessment?"
    ↓
If user says yes:
    Ask 2-3 soft questions (size, industry, timeline)
    ↓
Store in memory (not PII)
    ↓
Offer: "I can connect you with our team for a deeper discussion."
```

---

*Document Version: 2.0-draft*
*Next: CHATBOT_MEMORY_SYSTEM.md*
