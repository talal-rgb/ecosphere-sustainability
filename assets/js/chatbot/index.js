/**
 * Chatbot V2 — Main Controller
 * Week 2 Implementation
 * Entry point for chatbot functionality with session memory, confidence, PDF assistant, quiz, and lead qualification
 */

const TerrnixChatbot = {
  // State
  initialized: false,
  knowledgeBase: null,

  /**
   * Initialize chatbot
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load knowledge base
      const response = await fetch('assets/js/chatbot/knowledge.json');
      this.knowledgeBase = await response.json();

      // Initialize Week 1 components
      ResponseBuilder.init(this.knowledgeBase);

      // Initialize Week 2 components
      SessionMemory.init();
      QuizRecommender.init();
      LeadQualification.init();

      this.initialized = true;
      console.log('Terrnix Chatbot V2 (Week 2) initialized');
    } catch (error) {
      console.error('Chatbot initialization error:', error);
      // Fallback: use inline knowledge if fetch fails
      this.knowledgeBase = this.getFallbackKnowledge();
      ResponseBuilder.init(this.knowledgeBase);

      // Initialize Week 2 components even in fallback
      SessionMemory.init();
      QuizRecommender.init();
      LeadQualification.init();

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
    const questionType = this.detectQuestionType(message);

    // Update session memory with user message
    SessionMemory.recordUserMessage(message, intent, topic ? topic.id : null, questionType);

    // Infer lead qualification data
    LeadQualification.inferFromMessage(message, intent, topic ? topic.id : null);

    // Update calculator context
    SessionMemory.updateCalculatorContext();

    // Get enriched context
    const context = SessionMemory.getContext();

    // Check for follow-up
    const isFollowUp = SessionMemory.isFollowUp(message);
    if (isFollowUp && context.lastTopic) {
      // Enhance topic detection for follow-ups
      // e.g., "What about Scope 3?" after Scope 2 discussion
    }

    // Build base response
    let response;
    if (intent === 'fallback' && !topic) {
      response = ResponseBuilder.getFallback();
    } else {
      response = ResponseBuilder.build(intent, topic, message, context.calculatorContext);
    }

    // Calculate confidence
    const knowledgeDepth = Confidence.getKnowledgeDepth(topic ? topic.id : null, intent);
    const confidence = Confidence.calculate(intent, topic ? topic.id : null, context, knowledgeDepth);

    // Add confidence to response
    response.text = Confidence.addToResponse(response.text, confidence);
    response.confidence = confidence;

    // PDF Assistant: handle PDF-related intents
    if (intent === 'pdf_help' || message.toLowerCase().includes('pdf') || message.toLowerCase().includes('report')) {
      const pdfResponse = PDFAssistant.interpretResults(context.calculatorContext);
      response.text = pdfResponse;
      response.intent = 'pdf_help';
    }

    // Quiz Recommendation
    const quizRec = QuizRecommender.recommend(
      SessionMemory.topicsDiscussed,
      SessionMemory.engagement.messageCount,
      SessionMemory.maturity
    );

    if (quizRec && QuizRecommender.shouldRecommend(SessionMemory)) {
      response.text += QuizRecommender.format(quizRec);
      SessionMemory.recordQuizInterest();
    }

    // Record bot message in session memory
    SessionMemory.recordBotMessage(response.text, confidence.level, topic ? topic.id : null);

    // Update engagement score
    LeadQualification.calculateEngagementScore(SessionMemory);

    return response;
  },

  /**
   * Detect question type for maturity inference
   */
  detectQuestionType(message) {
    const lower = message.toLowerCase();

    if (/\b(difference|compare|versus|vs)\b/.test(lower)) {
      return 'comparison';
    }
    if (/\b(how|steps|process|guide)\b/.test(lower)) {
      return 'how-to';
    }
    if (/\b(why|reason|cause)\b/.test(lower)) {
      return 'why';
    }
    if (/\b(what is|define|meaning)\b/.test(lower)) {
      return 'definition';
    }
    if (/\b(should|recommend|advise|suggest)\b/.test(lower)) {
      return 'recommendation';
    }

    return 'general';
  },

  /**
   * Get session context (for debugging)
   */
  getSessionContext() {
    return {
      memory: SessionMemory.export(),
      leadProfile: LeadQualification.getProfile(),
      isQualifiedLead: LeadQualification.isQualifiedLead()
    };
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
   * Clear session history and memory
   */
  clearHistory() {
    SessionMemory.clear();
    LeadQualification.clear();
    QuizRecommender.init();
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TerrnixChatbot };
} else {
  window.TerrnixChatbot = TerrnixChatbot;
}
