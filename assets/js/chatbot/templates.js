/**
 * Chatbot V2 — Response Templates
 * Week 1 Implementation
 * No memory, no PDF, no quiz, no lead qualification
 */

const ChatbotTemplates = {
  /**
   * Template 1: Educational Question
   * Used for: "What is X?", "Explain Y", "How does Z work?"
   */
  educational(knowledge, skillLevel = 'beginner') {
    const r = knowledge.response || knowledge;
    let text = '';

    // Definition
    text += r.definition || r.description || '';
    text += '\n\n';

    // Why it matters (all levels)
    if (r.whyItMatters) {
      text += `**Why it matters:** ${r.whyItMatters}\n\n`;
    }

    // Key facts (all levels)
    if (r.keyFacts && r.keyFacts.length > 0) {
      text += '**Key facts:**\n';
      r.keyFacts.forEach(fact => {
        text += `• ${fact}\n`;
      });
      text += '\n';
    }

    // Categories (for Scope 3, etc.)
    if (r.categories) {
      if (r.categories.upstream) {
        text += '**Upstream categories:**\n';
        r.categories.upstream.forEach(cat => text += `• ${cat}\n`);
        text += '\n';
      }
      if (r.categories.downstream) {
        text += '**Downstream categories:**\n';
        r.categories.downstream.forEach(cat => text += `• ${cat}\n`);
        text += '\n';
      }
    }

    // Reduction actions (intermediate+)
    if (skillLevel !== 'beginner' && r.reductionActions && r.reductionActions.length > 0) {
      text += '**Reduction actions:**\n';
      r.reductionActions.forEach(action => {
        text += `• ${action}\n`;
      });
      text += '\n';
    }

    // Steps (for strategies)
    if (r.keySteps && r.keySteps.length > 0) {
      text += '**Key steps:**\n';
      r.keySteps.forEach(step => {
        text += `• ${step}\n`;
      });
      text += '\n';
    }

    // Terrnix connection
    if (r.terrnixConnection) {
      text += `💡 **Terrnix:** ${r.terrnixConnection}\n\n`;
    }

    // Link
    if (r.terrnixLink) {
      text += `📖 **Learn more:** ${r.terrnixLink}\n`;
    }

    return text.trim();
  },

  /**
   * Template 2: Regulatory Question
   * Used for: "Does X apply to me?", "When is the deadline?", "What are the requirements?"
   */
  regulatory(knowledge) {
    const r = knowledge.response || knowledge;
    let text = '';

    text += r.definition || r.description || '';
    text += '\n\n';

    if (r.keyFacts && r.keyFacts.length > 0) {
      text += '**Key regulatory facts:**\n';
      r.keyFacts.forEach(fact => {
        text += `• ${fact}\n`;
      });
      text += '\n';
    }

    if (r.terrnixConnection) {
      text += `💡 **Terrnix:** ${r.terrnixConnection}\n\n`;
    }

    if (r.terrnixLink) {
      text += `📖 **Detailed guide:** ${r.terrnixLink}\n`;
    }

    // Safety disclaimer for regulatory topics
    text += '\n⚠️ **Note:** Regulatory requirements change frequently. Verify current obligations with your legal or compliance team.';

    return text.trim();
  },

  /**
   * Template 3: Calculator Help
   * Used for: "How do I use the calculator?", "What units?", "How was this calculated?"
   */
  calculatorHelp(knowledge) {
    const r = knowledge.response || knowledge;
    let text = '';

    text += r.description || '';
    text += '\n\n';

    if (r.howToUse && r.howToUse.length > 0) {
      text += '**How to use it:**\n';
      r.howToUse.forEach(step => {
        text += `${step}\n`;
      });
      text += '\n';
    }

    if (r.features && r.features.length > 0) {
      text += '**Features:**\n';
      r.features.forEach(feature => {
        text += `• ${feature}\n`;
      });
      text += '\n';
    }

    if (r.securityNote) {
      text += `🔒 **Privacy:** ${r.securityNote}\n\n`;
    }

    if (r.terrnixLink) {
      text += `🧮 **Try it:** ${r.terrnixLink}\n`;
    }

    return text.trim();
  },

  /**
   * Template 4: Calculator Explanation
   * Used for: "Why is my X high?", "Is this number normal?", "Explain my results"
   * Requires calculator context (anonymized)
   */
  calculatorExplain(knowledge, calculatorContext) {
    let text = '';

    if (!calculatorContext || !calculatorContext.hasData) {
      text += "I can help explain your calculator results, but I don't see any data yet. ";
      text += "Please enter your activity data in the Terrnix Carbon Calculator first, then ask me about your results.\n\n";
      text += "🧮 **Calculator:** /carbon-accounting/carbon-footprint-calculator/";
      return text.trim();
    }

    const ctx = calculatorContext;

    text += `Based on your calculator inputs, here's what I see:\n\n`;

    // Scope split
    if (ctx.scopeSplit) {
      text += `**Your emission profile:**\n`;
      text += `• Scope 1: ${(ctx.scopeSplit.s1 * 100).toFixed(1)}%\n`;
      text += `• Scope 2: ${(ctx.scopeSplit.s2 * 100).toFixed(1)}%\n`;
      text += `• Scope 3: ${(ctx.scopeSplit.s3 * 100).toFixed(1)}%\n\n`;
    }

    // Top category
    if (ctx.topCategory) {
      text += `**Your highest emission source:** ${ctx.topCategory}\n\n`;
    }

    // Benchmark comparison
    if (ctx.industryBenchmark) {
      text += `**Benchmark:** Your profile is ${ctx.industryBenchmark.comparison} compared to typical ${ctx.industryBenchmark.industry} companies.\n\n`;
    }

    // Recommendations based on top source
    text += '**Suggested next steps:**\n';
    if (ctx.topCategory && ctx.topCategory.toLowerCase().includes('scope 3')) {
      text += '• Focus on supplier engagement and procurement policies\n';
      text += '• Consider spend-based vs. activity-based calculation improvements\n';
    } else if (ctx.topCategory && ctx.topCategory.toLowerCase().includes('scope 2')) {
      text += '• Explore renewable energy procurement (PPAs, green tariffs)\n';
      text += '• Evaluate on-site solar or wind opportunities\n';
    } else if (ctx.topCategory && ctx.topCategory.toLowerCase().includes('scope 1')) {
      text += '• Assess fuel switching opportunities (electric, biofuels)\n';
      text += '• Review equipment efficiency and maintenance schedules\n';
    }
    text += '• Generate a PDF report to share with stakeholders\n';
    text += '\n';

    text += `💡 **Terrnix:** Use the Academy guides to dive deeper into your top emission sources.\n`;

    return text.trim();
  },

  /**
   * Template 5: Academy Recommendation
   * Used for: "Where can I learn more?", "What guide covers X?"
   */
  academyRecommendation(topic, guide) {
    let text = '';

    text += `Based on your interest in **${topic}**, I recommend:\n\n`;
    text += `📖 **${guide.title}**\n`;
    if (guide.level) {
      text += `Level: ${guide.level}\n`;
    }
    if (guide.description) {
      text += `${guide.description}\n`;
    }
    text += `\n🔗 ${guide.url}\n`;

    return text.trim();
  },

  /**
   * Template 6: Safety / Disclaimer
   * Used for: "Is this advice reliable?", "Can I use this for audit?", "What are the limitations?"
   */
  safety() {
    let text = '';

    text += '**Important disclaimer:**\n\n';
    text += 'The information I provide is for **educational and guidance purposes only**.\n\n';
    text += '**Limitations:**\n';
    text += '• I do not provide legal, financial, or audit advice\n';
    text += '• Regulatory requirements change frequently — verify with official sources\n';
    text += '• Emission factors are estimates based on published databases\n';
    text += '• Always consult qualified sustainability professionals for compliance decisions\n\n';
    text += '**For audit use:**\n';
    text += 'The Terrnix Calculator follows GHG Protocol methodology, but third-party verification is recommended before submitting to regulators or CDP.\n\n';
    text += '**Data privacy:**\n';
    text += 'All calculations happen client-side in your browser. Your data is never sent to our servers.\n';

    return text.trim();
  },

  /**
   * Template 7: Fallback / Unknown
   * Used when intent or topic cannot be determined
   */
  fallback() {
    const suggestions = [
      'What is Scope 1, 2, or 3?',
      'How do I use the carbon calculator?',
      'What is CSRD?',
      'How do I set a science-based target?',
      'What guides are in the Academy?'
    ];

    let text = "I'm not sure I understood that. I can help you with:\n\n";
    text += '**Carbon Accounting:** Scope 1, 2, 3, GHG Protocol, emission factors\n';
    text += '**ESG Reporting:** CSRD, ISSB, TCFD, SBTi, double materiality\n';
    text += '**Terrnix Tools:** Carbon Calculator, PDF reports, Academy guides\n';
    text += '**Sustainability Strategy:** Net zero, decarbonization, carbon pricing\n\n';
    text += '**Try asking:**\n';
    suggestions.forEach((s, i) => {
      text += `${i + 1}. ${s}\n`;
    });

    return text.trim();
  },

  /**
   * Template 8: Greeting
   * Used for: "Hello", "Hi", "Hey"
   */
  greeting() {
    const greetings = [
      "Hello! I'm Terrnix AI, your sustainability assistant. I can help with carbon accounting, ESG reporting, and using our tools. What would you like to know?",
      "Hi there! Ready to talk sustainability? Ask me about emissions, regulations, or how to use the Terrnix Calculator.",
      "Hey! I'm here to help with your sustainability questions. What can I assist you with today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  },

  /**
   * Template 9: Clarification
   * Used when topic is ambiguous
   */
  clarification(possibleTopics) {
    let text = "I want to make sure I help you with the right topic. Did you mean:\n\n";
    possibleTopics.forEach((topic, i) => {
      text += `${i + 1}. ${topic.label}\n`;
    });
    text += '\nPlease clarify or ask your question with more details.';
    return text.trim();
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChatbotTemplates };
} else {
  window.ChatbotTemplates = ChatbotTemplates;
}
