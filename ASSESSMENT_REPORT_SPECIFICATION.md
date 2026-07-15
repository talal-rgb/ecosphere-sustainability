# Terrnix Assessment Report Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0

---

## Overview

A professional, multi-page PDF report generated after assessment completion. Separate from the certificate. Provides detailed analysis, recommendations, and actionable roadmap.

---

## Report Structure (8–10 Pages)

### Page 1: Cover Page

**Layout:**
- Full-page with Terrnix branding
- Top: Terrnix logo (centered, 30mm wide)
- Middle:
  - Title: "Sustainability Assessment Report"
  - Subtitle: `[Assessment Name]`
  - Participant: `[Full Name]`
  - Company: `[Company]` (if provided)
  - Date: `[Completion Date]`
- Bottom: Confidentiality notice
  - "This report is confidential and prepared exclusively for [Name]."

### Page 2: Executive Summary

**Sections:**
1. **Overall Score**
   - Large score display: `[Score]/100`
   - Maturity level badge: `[Maturity Level]`
   - Visual: horizontal bar chart showing score position

2. **Key Findings (3 bullets)**
   - Auto-generated based on category scores
   - Example: "Strong governance framework but limited Scope 3 data coverage."

3. **Top Priority**
   - Single highest-impact recommendation
   - Bold, actionable language

### Page 3: Category Breakdown

**Layout:**
- Title: "Assessment Category Results"
- For each category (5 categories):
  - Category name
  - Score: `[Score]/100`
  - Visual: horizontal bar (0–100)
  - Colour coding:
    - 0–49: Red (#ef4444)
    - 50–69: Amber (#f59e0b)
    - 70–84: Emerald (#10b981)
    - 85–100: Dark emerald (#059669)
  - Brief interpretation (1 sentence)

**Chart:**
- Radar chart or bar chart showing all 5 categories
- Generated using Chart.js, captured as image for PDF

### Page 4: Strengths

**Title:** "Your Strengths"

**Content:**
- Top 2 scoring categories
- For each:
  - Category name + score
  - 2–3 sentences explaining what this means
  - "What this enables:" bullet list of business benefits

**Example:**
```
Governance & Accountability: 80/100

Your organisation has established board-level accountability for 
sustainability performance. This creates a strong foundation for 
strategic carbon management.

What this enables:
• Clear decision-making on carbon investments
• Executive ownership of climate targets
• Investor confidence in governance structures
```

### Page 5: Priority Gaps

**Title:** "Priority Gaps"

**Content:**
- Bottom 2 scoring categories
- For each:
  - Category name + score
  - Risk statement: "Without addressing this, your organisation faces..."
  - Recommended action (1 sentence)

**Example:**
```
Supplier Engagement: 45/100

Without addressing this, your organisation faces regulatory non-compliance 
under CSRD Scope 3 reporting requirements and reputational risk from 
undisclosed supply chain emissions.

Recommended action: Implement a tier-1 supplier data collection programme 
with emission reduction targets by Q2 2027.
```

### Page 6: Recommended Actions

**Title:** "Your Recommended Action Plan"

**Content:**
- 5 prioritised actions
- For each:
  - Priority number (1–5)
  - Action title
  - Description (2–3 sentences)
  - Expected impact
  - Difficulty: Low / Medium / High
  - Timeframe: Immediate / 30 days / 90 days

**Example:**
```
1. Establish Scope 3 Data Collection Protocol
   
   Description: Define data requirements for tier-1 suppliers and 
   implement a collection workflow using emission factors from DEFRA 
   or EPA.
   
   Expected impact: Enable CSRD-compliant Scope 3 reporting
   Difficulty: Medium
   Timeframe: 90 days
```

### Page 7: 30-60-90 Day Roadmap

**Title:** "Your 30-60-90 Day Roadmap"

**Layout:** Three columns

**30 Days (Foundation):**
- 2–3 quick wins
- Example: "Assign carbon accountability to a director"
- Example: "Collect Scope 1 and 2 energy data for past 12 months"

**60 Days (Development):**
- 2–3 medium-term actions
- Example: "Complete Scope 3 screening using spend-based method"
- Example: "Draft GHG inventory using GHG Protocol Corporate Standard"

**90 Days (Maturity):**
- 2–3 strategic actions
- Example: "Set science-based targets through SBTi"
- Example: "Publish first sustainability report aligned with CSRD"

### Page 8: Terrnix Resources

**Title:** "Recommended Terrnix Resources"

**Sections:**
1. **Tools**
   - List of 2–3 relevant calculators/tools
   - Title + one-line description + URL

2. **Intelligence Articles**
   - List of 2–3 relevant articles
   - Title + one-line summary + URL

3. **Consultation CTA**
   - Heading: "Need Expert Guidance?"
   - Text: "Book a free 30-minute consultation with a Terrnix sustainability expert."
   - Button: "Book Consultation" (URL)

### Page 9: Methodology

**Title:** "Assessment Methodology"

**Content:**
- How the assessment was developed
- Scoring methodology
- Maturity level definitions
- Limitations and disclaimers

**Example:**
```
This assessment evaluates carbon accounting maturity across five 
dimensions: Governance, Data Collection, Reporting, Targets, and 
Stakeholder Engagement. Each question is weighted by category 
importance. Scores are normalised to a 0–100 scale.

Maturity levels:
• Foundation (0–49): Early stage development
• Developing (50–69): Core processes established
• Practitioner (70–84): Mature, operational processes
• Advanced (85–100): Leading practice, continuous improvement

Limitations: This assessment provides a directional evaluation based 
on self-reported information. It does not replace a formal audit or 
third-party verification.
```

### Page 10: Disclaimer

**Title:** "Disclaimer"

**Content:**
```
This report is generated based on responses provided during the Terrnix 
[Assessment Name]. The results, recommendations, and roadmap are intended 
for educational and planning purposes only.

Terrnix does not guarantee specific outcomes from following the 
recommendations in this report. Organisations should seek professional 
advice tailored to their specific circumstances before making significant 
investments or strategic decisions.

This report does not constitute professional advice, regulatory 
consultation, or formal certification. For professional sustainability 
consulting services, contact Terrnix at terrnix.com.

© 2026 Terrnix. All rights reserved.
```

---

## PDF Generation

### jsPDF Configuration
```javascript
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true
});
```

### Page Layout
- **Orientation:** Portrait (A4: 210mm × 297mm)
- **Margins:** 20mm left/right, 25mm top, 20mm bottom
- **Header:** Terrnix logo (top-left, 20mm wide) + Report title (top-right, 10pt)
- **Footer:** Page number (bottom-center) + "Confidential" (bottom-right)

### Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page titles | Sans-serif | 18pt | Bold |
| Section headings | Sans-serif | 14pt | Bold |
| Body text | Sans-serif | 11pt | Regular |
| Captions | Sans-serif | 9pt | Regular |
| Score display | Sans-serif | 24pt | Bold |

### Charts
- Use Chart.js to generate charts in a hidden canvas
- Capture canvas as image using `canvas.toDataURL('image/png')`
- Add to PDF using `doc.addImage()`
- Chart dimensions: 170mm × 80mm

### File Naming
```
terrnix-assessment-report-{assessment-id}-{participant-name}-{date}.pdf

Example:
terrnix-assessment-report-carbon-readiness-tallal-belkheiri-2026-07-15.pdf
```

---

## Colour Scheme

| Element | Colour | Hex |
|---------|--------|-----|
| Primary accent | Terrnix emerald | #059669 |
| Secondary accent | Teal | #0d9488 |
| Score high | Dark emerald | #059669 |
| Score medium | Emerald | #10b981 |
| Score low | Amber | #f59e0b |
| Score critical | Red | #ef4444 |
| Text primary | Dark charcoal | #1a1a1a |
| Text secondary | Medium gray | #666666 |
| Background | White | #FFFFFF |
| Light background | Light gray | #f8fafc |

---

## Dynamic Content Generation

### Score-Based Content Mapping

| Score Range | Executive Summary Tone | Priority Actions Focus |
|-------------|------------------------|------------------------|
| 0–49 | "Foundation building needed" | Quick wins, basic setup |
| 50–69 | "Good start, gaps to address" | Process development |
| 70–84 | "Strong foundation, optimise" | Advanced practices |
| 85–100 | "Leading practice, maintain" | Innovation, mentoring |

### Category-Based Recommendations

Each category has a pool of 3–5 recommended actions. The report selects:
- 2 actions from lowest-scoring categories
- 2 actions from medium-scoring categories  
- 1 action from highest-scoring category (optimisation)

### Resource Mapping

Resources (tools, articles) are mapped to categories:
```json
{
  "governance": {
    "tools": ["ESG Maturity Calculator"],
    "articles": ["Board-Level ESG Oversight"]
  },
  "data": {
    "tools": ["Carbon Footprint Calculator"],
    "articles": ["GHG Protocol Scope 3 Revisions"]
  }
}
```

---

## Implementation Checklist

- [ ] jsPDF library loaded (self-hosted)
- [ ] Chart.js available for chart generation
- [ ] Report generation function implemented
- [ ] Cover page with branding
- [ ] Executive summary with score and maturity
- [ ] Category breakdown with bar charts
- [ ] Strengths analysis page
- [ ] Priority gaps analysis page
- [ ] Recommended actions (5 items)
- [ ] 30-60-90 day roadmap
- [ ] Terrnix resources page
- [ ] Methodology page
- [ ] Disclaimer page
- [ ] Header/footer on every page
- [ ] Page numbers
- [ ] File naming convention implemented
- [ ] PDF file size < 1MB
- [ ] No browser print dialog used
- [ ] Separate from certificate generation
