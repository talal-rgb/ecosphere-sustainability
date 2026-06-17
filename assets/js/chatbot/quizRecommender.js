/**
 * Quiz Recommender Module
 * Suggests relevant quizzes based on conversation topics
 * Soft recommendations only — never gate answers
 */

const QuizRecommender = {
  // Available quizzes
  QUIZZES: {
    'carbon-readiness': {
      name: 'Carbon Readiness Quiz',
      description: 'Test your knowledge of carbon accounting, scopes, and GHG Protocol',
      topics: ['scope1', 'scope2', 'scope3', 'ghg-protocol', 'emission-factors', 'carbon-accounting'],
      url: '/#quiz',
      minTopics: 2,
      message: 'Based on your carbon accounting questions, test your knowledge with the Carbon Readiness Quiz.'
    },
    'esg-maturity': {
      name: 'ESG Maturity Quiz',
      description: 'Assess your understanding of ESG reporting, CSRD, and frameworks',
      topics: ['csrd', 'esrs', 'issb', 'gri', 'double-materiality', 'tcfd', 'sustainability-reporting'],
      url: '/#quiz',
      minTopics: 2,
      message: 'Based on your ESG reporting questions, assess your knowledge with the ESG Maturity Quiz.'
    },
    'sustainability-strategy': {
      name: 'Sustainability Strategy Quiz',
      description: 'Evaluate your understanding of net zero, SBTi, and decarbonization',
      topics: ['net-zero', 'sbti', 'decarbonization', 'carbon-pricing', 'renewable-energy', 'climate-strategy', 'strategy'],
      url: '/#quiz',
      minTopics: 2,
      message: 'Based on your strategy questions, evaluate your knowledge with the Sustainability Strategy Quiz.'
    }
  },

  // Configuration
  MIN_MESSAGES_BEFORE_RECOMMEND: 3,
  MAX_RECOMMENDATIONS_PER_SESSION: 2,

  // Track recommendations
  recommendationsMade: 0,

  /**
   * Initialize
   */
  init() {
    this.recommendationsMade = 0;
    return this;
  },

  /**
   * Recommend a quiz based on topics discussed
   */
  recommend(topicsDiscussed, messageCount, maturity) {
    // Don't recommend too early
    if (messageCount < this.MIN_MESSAGES_BEFORE_RECOMMEND) {
      return null;
    }

    // Don't recommend too many times
    if (this.recommendationsMade >= this.MAX_RECOMMENDATIONS_PER_SESSION) {
      return null;
    }

    const topicsArray = Array.from(topicsDiscussed);
    let bestMatch = null;
    let bestScore = 0;

    // Find best matching quiz
    for (const [quizId, quiz] of Object.entries(this.QUIZZES)) {
      const matchingTopics = quiz.topics.filter(topic => topicsArray.includes(topic));
      const score = matchingTopics.length;

      if (score >= quiz.minTopics && score > bestScore) {
        bestScore = score;
        bestMatch = { ...quiz, id: quizId, matchingTopics };
      }
    }

    if (!bestMatch) {
      return null;
    }

    // Don't recommend if user already showed interest
    // (This would be checked via session memory)

    this.recommendationsMade++;

    return {
      quiz: bestMatch.name,
      message: bestMatch.message,
      url: bestMatch.url,
      relevance: bestScore,
      matchingTopics: bestMatch.matchingTopics
    };
  },

  /**
   * Format recommendation for display
   */
  format(recommendation) {
    if (!recommendation) {
      return '';
    }

    return `\n\n---\n\n📝 **Quiz Recommendation**\n\n${recommendation.message}\n\n**Relevant topics covered:** ${recommendation.matchingTopics.join(', ')}\n\n[Take Quiz](${recommendation.url})\n\n*This is optional — your answer above is complete without the quiz.*`;
  },

  /**
   * Check if recommendation should be shown
   */
  shouldRecommend(sessionMemory) {
    // Don't recommend if user already took quiz
    if (sessionMemory.engagement?.quizInterest) {
      return false;
    }

    // Don't recommend if too many messages without relevant topics
    if (sessionMemory.engagement?.messageCount < this.MIN_MESSAGES_BEFORE_RECOMMEND) {
      return false;
    }

    return true;
  },

  /**
   * Get all available quizzes
   */
  getAvailableQuizzes() {
    return Object.entries(this.QUIZZES).map(([id, quiz]) => ({
      id,
      name: quiz.name,
      description: quiz.description,
      url: quiz.url
    }));
  }
};

// Auto-initialize
QuizRecommender.init();

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizRecommender };
}
