# Terrnix Assessment JSON Schema

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Data Contract

---

## Schema Overview

Every assessment is defined by a single JSON file. The Assessment Engine reads this file and generates the entire experience. No JavaScript code changes are required for new assessments.

**File Location:** `data/assessments/{slug}.json`

**Validation:** JSON Schema (draft-07) enforced at build time and runtime.

---

## Top-Level Structure

```json
{
  "$schema": "https://terrnix.com/schemas/assessment-v1.json",
  "id": "carbon-accounting-readiness",
  "slug": "carbon-accounting-readiness",
  "version": "1.0.0",
  "status": "published",
  
  "metadata": { ... },
  "categories": [ ... ],
  "questions": [ ... ],
  "scoring": { ... },
  "maturityLevels": [ ... ],
  "certificateRules": { ... },
  "recommendations": { ... },
  "report": { ... },
  "relatedContent": { ... },
  "analytics": { ... },
  "ui": { ... }
}
```

---

## Field Definitions

### 1. Identity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier. Kebab-case. Never changes. |
| `slug` | string | Yes | URL-friendly identifier. Matches filename. |
| `version` | string | Yes | Semantic versioning. Major changes = new version. |
| `status` | enum | Yes | `draft`, `published`, `archived` |

**Example:**
```json
{
  "id": "carbon-accounting-readiness",
  "slug": "carbon-accounting-readiness",
  "version": "1.0.0",
  "status": "published"
}
```

---

### 2. Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metadata.title` | string | Yes | Display title. Max 80 chars. |
| `metadata.subtitle` | string | Yes | One-line description. Max 120 chars. |
| `metadata.description` | string | Yes | Full description. Max 300 chars. SEO meta. |
| `metadata.estimatedDuration` | string | Yes | Human-readable. e.g., "8 minutes" |
| `metadata.difficulty` | enum | Yes | `beginner`, `intermediate`, `advanced`, `expert` |
| `metadata.language` | string | Yes | ISO 639-1 code. e.g., "en" |
| `metadata.author` | string | No | Content author or reviewer name. |
| `metadata.lastUpdated` | string | No | ISO 8601 date. e.g., "2026-07-15" |
| `metadata.tags` | array | No | Keywords for internal search. |
| `metadata.ogImage` | string | No | Open Graph image URL. 1200x630px. |
| `metadata.keywords` | array | No | SEO keywords. |

**Example:**
```json
{
  "metadata": {
    "title": "Carbon Accounting Readiness Assessment",
    "subtitle": "Evaluate your organisation's carbon accounting maturity",
    "description": "A comprehensive 25-question assessment evaluating your carbon accounting practices across governance, data collection, reporting, targets, and stakeholder engagement.",
    "estimatedDuration": "8 minutes",
    "difficulty": "intermediate",
    "language": "en",
    "author": "Terrnix Sustainability Team",
    "lastUpdated": "2026-07-15",
    "tags": ["carbon", "accounting", "ghg-protocol", "csrd", "reporting"],
    "ogImage": "https://terrnix.com/assets/images/assessments/carbon-accounting-og.jpg",
    "keywords": ["carbon accounting assessment", "GHG protocol readiness", "carbon maturity"]
  }
}
```

---

### 3. Categories

Array of assessment dimensions. Weights must sum to 1.0.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `categories[].id` | string | Yes | Unique within assessment. Kebab-case. |
| `categories[].name` | string | Yes | Display name. |
| `categories[].description` | string | Yes | One-line description. |
| `categories[].weight` | number | Yes | 0.0 to 1.0. Sum of all = 1.0. |
| `categories[].icon` | string | No | SVG path or icon name. |
| `categories[].colour` | string | No | Hex colour for charts. |

**Example:**
```json
{
  "categories": [
    {
      "id": "governance",
      "name": "Governance & Accountability",
      "description": "Board oversight, carbon ownership, and accountability structures",
      "weight": 0.20,
      "icon": "shield",
      "colour": "#059669"
    },
    {
      "id": "data-collection",
      "name": "Carbon Data Collection",
      "description": "Scope 1, 2, and 3 data coverage, quality, and verification",
      "weight": 0.25,
      "icon": "database",
      "colour": "#0d9488"
    },
    {
      "id": "reporting",
      "name": "Reporting & Disclosure",
      "description": "Alignment with GHG Protocol, CSRD, ISSB, CDP, and other frameworks",
      "weight": 0.20,
      "icon": "file-text",
      "colour": "#0891b2"
    },
    {
      "id": "targets",
      "name": "Targets & Strategy",
      "description": "Science-based targets, net-zero commitments, and decarbonisation plans",
      "weight": 0.20,
      "icon": "target",
      "colour": "#2563eb"
    },
    {
      "id": "engagement",
      "name": "Stakeholder Engagement",
      "description": "Supplier engagement, internal communication, and external transparency",
      "weight": 0.15,
      "icon": "users",
      "colour": "#7c3aed"
    }
  ]
}
```

---

### 4. Questions

Array of assessment questions. Each question maps to one category.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `questions[].id` | string | Yes | Unique within assessment. e.g., "q1" |
| `questions[].text` | string | Yes | Question text. Max 200 chars. |
| `questions[].category` | string | Yes | Must match a category ID. |
| `questions[].type` | enum | Yes | `single` (radio), `multiple` (checkbox), `scale` (1-5) |
| `questions[].required` | boolean | Yes | Whether question must be answered. |
| `questions[].options` | array | Yes | Answer choices. |
| `questions[].options[].value` | number/string | Yes | Stored answer value. |
| `questions[].options[].label` | string | Yes | Display text. |
| `questions[].options[].score` | number | Yes | Normalised score 0-100. |
| `questions[].options[].description` | string | No | Additional context. |
| `questions[].weight` | number | No | Question weight within category. Default 1.0. |
| `questions[].helpText` | string | No | Contextual help. |

**Example:**
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Does your organisation have a board-level committee or designated director accountable for carbon emissions?",
      "category": "governance",
      "type": "single",
      "required": true,
      "weight": 1.0,
      "helpText": "This refers to formal accountability at the highest governance level, not informal interest.",
      "options": [
        {
          "value": 0,
          "label": "No formal accountability",
          "score": 0,
          "description": "No one is formally responsible for carbon emissions"
        },
        {
          "value": 1,
          "label": "One person has this as part of their role",
          "score": 25,
          "description": "A single individual handles carbon matters alongside other duties"
        },
        {
          "value": 2,
          "label": "Dedicated sustainability director or team",
          "score": 50,
          "description": "A dedicated role or team exists for sustainability"
        },
        {
          "value": 3,
          "label": "Board-level committee with regular reporting",
          "score": 100,
          "description": "The board actively oversees carbon performance"
        }
      ]
    }
  ]
}
```

---

### 5. Scoring Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scoring.method` | enum | Yes | `weighted-average` (only method currently) |
| `scoring.categoryCalculation` | enum | Yes | `average`, `weighted-average` |
| `scoring.overallCalculation` | enum | Yes | `weighted-categories` |
| `scoring.rounding` | enum | Yes | `nearest`, `floor`, `ceiling` |
| `scoring.decimalPlaces` | number | Yes | 0 for integers, 1 for one decimal. |
| `scoring.benchmarks.enabled` | boolean | No | Enable industry benchmarking. |
| `scoring.benchmarks.industries` | array | No | List of supported industries. |

**Example:**
```json
{
  "scoring": {
    "method": "weighted-average",
    "categoryCalculation": "weighted-average",
    "overallCalculation": "weighted-categories",
    "rounding": "nearest",
    "decimalPlaces": 0,
    "benchmarks": {
      "enabled": true,
      "industries": [
        "manufacturing",
        "financial-services",
        "technology",
        "energy",
        "retail",
        "healthcare",
        "transportation",
        "construction"
      ]
    }
  }
}
```

---

### 6. Maturity Levels

Define score ranges and labels. Must cover 0-100 without gaps.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `maturityLevels[].min` | number | Yes | Minimum score (inclusive). |
| `maturityLevels[].max` | number | Yes | Maximum score (inclusive). |
| `maturityLevels[].label` | string | Yes | Display label. |
| `maturityLevels[].description` | string | Yes | One-line description. |
| `maturityLevels[].colour` | string | Yes | Hex colour for UI. |
| `maturityLevels[].badge` | string | No | Badge text for certificate. |

**Example:**
```json
{
  "maturityLevels": [
    {
      "min": 0,
      "max": 49,
      "label": "Foundation",
      "description": "Early stage. Basic awareness but limited formal processes.",
      "colour": "#ef4444",
      "badge": "Foundation Level"
    },
    {
      "min": 50,
      "max": 69,
      "label": "Developing",
      "description": "Some processes in place. Significant gaps remain.",
      "colour": "#f59e0b",
      "badge": "Developing Level"
    },
    {
      "min": 70,
      "max": 84,
      "label": "Practitioner",
      "description": "Mature processes. Most core elements operational.",
      "colour": "#10b981",
      "badge": "Practitioner Level"
    },
    {
      "min": 85,
      "max": 100,
      "label": "Advanced",
      "description": "Leading practice. Comprehensive, verified, and continuously improving.",
      "colour": "#059669",
      "badge": "Advanced Level"
    }
  ]
}
```

---

### 7. Certificate Rules

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `certificateRules.enabled` | boolean | Yes | Whether certificates are issued. |
| `certificateRules.thresholds` | array | Yes | Score thresholds for certificate types. |
| `certificateRules.thresholds[].min` | number | Yes | Minimum score. |
| `certificateRules.thresholds[].max` | number | Yes | Maximum score. |
| `certificateRules.thresholds[].type` | enum | Yes | `completion`, `achievement` |
| `certificateRules.thresholds[].label` | string | Yes | Certificate title. |
| `certificateRules.thresholds[].subtitle` | string | No | Subtitle text. |
| `certificateRules.design` | object | No | Override default design. |

**Example:**
```json
{
  "certificateRules": {
    "enabled": true,
    "thresholds": [
      {
        "min": 0,
        "max": 49,
        "type": "completion",
        "label": "Certificate of Completion",
        "subtitle": "Carbon Accounting Readiness Assessment"
      },
      {
        "min": 50,
        "max": 69,
        "type": "achievement",
        "label": "Foundation Achievement",
        "subtitle": "Carbon Accounting Readiness"
      },
      {
        "min": 70,
        "max": 84,
        "type": "achievement",
        "label": "Practitioner Achievement",
        "subtitle": "Carbon Accounting Readiness"
      },
      {
        "min": 85,
        "max": 100,
        "type": "achievement",
        "label": "Advanced Achievement",
        "subtitle": "Carbon Accounting Readiness"
      }
    ],
    "design": {
      "primaryColour": "#059669",
      "logoUrl": "/assets/images/terrnix-logo.png",
      "signatureUrl": "/assets/images/signature.png"
    }
  }
}
```

---

### 8. Recommendations

Rule-based recommendation engine configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recommendations.rules` | array | Yes | Recommendation rules. |
| `recommendations.rules[].id` | string | Yes | Unique rule ID. |
| `recommendations.rules[].priority` | number | Yes | 1 = highest. |
| `recommendations.rules[].conditions` | array | Yes | Match conditions. |
| `recommendations.rules[].conditions[].field` | string | Yes | Field to evaluate. |
| `recommendations.rules[].conditions[].operator` | enum | Yes | `<`, `>`, `<=`, `>=`, `==`, `!=`, `in`, `not-in` |
| `recommendations.rules[].conditions[].value` | any | Yes | Value to compare. |
| `recommendations.rules[].actions` | object | Yes | Actions when rule matches. |
| `recommendations.pool` | object | Yes | Pool of reusable recommendation items. |

**Example:**
```json
{
  "recommendations": {
    "rules": [
      {
        "id": "scope3-manufacturing",
        "priority": 1,
        "conditions": [
          {
            "field": "categories.engagement.score",
            "operator": "<",
            "value": 50
          },
          {
            "field": "participant.industry",
            "operator": "in",
            "value": ["manufacturing", "automotive", "textiles"]
          }
        ],
        "actions": {
          "recommendations": ["scope3-supplier-engagement", "cbam-readiness"],
          "articles": ["scope-3-supplier-engagement-2026", "cbam-definitive-phase-july-2026"],
          "calculators": ["carbon-footprint-calculator"],
          "consultation": "scope-3-consultation"
        }
      }
    ],
    "pool": {
      "recommendations": [
        {
          "id": "scope3-supplier-engagement",
          "title": "Implement Tier-1 Supplier Data Collection",
          "description": "Establish a systematic process for collecting emissions data from your top suppliers.",
          "impact": "High",
          "difficulty": "Medium",
          "timeframe": "90 days",
          "category": "engagement"
        }
      ],
      "articles": [
        {
          "id": "scope-3-supplier-engagement-2026",
          "title": "Scope 3 Supplier Engagement in 2026",
          "url": "/sustainability-intelligence/2026/06/scope-3-supplier-engagement-2026/",
          "description": "How leading companies are engaging suppliers on emissions."
        }
      ],
      "calculators": [
        {
          "id": "carbon-footprint-calculator",
          "title": "Carbon Footprint Calculator",
          "url": "/carbon-accounting/carbon-footprint-calculator/",
          "description": "Calculate your organisation's carbon footprint."
        }
      ],
      "consultations": [
        {
          "id": "scope-3-consultation",
          "title": "Book a Scope 3 Consultation",
          "description": "Speak with a Terrnix expert about supplier engagement.",
          "url": "#contact",
          "type": "scope3"
        }
      ]
    }
  }
}
```

---

### 9. Report Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `report.sections` | array | Yes | Ordered list of report sections. |
| `report.sections[].id` | string | Yes | Section identifier. |
| `report.sections[].title` | string | Yes | Section title. |
| `report.sections[].enabled` | boolean | Yes | Whether to include. |
| `report.sections[].template` | enum | Yes | `cover`, `executive-summary`, `score-overview`, `category-breakdown`, `strengths`, `gaps`, `recommendations`, `roadmap`, `resources`, `methodology`, `disclaimer` |
| `report.design` | object | No | Override default design. |

**Example:**
```json
{
  "report": {
    "sections": [
      { "id": "cover", "title": "Cover Page", "enabled": true, "template": "cover" },
      { "id": "executive-summary", "title": "Executive Summary", "enabled": true, "template": "executive-summary" },
      { "id": "score-overview", "title": "Overall Score", "enabled": true, "template": "score-overview" },
      { "id": "category-breakdown", "title": "Category Breakdown", "enabled": true, "template": "category-breakdown" },
      { "id": "strengths", "title": "Your Strengths", "enabled": true, "template": "strengths" },
      { "id": "gaps", "title": "Priority Gaps", "enabled": true, "template": "gaps" },
      { "id": "recommendations", "title": "Recommended Actions", "enabled": true, "template": "recommendations" },
      { "id": "roadmap", "title": "30-60-90 Day Roadmap", "enabled": true, "template": "roadmap" },
      { "id": "resources", "title": "Recommended Resources", "enabled": true, "template": "resources" },
      { "id": "methodology", "title": "Methodology", "enabled": true, "template": "methodology" },
      { "id": "disclaimer", "title": "Disclaimer", "enabled": true, "template": "disclaimer" }
    ],
    "design": {
      "primaryColour": "#059669",
      "font": "Inter",
      "logoUrl": "/assets/images/terrnix-logo.png"
    }
  }
}
```

---

### 10. Related Content

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `relatedContent.articles` | array | No | Related intelligence articles. |
| `relatedContent.calculators` | array | No | Related calculators/tools. |
| `relatedContent.services` | array | No | Related services/consultations. |
| `relatedContent.assessments` | array | No | Related assessments. |

**Example:**
```json
{
  "relatedContent": {
    "articles": [
      {
        "id": "ghg-protocol-scope-3-revisions-2026",
        "title": "GHG Protocol Scope 3 Revisions 2026",
        "url": "/sustainability-intelligence/2026/06/ghg-protocol-scope-3-revisions-2026/",
        "description": "What the new GHG Protocol revisions mean for corporate reporting."
      }
    ],
    "calculators": [
      {
        "id": "carbon-footprint-calculator",
        "title": "Carbon Footprint Calculator",
        "url": "/carbon-accounting/carbon-footprint-calculator/",
        "description": "Calculate your organisation's carbon footprint."
      }
    ],
    "services": [
      {
        "id": "carbon-accounting-consultation",
        "title": "Carbon Accounting Consultation",
        "description": "Expert guidance on carbon accounting implementation.",
        "url": "#contact",
        "cta": "Book Consultation"
      }
    ],
    "assessments": [
      {
        "id": "scope-3-readiness",
        "title": "Scope 3 Readiness Assessment",
        "description": "Evaluate your Scope 3 data collection and supplier engagement.",
        "url": "/assessments/scope-3-readiness/"
      }
    ]
  }
}
```

---

### 11. Analytics Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `analytics.events` | object | Yes | Event configuration. |
| `analytics.events.[eventName].enabled` | boolean | Yes | Whether to track. |
| `analytics.events.[eventName].parameters` | array | No | Custom parameters. |
| `analytics.customDimensions` | array | No | GA4 custom dimensions. |

**Example:**
```json
{
  "analytics": {
    "events": {
      "assessment_view": { "enabled": true },
      "assessment_start": { "enabled": true },
      "assessment_progress": { "enabled": true, "parameters": ["question_id", "question_number", "category"] },
      "assessment_complete": { "enabled": true, "parameters": ["score", "maturity_level", "duration_seconds"] },
      "participant_details": { "enabled": true, "parameters": ["has_newsletter_consent"] },
      "certificate_download": { "enabled": true, "parameters": ["score", "certificate_type"] },
      "report_download": { "enabled": true, "parameters": ["score"] },
      "consultation_click": { "enabled": true, "parameters": ["location"] },
      "newsletter_consent": { "enabled": true, "parameters": ["granted"] },
      "recommended_article_click": { "enabled": true, "parameters": ["article_id"] },
      "recommended_calculator_click": { "enabled": true, "parameters": ["calculator_id"] },
      "share_click": { "enabled": true, "parameters": ["method"] }
    },
    "customDimensions": [
      { "name": "assessment_id", "scope": "event" },
      { "name": "maturity_level", "scope": "event" },
      { "name": "industry", "scope": "user" }
    ]
  }
}
```

---

### 12. UI Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.intro` | object | Yes | Introduction screen config. |
| `ui.intro.headline` | string | Yes | Main headline. |
| `ui.intro.subheadline` | string | Yes | Subheadline. |
| `ui.intro.benefits` | array | Yes | List of benefits. |
| `ui.intro.ctaText` | string | Yes | Button text. |
| `ui.question` | object | Yes | Question screen config. |
| `ui.question.showProgress` | boolean | Yes | Show progress bar. |
| `ui.question.showCategory` | boolean | Yes | Show category label. |
| `ui.question.allowPrevious` | boolean | Yes | Allow going back. |
| `ui.question.allowSkip` | boolean | Yes | Allow skipping (if not required). |
| `ui.results` | object | Yes | Results screen config. |
| `ui.results.showRadarChart` | boolean | Yes | Show radar chart. |
| `ui.results.showMaturityBadge` | boolean | Yes | Show maturity badge. |
| `ui.results.showRoadmap` | boolean | Yes | Show 30-60-90 roadmap. |
| `ui.results.showBenchmark` | boolean | No | Show industry benchmark. |
| `ui.theme` | object | No | Theme overrides. |

**Example:**
```json
{
  "ui": {
    "intro": {
      "headline": "Carbon Accounting Readiness Assessment",
      "subheadline": "Evaluate your organisation's carbon accounting maturity in 8 minutes",
      "benefits": [
        "Identify gaps in your carbon accounting practices",
        "Receive a personalised maturity score and benchmark",
        "Get actionable recommendations tailored to your industry",
        "Download a professional assessment report and certificate"
      ],
      "ctaText": "Start Assessment"
    },
    "question": {
      "showProgress": true,
      "showCategory": true,
      "allowPrevious": true,
      "allowSkip": false
    },
    "results": {
      "showRadarChart": true,
      "showMaturityBadge": true,
      "showRoadmap": true,
      "showBenchmark": true
    },
    "theme": {
      "primaryColour": "#059669",
      "secondaryColour": "#0d9488",
      "backgroundColour": "#0f172a",
      "cardColour": "#1e293b"
    }
  }
}
```

---

## Validation Rules

### Required Validations

1. **ID uniqueness:** `id` must be unique across all assessments.
2. **Slug match:** `slug` must match filename (without `.json`).
3. **Category weights:** Sum of all category weights must equal 1.0 (±0.01).
4. **Maturity coverage:** Maturity levels must cover 0-100 without gaps or overlaps.
5. **Question categories:** Every question's `category` must match a defined category ID.
6. **Required questions:** At least 50% of questions should be `required: true`.
7. **Option scores:** All option scores must be between 0 and 100.
8. **Certificate thresholds:** Thresholds must cover 0-100 without gaps.
9. **Rule conditions:** All `field` references in rules must be valid paths.
10. **URL validity:** All URLs in related content must be valid paths.

### Build-Time Validation

```javascript
// Validate all assessment JSON files before deployment
const validator = new AssessmentValidator();
const results = await validator.validateAll('./data/assessments/');

// Results:
// {
//   valid: false,
//   assessments: [
//     { file: 'carbon-accounting-readiness.json', valid: true, errors: [] },
//     { file: 'invalid-assessment.json', valid: false, errors: ['Category weights sum to 0.95'] }
//   ]
// }
```

---

## Example: Complete Assessment JSON

See `data/assessments/carbon-accounting-readiness.json` for the full example.

---

## Future Extensibility

The schema supports future enhancements without breaking changes:

| Feature | Schema Addition | Status |
|---------|----------------|--------|
| Multi-language | `translations` object | Planned |
| Conditional questions | `conditions` on questions | Planned |
| Question banks | `pools` with random selection | Planned |
| Time limits | `timeLimit` per question | Planned |
| AI-generated content | `ai` configuration block | Planned |
| Video questions | `media` object | Planned |
| File upload | `type: "file"` | Planned |
| Team assessments | `team` configuration | Planned |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-15 | Initial schema |
