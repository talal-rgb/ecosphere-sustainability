/**
 * Terrnix Assessment Engine - State Manager
 * Immutable state management with localStorage persistence
 */

class AssessmentState {
  constructor(assessmentId) {
    this.assessmentId = assessmentId;
    this.storageKey = `terrnix-assessment-${assessmentId}`;
    this.state = this.getInitialState();
    this.listeners = new Map();
  }

  getInitialState() {
    return {
      assessment: null,
      participant: {
        name: '',
        email: '',
        company: '',
        industry: '',
        country: '',
        jobTitle: '',
        consent: false,
        newsletterConsent: false,
        consentTimestamp: null
      },
      answers: {},
      progress: {
        current: 0,
        total: 0,
        percentage: 0
      },
      results: null,
      meta: {
        startedAt: null,
        completedAt: null,
        duration: 0,
        sourceUrl: window.location.href,
        utm: AssessmentUtils.getStoredUtmParams(),
        sessionId: AssessmentUtils.generateSessionId()
      },
      ui: {
        screen: 'intro', // intro, question, review, lead, results
        loading: false,
        error: null
      }
    };
  }

  /**
   * Get current state (immutable copy)
   */
  get() {
    return AssessmentUtils.deepClone(this.state);
  }

  /**
   * Set state value at path
   */
  set(path, value) {
    const newState = AssessmentUtils.deepClone(this.state);
    AssessmentUtils.setByPath(newState, path, value);
    this.state = newState;
    this.notify(path, value);
    return this;
  }

  /**
   * Update multiple state values
   */
  update(updates) {
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value);
    }
    return this;
  }

  /**
   * Set answer for a question
   */
  setAnswer(questionId, value) {
    const answers = { ...this.state.answers, [questionId]: value };
    this.set('answers', answers);
    this.updateProgress();
    return this;
  }

  /**
   * Remove answer for a question
   */
  removeAnswer(questionId) {
    const answers = { ...this.state.answers };
    delete answers[questionId];
    this.set('answers', answers);
    this.updateProgress();
    return this;
  }

  /**
   * Update progress based on answers
   */
  updateProgress() {
    if (!this.state.assessment) return;
    const total = this.state.assessment.questions.length;
    const current = Object.keys(this.state.answers).length;
    const percentage = AssessmentUtils.percentage(current, total);
    this.set('progress', { current, total, percentage });
  }

  /**
   * Navigate to a screen
   */
  navigate(screen) {
    this.set('ui.screen', screen);
    return this;
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.set('ui.loading', loading);
    return this;
  }

  /**
   * Set error state
   */
  setError(error) {
    this.set('ui.error', error);
    return this;
  }

  /**
   * Clear error state
   */
  clearError() {
    this.set('ui.error', null);
    return this;
  }

  /**
   * Start the assessment
   */
  start() {
    this.set('meta.startedAt', new Date().toISOString());
    this.navigate('question');
    return this;
  }

  /**
   * Complete the assessment
   */
  complete(results) {
    const completedAt = new Date().toISOString();
    const startedAt = this.state.meta.startedAt;
    const duration = startedAt 
      ? Math.round((new Date(completedAt) - new Date(startedAt)) / 1000)
      : 0;
    
    this.set('results', results);
    this.set('meta.completedAt', completedAt);
    this.set('meta.duration', duration);
    this.navigate('lead');
    return this;
  }

  /**
   * Set participant data
   */
  setParticipant(data) {
    const participant = { ...this.state.participant, ...data };
    this.set('participant', participant);
    return this;
  }

  /**
   * Set assessment configuration
   */
  setAssessment(config) {
    this.set('assessment', config);
    this.updateProgress();
    return this;
  }

  /**
   * Persist state to localStorage
   */
  persist() {
    try {
      const data = JSON.stringify(this.state);
      localStorage.setItem(this.storageKey, data);
    } catch (e) {
      console.warn('Failed to persist assessment state:', e);
    }
    return this;
  }

  /**
   * Restore state from localStorage
   */
  restore() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // Only restore answers and progress, not results or UI state
        if (parsed.answers) this.set('answers', parsed.answers);
        if (parsed.meta?.startedAt) this.set('meta.startedAt', parsed.meta.startedAt);
      }
    } catch (e) {
      console.warn('Failed to restore assessment state:', e);
    }
    return this;
  }

  /**
   * Clear persisted state
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear assessment state:', e);
    }
    this.state = this.getInitialState();
    return this;
  }

  /**
   * Check if assessment is complete
   */
  isComplete() {
    if (!this.state.assessment) return false;
    const requiredQuestions = this.state.assessment.questions.filter(q => q.required);
    return requiredQuestions.every(q => this.state.answers[q.id] !== undefined);
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (!this.state.assessment) return null;
    const index = this.state.progress.current;
    return this.state.assessment.questions[index] || null;
  }

  /**
   * Get question by ID
   */
  getQuestion(id) {
    if (!this.state.assessment) return null;
    return this.state.assessment.questions.find(q => q.id === id) || null;
  }

  /**
   * Get answer for a question
   */
  getAnswer(questionId) {
    return this.state.answers[questionId];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);
    
    // Return unsubscribe function
    return () => this.listeners.get(path)?.delete(callback);
  }

  /**
   * Notify listeners of state change
   */
  notify(path, value) {
    // Notify exact path listeners
    this.listeners.get(path)?.forEach(cb => cb(value, path));
    
    // Notify wildcard listeners
    this.listeners.get('*')?.forEach(cb => cb(value, path));
    
    // Notify parent path listeners
    const parts = path.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('.');
      this.listeners.get(parentPath)?.forEach(cb => cb(value, path));
    }
  }

  /**
   * Get time spent on assessment
   */
  getTimeSpent() {
    if (!this.state.meta.startedAt) return 0;
    return Math.round((Date.now() - new Date(this.state.meta.startedAt).getTime()) / 1000);
  }

  /**
   * Export state for backend submission
   */
  exportForSubmission() {
    return {
      assessmentId: this.state.assessment?.id,
      answers: this.state.answers,
      participant: this.state.participant,
      meta: this.state.meta,
      results: this.state.results
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssessmentState;
}
