/**
 * Terrnix Assessment Engine - Scoring
 * Calculates scores, maturity levels, strengths, and gaps
 */

class AssessmentScoring {
  constructor(config) {
    this.config = config;
    this.categories = config.categories;
    this.questions = config.questions;
    this.maturityLevels = config.maturityLevels;
    this.scoringConfig = config.scoring || {};
  }

  /**
   * Calculate full assessment results
   */
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

    // 5. Calculate completion stats
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
      completion,
      meta: {
        scoringMethod: this.scoringConfig.method || 'weighted-average',
        version: this.config.version
      }
    };
  }

  /**
   * Calculate scores for each category
   */
  calculateCategoryScores(answers) {
    const scores = {};

    for (const category of this.categories) {
      scores[category.id] = this.calculateCategoryScore(category, answers);
    }

    return scores;
  }

  /**
   * Calculate score for a single category
   */
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

  /**
   * Calculate overall score from category scores
   */
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

  /**
   * Determine maturity level from score
   */
  determineMaturityLevel(score) {
    const level = this.maturityLevels.find(
      l => score >= l.min && score <= l.max
    );

    return level || this.maturityLevels[this.maturityLevels.length - 1];
  }

  /**
   * Identify top strengths
   */
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

  /**
   * Identify priority gaps
   */
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

  /**
   * Generate strength description with category-specific insight
   */
  generateStrengthDescription(categoryScore) {
    const specificInsights = {
      'Governance and Accountability': {
        high: 'Governance is a clear strength. Executive ownership and accountability structures are well-established, providing a foundation for ambitious climate commitments.',
        mid: 'Governance structures exist and are functional. Consider elevating carbon accountability to board level to unlock further progress.'
      },
      'Organisational Boundaries and Methodology': {
        high: 'Your boundary definitions and methodology are robust. This discipline ensures data comparability and positions you well for external assurance.',
        mid: 'Methodology is documented and applied. Regular review and broader scope coverage will strengthen this foundation.'
      },
      'Emissions Data and Calculation Quality': {
        high: 'Data quality is excellent. Strong verification processes and uncertainty management give confidence in your reported figures.',
        mid: 'Data collection is structured. Focus on completeness across all sources and formal uncertainty assessment.'
      },
      'Scope 3 and Supplier Engagement': {
        high: 'Scope 3 management is advanced. Your supplier engagement programme and category-specific approaches are best practice.',
        mid: 'Scope 3 screening is underway. Prioritise activity-based methods for material categories and expand supplier data collection.'
      },
      'Reporting, Targets and Improvement': {
        high: 'Reporting and target-setting are mature. Transparent disclosure and science-based targets demonstrate leadership.',
        mid: 'Reporting processes exist. Integrate carbon into broader ESG reporting and consider science-based target validation.'
      }
    };

    const catInsight = specificInsights[categoryScore.name] || specificInsights['Governance and Accountability'];
    const level = categoryScore.score >= 75 ? 'high' : 'mid';
    return catInsight[level];
  }

  /**
   * Generate gap risk level
   */
  generateGapRisk(categoryScore) {
    if (categoryScore.score < 40) return 'Critical';
    if (categoryScore.score < 60) return 'High';
    if (categoryScore.score < 75) return 'Medium';
    return 'Low';
  }

  /**
   * Generate gap description with category-specific, actionable insight
   */
  generateGapDescription(categoryScore) {
    const specificGaps = {
      'Governance and Accountability': {
        critical: 'Carbon accountability is not clearly assigned. Without governance, data quality, target-setting, and reporting will lack credibility and consistency.',
        high: 'Governance exists but is fragmented. Carbon may be treated as a compliance exercise rather than a strategic priority.',
        medium: 'Governance is functional but not fully integrated. Board oversight and cross-functional coordination would accelerate progress.'
      },
      'Organisational Boundaries and Methodology': {
        critical: 'No documented boundary or methodology. This makes data incomparable year-to-year and unsuitable for external disclosure.',
        high: 'Methodology is informal or inconsistently applied. Changes in operations may not trigger necessary recalculations.',
        medium: 'Methodology exists but needs regular review. Consider formalising the emission factor update process and baseline year policy.'
      },
      'Emissions Data and Calculation Quality': {
        critical: 'Data collection is unstructured. Significant sources may be missed and emission factors may be outdated or inappropriate.',
        high: 'Data exists but quality controls are weak. Uncertainty is unquantified, limiting the usefulness of reported figures.',
        medium: 'Data quality is reasonable. Focus on completeness across all material sources and formal verification processes.'
      },
      'Scope 3 and Supplier Engagement': {
        critical: 'Scope 3 is largely unaddressed. For many organisations, Scope 3 represents the majority of emissions.',
        high: 'Scope 3 screening is partial. Supplier data collection is ad hoc and spend-based estimates may dominate.',
        medium: 'Most categories are screened. Shift from spend-based to activity-based methods for material categories.'
      },
      'Reporting, Targets and Improvement': {
        critical: 'No formal reporting or targets. Carbon performance is invisible to stakeholders and unmanaged internally.',
        high: 'Reporting is basic and targets are informal. Without science-based targets, decarbonisation claims lack credibility.',
        medium: 'Reporting and targets exist but are not fully integrated. Link carbon performance to executive incentives and financial planning.'
      }
    };

    const catGap = specificGaps[categoryScore.name] || specificGaps['Governance and Accountability'];
    let level = 'medium';
    if (categoryScore.score < 40) level = 'critical';
    else if (categoryScore.score < 60) level = 'high';
    
    return catGap[level];
  }

  /**
   * Calculate gap priority score
   */
  calculateGapPriority(categoryScore) {
    return Math.round((100 - categoryScore.score) * categoryScore.weight * 100);
  }

  /**
   * Calculate completion statistics
   */
  calculateCompletion(answers) {
    const totalQuestions = this.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const requiredQuestions = this.questions.filter(q => q.required);
    const requiredAnswered = requiredQuestions.filter(q => answers[q.id] !== undefined).length;

    return {
      totalQuestions,
      answeredQuestions,
      completionRate: Math.round((answeredQuestions / totalQuestions) * 100),
      requiredQuestions: requiredQuestions.length,
      requiredAnswered
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssessmentScoring;
}
