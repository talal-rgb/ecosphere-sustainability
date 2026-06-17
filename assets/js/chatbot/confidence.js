/**
 * Confidence Levels Module
 * Calculates and formats confidence indicators for all chatbot responses
 */

const Confidence = {
  // Confidence levels
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',

  /**
   * Calculate confidence based on intent, topic, and context
   */
  calculate(intent, topic, context, knowledgeDepth) {
    // Default to medium
    let level = this.MEDIUM;
    let reason = 'General guidance based on available information';

    // High confidence criteria
    if (knowledgeDepth === 'established_standard') {
      level = this.HIGH;
      reason = 'Based on established GHG Protocol guidance';
    } else if (knowledgeDepth === 'regulatory_framework') {
      level = this.HIGH;
      reason = 'Based on official regulatory framework';
    } else if (knowledgeDepth === 'terrnix_feature') {
      level = this.HIGH;
      reason = 'Based on Terrnix calculator functionality';
    }

    // Medium confidence criteria
    if (knowledgeDepth === 'general_guidance') {
      level = this.MEDIUM;
      reason = 'Depends on company-specific assumptions';
    } else if (knowledgeDepth === 'industry_benchmark') {
      level = this.MEDIUM;
      reason = 'Based on industry averages; your experience may vary';
    } else if (intent === 'calculator_help' && context.calculatorContext?.hasData) {
      level = this.MEDIUM;
      reason = 'Based on your calculator inputs; verify with primary data';
    }

    // Low confidence criteria
    if (knowledgeDepth === 'estimate') {
      level = this.LOW;
      reason = 'Based on limited information available';
    } else if (knowledgeDepth === 'user_specific') {
      level = this.LOW;
      reason = 'Requires company-specific data for accurate assessment';
    } else if (intent === 'unknown' || !topic) {
      level = this.LOW;
      reason = 'Unable to determine specific context';
    }

    // Adjust based on context
    if (context.maturity === 'beginner' && level === this.HIGH) {
      // Keep high but add caveat for beginners
      reason += '. Verify with your sustainability team';
    }

    return { level, reason };
  },

  /**
   * Format confidence for display
   */
  format(confidence) {
    const levelClass = confidence.level.toLowerCase();
    return `
<div class="confidence-badge confidence-${levelClass}">
  <span class="confidence-icon">${this.getIcon(confidence.level)}</span>
  <span class="confidence-label">Confidence: ${confidence.level}</span>
  <span class="confidence-reason">${confidence.reason}</span>
</div>`;
  },

  /**
   * Get icon for confidence level
   */
  getIcon(level) {
    switch (level) {
      case this.HIGH:
        return '✓';
      case this.MEDIUM:
        return '~';
      case this.LOW:
        return '?';
      default:
        return '~';
    }
  },

  /**
   * Get CSS class for confidence level
   */
  getClass(level) {
    switch (level) {
      case this.HIGH:
        return 'confidence-high';
      case this.MEDIUM:
        return 'confidence-medium';
      case this.LOW:
        return 'confidence-low';
      default:
        return 'confidence-medium';
    }
  },

  /**
   * Add confidence to response text
   */
  addToResponse(responseText, confidence) {
    const confidenceSection = `\n\n---\n**Confidence: ${confidence.level}**\n*${confidence.reason}*`;
    return responseText + confidenceSection;
  },

  /**
   * Determine knowledge depth from topic
   */
  getKnowledgeDepth(topic, intent) {
    const establishedStandards = [
      'ghg-protocol', 'scope1', 'scope2', 'scope3',
      'emission-factors', 'carbon-accounting'
    ];

    const regulatoryFrameworks = [
      'csrd', 'esrs', 'issb', 'tcfd', 'sbti'
    ];

    const terrnixFeatures = [
      'calculator', 'pdf-report', 'academy', 'quiz'
    ];

    if (establishedStandards.includes(topic)) {
      return 'established_standard';
    }

    if (regulatoryFrameworks.includes(topic)) {
      return 'regulatory_framework';
    }

    if (terrnixFeatures.includes(topic)) {
      return 'terrnix_feature';
    }

    if (intent === 'calculator_help') {
      return 'general_guidance';
    }

    if (intent === 'sustainability_strategy') {
      return 'general_guidance';
    }

    return 'general_guidance';
  }
};

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Confidence };
}
