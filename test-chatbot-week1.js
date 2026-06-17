/**
 * Chatbot V2 Week 1 — Test Suite
 * Run with: node test-chatbot-week1.js
 */

const fs = require('fs');
const path = require('path');

// Mock DOM for Node.js testing
const mockDOM = {
  elements: {},
  getElementById(id) {
    return this.elements[id] || null;
  },
  querySelectorAll(selector) {
    return [];
  }
};
global.document = mockDOM;

// Load chatbot modules
const knowledgePath = path.join(__dirname, 'assets/js/chatbot/knowledge.json');
const knowledgeJson = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));

// Load JS modules (simplified for Node)
const { ChatbotTemplates } = require('./assets/js/chatbot/templates.js');
const { IntentDetector } = require('./assets/js/chatbot/intentDetector.js');
const { TopicDetector } = require('./assets/js/chatbot/topicDetector.js');
const { CalculatorBridge } = require('./assets/js/chatbot/calculator-bridge.js');
const { AcademyBridge } = require('./assets/js/chatbot/academy-bridge.js');
const { ResponseBuilder } = require('./assets/js/chatbot/responseBuilder.js');
const { TerrnixChatbot } = require('./assets/js/chatbot/index.js');

// Initialize
ResponseBuilder.init(knowledgeJson);

// Test cases
const testCases = [
  // === CARBON ACCOUNTING (12 cases) ===
  { prompt: "What is Scope 1?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-1" },
  { prompt: "Explain Scope 2 emissions", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-2" },
  { prompt: "How do I calculate Scope 3?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-3" },
  { prompt: "What is the GHG Protocol?", category: "carbon", expectedIntent: "educational", expectedTopic: "ghg-protocol" },
  { prompt: "What are emission factors?", category: "carbon", expectedIntent: "educational", expectedTopic: "emission-factors" },
  { prompt: "What's the difference between carbon neutral and net zero?", category: "carbon", expectedIntent: "educational", expectedTopic: "carbon-neutral-vs-net-zero" },
  { prompt: "How do I reduce Scope 1 emissions?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-1" },
  { prompt: "What is location-based vs market-based?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-2" },
  { prompt: "Which Scope 3 category is biggest?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-3" },
  { prompt: "What is the biggest Scope 3 category?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-3" },
  { prompt: "What is the largest Scope 3 category?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-3" },
  { prompt: "What GWP values should I use?", category: "carbon", expectedIntent: "educational", expectedTopic: "gwp" },
  { prompt: "What emission factor should I use for diesel?", category: "carbon", expectedIntent: "educational", expectedTopic: "emission-factors" },
  { prompt: "What are the 15 Scope 3 categories?", category: "carbon", expectedIntent: "educational", expectedTopic: "scope-3" },

  // === CALCULATOR (7 cases) ===
  { prompt: "How do I use the calculator?", category: "calculator", expectedIntent: "educational", expectedTopic: "calculator" },
  { prompt: "Show me how to use the calculator", category: "calculator", expectedIntent: "educational", expectedTopic: "calculator" },
  { prompt: "What units should I use for fuel?", category: "calculator", expectedIntent: "educational", expectedTopic: "scope-1" },
  { prompt: "How do I enter electricity data?", category: "calculator", expectedIntent: "educational", expectedTopic: "scope-2" },
  { prompt: "How was my total calculated?", category: "calculator", expectedIntent: "calculatorExplain", expectedTopic: "calculator" },
  { prompt: "Explain my calculator results", category: "calculator", expectedIntent: "educational", expectedTopic: "calculator" },
  { prompt: "Help me understand my results", category: "calculator", expectedIntent: "calculatorExplain", expectedTopic: null },
  { prompt: "Why is my Scope 3 so high?", category: "calculator", expectedIntent: "calculatorExplain", expectedTopic: "scope-3" },
  { prompt: "Is 10,000 tonnes a lot?", category: "calculator", expectedIntent: "calculatorExplain", expectedTopic: null },

  // === ESG/CSRD (6 cases) ===
  { prompt: "What is CSRD?", category: "esg", expectedIntent: "educational", expectedTopic: "csrd" },
  { prompt: "Does CSRD apply to my company?", category: "esg", expectedIntent: "regulatory", expectedTopic: "csrd" },
  { prompt: "What is double materiality?", category: "esg", expectedIntent: "educational", expectedTopic: "csrd" },
  { prompt: "Explain double materiality under CSRD", category: "esg", expectedIntent: "educational", expectedTopic: "csrd" },
  { prompt: "What is ISSB?", category: "esg", expectedIntent: "educational", expectedTopic: "issb" },
  { prompt: "What is SBTi?", category: "esg", expectedIntent: "educational", expectedTopic: "sbti" },

  // === ACADEMY (7 cases) ===
  { prompt: "Where can I learn more about Scope 3?", category: "academy", expectedIntent: "academyRequest", expectedTopic: "scope-3" },
  { prompt: "What guides do you have?", category: "academy", expectedIntent: "academyRequest", expectedTopic: null },
  { prompt: "I want to learn about carbon accounting", category: "academy", expectedIntent: "educational", expectedTopic: null },
  { prompt: "Teach me about carbon accounting", category: "academy", expectedIntent: "educational", expectedTopic: null },
  { prompt: "Recommend a guide for beginners", category: "academy", expectedIntent: "academyRequest", expectedTopic: "scope-2" },
  { prompt: "What beginner guides do you have?", category: "academy", expectedIntent: "academyRequest", expectedTopic: "academy" },
  { prompt: "List your beginner guides", category: "academy", expectedIntent: "academyRequest", expectedTopic: "academy" },
  { prompt: "What should I read about CSRD?", category: "academy", expectedIntent: "academyRequest", expectedTopic: "csrd" },

  // === SAFETY/DISCLAIMER (6 cases) ===
  { prompt: "Is this advice reliable?", category: "safety", expectedIntent: "safety", expectedTopic: null },
  { prompt: "Can I use this for audit?", category: "safety", expectedIntent: "safety", expectedTopic: null },
  { prompt: "What are the limitations?", category: "safety", expectedIntent: "safety", expectedTopic: null },
  { prompt: "Is this legally binding?", category: "safety", expectedIntent: "safety", expectedTopic: null },
  { prompt: "Can I trust these emission factors?", category: "safety", expectedIntent: "safety", expectedTopic: "emission-factors" },
  { prompt: "Are these numbers accurate?", category: "safety", expectedIntent: "safety", expectedTopic: null }
];

// Run tests
console.log('=== Chatbot V2 Week 1 Test Suite ===\n');

let passed = 0;
let failed = 0;
const results = [];

for (const test of testCases) {
  const intent = IntentDetector.detect(test.prompt);
  const topic = TopicDetector.detect(test.prompt);
  const topicId = topic ? topic.id : null;

  const intentMatch = intent === test.expectedIntent;
  const topicMatch = test.expectedTopic === null ? topicId === null : topicId === test.expectedTopic;

  const success = intentMatch && topicMatch;

  if (success) {
    passed++;
  } else {
    failed++;
  }

  results.push({
    prompt: test.prompt,
    category: test.category,
    expectedIntent: test.expectedIntent,
    actualIntent: intent,
    expectedTopic: test.expectedTopic,
    actualTopic: topicId,
    success
  });

  const status = success ? '✅' : '❌';
  console.log(`${status} [${test.category}] "${test.prompt}"`);
  if (!success) {
    if (!intentMatch) console.log(`   Intent: expected "${test.expectedIntent}", got "${intent}"`);
    if (!topicMatch) console.log(`   Topic: expected "${test.expectedTopic}", got "${topicId}"`);
  }
}

console.log(`\n=== Results ===`);
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

// Response quality tests
console.log(`\n=== Response Quality Tests ===`);

const qualityTests = [
  { prompt: "What is Scope 1?", check: (text) => text.includes('direct') && text.includes('fuel') },
  { prompt: "What is CSRD?", check: (text) => text.includes('Corporate Sustainability Reporting Directive') || text.includes('EU') },
  { prompt: "How do I use the calculator?", check: (text) => text.includes('calculator') || text.includes('Terrnix') },
  { prompt: "Is this advice reliable?", check: (text) => text.includes('educational') || text.includes('disclaimer') },
  { prompt: "Hello", check: (text) => text.includes('Terrnix') || text.includes('sustainability') }
];

let qualityPassed = 0;
for (const test of qualityTests) {
  const response = ResponseBuilder.build(
    IntentDetector.detect(test.prompt),
    TopicDetector.detect(test.prompt),
    test.prompt
  );
  const quality = test.check(response.text);
  if (quality) qualityPassed++;
  console.log(`${quality ? '✅' : '❌'} "${test.prompt}" → ${quality ? 'Good response' : 'Weak response'}`);
  if (!quality) {
    console.log(`   Response: ${response.text.substring(0, 100)}...`);
  }
}

console.log(`\nQuality Rate: ${((qualityPassed / qualityTests.length) * 100).toFixed(1)}%`);

// Summary
console.log(`\n=== Week 1 Test Summary ===`);
console.log(`Intent/Topic Detection: ${((passed / testCases.length) * 100).toFixed(1)}%`);
console.log(`Response Quality: ${((qualityPassed / qualityTests.length) * 100).toFixed(1)}%`);

if (failed === 0 && qualityPassed === qualityTests.length) {
  console.log(`\n🎉 All tests passed! Week 1 implementation is ready.`);
} else {
  console.log(`\n⚠️  Some tests failed. Review and fix before proceeding.`);
}
