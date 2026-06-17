/**
 * Chatbot V2 — Response Builder
 * Week 1 Implementation
 * Assembles responses from templates, knowledge, and context
 */

// Import templates (Node.js compatibility)
const ChatbotTemplates = typeof window !== 'undefined' ? window.ChatbotTemplates : require('./templates.js').ChatbotTemplates;
const AcademyBridge = typeof window !== 'undefined' ? window.AcademyBridge : require('./academy-bridge.js').AcademyBridge;

const ResponseBuilder = {
  // Current knowledge base (loaded from knowledge.json)
  knowledgeBase: null,

  /**
   * Initialize with knowledge base
   */
  init(knowledgeJson) {
    this.knowledgeBase = knowledgeJson;
  },

  /**
   * Build response from intent, topic, and context
   */
  build(intent, topic, message, calculatorContext = null) {
    // Handle greetings immediately
    if (intent === 'greeting') {
      return {
        text: ChatbotTemplates.greeting(),
        intent: 'greeting',
        topic: null,
        hasAcademyRecommendation: false
      };
    }

    // Handle thanks
    if (intent === 'thanks') {
      return {
        text: "You're welcome! Feel free to ask if you have more sustainability questions.",
        intent: 'thanks',
        topic: null,
        hasAcademyRecommendation: false
      };
    }

    // Handle goodbye
    if (intent === 'goodbye') {
      return {
        text: "Goodbye! Feel free to come back anytime for sustainability guidance.",
        intent: 'goodbye',
        topic: null,
        hasAcademyRecommendation: false
      };
    }

    // Handle safety/disclaimer
    if (intent === 'safety') {
      return {
        text: ChatbotTemplates.safety(),
        intent: 'safety',
        topic: null,
        hasAcademyRecommendation: false
      };
    }

    // Get knowledge for topic
    const knowledge = this.getKnowledge(topic);

    // Handle fallback if no knowledge found
    if (!knowledge) {
      return {
        text: ChatbotTemplates.fallback(),
        intent: 'fallback',
        topic: null,
        hasAcademyRecommendation: false
      };
    }

    let responseText = '';
    let hasAcademyRecommendation = false;

    // Build response based on intent
    switch (intent) {
      case 'educational':
        responseText = ChatbotTemplates.educational(knowledge);
        break;

      case 'regulatory':
        responseText = ChatbotTemplates.regulatory(knowledge);
        break;

      case 'calculatorHelp':
        responseText = ChatbotTemplates.calculatorHelp(knowledge);
        break;

      case 'calculatorExplain':
        responseText = ChatbotTemplates.calculatorExplain(knowledge, calculatorContext);
        break;

      case 'academyRequest':
        const recs = AcademyBridge.getRecommendations(topic ? topic.id : null);
        if (recs.length > 0) {
          responseText = `Here are some Academy guides that might help:\n\n`;
          recs.forEach(rec => {
            responseText += AcademyBridge.formatRecommendation(rec, topic ? topic.id : '') + '\n\n';
          });
          hasAcademyRecommendation = true;
        } else {
          responseText = ChatbotTemplates.fallback();
        }
        break;

      default:
        // For unknown intents with a known topic, default to educational
        responseText = ChatbotTemplates.educational(knowledge);
    }

    // Add academy recommendation for educational intents (if not already added)
    if (intent === 'educational' && topic && !hasAcademyRecommendation) {
      const recs = AcademyBridge.getRecommendations(topic.id);
      if (recs.length > 0) {
        responseText += '\n\n';
        responseText += `📚 **Want to learn more?** Check out the ${recs[0].title}:\n`;
        responseText += `${recs[0].url}`;
        hasAcademyRecommendation = true;
      }
    }

    return {
      text: responseText,
      intent,
      topic: topic ? topic.id : null,
      hasAcademyRecommendation
    };
  },

  /**
   * Get knowledge entry for a topic
   */
  getKnowledge(topic) {
    if (!this.knowledgeBase || !topic) {
      return null;
    }

    const domain = topic.domain;
    const topicId = topic.id;

    if (this.knowledgeBase.domains[domain] &&
        this.knowledgeBase.domains[domain].topics[topicId]) {
      return this.knowledgeBase.domains[domain].topics[topicId];
    }

    return null;
  },

  /**
   * Get fallback response
   */
  getFallback() {
    return {
      text: ChatbotTemplates.fallback(),
      intent: 'fallback',
      topic: null,
      hasAcademyRecommendation: false
    };
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResponseBuilder };
} else {
  window.ResponseBuilder = ResponseBuilder;
}
