/**
 * Chatbot V2 — Academy Bridge
 * Week 1 Implementation
 * Recommends Academy guides based on user topics
 */

const AcademyBridge = {
  // Academy content index
  guides: [
    {
      id: 'scope-1-guide',
      title: 'Scope 1 Emissions Guide',
      url: '/carbon-accounting/scope-1-emissions/',
      topics: ['scope-1', 'direct-emissions', 'fuel', 'fleet', 'combustion'],
      level: 'Beginner',
      description: 'Learn how to identify, measure, and reduce direct emissions from your operations.'
    },
    {
      id: 'scope-2-guide',
      title: 'Scope 2 Emissions Guide',
      url: '/carbon-accounting/scope-2-emissions/',
      topics: ['scope-2', 'indirect-emissions', 'electricity', 'grid', 'renewable-energy'],
      level: 'Beginner',
      description: 'Understand purchased electricity emissions and the difference between location-based and market-based reporting.'
    },
    {
      id: 'scope-3-guide',
      title: 'Scope 3 Emissions Guide',
      url: '/carbon-accounting/scope-3-emissions/',
      topics: ['scope-3', 'value-chain', 'supply-chain', 'upstream', 'downstream', 'purchased-goods'],
      level: 'Intermediate',
      description: 'Master the 15 categories of value chain emissions and learn collection strategies.'
    },
    {
      id: 'ghg-protocol-guide',
      title: 'GHG Protocol Guide',
      url: '/carbon-accounting/ghg-protocol-guide/',
      topics: ['ghg-protocol', 'reporting-standard', 'corporate-standard', 'emission-scopes'],
      level: 'Beginner',
      description: 'The definitive guide to the world\'s most widely used greenhouse gas accounting standard.'
    },
    {
      id: 'csrd-guide',
      title: 'CSRD Omnibus Guide',
      url: '/esg-reporting/csrd-omnibus-guide/',
      topics: ['csrd', 'esrs', 'eu-reporting', 'double-materiality', 'sustainability-reporting'],
      level: 'Intermediate',
      description: 'Everything you need to know about the EU Corporate Sustainability Reporting Directive.'
    }
  ],

  /**
   * Get recommendations for a topic
   * @param {string} topicId - Topic identifier
   * @returns {array} matching guides
   */
  getRecommendations(topicId) {
    if (!topicId) return [];

    const matches = this.guides.filter(guide =>
      guide.topics.includes(topicId) ||
      guide.topics.some(t => topicId.includes(t) || t.includes(topicId))
    );

    return matches.slice(0, 2); // Max 2 recommendations
  },

  /**
   * Get recommendations by domain
   * @param {string} domain - Domain name
   * @returns {array} matching guides
   */
  getRecommendationsByDomain(domain) {
    const domainTopicMap = {
      'carbon-accounting': ['scope-1', 'scope-2', 'scope-3', 'ghg-protocol', 'emission-factors'],
      'esg-reporting': ['csrd', 'issb', 'tcfd', 'sbti', 'double-materiality'],
      'sustainability-strategy': ['net-zero-strategy', 'decarbonization-levers', 'carbon-pricing']
    };

    const topics = domainTopicMap[domain] || [];
    const matches = [];

    topics.forEach(topic => {
      const recs = this.getRecommendations(topic);
      matches.push(...recs);
    });

    // Remove duplicates
    return [...new Map(matches.map(g => [g.id, g])).values()].slice(0, 2);
  },

  /**
   * Format recommendation text
   * @param {object} guide - Guide object
   * @param {string} topic - Topic label
   * @returns {string} formatted recommendation
   */
  formatRecommendation(guide, topic) {
    let text = `📖 **${guide.title}**`;
    text += `\n   Level: ${guide.level}`;
    if (guide.description) {
      text += `\n   ${guide.description}`;
    }
    text += `\n   🔗 ${guide.url}`;
    return text;
  },

  /**
   * Check if we should recommend academy content
   * Rules:
   * 1. User explicitly asks for resources
   * 2. User has asked 2+ questions on same topic
   */
  shouldRecommend(messageHistory, currentTopic, intent) {
    // Explicit request
    if (intent === 'academyRequest') {
      return true;
    }

    // Topic frequency (if history provided)
    if (messageHistory && Array.isArray(messageHistory)) {
      const topicCount = messageHistory.filter(m => m.topic === currentTopic).length;
      if (topicCount >= 2) {
        return true;
      }
    }

    return false;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AcademyBridge };
} else {
  window.AcademyBridge = AcademyBridge;
}
