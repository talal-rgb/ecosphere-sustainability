/**
 * Terrnix Assessment Engine - Core
 * Orchestrates assessment flow: load, render, navigate, submit
 */

class AssessmentEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Assessment container not found: ${containerId}`);
    }

    this.options = {
      assessmentSlug: options.assessmentSlug || null,
      theme: options.theme || 'dark',
      language: options.language || 'en',
      ...options
    };

    this.state = null;
    this.config = null;
    this.ui = null;
    this.scoring = null;
    this.analytics = null;
    this.eventListeners = new Map();

    this.screens = ['intro', 'question', 'review', 'lead', 'results'];
    this.currentScreenIndex = -1;
  }

  /**
   * Load assessment configuration
   */
  async load(assessmentSlug = this.options.assessmentSlug) {
    if (!assessmentSlug) {
      throw new Error('Assessment slug is required');
    }

    this.emit('loading', { message: 'Loading assessment...' });

    try {
      const response = await fetch(`/data/assessments/${assessmentSlug}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load assessment: ${response.status}`);
      }

      this.config = await response.json();

      // Validate config
      this.validateConfig();

      // Initialise state
      this.state = new AssessmentState(this.config.id);
      this.state.setAssessment(this.config);

      // Restore previous session if exists
      this.state.restore();

      // Initialise sub-modules
      this.ui = new AssessmentUI(this.container, this.config, this.state);
      this.scoring = new AssessmentScoring(this.config);
      this.analytics = new AssessmentAnalytics(this.config);

      this.emit('loaded', { config: this.config });
      return this;

    } catch (error) {
      this.emit('error', { type: 'load', message: error.message });
      throw error;
    }
  }

  /**
   * Validate assessment configuration
   */
  validateConfig() {
    const required = ['id', 'slug', 'version', 'metadata', 'categories', 'questions', 'maturityLevels'];
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`Missing required config field: ${field}`);
      }
    }

    // Validate category weights sum to 1.0
    const totalWeight = this.config.categories.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(`Category weights must sum to 1.0, got ${totalWeight}`);
    }

    // Validate questions have valid categories
    const categoryIds = new Set(this.config.categories.map(c => c.id));
    for (const question of this.config.questions) {
      if (!categoryIds.has(question.category)) {
        throw new Error(`Invalid category "${question.category}" for question ${question.id}`);
      }
    }

    // Validate maturity levels cover 0-100
    const levels = this.config.maturityLevels;
    if (levels[0].min !== 0 || levels[levels.length - 1].max !== 100) {
      throw new Error('Maturity levels must cover 0-100');
    }
  }

  /**
   * Start the assessment
   */
  start() {
    if (!this.config) {
      throw new Error('Assessment not loaded. Call load() first.');
    }

    this.state.start();
    this.analytics.trackStart();
    this.showScreen('intro');
    this.emit('started', {});
    return this;
  }

  /**
   * Show a specific screen
   */
  showScreen(screenName) {
    const index = this.screens.indexOf(screenName);
    if (index === -1) {
      throw new Error(`Unknown screen: ${screenName}`);
    }

    this.currentScreenIndex = index;
    this.state.navigate(screenName);

    switch (screenName) {
      case 'intro':
        this.ui.renderIntro();
        break;
      case 'question':
        this.renderCurrentQuestion();
        break;
      case 'review':
        this.ui.renderReview();
        break;
      case 'lead':
        this.ui.renderLeadCapture();
        break;
      case 'results':
        this.showResults();
        break;
    }

    this.emit('screen', { screen: screenName });
    return this;
  }

  /**
   * Render current question
   */
  renderCurrentQuestion() {
    const question = this.state.getCurrentQuestion();
    if (!question) {
      // All questions answered, show review
      this.showScreen('review');
      return;
    }

    const index = this.state.state.progress.current;
    const total = this.state.state.progress.total;
    const answer = this.state.getAnswer(question.id);

    this.ui.renderQuestion(question, index, total, answer);
  }

  /**
   * Record an answer
   */
  answer(questionId, value) {
    const question = this.state.getQuestion(questionId);
    if (!question) {
      console.warn(`Question not found: ${questionId}`);
      return this;
    }

    this.state.setAnswer(questionId, value);
    this.analytics.trackQuestionAnswered(
      questionId,
      this.state.state.progress.current,
      question.category,
      value
    );
    this.analytics.trackProgress(
      questionId,
      this.state.state.progress.current,
      question.category,
      this.state.state.progress.percentage
    );

    this.emit('answered', { questionId, value, category: question.category });
    return this;
  }

  /**
   * Navigate to previous question
   */
  previous() {
    const current = this.state.state.progress.current;
    if (current > 0) {
      this.state.set('progress.current', current - 1);
      this.renderCurrentQuestion();
      this.analytics.trackPrevious(current, current - 1);
    }
    return this;
  }

  /**
   * Navigate to next question
   */
  next() {
    const current = this.state.state.progress.current;
    const total = this.state.state.progress.total;

    if (current < total - 1) {
      this.state.set('progress.current', current + 1);
      this.renderCurrentQuestion();
    } else {
      // Last question, show review
      this.showScreen('review');
    }
    return this;
  }

  /**
   * Jump to a specific question
   */
  goToQuestion(index) {
    if (index < 0 || index >= this.state.state.progress.total) {
      return this;
    }
    this.state.set('progress.current', index);
    this.showScreen('question');
    return this;
  }

  /**
   * Show review screen
   */
  review() {
    this.showScreen('review');
    this.analytics.trackReview(Object.keys(this.state.state.answers).length);
    return this;
  }

  /**
   * Submit assessment and calculate results
   */
  submit() {
    if (!this.state.isComplete()) {
      const unanswered = this.getUnansweredRequired();
      this.emit('error', {
        type: 'validation',
        message: `Please answer all required questions. ${unanswered.length} remaining.`
      });
      return this;
    }

    this.state.setLoading(true);
    this.emit('submitting', {});

    try {
      // Calculate results
      const results = this.scoring.calculate(this.state.state.answers);
      this.state.complete(results);

      this.analytics.trackComplete(
        results.overall.score,
        results.overall.maturityLevel.label,
        this.state.getTimeSpent(),
        100
      );

      this.emit('completed', results);
      this.showScreen('lead');

      // Track that results are available
      this.analytics.trackResultViewed(results.overall.score, results.overall.maturityLevel.label);

    } catch (error) {
      this.state.setError(error.message);
      this.emit('error', { type: 'scoring', message: error.message });
    } finally {
      this.state.setLoading(false);
    }

    return this;
  }

  /**
   * Show results screen
   */
  showResults() {
    if (!this.state.state.results) {
      throw new Error('No results available. Complete the assessment first.');
    }

    this.ui.renderResults(this.state.state.results);
    this.emit('results', this.state.state.results);
    return this;
  }

  /**
   * Get unanswered required questions
   */
  getUnansweredRequired() {
    if (!this.config) return [];
    return this.config.questions.filter(q => {
      return q.required && this.state.state.answers[q.id] === undefined;
    });
  }

  /**
   * Event system: subscribe
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Return unsubscribe
    return () => this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Event system: unsubscribe
   */
  off(event, callback) {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Event system: emit
   */
  emit(event, data) {
    this.eventListeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`Event handler error for ${event}:`, e);
      }
    });

    // Also emit to wildcard
    this.eventListeners.get('*')?.forEach(cb => {
      try {
        cb({ event, data });
      } catch (e) {
        console.error(`Wildcard event handler error:`, e);
      }
    });
  }

  /**
   * Destroy the engine
   */
  destroy() {
    this.state?.persist();
    this.ui?.destroy();
    this.eventListeners.clear();
    this.container.innerHTML = '';
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssessmentEngine;
}
