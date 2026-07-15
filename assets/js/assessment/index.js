/**
 * Terrnix Assessment Engine - Module Entry Point
 * Exports all assessment modules and provides initialisation helper
 */

// Module references (loaded via script tags or ES modules)
const AssessmentModules = {
  Engine: AssessmentEngine,
  State: AssessmentState,
  UI: AssessmentUI,
  Scoring: AssessmentScoring,
  Analytics: AssessmentAnalytics,
  Utils: AssessmentUtils
};

/**
 * Initialise an assessment on a container element
 */
function initAssessment(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Assessment container not found: ${containerId}`);
    return null;
  }

  const engine = new AssessmentEngine(containerId, options);

  // Wire UI callbacks to engine methods
  engine.ui.onStart = () => engine.showScreen('question');
  engine.ui.onPrevious = () => engine.previous();
  engine.ui.onNext = () => engine.next();
  engine.ui.onAnswer = (questionId, value) => {
    engine.answer(questionId, value);
    engine.next();
  };
  engine.ui.onEditQuestion = (index) => engine.goToQuestion(index);
  engine.ui.onSubmit = () => engine.submit();
  engine.ui.onLeadSubmit = (e) => {
    e.preventDefault();
    handleLeadSubmit(engine, e.target);
  };

  return engine;
}

/**
 * Handle lead form submission
 */
async function handleLeadSubmit(engine, form) {
  const name = form.querySelector('#leadName')?.value.trim();
  const email = form.querySelector('#leadEmail')?.value.trim();
  const company = form.querySelector('#leadCompany')?.value.trim() || null;
  const jobTitle = form.querySelector('#leadJobTitle')?.value.trim() || null;
  const industry = form.querySelector('#leadIndustry')?.value || null;
  const country = form.querySelector('#leadCountry')?.value || null;
  const consent = form.querySelector('#leadConsent')?.checked || false;
  const newsletterConsent = form.querySelector('#leadNewsletter')?.checked || false;

  // Validation
  const errors = [];
  if (!name || name.length < 2) errors.push({ field: 'leadName', message: 'Please enter your full name' });
  if (!email || !AssessmentUtils.isValidEmail(email)) errors.push({ field: 'leadEmail', message: 'Please enter a valid email address' });
  if (!consent) errors.push({ field: 'leadConsent', message: 'You must agree to receive your results' });

  // Clear previous errors
  form.querySelectorAll('.text-red-400').forEach(el => el.classList.add('hidden'));
  form.querySelectorAll('.assessment-input--error').forEach(el => el.classList.remove('assessment-input--error'));

  if (errors.length > 0) {
    errors.forEach(err => {
      const field = form.querySelector(`#${err.field}`);
      const errorEl = form.querySelector(`#${err.field}Error`);
      if (field) field.classList.add('assessment-input--error');
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
    return;
  }

  // Update state
  engine.state.setParticipant({
    name,
    email,
    company,
    jobTitle,
    industry,
    country,
    consent,
    newsletterConsent,
    consentTimestamp: new Date().toISOString()
  });

  // Track analytics
  engine.analytics.trackParticipantDetails(newsletterConsent, 0, 'unknown');

  // Show results
  engine.showScreen('results');

  // Persist state
  engine.state.persist();

  // Submit to backend (async, non-blocking)
  submitLeadToBackend(engine).catch(console.error);
}

/**
 * Submit lead data to backend
 */
async function submitLeadToBackend(engine) {
  const data = engine.state.exportForSubmission();

  try {
    const response = await fetch('/api/assessment/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[Assessment] Lead submitted:', result);

  } catch (error) {
    console.warn('[Assessment] Lead submission failed:', error);
    // Non-critical: user still sees results
  }
}

/**
 * Auto-initialise assessments on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('[data-assessment]');
  containers.forEach(container => {
    const slug = container.getAttribute('data-assessment');
    if (slug) {
      const engine = initAssessment(container.id, { assessmentSlug: slug });
      if (engine) {
        engine.load(slug).then(() => engine.start());
      }
    }
  });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AssessmentModules, initAssessment };
}
