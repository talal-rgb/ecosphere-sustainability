/**
 * Chatbot V2 — Topic Detection
 * Week 1 Implementation
 * Identifies sustainability topics from user messages
 */

const TopicDetector = {
  // Topic keyword mappings
  topics: {
    // Carbon Accounting
    'scope-1': {
      keywords: ['scope 1', 'scope1', 'direct emission', 'stationary combustion', 'fleet emission', 'fuel emission', 'boiler', 'furnace', 'generator', 'company vehicle', 'process emission', 'fugitive emission', 'refrigerant leak', 'what units', 'fuel units'],
      domain: 'carbon-accounting',
      difficulty: 'beginner'
    },
    'scope-2': {
      keywords: ['scope 2', 'scope2', 'indirect emission', 'purchased electricity', 'purchased heat', 'purchased steam', 'purchased cooling', 'grid electricity', 'power consumption', 'kwh', 'kilowatt', 'electricity emission', 'location based', 'market based', 'location-based', 'market-based', 'rec', 'ppa', 'electricity data'],
      domain: 'carbon-accounting',
      difficulty: 'beginner'
    },
    'scope-3': {
      keywords: ['scope 3', 'scope3', 'value chain', 'supply chain emission', 'upstream', 'downstream', 'purchased good', 'business travel', 'employee commuting', 'waste emission', 'transport emission', 'use of sold product', 'end of life', 'investment emission', 'franchise emission', 'scope 3 category', 'scope 3 categories'],
      domain: 'carbon-accounting',
      difficulty: 'intermediate'
    },
    'ghg-protocol': {
      keywords: ['ghg protocol', 'greenhouse gas protocol', 'wri', 'wbcsd', 'corporate standard', 'scope definition', 'emission scope', 'reporting standard', 'ghg accounting'],
      domain: 'carbon-accounting',
      difficulty: 'beginner'
    },
    'emission-factors': {
      keywords: ['emission factor', 'conversion factor', 'co2 per kwh', 'co2 per litre', 'co2 per kg', 'gwp', 'global warming potential', 'ipcc factor', 'epa factor', 'defra factor', 'iea factor', 'emission coefficient'],
      domain: 'carbon-accounting',
      difficulty: 'intermediate'
    },
    'carbon-neutral-vs-net-zero': {
      keywords: ['carbon neutral', 'net zero', 'climate neutral', 'carbon neutrality', 'net zero target', 'science based target', 'difference between carbon neutral and net zero', 'net zero vs carbon neutral'],
      domain: 'carbon-accounting',
      difficulty: 'intermediate'
    },
    // ESG Reporting
    'csrd': {
      keywords: ['csrd', 'corporate sustainability reporting directive', 'eu sustainability', 'european sustainability', 'nfrd replacement', 'esrs', 'double materiality', 'eu reporting'],
      domain: 'esg-reporting',
      difficulty: 'intermediate'
    },
    'issb': {
      keywords: ['issb', 'ifrs sustainability', 'ifrs s1', 'ifrs s2', 'international sustainability standards board', 'tcfd successor', 'global baseline', 'ifrs foundation'],
      domain: 'esg-reporting',
      difficulty: 'intermediate'
    },
    'tcfd': {
      keywords: ['tcfd', 'task force on climate-related financial disclosures', 'climate disclosure', 'climate risk', 'financial stability board', 'climate financial'],
      domain: 'esg-reporting',
      difficulty: 'intermediate'
    },
    'sbti': {
      keywords: ['sbti', 'science based targets initiative', 'science based target', '1.5 degree target', 'net zero standard', 'corporate net zero', 'validated target'],
      domain: 'esg-reporting',
      difficulty: 'intermediate'
    },
    'double-materiality': {
      keywords: ['double materiality', 'impact materiality', 'financial materiality', 'materiality assessment', 'csrd materiality', 'inward outward'],
      domain: 'esg-reporting',
      difficulty: 'advanced'
    },
    'gwp': {
      keywords: ['gwp', 'global warming potential', 'gwp values', 'gwp100', 'gwp20'],
      domain: 'carbon-accounting',
      difficulty: 'intermediate'
    },
    'carbon-pricing': {
      keywords: ['carbon pricing', 'carbon tax', 'eu ets', 'ets', 'emissions trading', 'carbon market', 'carbon credit', 'carbon offset', 'voluntary carbon market', 'cbam'],
      domain: 'sustainability-strategy',
      difficulty: 'intermediate'
    },
    // Sustainability Strategy
    'net-zero-strategy': {
      keywords: ['net zero strategy', 'decarbonization strategy', 'carbon reduction plan', 'emissions reduction roadmap', 'climate strategy', 'net zero pathway'],
      domain: 'sustainability-strategy',
      difficulty: 'intermediate'
    },
    'decarbonization-levers': {
      keywords: ['decarbonization', 'reduce emission', 'emission reduction', 'carbon reduction', 'green hydrogen', 'electrification', 'renewable energy', 'energy efficiency', 'ccus', 'carbon capture'],
      domain: 'sustainability-strategy',
      difficulty: 'intermediate'
    },
    'carbon-pricing': {
      keywords: ['carbon pricing', 'carbon tax', 'eu ets', 'ets', 'emissions trading', 'carbon market', 'carbon credit', 'carbon offset', 'voluntary carbon market', 'cbam'],
      domain: 'sustainability-strategy',
      difficulty: 'intermediate'
    },
    // Terrnix Features
    'calculator': {
      keywords: ['calculator', 'carbon calculator', 'carbon footprint calculator', 'emissions calculator', 'how to calculate', 'calculate emission', 'compute carbon', 'carbon tool', 'how do i calculate', 'how to use calculator', 'my total', 'my calculation', 'calculator results'],
      domain: 'terrnix-features',
      difficulty: 'beginner'
    },
    'pdf-report': {
      keywords: ['pdf report', 'carbon report', 'emissions report', 'download report', 'generate report', 'my report', 'report explanation', 'pdf output'],
      domain: 'terrnix-features',
      difficulty: 'beginner'
    },
    'academy': {
      keywords: ['academy', 'tutorial', 'education', 'resources', 'knowledge base', 'read more', 'where can i learn', 'study', 'training', 'article', 'blog', 'beginner guide', 'beginner guides'],
      domain: 'terrnix-features',
      difficulty: 'beginner'
    },
    'quiz': {
      keywords: ['quiz', 'test', 'assessment', 'knowledge test', 'carbon quiz', 'esg quiz', 'readiness assessment', 'exam'],
      domain: 'terrnix-features',
      difficulty: 'beginner'
    }
  },

  /**
   * Detect topic from user message
   * @param {string} message - User input
   * @returns {object|null} topic info or null
   */
  detect(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }

    const lowerMsg = message.toLowerCase().trim();
    const scores = {};

    // Score each topic
    for (const [topicId, config] of Object.entries(this.topics)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      if (score > 0) {
        scores[topicId] = {
          score,
          ...config
        };
      }
    }

    // Find highest scoring topic
    let bestTopic = null;
    let bestScore = 0;

    for (const [topicId, data] of Object.entries(scores)) {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestTopic = {
          id: topicId,
          ...data
        };
      }
    }

    // Threshold: need at least 1 match
    if (!bestTopic || bestScore < 1) {
      return null;
    }

    return bestTopic;
  },

  /**
   * Detect multiple topics (for ambiguous queries)
   * @param {string} message - User input
   * @returns {array} array of topic objects
   */
  detectMultiple(message) {
    if (!message || typeof message !== 'string') {
      return [];
    }

    const lowerMsg = message.toLowerCase().trim();
    const matches = [];

    for (const [topicId, config] of Object.entries(this.topics)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      if (score > 0) {
        matches.push({
          id: topicId,
          score,
          ...config
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  },

  /**
   * Get all topics in a domain
   * @param {string} domain - Domain name
   * @returns {array} topic IDs
   */
  getTopicsByDomain(domain) {
    return Object.entries(this.topics)
      .filter(([_, config]) => config.domain === domain)
      .map(([id, _]) => id);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopicDetector };
} else {
  window.TopicDetector = TopicDetector;
}
