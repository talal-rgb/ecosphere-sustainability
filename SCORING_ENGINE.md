# Terrnix Scoring Engine Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Algorithm

---

## Philosophy

The Scoring Engine transforms raw assessment answers into actionable intelligence. It must be:

- **Transparent:** Users understand how their score is calculated
- **Fair:** All assessments use consistent, validated methodology
- **Insightful:** Scores reveal meaningful patterns, not just numbers
- **Benchmarked:** Contextualised against peers and standards
- **Actionable:** Scores directly map to recommendations

---

## Scoring Architecture

```
Answers → Question Scores → Category Scores → Overall Score → Maturity Level
                ↓                  ↓                ↓
          Normalisation      Weighting       Percentile
                ↓                  ↓                ↓
          Gap Analysis      Strengths      Benchmarking
```

---

## 1. Question Scoring

### Normalisation

Every answer is normalised to a 0-100 scale.

```javascript
function normaliseQuestionScore(selectedOption, question) {
  // Option scores are already 0-100 in the JSON config
  // This validates and returns the score
  const score = selectedOption.score;
  
  // Validate range
  if (score < 0 || score > 100) {
    console.warn(`Invalid score ${score} for question ${question.id}`);
    return Math.max(0, Math.min(100, score));
  }
  
  return score;
}
```

### Weighted Question Scoring

Questions within a category can have different weights.

```javascript
function calculateWeightedQuestionScore(answers, questions) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === undefined && question.required) {
      // Required question unanswered: treat as 0
      weightedSum += 0 * question.weight;
      totalWeight += question.weight;
    } else if (answer !== undefined) {
      const option = question.options.find(o => o.value === answer);
      if (option) {
        weightedSum += option.score * question.weight;
        totalWeight += question.weight;
      }
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

---

## 2. Category Scoring

### Weighted Average

Category scores are weighted averages of question scores.

```javascript
function calculateCategoryScore(category, questions, answers) {
  const categoryQuestions = questions.filter(q => q.category === category.id);
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const question of categoryQuestions) {
    const answer = answers[question.id];
    const weight = question.weight || 1.0;
    
    if (answer !== undefined) {
      const option = question.options.find(o => o.value === answer);
      if (option) {
        weightedSum += option.score * weight;
        totalWeight += weight;
      }
    }
  }
  
  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    id: category.id,
    name: category.name,
    score: Math.round(score),
    weight: category.weight,
    weightedScore: score * category.weight,
    questionCount: categoryQuestions.length,
    answeredCount: categoryQuestions.filter(q => answers[q.id] !== undefined).length
  };
}
```

### Category Score Breakdown

```javascript
{
  "governance": {
    "id": "governance",
    "name": "Governance & Accountability",
    "score": 80,              // Raw category score (0-100)
    "weight": 0.20,           // Category weight
    "weightedScore": 16.0,    // score * weight (contribution to overall)
    "questionCount": 5,       // Total questions in category
    "answeredCount": 5,       // Questions answered
    "completionRate": 100     // answeredCount / questionCount * 100
  }
}
```

---

## 3. Overall Score Calculation

### Weighted Category Aggregation

```javascript
function calculateOverallScore(categoryScores, categories) {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const category of categories) {
    const categoryScore = categoryScores[category.id];
    if (categoryScore) {
      totalWeightedScore += categoryScore.score * category.weight;
      totalWeight += category.weight;
    }
  }
  
  // Normalise by total weight (should be 1.0, but handle edge cases)
  const overallScore = totalWeight > 0 
    ? totalWeightedScore / totalWeight 
    : 0;
  
  return Math.round(overallScore);
}
```

### Score Validation

```javascript
function validateScore(score) {
  // Ensure score is within valid range
  const validScore = Math.max(0, Math.min(100, score));
  
  // Ensure score is a number
  if (isNaN(validScore)) {
    console.error('Score calculation resulted in NaN');
    return 0;
  }
  
  return validScore;
}
```

---

## 4. Maturity Level Determination

### Level Lookup

```javascript
function determineMaturityLevel(score, maturityLevels) {
  const level = maturityLevels.find(
    l => score >= l.min && score <= l.max
  );
  
  if (!level) {
    console.warn(`No maturity level found for score ${score}`);
    return maturityLevels[maturityLevels.length - 1];
  }
  
  return level;
}
```

### Maturity Level Output

```javascript
{
  "level": "practitioner",
  "label": "Practitioner",
  "description": "Mature processes. Most core elements operational.",
  "colour": "#10b981",
  "badge": "Practitioner Level",
  "min": 70,
  "max": 84
}
```

---

## 5. Strengths and Gaps Analysis

### Strengths Identification

```javascript
function identifyStrengths(categoryScores, count = 2) {
  const sorted = Object.values(categoryScores)
    .sort((a, b) => b.score - a.score);
  
  return sorted.slice(0, count).map(cs => ({
    category: cs.id,
    name: cs.name,
    score: cs.score,
    description: generateStrengthDescription(cs)
  }));
}

function generateStrengthDescription(categoryScore) {
  const templates = {
    high: `${categoryScore.name} is a significant strength. Your score of ${categoryScore.score}% indicates mature processes that can serve as a foundation for broader sustainability initiatives.`,
    medium: `${categoryScore.name} shows solid progress. At ${categoryScore.score}%, you have established processes with room for optimisation.`
  };
  
  return categoryScore.score >= 75 ? templates.high : templates.medium;
}
```

### Gaps Identification

```javascript
function identifyGaps(categoryScores, count = 2) {
  const sorted = Object.values(categoryScores)
    .sort((a, b) => a.score - b.score);
  
  return sorted.slice(0, count).map(cs => ({
    category: cs.id,
    name: cs.name,
    score: cs.score,
    risk: generateGapRisk(cs),
    description: generateGapDescription(cs)
  }));
}

function generateGapRisk(categoryScore) {
  if (categoryScore.score < 40) return 'Critical';
  if (categoryScore.score < 60) return 'High';
  if (categoryScore.score < 75) return 'Medium';
  return 'Low';
}

function generateGapDescription(categoryScore) {
  return `${categoryScore.name} scored ${categoryScore.score}%, indicating significant room for improvement. ` +
    `Without addressing this gap, your organisation may face compliance risks and miss opportunities ` +
    `for operational efficiency and stakeholder confidence.`;
}
```

---

## 6. Benchmarking

### Industry Benchmark

```javascript
function calculateBenchmark(score, industry, benchmarks) {
  if (!benchmarks.enabled || !industry) {
    return null;
  }
  
  const industryData = benchmarks.data?.[industry];
  if (!industryData) {
    return null;
  }
  
  return {
    industry: industry,
    average: industryData.average,
    median: industryData.median,
    topQuartile: industryData.topQuartile,
    percentile: calculatePercentile(score, industryData.distribution),
    comparison: score >= industryData.average ? 'above-average' : 'below-average'
  };
}

function calculatePercentile(score, distribution) {
  // Simple percentile calculation
  const below = distribution.filter(s => s < score).length;
  return Math.round((below / distribution.length) * 100);
}
```

### Benchmark Data Structure

```json
{
  "benchmarks": {
    "enabled": true,
    "data": {
      "manufacturing": {
        "average": 58,
        "median": 60,
        "topQuartile": 78,
        "distribution": [45, 52, 58, 60, 65, 70, 78, 82, 88, 92]
      },
      "financial-services": {
        "average": 62,
        "median": 64,
        "topQuartile": 80,
        "distribution": [48, 55, 62, 64, 68, 72, 80, 84, 90, 94]
      }
    }
  }
}
```

---

## 7. Priority Scoring

### Gap Priority Score

```javascript
function calculateGapPriority(gap, categoryWeight, industry) {
  // Priority = (100 - gap.score) * categoryWeight * industryMultiplier
  
  const industryMultipliers = {
    'manufacturing': { 'data-collection': 1.3, 'engagement': 1.2 },
    'financial-services': { 'reporting': 1.3, 'governance': 1.2 }
  };
  
  const basePriority = (100 - gap.score) * categoryWeight;
  const multiplier = industryMultipliers[industry]?.[gap.category] || 1.0;
  
  return Math.round(basePriority * multiplier);
}
```

---

## 8. Complete Scoring Output

```javascript
{
  "overall": {
    "score": 72,
    "maxScore": 100,
    "percentage": 72,
    "maturityLevel": {
      "level": "practitioner",
      "label": "Practitioner",
      "description": "Mature processes. Most core elements operational.",
      "colour": "#10b981",
      "badge": "Practitioner Level"
    }
  },
  "categories": {
    "governance": {
      "id": "governance",
      "name": "Governance & Accountability",
      "score": 80,
      "weight": 0.20,
      "weightedScore": 16.0,
      "questionCount": 5,
      "answeredCount": 5,
      "completionRate": 100
    },
    "data-collection": {
      "id": "data-collection",
      "name": "Carbon Data Collection",
      "score": 65,
      "weight": 0.25,
      "weightedScore": 16.25,
      "questionCount": 6,
      "answeredCount": 6,
      "completionRate": 100
    },
    "reporting": {
      "id": "reporting",
      "name": "Reporting & Disclosure",
      "score": 70,
      "weight": 0.20,
      "weightedScore": 14.0,
      "questionCount": 5,
      "answeredCount": 5,
      "completionRate": 100
    },
    "targets": {
      "id": "targets",
      "name": "Targets & Strategy",
      "score": 75,
      "weight": 0.20,
      "weightedScore": 15.0,
      "questionCount": 5,
      "answeredCount": 5,
      "completionRate": 100
    },
    "engagement": {
      "id": "engagement",
      "name": "Stakeholder Engagement",
      "score": 60,
      "weight": 0.15,
      "weightedScore": 9.0,
      "questionCount": 4,
      "answeredCount": 4,
      "completionRate": 100
    }
  },
  "strengths": [
    {
      "category": "governance",
      "name": "Governance & Accountability",
      "score": 80,
      "description": "Governance & Accountability is a significant strength. Your score of 80% indicates mature processes that can serve as a foundation for broader sustainability initiatives."
    },
    {
      "category": "targets",
      "name": "Targets & Strategy",
      "score": 75,
      "description": "Targets & Strategy shows solid progress. At 75%, you have established processes with room for optimisation."
    }
  ],
  "gaps": [
    {
      "category": "engagement",
      "name": "Stakeholder Engagement",
      "score": 60,
      "risk": "High",
      "description": "Stakeholder Engagement scored 60%, indicating significant room for improvement. Without addressing this gap, your organisation may face compliance risks and miss opportunities for operational efficiency and stakeholder confidence.",
      "priority": 42
    },
    {
      "category": "data-collection",
      "name": "Carbon Data Collection",
      "score": 65,
      "risk": "Medium",
      "description": "Carbon Data Collection scored 65%, indicating significant room for improvement. Without addressing this gap, your organisation may face compliance risks and miss opportunities for operational efficiency and stakeholder confidence.",
      "priority": 35
    }
  ],
  "benchmark": {
    "industry": "manufacturing",
    "average": 58,
    "median": 60,
    "topQuartile": 78,
    "percentile": 68,
    "comparison": "above-average"
  },
  "completion": {
    "totalQuestions": 25,
    "answeredQuestions": 25,
    "completionRate": 100,
    "requiredQuestions": 25,
    "requiredAnswered": 25
  },
  "meta": {
    "scoringMethod": "weighted-average",
    "categoryCalculation": "weighted-average",
    "overallCalculation": "weighted-categories",
    "version": "1.0.0"
  }
}
```

---

## 9. Scoring Engine Class

```javascript
class ScoringEngine {
  constructor(config) {
    this.config = config;
    this.categories = config.categories;
    this.questions = config.questions;
    this.maturityLevels = config.maturityLevels;
    this.scoringConfig = config.scoring;
  }
  
  calculate(answers) {
    // 1. Calculate category scores
    const categoryScores = this.calculateCategoryScores(answers);
    
    // 2. Calculate overall score
    const overallScore = this.calculateOverallScore(categoryScores);
    
    // 3. Determine maturity level
    const maturityLevel = this.determineMaturityLevel(overallScore);
    
    // 4. Identify strengths and gaps
    const strengths = this.identifyStrengths(categoryScores);
    const gaps = this.identifyGaps(categoryScores);
    
    // 5. Calculate benchmark (if enabled)
    const benchmark = this.calculateBenchmark(overallScore);
    
    // 6. Calculate completion stats
    const completion = this.calculateCompletion(answers);
    
    return {
      overall: {
        score: overallScore,
        maxScore: 100,
        percentage: overallScore,
        maturityLevel
      },
      categories: categoryScores,
      strengths,
      gaps,
      benchmark,
      completion,
      meta: {
        scoringMethod: this.scoringConfig.method,
        categoryCalculation: this.scoringConfig.categoryCalculation,
        overallCalculation: this.scoringConfig.overallCalculation,
        version: this.config.version
      }
    };
  }
  
  calculateCategoryScores(answers) {
    const scores = {};
    
    for (const category of this.categories) {
      scores[category.id] = this.calculateCategoryScore(category, answers);
    }
    
    return scores;
  }
  
  calculateCategoryScore(category, answers) {
    const categoryQuestions = this.questions.filter(q => q.category === category.id);
    
    let weightedSum = 0;
    let totalWeight = 0;
    let answeredCount = 0;
    
    for (const question of categoryQuestions) {
      const answer = answers[question.id];
      const weight = question.weight || 1.0;
      
      if (answer !== undefined) {
        const option = question.options.find(o => o.value === answer);
        if (option) {
          weightedSum += option.score * weight;
          totalWeight += weight;
          answeredCount++;
        }
      }
    }
    
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    return {
      id: category.id,
      name: category.name,
      score: Math.round(score),
      weight: category.weight,
      weightedScore: score * category.weight,
      questionCount: categoryQuestions.length,
      answeredCount,
      completionRate: categoryQuestions.length > 0 
        ? Math.round((answeredCount / categoryQuestions.length) * 100) 
        : 0
    };
  }
  
  calculateOverallScore(categoryScores) {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const category of this.categories) {
      const categoryScore = categoryScores[category.id];
      if (categoryScore) {
        totalWeightedScore += categoryScore.score * category.weight;
        totalWeight += category.weight;
      }
    }
    
    const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    return Math.round(score);
  }
  
  determineMaturityLevel(score) {
    const level = this.maturityLevels.find(
      l => score >= l.min && score <= l.max
    );
    
    return level || this.maturityLevels[this.maturityLevels.length - 1];
  }
  
  identifyStrengths(categoryScores, count = 2) {
    const sorted = Object.values(categoryScores)
      .sort((a, b) => b.score - a.score);
    
    return sorted.slice(0, count).map(cs => ({
      category: cs.id,
      name: cs.name,
      score: cs.score,
      description: this.generateStrengthDescription(cs)
    }));
  }
  
  identifyGaps(categoryScores, count = 2) {
    const sorted = Object.values(categoryScores)
      .sort((a, b) => a.score - b.score);
    
    return sorted.slice(0, count).map(cs => ({
      category: cs.id,
      name: cs.name,
      score: cs.score,
      risk: this.generateGapRisk(cs),
      description: this.generateGapDescription(cs),
      priority: this.calculateGapPriority(cs)
    }));
  }
  
  generateStrengthDescription(categoryScore) {
    if (categoryScore.score >= 75) {
      return `${categoryScore.name} is a significant strength. Your score of ${categoryScore.score}% indicates mature processes that can serve as a foundation for broader sustainability initiatives.`;
    }
    return `${categoryScore.name} shows solid progress. At ${categoryScore.score}%, you have established processes with room for optimisation.`;
  }
  
  generateGapRisk(categoryScore) {
    if (categoryScore.score < 40) return 'Critical';
    if (categoryScore.score < 60) return 'High';
    if (categoryScore.score < 75) return 'Medium';
    return 'Low';
  }
  
  generateGapDescription(categoryScore) {
    return `${categoryScore.name} scored ${categoryScore.score}%, indicating significant room for improvement. Without addressing this gap, your organisation may face compliance risks and miss opportunities for operational efficiency and stakeholder confidence.`;
  }
  
  calculateGapPriority(categoryScore) {
    return Math.round((100 - categoryScore.score) * categoryScore.weight * 100);
  }
  
  calculateBenchmark(score) {
    if (!this.scoringConfig.benchmarks?.enabled) {
      return null;
    }
    
    // Placeholder: would lookup from benchmark data
    return null;
  }
  
  calculateCompletion(answers) {
    const totalQuestions = this.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const requiredQuestions = this.questions.filter(q => q.required).length;
    const requiredAnswered = this.questions
      .filter(q => q.required)
      .filter(q => answers[q.id] !== undefined)
      .length;
    
    return {
      totalQuestions,
      answeredQuestions,
      completionRate: Math.round((answeredQuestions / totalQuestions) * 100),
      requiredQuestions,
      requiredAnswered
    };
  }
}
```

---

## 10. Testing

### Unit Tests

```javascript
describe('ScoringEngine', () => {
  const config = {
    categories: [
      { id: 'cat1', name: 'Category 1', weight: 0.5 },
      { id: 'cat2', name: 'Category 2', weight: 0.5 }
    ],
    questions: [
      { id: 'q1', category: 'cat1', options: [{ value: 1, score: 100 }], weight: 1 },
      { id: 'q2', category: 'cat2', options: [{ value: 1, score: 0 }], weight: 1 }
    ],
    maturityLevels: [
      { min: 0, max: 49, label: 'Foundation', colour: '#ef4444' },
      { min: 50, max: 100, label: 'Advanced', colour: '#059669' }
    ],
    scoring: { method: 'weighted-average' }
  };
  
  test('calculates perfect score', () => {
    const engine = new ScoringEngine(config);
    const results = engine.calculate({ q1: 1, q2: 1 });
    expect(results.overall.score).toBe(50);
  });
  
  test('identifies strengths correctly', () => {
    const engine = new ScoringEngine(config);
    const results = engine.calculate({ q1: 1, q2: 1 });
    expect(results.strengths[0].category).toBe('cat1');
  });
  
  test('identifies gaps correctly', () => {
    const engine = new ScoringEngine(config);
    const results = engine.calculate({ q1: 1, q2: 1 });
    expect(results.gaps[0].category).toBe('cat2');
  });
});
```

---

## 11. Performance

| Operation | Target | Maximum |
|-----------|--------|---------|
| Category score calculation | < 1ms | 5ms |
| Overall score calculation | < 1ms | 5ms |
| Maturity level lookup | < 1ms | 5ms |
| Strengths/gaps identification | < 1ms | 5ms |
| Total scoring (25 questions) | < 10ms | 50ms |

---

## 12. Future Enhancements

| Feature | Description | Status |
|---------|-------------|--------|
| AI Scoring | Use ML to weight questions based on predictive validity | Planned |
| Adaptive Scoring | Adjust question difficulty based on previous answers | Planned |
| Longitudinal Scoring | Track score changes over time | Planned |
| Peer Benchmarking | Compare against anonymised peer group | Planned |
| Predictive Scoring | Predict future maturity based on current trajectory | Planned |
