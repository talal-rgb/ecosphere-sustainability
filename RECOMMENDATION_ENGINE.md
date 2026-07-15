# Terrnix Recommendation Engine Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Algorithm

---

## Philosophy

The Recommendation Engine transforms assessment scores into actionable, contextual guidance. It must feel like receiving advice from a senior sustainability consultant who understands the participant's industry, maturity level, and specific gaps.

**Core Principles:**
1. **Contextual:** Recommendations adapt to industry, company size, and geography
2. **Prioritised:** Actions ranked by impact and feasibility
3. **Specific:** Not generic advice, but targeted next steps
4. **Connected:** Every recommendation links to Terrnix content, tools, or services
5. **Measurable:** Actions have clear outcomes and timeframes

---

## Architecture

```
Assessment Results → Rule Engine → Recommendation Pool → Prioritisation → Output
                          ↓
                   Industry Context
                          ↓
                   Participant Data
```

---

## 1. Rule Engine

### Rule Structure

```javascript
{
  "id": "scope3-manufacturing-critical",
  "priority": 1,
  "enabled": true,
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
    },
    {
      "field": "overall.score",
      "operator": ">=",
      "value": 30
    }
  ],
  "actions": {
    "recommendations": ["scope3-supplier-engagement", "cbam-readiness"],
    "articles": ["scope-3-supplier-engagement-2026", "cbam-definitive-phase-july-2026"],
    "calculators": ["carbon-footprint-calculator"],
    "consultation": "scope-3-consultation",
    "roadmap": {
      "days30": ["assign-supplier-data-owner"],
      "days60": ["implement-tier1-collection"],
      "days90": ["establish-reduction-targets"]
    }
  }
}
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal | `overall.score == 100` |
| `!=` | Not equal | `participant.industry != "technology"` |
| `<` | Less than | `categories.data.score < 50` |
| `>` | Greater than | `overall.score > 70` |
| `<=` | Less than or equal | `categories.governance.score <= 60` |
| `>=` | Greater than or equal | `overall.score >= 50` |
| `in` | In array | `participant.industry in ["manufacturing", "automotive"]` |
| `not-in` | Not in array | `participant.industry not-in ["technology"]` |
| `contains` | String contains | `participant.industry contains "manufacturing"` |

### Field References

| Field Path | Type | Description |
|------------|------|-------------|
| `overall.score` | number | Overall assessment score (0-100) |
| `overall.maturityLevel` | string | Maturity level label |
| `categories.{id}.score` | number | Category score (0-100) |
| `categories.{id}.name` | string | Category name |
| `strengths.{n}.category` | string | Nth strength category ID |
| `gaps.{n}.category` | string | Nth gap category ID |
| `gaps.{n}.risk` | string | Nth gap risk level |
| `participant.industry` | string | Participant industry |
| `participant.company` | string | Participant company name |
| `participant.country` | string | Participant country |
| `participant.jobTitle` | string | Participant job title |
| `completion.completionRate` | number | Percentage complete |

---

## 2. Recommendation Pool

### Pool Structure

```javascript
{
  "recommendations": [
    {
      "id": "scope3-supplier-engagement",
      "title": "Implement Tier-1 Supplier Data Collection",
      "description": "Establish a systematic process for collecting emissions data from your top suppliers. Start with your 20 largest suppliers by spend.",
      "impact": "High",
      "difficulty": "Medium",
      "timeframe": "90 days",
      "category": "engagement",
      "resources": [
        {
          "type": "article",
          "id": "scope-3-supplier-engagement-2026",
          "title": "Scope 3 Supplier Engagement in 2026",
          "url": "/sustainability-intelligence/2026/06/scope-3-supplier-engagement-2026/"
        },
        {
          "type": "calculator",
          "id": "carbon-footprint-calculator",
          "title": "Carbon Footprint Calculator",
          "url": "/carbon-accounting/carbon-footprint-calculator/"
        }
      ],
      "kpis": [
        "80% of tier-1 suppliers providing emissions data",
        "Complete Scope 3 screening within 90 days"
      ],
      "industries": ["manufacturing", "automotive", "textiles", "retail"],
      "maturityLevels": ["foundation", "developing"]
    }
  ],
  "articles": [
    {
      "id": "scope-3-supplier-engagement-2026",
      "title": "Scope 3 Supplier Engagement in 2026",
      "url": "/sustainability-intelligence/2026/06/scope-3-supplier-engagement-2026/",
      "description": "How leading companies are engaging suppliers on emissions.",
      "categories": ["engagement", "scope3"],
      "industries": ["all"]
    }
  ],
  "calculators": [
    {
      "id": "carbon-footprint-calculator",
      "title": "Carbon Footprint Calculator",
      "url": "/carbon-accounting/carbon-footprint-calculator/",
      "description": "Calculate your organisation's carbon footprint.",
      "categories": ["data-collection", "reporting"]
    }
  ],
  "consultations": [
    {
      "id": "scope-3-consultation",
      "title": "Book a Scope 3 Consultation",
      "description": "Speak with a Terrnix expert about supplier engagement and Scope 3 data collection.",
      "url": "#contact",
      "type": "scope3",
      "duration": "30 minutes",
      "cta": "Book Consultation"
    }
  ],
  "roadmapActions": [
    {
      "id": "assign-supplier-data-owner",
      "title": "Assign a supplier data owner",
      "description": "Designate one person responsible for supplier emissions data collection.",
      "timeframe": "30 days",
      "difficulty": "Low",
      "impact": "Medium"
    }
  ]
}
```

---

## 3. Prioritisation Algorithm

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Gap Severity | 0.30 | Lower category score = higher priority |
| Industry Relevance | 0.20 | Match with participant industry |
| Maturity Fit | 0.15 | Appropriate for participant's maturity level |
| Impact | 0.15 | High impact actions score higher |
| Feasibility | 0.10 | Lower difficulty = higher priority |
| Timeframe | 0.10 | Shorter timeframe = higher priority |

### Priority Score Calculation

```javascript
function calculatePriorityScore(recommendation, results, participant) {
  let score = 0;
  
  // 1. Gap Severity (30%)
  const categoryScore = results.categories[recommendation.category]?.score || 0;
  score += (100 - categoryScore) * 0.30;
  
  // 2. Industry Relevance (20%)
  if (recommendation.industries?.includes(participant.industry) || 
      recommendation.industries?.includes('all')) {
    score += 100 * 0.20;
  }
  
  // 3. Maturity Fit (15%)
  if (recommendation.maturityLevels?.includes(results.overall.maturityLevel.level) ||
      recommendation.maturityLevels?.includes('all')) {
    score += 100 * 0.15;
  }
  
  // 4. Impact (15%)
  const impactScores = { 'Critical': 100, 'High': 80, 'Medium': 50, 'Low': 20 };
  score += (impactScores[recommendation.impact] || 50) * 0.15;
  
  // 5. Feasibility (10%)
  const difficultyScores = { 'Low': 100, 'Medium': 60, 'High': 30 };
  score += (difficultyScores[recommendation.difficulty] || 50) * 0.10;
  
  // 6. Timeframe (10%)
  const timeframeScores = { '30 days': 100, '60 days': 70, '90 days': 50 };
  score += (timeframeScores[recommendation.timeframe] || 50) * 0.10;
  
  return Math.round(score);
}
```

### Ranking

```javascript
function rankRecommendations(recommendations, results, participant) {
  return recommendations
    .map(rec => ({
      ...rec,
      priorityScore: calculatePriorityScore(rec, results, participant)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
```

---

## 4. Roadmap Generation

### 30-60-90 Day Framework

```javascript
function generateRoadmap(recommendations, results) {
  const roadmap = {
    days30: [],
    days60: [],
    days90: []
  };
  
  // Assign recommendations to timeframes
  for (const rec of recommendations.slice(0, 6)) {
    if (rec.difficulty === 'Low' && rec.timeframe === '30 days') {
      roadmap.days30.push(rec);
    } else if (rec.difficulty === 'Medium' || rec.timeframe === '60 days') {
      roadmap.days60.push(rec);
    } else {
      roadmap.days90.push(rec);
    }
  }
  
  // Ensure balanced distribution
  while (roadmap.days30.length < 2 && roadmap.days60.length > 0) {
    roadmap.days30.push(roadmap.days60.shift());
  }
  
  while (roadmap.days60.length < 2 && roadmap.days90.length > 0) {
    roadmap.days60.push(roadmap.days90.shift());
  }
  
  return roadmap;
}
```

### Roadmap Output

```javascript
{
  "days30": {
    "title": "Foundation",
    "description": "Quick wins to establish momentum",
    "actions": [
      {
        "id": "assign-supplier-data-owner",
        "title": "Assign a supplier data owner",
        "description": "Designate one person responsible for supplier emissions data collection.",
        "impact": "Medium",
        "difficulty": "Low"
      }
    ]
  },
  "days60": {
    "title": "Development",
    "description": "Build core processes and capabilities",
    "actions": [/* ... */]
  },
  "days90": {
    "title": "Maturity",
    "description": "Strategic initiatives for long-term success",
    "actions": [/* ... */]
  }
}
```

---

## 5. Executive Summary Generation

### Auto-Generated Summary

```javascript
function generateExecutiveSummary(results, participant) {
  const parts = [];
  
  // Opening
  parts.push(`Your organisation scored ${results.overall.score}/100, placing you at the ${results.overall.maturityLevel.label} level.`);
  
  // Strengths
  if (results.strengths.length > 0) {
    const strengthNames = results.strengths.map(s => s.name).join(' and ');
    parts.push(`Your strongest areas are ${strengthNames}.`);
  }
  
  // Gaps
  if (results.gaps.length > 0) {
    const gapNames = results.gaps.map(g => g.name).join(' and ');
    parts.push(`Priority gaps to address include ${gapNames}.`);
  }
  
  // Benchmark
  if (results.benchmark) {
    parts.push(`Your score is ${results.benchmark.comparison === 'above-average' ? 'above' : 'below'} the ${results.benchmark.industry} industry average of ${results.benchmark.average}%.`);
  }
  
  // Closing
  parts.push(`The following action plan is tailored to your specific context and designed to deliver measurable improvements within 90 days.`);
  
  return parts.join(' ');
}
```

---

## 6. Recommendation Engine Class

```javascript
class RecommendationEngine {
  constructor(config) {
    this.rules = config.recommendations.rules;
    this.pool = config.recommendations.pool;
  }
  
  generate(results, participant = {}) {
    // 1. Evaluate all rules
    const matchedRules = this.evaluateRules(results, participant);
    
    // 2. Collect recommendations from matched rules
    const recommendations = this.collectRecommendations(matchedRules);
    
    // 3. Add default recommendations if few matches
    if (recommendations.length < 5) {
      recommendations.push(...this.getDefaultRecommendations(results));
    }
    
    // 4. Remove duplicates
    const uniqueRecommendations = this.deduplicate(recommendations);
    
    // 5. Prioritise
    const prioritised = this.prioritise(uniqueRecommendations, results, participant);
    
    // 6. Generate roadmap
    const roadmap = this.generateRoadmap(prioritised);
    
    // 7. Collect related content
    const relatedContent = this.collectRelatedContent(prioritised);
    
    // 8. Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(results, participant);
    
    return {
      executiveSummary,
      priority: prioritised.slice(0, 5),
      quickWins: prioritised.filter(r => r.difficulty === 'Low').slice(0, 3),
      roadmap,
      ...relatedContent
    };
  }
  
  evaluateRules(results, participant) {
    return this.rules.filter(rule => {
      if (!rule.enabled) return false;
      return rule.conditions.every(condition => this.evaluateCondition(condition, results, participant));
    });
  }
  
  evaluateCondition(condition, results, participant) {
    const value = this.getFieldValue(condition.field, results, participant);
    
    switch (condition.operator) {
      case '==': return value == condition.value;
      case '!=': return value != condition.value;
      case '<': return value < condition.value;
      case '>': return value > condition.value;
      case '<=': return value <= condition.value;
      case '>=': return value >= condition.value;
      case 'in': return condition.value.includes(value);
      case 'not-in': return !condition.value.includes(value);
      case 'contains': return String(value).includes(condition.value);
      default: return false;
    }
  }
  
  getFieldValue(field, results, participant) {
    // Parse field path: "categories.engagement.score"
    const parts = field.split('.');
    let value = { ...results, participant };
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      
      // Handle array indices: "strengths.0.category"
      if (/^\d+$/.test(part)) {
        value = value[parseInt(part)];
      } else {
        value = value[part];
      }
    }
    
    return value;
  }
  
  collectRecommendations(rules) {
    const recommendations = [];
    
    for (const rule of rules) {
      for (const recId of rule.actions.recommendations || []) {
        const rec = this.pool.recommendations.find(r => r.id === recId);
        if (rec) recommendations.push(rec);
      }
    }
    
    return recommendations;
  }
  
  getDefaultRecommendations(results) {
    // Return generic recommendations based on lowest-scoring categories
    const gaps = Object.values(results.categories)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
    
    return gaps.map(gap => ({
      id: `default-${gap.id}`,
      title: `Improve ${gap.name}`,
      description: `Focus on building capabilities in ${gap.name} to strengthen your overall sustainability programme.`,
      impact: 'High',
      difficulty: 'Medium',
      timeframe: '90 days',
      category: gap.id
    }));
  }
  
  deduplicate(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.id)) return false;
      seen.add(rec.id);
      return true;
    });
  }
  
  prioritise(recommendations, results, participant) {
    return recommendations
      .map(rec => ({
        ...rec,
        priorityScore: this.calculatePriorityScore(rec, results, participant)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
  
  calculatePriorityScore(recommendation, results, participant) {
    let score = 0;
    
    // Gap severity
    const categoryScore = results.categories[recommendation.category]?.score || 0;
    score += (100 - categoryScore) * 0.30;
    
    // Industry relevance
    if (recommendation.industries?.includes(participant.industry) || 
        recommendation.industries?.includes('all')) {
      score += 100 * 0.20;
    }
    
    // Maturity fit
    if (recommendation.maturityLevels?.includes(results.overall.maturityLevel.level) ||
        recommendation.maturityLevels?.includes('all')) {
      score += 100 * 0.15;
    }
    
    // Impact
    const impactScores = { 'Critical': 100, 'High': 80, 'Medium': 50, 'Low': 20 };
    score += (impactScores[recommendation.impact] || 50) * 0.15;
    
    // Feasibility
    const difficultyScores = { 'Low': 100, 'Medium': 60, 'High': 30 };
    score += (difficultyScores[recommendation.difficulty] || 50) * 0.10;
    
    // Timeframe
    const timeframeScores = { '30 days': 100, '60 days': 70, '90 days': 50 };
    score += (timeframeScores[recommendation.timeframe] || 50) * 0.10;
    
    return Math.round(score);
  }
  
  generateRoadmap(recommendations) {
    const roadmap = { days30: [], days60: [], days90: [] };
    
    for (const rec of recommendations.slice(0, 6)) {
      if (rec.difficulty === 'Low' && rec.timeframe === '30 days') {
        roadmap.days30.push(rec);
      } else if (rec.difficulty === 'Medium' || rec.timeframe === '60 days') {
        roadmap.days60.push(rec);
      } else {
        roadmap.days90.push(rec);
      }
    }
    
    // Balance distribution
    while (roadmap.days30.length < 2 && roadmap.days60.length > 0) {
      roadmap.days30.push(roadmap.days60.shift());
    }
    while (roadmap.days60.length < 2 && roadmap.days90.length > 0) {
      roadmap.days60.push(roadmap.days90.shift());
    }
    
    return {
      days30: { title: 'Foundation', description: 'Quick wins to establish momentum', actions: roadmap.days30 },
      days60: { title: 'Development', description: 'Build core processes and capabilities', actions: roadmap.days60 },
      days90: { title: 'Maturity', description: 'Strategic initiatives for long-term success', actions: roadmap.days90 }
    };
  }
  
  collectRelatedContent(recommendations) {
    const articleIds = new Set();
    const calculatorIds = new Set();
    const consultationIds = new Set();
    
    for (const rec of recommendations) {
      rec.resources?.forEach(r => {
        if (r.type === 'article') articleIds.add(r.id);
        if (r.type === 'calculator') calculatorIds.add(r.id);
      });
    }
    
    return {
      articles: this.pool.articles.filter(a => articleIds.has(a.id)),
      calculators: this.pool.calculators.filter(c => calculatorIds.has(c.id)),
      consultations: this.pool.consultations.filter(c => consultationIds.has(c.id))
    };
  }
  
  generateExecutiveSummary(results, participant) {
    const parts = [];
    parts.push(`Your organisation scored ${results.overall.score}/100, placing you at the ${results.overall.maturityLevel.label} level.`);
    
    if (results.strengths.length > 0) {
      const strengthNames = results.strengths.map(s => s.name).join(' and ');
      parts.push(`Your strongest areas are ${strengthNames}.`);
    }
    
    if (results.gaps.length > 0) {
      const gapNames = results.gaps.map(g => g.name).join(' and ');
      parts.push(`Priority gaps to address include ${gapNames}.`);
    }
    
    parts.push(`The following action plan is tailored to your specific context and designed to deliver measurable improvements within 90 days.`);
    
    return parts.join(' ');
  }
}
```

---

## 7. Example Rules

### Rule: Scope 3 for Manufacturing

```json
{
  "id": "scope3-manufacturing",
  "priority": 1,
  "conditions": [
    { "field": "categories.engagement.score", "operator": "<", "value": 50 },
    { "field": "participant.industry", "operator": "in", "value": ["manufacturing", "automotive", "textiles"] }
  ],
  "actions": {
    "recommendations": ["scope3-supplier-engagement", "cbam-readiness"],
    "articles": ["scope-3-supplier-engagement-2026", "cbam-definitive-phase-july-2026"],
    "calculators": ["carbon-footprint-calculator"],
    "consultation": "scope-3-consultation"
  }
}
```

### Rule: Governance for Financial Services

```json
{
  "id": "governance-financial",
  "priority": 2,
  "conditions": [
    { "field": "categories.governance.score", "operator": "<", "value": 60 },
    { "field": "participant.industry", "operator": "in", "value": ["financial-services", "banking", "insurance"] }
  ],
  "actions": {
    "recommendations": ["esg-board-oversight", "tcfd-alignment"],
    "articles": ["esg-board-oversight-2026", "tcfd-implementation-guide"],
    "consultation": "esg-governance-consultation"
  }
}
```

### Rule: Advanced Maturity

```json
{
  "id": "advanced-optimisation",
  "priority": 5,
  "conditions": [
    { "field": "overall.score", "operator": ">=", "value": 85 }
  ],
  "actions": {
    "recommendations": ["science-based-targets", "net-zero-commitment", "supply-chain-decarbonisation"],
    "articles": ["sbti-rules-update-2026", "net-zero-implementation"],
    "consultation": "advanced-strategy-consultation"
  }
}
```

---

## 8. Testing

### Unit Tests

```javascript
describe('RecommendationEngine', () => {
  const config = {
    recommendations: {
      rules: [
        {
          id: 'test-rule',
          priority: 1,
          enabled: true,
          conditions: [
            { field: 'categories.cat1.score', operator: '<', value: 50 }
          ],
          actions: {
            recommendations: ['rec1']
          }
        }
      ],
      pool: {
        recommendations: [
          {
            id: 'rec1',
            title: 'Test Recommendation',
            category: 'cat1',
            impact: 'High',
            difficulty: 'Medium',
            timeframe: '90 days'
          }
        ]
      }
    }
  };
  
  test('matches rule when condition is true', () => {
    const engine = new RecommendationEngine(config);
    const results = {
      overall: { score: 40, maturityLevel: { level: 'foundation' } },
      categories: { cat1: { score: 40 } }
    };
    const recs = engine.generate(results);
    expect(recs.priority).toHaveLength(1);
    expect(recs.priority[0].id).toBe('rec1');
  });
  
  test('does not match rule when condition is false', () => {
    const engine = new RecommendationEngine(config);
    const results = {
      overall: { score: 80, maturityLevel: { level: 'advanced' } },
      categories: { cat1: { score: 80 } }
    };
    const recs = engine.generate(results);
    expect(recs.priority).toHaveLength(0);
  });
});
```

---

## 9. Performance

| Operation | Target | Maximum |
|-----------|--------|---------|
| Rule evaluation | < 1ms per rule | 5ms |
| Recommendation collection | < 5ms | 20ms |
| Prioritisation | < 5ms | 20ms |
| Roadmap generation | < 2ms | 10ms |
| Total (50 rules) | < 50ms | 200ms |

---

## 10. Future Enhancements

| Feature | Description | Status |
|---------|-------------|--------|
| AI Recommendations | Use LLM to generate personalised recommendations | Planned |
| Predictive Recommendations | Predict which actions lead to score improvement | Planned |
| Collaborative Filtering | Recommend based on similar organisations | Planned |
| Dynamic Rules | Rules that adapt based on assessment performance | Planned |
| A/B Testing | Test different recommendation strategies | Planned |
