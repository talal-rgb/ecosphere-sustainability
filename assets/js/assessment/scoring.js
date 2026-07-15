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
   * Generate strength description
   */
  generateStrengthDescription(categoryScore) {
    if (categoryScore.score >= 75) {
      return `${categoryScore.name} is a significant strength. Your score of ${categoryScore.score}% indicates mature processes that can serve as a foundation for broader sustainability initiatives.`;
    }
    return `${categoryScore.name} shows solid progress. At ${categoryScore.score}%, you have established processes with room for optimisation.`;
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
   * Generate gap description
   */
  generateGapDescription(categoryScore) {
    return `${categoryScore.name} scored ${categoryScore.score}%, indicating significant room for improvement. Without addressing this gap, your organisation may face compliance risks and miss opportunities for operational efficiency and stakeholder confidence.`;
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
