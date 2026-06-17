/**
 * Chatbot V2 — Intent Detection
 * Week 1 Implementation
 * Classifies user messages into intent categories
 */

const IntentDetector = {
  // Intent patterns (regex or keyword-based)
  patterns: {
    greeting: {
      keywords: ['hello', 'hi there', 'hey there', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'],
      weight: 1.0
    },
    educational: {
      keywords: ['what is', 'what are', 'explain', 'how does', 'how do', 'tell me about', 'define', 'definition of', 'what does', 'meaning of', 'overview of', 'introduction to', 'difference between', 'versus', 'vs', 'which category', 'which scope', 'what gwp', 'gwp values', 'what units', 'show me', 'teach me', 'i want to learn', 'what emission factor'],
      weight: 1.0
    },
    regulatory: {
      keywords: ['apply to me', 'does it apply', 'deadline', 'when do i need', 'requirement', 'compliance', 'mandatory', 'obligation', 'reporting requirement', 'do i have to', 'does csrd apply'],
      weight: 1.0
    },
    calculatorHelp: {
      keywords: ['how to use calculator', 'how do i use calculator', 'calculator help', 'using the calculator', 'input data', 'enter data', 'how to calculate', 'calculator guide', 'how do i calculate'],
      weight: 1.0
    },
    calculatorExplain: {
      keywords: ['why is my', 'explain my', 'my results', 'my report', 'my calculation', 'is this high', 'is this normal', 'compare to', 'benchmark', 'my scope', 'my emissions', 'my total', 'tonnes a lot', 'how was my total'],
      weight: 1.0
    },
    academyRequest: {
      keywords: ['learn more', 'where can i learn', 'guide', 'tutorial', 'read more', 'resources', 'education', 'study', 'training', 'academy', 'article', 'blog', 'what should i read', 'recommend a guide', 'beginner guide'],
      weight: 1.0
    },
    safety: {
      keywords: ['reliable', 'accurate', 'trust', 'audit', 'legal advice', 'disclaimer', 'limitation', 'limitations', 'can i use this', 'is this valid', 'verification', 'certified', 'legally binding', 'legally', 'binding'],
      weight: 1.0
    },
    comparison: {
      keywords: ['difference between', 'vs', 'versus', 'compare', 'comparison'],
      weight: 1.0
    },
    thanks: {
      keywords: ['thank', 'thanks', 'appreciate', 'grateful', 'helpful'],
      weight: 1.0
    },
    goodbye: {
      keywords: ['bye', 'goodbye', 'see you', 'later', 'talk soon'],
      weight: 1.0
    }
  },

  /**
   * Detect intent from user message
   * @param {string} message - User input
   * @returns {string} intent - One of the pattern keys or 'fallback'
   */
  detect(message) {
    if (!message || typeof message !== 'string') {
      return 'fallback';
    }

    const lowerMsg = message.toLowerCase().trim();
    const scores = {};

    // Score each intent
    for (const [intent, config] of Object.entries(this.patterns)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
          score += config.weight;
        }
      }
      scores[intent] = score;
    }

    // Find highest scoring intent
    let bestIntent = 'fallback';
    let bestScore = 0;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    // Threshold: need at least 1 match
    if (bestScore < 0.5) {
      return 'fallback';
    }

    return bestIntent;
  },

  /**
   * Detect if message is a follow-up question
   * @param {string} message - User input
   * @returns {boolean} isFollowUp
   */
  isFollowUp(message) {
    const followUpPatterns = [
      /^it\b/i,
      /^that\b/i,
      /^those\b/i,
      /^they\b/i,
      /^them\b/i,
      /^what about\b/i,
      /^how about\b/i,
      /^and\b/i,
      /^also\b/i,
      /^but\b/i,
      /^why\b/i,
      /^how\b/i,
      /^can you\b/i,
      /^tell me more\b/i,
      /^more on\b/i,
      /^elaborate\b/i
    ];

    return followUpPatterns.some(pattern => pattern.test(message.trim()));
  },

  /**
   * Detect if user is asking about a specific scope
   * @param {string} message - User input
   * @returns {string|null} scope - 'scope1', 'scope2', 'scope3', or null
   */
  detectScope(message) {
    const lowerMsg = message.toLowerCase();
    if (/\bscope\s*1\b/.test(lowerMsg) || /\bscope1\b/.test(lowerMsg)) return 'scope1';
    if (/\bscope\s*2\b/.test(lowerMsg) || /\bscope2\b/.test(lowerMsg)) return 'scope2';
    if (/\bscope\s*3\b/.test(lowerMsg) || /\bscope3\b/.test(lowerMsg)) return 'scope3';
    return null;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IntentDetector };
} else {
  window.IntentDetector = IntentDetector;
}
