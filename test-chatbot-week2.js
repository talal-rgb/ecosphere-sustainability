/**
 * Chatbot V2 Week 2 — Automated Test Suite
 * 60 tests across 6 categories
 * Target: 100% pass rate
 */

const assert = require('assert');

// Mock modules for Node.js testing
const SessionMemory = require('./assets/js/chatbot/sessionMemory.js').SessionMemory;
const Confidence = require('./assets/js/chatbot/confidence.js').Confidence;
const PDFAssistant = require('./assets/js/chatbot/pdfAssistant.js').PDFAssistant;
const QuizRecommender = require('./assets/js/chatbot/quizRecommender.js').QuizRecommender;
const LeadQualification = require('./assets/js/chatbot/leadQualification.js').LeadQualification;

// Test results
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`✗ ${name}: ${e.message}`);
  }
}

console.log('=== Chatbot V2 Week 2 Test Suite ===\n');

// ==================== CATEGORY 1: Follow-up Questions (10 tests) ====================
console.log('\n--- Category 1: Follow-up Questions ---');

test('1.1 Detect follow-up: "What about Scope 3?"', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('What is Scope 2?', 'carbon', 'scope2', 'definition');
  const isFollowUp = SessionMemory.isFollowUp('What about Scope 3?');
  assert.strictEqual(isFollowUp, true, 'Should detect follow-up');
});

test('1.2 Detect follow-up: "How do I reduce it?"', () => {
  const isFollowUp = SessionMemory.isFollowUp('How do I reduce it?');
  assert.strictEqual(isFollowUp, true, 'Should detect follow-up with pronoun');
});

test('1.3 Detect follow-up: "Tell me more"', () => {
  const isFollowUp = SessionMemory.isFollowUp('Tell me more');
  assert.strictEqual(isFollowUp, true, 'Should detect follow-up request');
});

test('1.4 Not follow-up: standalone question', () => {
  SessionMemory.clear(); // Ensure no history
  const isFollowUp = SessionMemory.isFollowUp('What is CSRD?');
  assert.strictEqual(isFollowUp, false, 'Should not detect standalone as follow-up');
});

test('1.5 Topic persistence after follow-up', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('What is Scope 2?', 'carbon', 'scope2', 'definition');
  assert.strictEqual(SessionMemory.lastTopic, 'scope2', 'Should remember last topic');
});

test('1.6 Context enrichment: previous topic available', () => {
  const context = SessionMemory.getContext();
  assert.strictEqual(context.lastTopic, 'scope2', 'Context should include last topic');
});

test('1.7 Follow-up with "Why?"', () => {
  const isFollowUp = SessionMemory.isFollowUp('Why is that important?');
  assert.strictEqual(isFollowUp, true, 'Should detect "Why" as follow-up');
});

test('1.8 Follow-up with "Can you explain?"', () => {
  const isFollowUp = SessionMemory.isFollowUp('Can you explain that?');
  assert.strictEqual(isFollowUp, true, 'Should detect request for explanation');
});

test('1.9 History tracking: user + bot messages', () => {
  SessionMemory.recordBotMessage('Scope 2 is...', 'High', 'scope2');
  assert.strictEqual(SessionMemory.history.length, 2, 'Should have 2 messages');
});

test('1.10 Recent history retrieval', () => {
  const recent = SessionMemory.getRecentHistory(1);
  assert.strictEqual(recent.length, 2, 'Should retrieve recent messages');
});

// ==================== CATEGORY 2: Memory Tests (10 tests) ====================
console.log('\n--- Category 2: Memory Tests ---');

test('2.1 Topic tracking: 3 topics', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('What is Scope 1?', 'carbon', 'scope1', 'definition');
  SessionMemory.recordUserMessage('What is Scope 2?', 'carbon', 'scope2', 'definition');
  SessionMemory.recordUserMessage('What is Scope 3?', 'carbon', 'scope3', 'definition');
  assert.strictEqual(SessionMemory.topicsDiscussed.size, 3, 'Should track 3 topics');
});

test('2.2 Topic deduplication', () => {
  SessionMemory.recordUserMessage('Tell me more about Scope 1', 'carbon', 'scope1', 'definition');
  assert.strictEqual(SessionMemory.topicsDiscussed.size, 3, 'Should not duplicate topics');
});

test('2.3 Maturity inference: beginner', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('What is carbon accounting?', 'carbon', 'carbon-accounting', 'definition');
  assert.strictEqual(SessionMemory.maturity, 'beginner', 'Should infer beginner');
});

test('2.4 Maturity inference: intermediate', () => {
  SessionMemory.recordUserMessage('What is Scope 3 category 1?', 'carbon', 'scope3', 'definition');
  assert.strictEqual(SessionMemory.maturity, 'intermediate', 'Should upgrade to intermediate');
});

test('2.5 Maturity inference: advanced', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('How do I calculate emission factors using activity-based method with GWP values and verification?', 'carbon', 'emission-factors', 'how-to');
  assert.strictEqual(SessionMemory.maturity, 'advanced', 'Should upgrade to advanced');
});

test('2.6 Calculator context: no data', () => {
  SessionMemory.clear();
  SessionMemory.updateCalculatorContext();
  assert.strictEqual(SessionMemory.calculatorContext.hasData, false, 'Should detect no calculator data');
});

test('2.7 Engagement tracking: message count', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('What is Scope 1?', 'carbon', 'scope1', 'definition');
  SessionMemory.recordUserMessage('What is Scope 2?', 'carbon', 'scope2', 'definition');
  SessionMemory.recordUserMessage('What is Scope 3?', 'carbon', 'scope3', 'definition');
  assert.strictEqual(SessionMemory.engagement.messageCount, 3, 'Should count messages');
});

test('2.8 Engagement tracking: topics explored', () => {
  SessionMemory.clear();
  SessionMemory.recordUserMessage('What is Scope 1?', 'carbon', 'scope1', 'definition');
  SessionMemory.recordUserMessage('What is Scope 2?', 'carbon', 'scope2', 'definition');
  SessionMemory.recordUserMessage('What is Scope 3?', 'carbon', 'scope3', 'definition');
  assert.strictEqual(SessionMemory.engagement.topicsExplored, 3, 'Should count topics');
});

test('2.9 Guide view tracking', () => {
  SessionMemory.recordGuideView('/carbon-accounting/scope-1-emissions/');
  assert.strictEqual(SessionMemory.engagement.guidesViewed.length, 1, 'Should track guide view');
});

test('2.10 Memory clear', () => {
  SessionMemory.clear();
  assert.strictEqual(SessionMemory.history.length, 0, 'Should clear history');
  assert.strictEqual(SessionMemory.topicsDiscussed.size, 0, 'Should clear topics');
});

// ==================== CATEGORY 3: PDF Interpretation (10 tests) ====================
console.log('\n--- Category 3: PDF Interpretation ---');

test('3.1 PDF structure explanation', () => {
  const response = PDFAssistant.explainStructure();
  assert(response.includes('9-page'), 'Should mention 9 pages');
  assert(response.includes('Cover'), 'Should mention Cover page');
  assert(response.includes('Executive Summary'), 'Should mention Executive Summary');
});

test('3.2 PDF disclaimer included', () => {
  const response = PDFAssistant.explainStructure();
  assert(response.includes('educational'), 'Should include educational disclaimer');
  assert(response.includes('not constitute regulatory compliance'), 'Should mention no compliance claims');
});

test('3.3 PDF interpretation: no calculator data', () => {
  const response = PDFAssistant.interpretResults({ hasData: false });
  assert(response.includes('9-page'), 'Should explain structure when no data');
});

test('3.4 PDF interpretation: with calculator data', () => {
  const context = {
    hasData: true,
    scope1: 10,
    scope2: 30,
    scope3: 60,
    total: 100,
    percentages: { scope1: '10.0', scope2: '30.0', scope3: '60.0' }
  };
  const response = PDFAssistant.interpretResults(context);
  assert(response.includes('100.00 tCO2e'), 'Should show total');
  assert(response.includes('Scope 3'), 'Should mention top contributor');
});

test('3.5 PDF section explanation: Executive Summary', () => {
  const response = PDFAssistant.explainSection('Executive Summary');
  assert(response.includes('high-level overview'), 'Should explain Executive Summary');
});

test('3.6 PDF section explanation: Methodology', () => {
  const response = PDFAssistant.explainSection('Methodology');
  assert(response.includes('GHG Protocol'), 'Should mention GHG Protocol');
});

test('3.7 PDF section explanation: unknown section', () => {
  const response = PDFAssistant.explainSection('Random Section');
  assert(response.includes("don't have specific information"), 'Should handle unknown section');
});

test('3.8 PDF usage tips', () => {
  const response = PDFAssistant.getUsageTips();
  assert(response.includes('Leadership'), 'Should include leadership tips');
  assert(response.includes('Sustainability Teams'), 'Should include team tips');
});

test('3.9 PDF interpretation: Scope 3 dominant', () => {
  const context = {
    hasData: true,
    scope1: 5,
    scope2: 15,
    scope3: 80,
    total: 100,
    percentages: { scope1: '5.0', scope2: '15.0', scope3: '80.0' }
  };
  const response = PDFAssistant.interpretResults(context);
  assert(response.includes('supplier engagement'), 'Should recommend supplier engagement');
});

test('3.10 PDF interpretation: Scope 2 dominant', () => {
  const context = {
    hasData: true,
    scope1: 10,
    scope2: 50,
    scope3: 40,
    total: 100,
    percentages: { scope1: '10.0', scope2: '50.0', scope3: '40.0' }
  };
  const response = PDFAssistant.interpretResults(context);
  assert(response.includes('renewable energy'), 'Should recommend renewable energy');
});

// ==================== CATEGORY 4: Quiz Recommendations (10 tests) ====================
console.log('\n--- Category 4: Quiz Recommendations ---');

test('4.1 Recommend Carbon Readiness Quiz', () => {
  QuizRecommender.init();
  const topics = new Set(['scope1', 'scope2', 'scope3']);
  const rec = QuizRecommender.recommend(topics, 5, 'intermediate');
  assert(rec !== null, 'Should recommend a quiz');
  assert(rec.quiz.includes('Carbon'), 'Should recommend Carbon quiz');
});

test('4.2 Recommend ESG Maturity Quiz', () => {
  const topics = new Set(['csrd', 'esrs', 'double-materiality']);
  const rec = QuizRecommender.recommend(topics, 5, 'intermediate');
  assert(rec !== null, 'Should recommend a quiz');
  assert(rec.quiz.includes('ESG'), 'Should recommend ESG quiz');
});

test('4.3 No recommendation: too few messages', () => {
  const topics = new Set(['scope1', 'scope2']);
  const rec = QuizRecommender.recommend(topics, 2, 'beginner');
  assert.strictEqual(rec, null, 'Should not recommend too early');
});

test('4.4 No recommendation: irrelevant topics', () => {
  const topics = new Set(['greeting', 'fallback']);
  const rec = QuizRecommender.recommend(topics, 5, 'beginner');
  assert.strictEqual(rec, null, 'Should not recommend for irrelevant topics');
});

test('4.5 Recommendation formatting', () => {
  QuizRecommender.init();
  const topics = new Set(['scope1', 'scope2']);
  const rec = QuizRecommender.recommend(topics, 5, 'beginner');
  assert(rec !== null, 'Should have a recommendation');
  const formatted = QuizRecommender.format(rec);
  assert(formatted.includes('Quiz Recommendation'), 'Should format recommendation');
});

test('4.6 Max recommendations per session', () => {
  QuizRecommender.init();
  const topics = new Set(['scope1', 'scope2', 'scope3']);
  QuizRecommender.recommend(topics, 5, 'beginner');
  QuizRecommender.recommend(topics, 6, 'beginner');
  const rec = QuizRecommender.recommend(topics, 7, 'beginner');
  assert.strictEqual(rec, null, 'Should limit recommendations');
});

test('4.7 Should recommend check', () => {
  const mockMemory = { engagement: { quizInterest: false, messageCount: 5 } };
  const shouldRec = QuizRecommender.shouldRecommend(mockMemory);
  assert.strictEqual(shouldRec, true, 'Should allow recommendation');
});

test('4.8 Should not recommend if quiz taken', () => {
  const mockMemory = { engagement: { quizInterest: true, messageCount: 5 } };
  const shouldRec = QuizRecommender.shouldRecommend(mockMemory);
  assert.strictEqual(shouldRec, false, 'Should not recommend if already interested');
});

test('4.9 Get available quizzes', () => {
  const quizzes = QuizRecommender.getAvailableQuizzes();
  assert.strictEqual(quizzes.length, 3, 'Should list 3 quizzes');
  assert(quizzes[0].name.includes('Carbon'), 'Should include Carbon quiz');
});

test('4.10 Quiz recommendation relevance', () => {
  QuizRecommender.init();
  const topics = new Set(['net-zero', 'sbti', 'decarbonization']);
  const rec = QuizRecommender.recommend(topics, 5, 'advanced');
  assert(rec !== null, 'Should recommend for strategy topics');
  assert(rec.quiz.includes('Strategy'), 'Should recommend Strategy quiz');
});

// ==================== CATEGORY 5: Lead Qualification (10 tests) ====================
console.log('\n--- Category 5: Lead Qualification ---');

test('5.1 Infer industry: manufacturing', () => {
  LeadQualification.init();
  LeadQualification.inferFromMessage('I work in manufacturing', 'general', null);
  assert.strictEqual(LeadQualification.getProfile().industry, 'manufacturing', 'Should infer manufacturing');
});

test('5.2 Infer industry: technology', () => {
  LeadQualification.init();
  LeadQualification.inferFromMessage('Our SaaS company...', 'general', null);
  assert.strictEqual(LeadQualification.getProfile().industry, 'technology', 'Should infer technology');
});

test('5.3 Infer company size: enterprise', () => {
  LeadQualification.init();
  LeadQualification.inferFromMessage('We have 1000+ employees', 'general', null);
  assert.strictEqual(LeadQualification.getProfile().companySize, 'enterprise', 'Should infer enterprise');
});

test('5.4 Infer maturity: beginner', () => {
  LeadQualification.init();
  LeadQualification.inferFromMessage('I am new to carbon accounting and don\'t know where to start', 'general', null);
  const maturity = LeadQualification.getProfile().reportingMaturity;
  assert(maturity === 'beginner' || maturity === null, 'Should infer beginner or null');
});

test('5.5 Infer maturity: advanced', () => {
  LeadQualification.inferFromMessage('We have science-based targets', 'general', null);
  assert.strictEqual(LeadQualification.getProfile().reportingMaturity, 'advanced', 'Should infer advanced');
});

test('5.6 Engagement score calculation', () => {
  const mockMemory = {
    engagement: {
      messageCount: 10,
      topicsExplored: 5,
      calculatorUsed: true,
      guidesViewed: ['/guide1', '/guide2'],
      quizInterest: true
    }
  };
  const score = LeadQualification.calculateEngagementScore(mockMemory);
  assert(score > 50, 'Should calculate high engagement score');
});

test('5.7 Qualified lead detection', () => {
  const mockMemory = {
    engagement: {
      messageCount: 20,
      topicsExplored: 8,
      calculatorUsed: true,
      guidesViewed: ['/guide1', '/guide2', '/guide3'],
      quizInterest: true
    }
  };
  LeadQualification.calculateEngagementScore(mockMemory);
  assert.strictEqual(LeadQualification.isQualifiedLead(), true, 'Should detect qualified lead');
});

test('5.8 Not qualified: low engagement', () => {
  LeadQualification.init();
  const mockMemory = {
    engagement: {
      messageCount: 2,
      topicsExplored: 1,
      calculatorUsed: false,
      guidesViewed: [],
      quizInterest: false
    }
  };
  LeadQualification.calculateEngagementScore(mockMemory);
  assert.strictEqual(LeadQualification.isQualifiedLead(), false, 'Should not qualify low engagement');
});

test('5.9 Profile summary', () => {
  LeadQualification.init();
  LeadQualification.inferFromMessage('I work in manufacturing with 500 employees', 'general', null);
  const summary = LeadQualification.getSummary();
  assert(summary.includes('manufacturing'), 'Summary should include industry');
});

test('5.10 No PII captured', () => {
  LeadQualification.init();
  LeadQualification.inferFromMessage('My name is John at Acme Corp', 'general', null);
  const profile = LeadQualification.getProfile();
  assert.strictEqual(profile.industry, null, 'Should not infer from names');
  assert.strictEqual(profile.companySize, null, 'Should not capture company names');
});

// ==================== CATEGORY 6: Confidence Levels (10 tests) ====================
console.log('\n--- Category 6: Confidence Levels ---');

test('6.1 High confidence: established standard', () => {
  const confidence = Confidence.calculate('carbon', 'scope1', { maturity: 'beginner' }, 'established_standard');
  assert.strictEqual(confidence.level, 'High', 'Should be High for established standard');
  assert(confidence.reason.includes('GHG Protocol'), 'Should mention GHG Protocol');
});

test('6.2 High confidence: regulatory framework', () => {
  const confidence = Confidence.calculate('regulatory', 'csrd', { maturity: 'intermediate' }, 'regulatory_framework');
  assert.strictEqual(confidence.level, 'High', 'Should be High for regulatory');
});

test('6.3 High confidence: Terrnix feature', () => {
  const confidence = Confidence.calculate('calculator_help', 'calculator', { maturity: 'beginner' }, 'terrnix_feature');
  assert.strictEqual(confidence.level, 'High', 'Should be High for Terrnix feature');
});

test('6.4 Medium confidence: general guidance', () => {
  const confidence = Confidence.calculate('sustainability_strategy', 'net-zero', { maturity: 'intermediate' }, 'general_guidance');
  assert.strictEqual(confidence.level, 'Medium', 'Should be Medium for general guidance');
});

test('6.5 Low confidence: unknown', () => {
  const confidence = Confidence.calculate('unknown', null, { maturity: 'beginner' }, 'unknown');
  assert.strictEqual(confidence.level, 'Low', 'Should be Low for unknown');
});

test('6.6 Confidence formatting', () => {
  const confidence = { level: 'High', reason: 'Test reason' };
  const formatted = Confidence.format(confidence);
  assert(formatted.includes('Confidence: High'), 'Should format confidence level');
  assert(formatted.includes('Test reason'), 'Should format reason');
});

test('6.7 Confidence icon: High', () => {
  const icon = Confidence.getIcon('High');
  assert.strictEqual(icon, '✓', 'High should have checkmark');
});

test('6.8 Confidence icon: Low', () => {
  const icon = Confidence.getIcon('Low');
  assert.strictEqual(icon, '?', 'Low should have question mark');
});

test('6.9 Add confidence to response', () => {
  const response = Confidence.addToResponse('Test response', { level: 'High', reason: 'Test' });
  assert(response.includes('Confidence: High'), 'Should add confidence to response');
  assert(response.includes('Test'), 'Should add reason to response');
});

test('6.10 Knowledge depth detection', () => {
  const depth = Confidence.getKnowledgeDepth('scope1', 'carbon');
  assert.strictEqual(depth, 'established_standard', 'Should detect established standard');
});

// ==================== SUMMARY ====================
console.log('\n=== Test Summary ===');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);

if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}

const passRate = ((passed / (passed + failed)) * 100).toFixed(1);
console.log(`\nPass Rate: ${passRate}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Week 2 implementation is solid.');
} else {
  console.log('\n⚠️ Some tests failed. Review and fix before proceeding.');
}

process.exit(failed > 0 ? 1 : 0);
