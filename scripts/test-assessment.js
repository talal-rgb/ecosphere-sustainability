/**
 * Terrnix Assessment Engine - Automated Tests
 * Validates assessment JSON, scoring, and engine behaviour
 */

const fs = require('fs');
const path = require('path');

// Load assessment
const assessmentPath = path.join(__dirname, '..', 'data', 'assessments', 'carbon-accounting-readiness.json');
const assessment = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.error(`FAIL: ${name}`);
    console.error(`  ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// ===== JSON STRUCTURE TESTS =====

test('Assessment has required top-level fields', () => {
  assert(assessment.id, 'Missing id');
  assert(assessment.slug, 'Missing slug');
  assert(assessment.version, 'Missing version');
  assert(assessment.metadata, 'Missing metadata');
  assert(assessment.categories, 'Missing categories');
  assert(assessment.questions, 'Missing questions');
  assert(assessment.maturityLevels, 'Missing maturityLevels');
});

test('Metadata has required fields', () => {
  assert(assessment.metadata.title, 'Missing metadata.title');
  assert(assessment.metadata.description, 'Missing metadata.description');
  assert(assessment.metadata.estimatedDuration, 'Missing metadata.estimatedDuration');
});

test('Assessment has exactly 5 categories', () => {
  assertEqual(assessment.categories.length, 5, `Expected 5 categories, got ${assessment.categories.length}`);
});

test('Assessment has exactly 25 questions', () => {
  assertEqual(assessment.questions.length, 25, `Expected 25 questions, got ${assessment.questions.length}`);
});

test('Each category has exactly 5 questions', () => {
  for (const category of assessment.categories) {
    const count = assessment.questions.filter(q => q.category === category.id).length;
    assertEqual(count, 5, `Category ${category.id} has ${count} questions, expected 5`);
  }
});

test('All questions have required fields', () => {
  for (const question of assessment.questions) {
    assert(question.id, `Question missing id`);
    assert(question.category, `Question ${question.id} missing category`);
    assert(question.text, `Question ${question.id} missing text`);
    assert(question.options, `Question ${question.id} missing options`);
    assert(question.options.length === 5, `Question ${question.id} has ${question.options.length} options, expected 5`);
  }
});

test('All questions have valid category references', () => {
  const categoryIds = new Set(assessment.categories.map(c => c.id));
  for (const question of assessment.questions) {
    assert(categoryIds.has(question.category), `Question ${question.id} has invalid category: ${question.category}`);
  }
});

test('All options have value and score fields', () => {
  for (const question of assessment.questions) {
    for (const option of question.options) {
      assert(option.value !== undefined, `Option missing value in question ${question.id}`);
      assert(option.score !== undefined, `Option missing score in question ${question.id}`);
      assert(option.label, `Option missing label in question ${question.id}`);
    }
  }
});

test('Option values are 0-4', () => {
  for (const question of assessment.questions) {
    for (const option of question.options) {
      assert(option.value >= 0 && option.value <= 4, `Option value ${option.value} out of range in question ${question.id}`);
    }
  }
});

test('Option scores are 0, 25, 50, 75, 100', () => {
  const validScores = [0, 25, 50, 75, 100];
  for (const question of assessment.questions) {
    for (const option of question.options) {
      assert(validScores.includes(option.score), `Option score ${option.score} invalid in question ${question.id}`);
    }
  }
});

test('Category weights sum to 1.0', () => {
  const total = assessment.categories.reduce((sum, c) => sum + c.weight, 0);
  assert(Math.abs(total - 1.0) < 0.01, `Category weights sum to ${total}, expected 1.0`);
});

test('Maturity levels cover 0-100', () => {
  assertEqual(assessment.maturityLevels[0].min, 0, 'First maturity level min should be 0');
  assertEqual(assessment.maturityLevels[assessment.maturityLevels.length - 1].max, 100, 'Last maturity level max should be 100');
});

test('Maturity levels have 5 levels', () => {
  assertEqual(assessment.maturityLevels.length, 5, `Expected 5 maturity levels, got ${assessment.maturityLevels.length}`);
});

test('Maturity levels are contiguous', () => {
  for (let i = 0; i < assessment.maturityLevels.length - 1; i++) {
    const current = assessment.maturityLevels[i];
    const next = assessment.maturityLevels[i + 1];
    assertEqual(current.max + 1, next.min, `Gap between maturity levels ${current.id} and ${next.id}`);
  }
});

// ===== CONTENT QUALITY TESTS =====

test('No em dashes in assessment content', () => {
  const content = JSON.stringify(assessment);
  const emDashCount = (content.match(/\u2014/g) || []).length;
  assertEqual(emDashCount, 0, `Found ${emDashCount} em dashes in assessment content`);
});

test('No forbidden AI phrases in content', () => {
  const forbiddenPhrases = [
    'here is what changed',
    'bottom line',
    'key takeaways',
    'what this means',
    'what to do now',
    'the reality is',
    'in today\'s world',
    'game changer',
    'revolutionary',
    'this changes everything',
    'now more than ever',
    'it is important to note',
    'needless to say',
    'needless to mention',
    'as we move forward'
  ];

  const content = JSON.stringify(assessment).toLowerCase();
  const found = [];
  for (const phrase of forbiddenPhrases) {
    if (content.includes(phrase)) {
      found.push(phrase);
    }
  }
  assertEqual(found.length, 0, `Found forbidden phrases: ${found.join(', ')}`);
});

test('All URLs are from terrnix.com domain', () => {
  const urls = [];
  const extractUrls = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('http')) {
        urls.push(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractUrls(obj[key]);
      }
    }
  };
  extractUrls(assessment);

  const nonTerrnix = urls.filter(url => !url.includes('terrnix.com'));
  assertEqual(nonTerrnix.length, 0, `Found non-Terrnix URLs: ${nonTerrnix.join(', ')}`);
});

// ===== SCORING TESTS =====

function calculateScore(answers) {
  const categoryScores = {};
  for (const category of assessment.categories) {
    const categoryQuestions = assessment.questions.filter(q => q.category === category.id);
    let weightedSum = 0;
    let totalWeight = 0;
    for (const question of categoryQuestions) {
      const answer = answers[question.id];
      if (answer !== undefined) {
        const option = question.options.find(o => o.value === answer);
        if (option) {
          weightedSum += option.score * (question.weight || 1.0);
          totalWeight += (question.weight || 1.0);
        }
      }
    }
    categoryScores[category.id] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  let overall = 0;
  for (const category of assessment.categories) {
    overall += categoryScores[category.id] * category.weight;
  }

  return Math.round(overall);
}

function getMaturityLevel(score) {
  return assessment.maturityLevels.find(l => score >= l.min && score <= l.max);
}

test('All minimum answers score 0', () => {
  const answers = {};
  for (const question of assessment.questions) {
    answers[question.id] = 0;
  }
  const score = calculateScore(answers);
  assertEqual(score, 0, `Expected score 0, got ${score}`);
});

test('All maximum answers score 100', () => {
  const answers = {};
  for (const question of assessment.questions) {
    answers[question.id] = 4;
  }
  const score = calculateScore(answers);
  assertEqual(score, 100, `Expected score 100, got ${score}`);
});

test('Mixed answers produce score between 0 and 100', () => {
  const answers = {};
  for (const question of assessment.questions) {
    answers[question.id] = Math.floor(Math.random() * 5);
  }
  const score = calculateScore(answers);
  assert(score >= 0 && score <= 100, `Score ${score} out of range`);
});

test('Score exactly 29 maps to Initial maturity', () => {
  const level = getMaturityLevel(29);
  assertEqual(level.id, 'initial', `Expected Initial, got ${level.id}`);
});

test('Score exactly 30 maps to Developing maturity', () => {
  const level = getMaturityLevel(30);
  assertEqual(level.id, 'developing', `Expected Developing, got ${level.id}`);
});

test('Score exactly 49 maps to Developing maturity', () => {
  const level = getMaturityLevel(49);
  assertEqual(level.id, 'developing', `Expected Developing, got ${level.id}`);
});

test('Score exactly 50 maps to Established maturity', () => {
  const level = getMaturityLevel(50);
  assertEqual(level.id, 'established', `Expected Established, got ${level.id}`);
});

test('Score exactly 69 maps to Established maturity', () => {
  const level = getMaturityLevel(69);
  assertEqual(level.id, 'established', `Expected Established, got ${level.id}`);
});

test('Score exactly 70 maps to Advanced maturity', () => {
  const level = getMaturityLevel(70);
  assertEqual(level.id, 'advanced', `Expected Advanced, got ${level.id}`);
});

test('Score exactly 84 maps to Advanced maturity', () => {
  const level = getMaturityLevel(84);
  assertEqual(level.id, 'advanced', `Expected Advanced, got ${level.id}`);
});

test('Score exactly 85 maps to Leading maturity', () => {
  const level = getMaturityLevel(85);
  assertEqual(level.id, 'leading', `Expected Leading, got ${level.id}`);
});

test('Score exactly 100 maps to Leading maturity', () => {
  const level = getMaturityLevel(100);
  assertEqual(level.id, 'leading', `Expected Leading, got ${level.id}`);
});

// ===== RECOMMENDATION TESTS =====

test('Recommendations include articles', () => {
  assert(assessment.recommendations.articles.length > 0, 'No articles in recommendations');
});

test('Recommendations include calculators', () => {
  assert(assessment.recommendations.calculators.length > 0, 'No calculators in recommendations');
});

test('Recommendations include services', () => {
  assert(assessment.recommendations.services.length > 0, 'No services in recommendations');
});

test('All recommendation articles have valid URLs', () => {
  for (const article of assessment.recommendations.articles) {
    assert(article.url, `Article ${article.id} missing URL`);
    assert(article.url.includes('terrnix.com'), `Article ${article.id} has invalid URL: ${article.url}`);
  }
});

test('All recommendation calculators have valid URLs', () => {
  for (const calc of assessment.recommendations.calculators) {
    assert(calc.url, `Calculator ${calc.id} missing URL`);
    assert(calc.url.includes('terrnix.com'), `Calculator ${calc.id} has invalid URL: ${calc.url}`);
  }
});

// ===== CERTIFICATE TESTS =====

test('Certificate has 5 levels', () => {
  assertEqual(assessment.certificate.levels.length, 5, `Expected 5 certificate levels, got ${assessment.certificate.levels.length}`);
});

test('Certificate levels cover 0-100', () => {
  assertEqual(assessment.certificate.levels[0].minScore, 0, 'First certificate level min should be 0');
  assertEqual(assessment.certificate.levels[assessment.certificate.levels.length - 1].maxScore, 100, 'Last certificate level max should be 100');
});

// ===== REPORT =====
console.log('\n========================================');
console.log('TERRNIX ASSESSMENT TEST RESULTS');
console.log('========================================');
console.log(`Assessment: ${assessment.metadata.title}`);
console.log(`Questions: ${assessment.questions.length}`);
console.log(`Categories: ${assessment.categories.length}`);
console.log('----------------------------------------');
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Total:  ${results.passed + results.failed}`);
console.log('----------------------------------------');

if (results.failed > 0) {
  console.log('\nFailed tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.name}: ${t.error}`);
  });
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
  process.exit(0);
}
