/**
 * Chatbot V2 — Main Controller
 * Week 1 Implementation
 * Entry point for chatbot functionality
 */

const TerrnixChatbot = {
  // State
  initialized: false,
  knowledgeBase: null,
  messageHistory: [], // Session-only, not persisted

  /**
   * Initialize chatbot
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load knowledge base
      const response = await fetch('assets/js/chatbot/knowledge.json');
      this.knowledgeBase = await response.json();

      // Initialize components
      ResponseBuilder.init(this.knowledgeBase);

      this.initialized = true;
      console.log('Terrnix Chatbot V2 initialized');
    } catch (error) {
      console.error('Chatbot initialization error:', error);
      // Fallback: use inline knowledge if fetch fails
      this.knowledgeBase = this.getFallbackKnowledge();
      ResponseBuilder.init(this.knowledgeBase);
      this.initialized = true;
    }
  },

  /**
   * Handle user message
   */
  async handleMessage(userMessage) {
    if (!this.initialized) {
      await this.init();
    }

    const message = userMessage.trim();
    if (!message) return null;

    // Detect intent and topic
    const intent = IntentDetector.detect(message);
    const topic = TopicDetector.detect(message);

    // Get calculator context (if on calculator page)
    const calculatorContext = CalculatorBridge.getContext();

    // Build response
    let response;
    if (intent === 'fallback' && !topic) {
      response = ResponseBuilder.getFallback();
    } else {
      response = ResponseBuilder.build(intent, topic, message, calculatorContext);
    }

    // Store in session history (no persistence)
    this.messageHistory.push({
      role: 'user',
      text: message,
      intent,
      topic: topic ? topic.id : null,
      timestamp: Date.now()
    });

    this.messageHistory.push({
      role: 'ai',
      text: response.text,
      intent: response.intent,
      topic: response.topic,
      timestamp: Date.now()
    });

    // Keep only last 20 messages
    if (this.messageHistory.length > 20) {
      this.messageHistory = this.messageHistory.slice(-20);
    }

    return response;
  },

  /**
   * Get fallback knowledge (inline, if fetch fails)
   */
  getFallbackKnowledge() {
    return {
      version: '2.0-fallback',
      domains: {
        'carbon-accounting': {
          topics: {
            'scope-1': {
              response: {
                definition: 'Scope 1 emissions are direct greenhouse gas emissions from sources your organization owns or controls.',
                whyItMatters: 'These are the most straightforward emissions to measure and reduce.',
                keyFacts: ['Includes fuel combustion, company vehicles, and process emissions'],
                terrnixLink: '/carbon-accounting/scope-1-emissions/'
              }
            },
            'scope-2': {
              response: {
                definition: 'Scope 2 emissions are indirect emissions from purchased electricity, heat, steam, or cooling.',
                whyItMatters: 'Often represents 40-60% of emissions for office-based organizations.',
                keyFacts: ['Requires dual reporting: location-based and market-based'],
                terrnixLink: '/carbon-accounting/scope-2-emissions/'
              }
            },
            'scope-3': {
              response: {
                definition: 'Scope 3 emissions are all other indirect value chain emissions.',
                whyItMatters: 'Typically 70-90% of total emissions for manufacturing and retail.',
                keyFacts: ['15 categories covering upstream and downstream activities'],
                terrnixLink: '/carbon-accounting/scope-3-emissions/'
              }
            }
          }
        }
      }
    };
  },

  /**
   * Clear session history
   */
  clearHistory() {
    this.messageHistory = [];
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TerrnixChatbot };
} else {
  window.TerrnixChatbot = TerrnixChatbot;
}
