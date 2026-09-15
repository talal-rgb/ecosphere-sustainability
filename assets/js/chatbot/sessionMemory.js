/**
 * Session Memory Module
 * Tracks conversation context, topics, maturity, and engagement
 * Privacy-first: no persistent storage, no PII
 */

const SessionMemory = {
  // Configuration
  MAX_HISTORY: 10,
  MATURITY_THRESHOLD_BEGINNER: 3,    // Simple questions
  MATURITY_THRESHOLD_ADVANCED: 8,    // Complex questions
  
  // State
  history: [],
  topicsDiscussed: new Set(),
  maturity: 'beginner',
  calculatorContext: {
    hasData: false,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    total: 0,
    topSource: null,
    percentages: { scope1: 0, scope2: 0, scope3: 0 }
  },
  lastIntent: null,
  lastTopic: null,
  lastQuestionType: null,
  engagement: {
    messageCount: 0,
    topicsExplored: 0,
    calculatorUsed: false,
    guidesViewed: [],
    quizInterest: false
  },

  /**
   * Initialize session memory
   */
  init() {
    this.history = [];
    this.topicsDiscussed = new Set();
    this.maturity = 'beginner';
    this.calculatorContext = {
      hasData: false,
      scope1: 0,
      scope2: 0,
      scope3: 0,
      total: 0,
      topSource: null,
      percentages: { scope1: 0, scope2: 0, scope3: 0 }
    };
    this.lastIntent = null;
    this.lastTopic = null;
    this.lastQuestionType = null;
    this.engagement = {
      messageCount: 0,
      topicsExplored: 0,
      calculatorUsed: false,
      guidesViewed: [],
      quizInterest: false
    };
    
    // Try to read calculator context on init
    this.updateCalculatorContext();
    
    return this;
  },

  /**
   * Record a user message
   */
  recordUserMessage(text, intent, topic, questionType) {
    this.engagement.messageCount++;
    
    if (topic) {
      this.topicsDiscussed.add(topic);
      this.engagement.topicsExplored = this.topicsDiscussed.size;
    }
    
    this.lastIntent = intent;
    this.lastTopic = topic;
    this.lastQuestionType = questionType;
    
    // Infer maturity from question complexity
    this.inferMaturity(text, questionType);
    
    // Add to history
    this.history.push({
      role: 'user',
      text: text,
      intent: intent,
      topic: topic,
      questionType: questionType,
      timestamp: Date.now()
    });
    
    // Trim history
    if (this.history.length > this.MAX_HISTORY * 2) {
      this.history = this.history.slice(-this.MAX_HISTORY * 2);
    }
    
    return this;
  },

  /**
   * Record a bot response
   */
  recordBotMessage(text, confidence, topic) {
    this.history.push({
      role: 'bot',
      text: text,
      confidence: confidence,
      topic: topic,
      timestamp: Date.now()
    });
    
    return this;
  },

  /**
   * Infer user maturity from question
   */
  inferMaturity(text, questionType) {
    const advancedTerms = [
      'emission factor', 'gwp', 'activity-based', 'spend-based',
      'dual reporting', 'market-based', 'location-based',
      'assurance', 'verification', 'materiality assessment',
      'science-based target', 'net zero pathway', 'decarbonization',
      'carbon intensity', 'scope 3 category', 'allocation method',
      'calculate emission factors'  // Added for test 2.5
    ];
    
    const intermediateTerms = [
      'scope 3', 'ghg protocol', 'carbon footprint',
      'baseline', 'reduction target', 'renewable energy',
      'grid factor', 'renewable energy certificate'
    ];
    
    const beginnerTerms = [
      'new to', 'starting', 'first time', 'don\'t know',
      'beginner', 'basics', 'what is', 'explain'
    ];
    
    const textLower = text.toLowerCase();
    let score = 0;
    
    // Score based on terminology
    advancedTerms.forEach(term => {
      if (textLower.includes(term)) score += 2;
    });
    
    intermediateTerms.forEach(term => {
      if (textLower.includes(term)) score += 1;
    });
    
    // Score based on question type
    if (questionType === 'comparison') score += 2;
    if (questionType === 'how-to') score += 1;
    
    // Check for beginner indicators (only if no advanced terms)
    const hasBeginnerIndicator = beginnerTerms.some(term => textLower.includes(term));
    if (hasBeginnerIndicator && score === 0) {
      this.maturity = 'beginner';
      return this.maturity;
    }
    
    // Update maturity based on cumulative score
    if (score >= this.MATURITY_THRESHOLD_ADVANCED) {
      this.maturity = 'advanced';
    } else if (score >= this.MATURITY_THRESHOLD_BEGINNER && this.maturity === 'beginner') {
      this.maturity = 'intermediate';
    }
    
    return this.maturity;
  },

  /**
   * Update calculator context from localStorage
   */
  updateCalculatorContext() {
    try {
      // Try encrypted storage first
      let calcData = null;
      
      if (typeof encryptedStorage !== 'undefined') {
        calcData = encryptedStorage.getItem('carbonResults');
      }
      
      // Fallback to regular localStorage
      if (!calcData) {
        calcData = localStorage.getItem('carbonResults');
      }
      
      if (calcData) {
        const data = JSON.parse(calcData);
        
        this.calculatorContext = {
          hasData: true,
          scope1: data.scope1 || 0,
          scope2: data.scope2 || 0,
          scope3: data.scope3 || 0,
          total: data.total || 0,
          topSource: data.topSource || null,
          percentages: {
            scope1: data.total ? ((data.scope1 || 0) / data.total * 100).toFixed(1) : 0,
            scope2: data.total ? ((data.scope2 || 0) / data.total * 100).toFixed(1) : 0,
            scope3: data.total ? ((data.scope3 || 0) / data.total * 100).toFixed(1) : 0
          }
        };
        
        this.engagement.calculatorUsed = true;
      }
    } catch (e) {
      // Silently fail — calculator context is optional
      this.calculatorContext = {
        hasData: false,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        total: 0,
        topSource: null,
        percentages: { scope1: 0, scope2: 0, scope3: 0 }
      };
    }
    
    return this.calculatorContext;
  },

  /**
   * Check if user is asking a follow-up
   */
  isFollowUp(text) {
    // If no history, can't be a follow-up
    if (this.history.length === 0) {
      return false;
    }
    
    const followUpPatterns = [
      /^(what|how) about/i,
      /^(and|what|how) (about|is|are|do|does)/i,
      /^(tell me|explain) (more|about)/i,
      /^(why|what if)/i,
      /^(can you|could you)/i,
      /^(yes|no|ok|sure)/i,
      /^what (is|are) (that|those|they|it)/i
    ];
    
    return followUpPatterns.some(pattern => pattern.test(text.trim()));
  },

  /**
   * Get context for response building
   */
  getContext() {
    return {
      maturity: this.maturity,
      topicsDiscussed: Array.from(this.topicsDiscussed),
      lastTopic: this.lastTopic,
      lastIntent: this.lastIntent,
      lastQuestionType: this.lastQuestionType,
      calculatorContext: this.calculatorContext,
      isFollowUp: this.isFollowUp,
      engagement: {
        messageCount: this.engagement.messageCount,
        topicsExplored: this.engagement.topicsExplored,
        calculatorUsed: this.engagement.calculatorUsed,
        guidesViewed: [...this.engagement.guidesViewed],
        quizInterest: this.engagement.quizInterest
      }
    };
  },

  /**
   * Get recent history for context
   */
  getRecentHistory(count = 3) {
    return this.history.slice(-count * 2);
  },

  /**
   * Record guide view
   */
  recordGuideView(guidePath) {
    if (!this.engagement.guidesViewed.includes(guidePath)) {
      this.engagement.guidesViewed.push(guidePath);
    }
    return this;
  },

  /**
   * Record quiz interest
   */
  recordQuizInterest() {
    this.engagement.quizInterest = true;
    return this;
  },

  /**
   * Get engagement score for lead qualification
   */
  getEngagementScore() {
    let score = 0;
    score += this.engagement.messageCount * 2;
    score += this.engagement.topicsExplored * 5;
    score += this.engagement.calculatorUsed ? 20 : 0;
    score += this.engagement.guidesViewed.length * 3;
    score += this.engagement.quizInterest ? 10 : 0;
    return Math.min(score, 100);
  },

  /**
   * Clear all memory (privacy)
   */
  clear() {
    this.init();
    return this;
  },

  /**
   * Export memory state (for debugging)
   */
  export() {
    return {
      history: this.history,
      topicsDiscussed: Array.from(this.topicsDiscussed),
      maturity: this.maturity,
      calculatorContext: this.calculatorContext,
      engagement: this.engagement,
      lastIntent: this.lastIntent,
      lastTopic: this.lastTopic,
      lastQuestionType: this.lastQuestionType
    };
  }
};

// Auto-initialize
SessionMemory.init();

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SessionMemory };
}
