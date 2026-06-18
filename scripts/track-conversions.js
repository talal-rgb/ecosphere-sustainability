/**
 * Conversion Tracking Module
 * Tracks calculator usage, PDF downloads, quiz completions, and leads
 */

class ConversionTracker {
  constructor(config = {}) {
    this.endpoint = config.endpoint || '/api/track';
    this.enabled = config.enabled !== false;
    this.debug = config.debug || false;
    
    // Initialize storage
    this.sessionId = this.generateSessionId();
    this.events = [];
    
    if (this.enabled) {
      this.init();
    }
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  init() {
    // Track page view on init
    this.track('page_view', {
      url: window.location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Calculator conversions
    document.addEventListener('calculatorComplete', (e) => {
      this.track('calculator_complete', {
        calculatorType: e.detail?.type || 'unknown',
        result: e.detail?.result
      });
    });

    // PDF downloads
    document.addEventListener('pdfDownload', (e) => {
      this.track('pdf_download', {
        pdfName: e.detail?.name || 'unknown',
        page: window.location.pathname
      });
    });

    // Quiz completions
    document.addEventListener('quizComplete', (e) => {
      this.track('quiz_complete', {
        quizId: e.detail?.quizId || 'unknown',
        score: e.detail?.score
      });
    });

    // Contact form submissions
    document.addEventListener('contactSubmit', (e) => {
      this.track('lead_contact', {
        formType: e.detail?.formType || 'contact',
        source: window.location.pathname
      });
    });

    // Newsletter signups
    document.addEventListener('newsletterSignup', (e) => {
      this.track('lead_newsletter', {
        source: e.detail?.source || window.location.pathname
      });
    });

    // Track time on page
    this.trackTimeOnPage();
  }

  trackTimeOnPage() {
    let startTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      this.track('page_duration', {
        duration: duration,
        url: window.location.pathname
      });
    });
  }

  track(eventType, data = {}) {
    if (!this.enabled) return;

    const event = {
      sessionId: this.sessionId,
      eventType: eventType,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
      data: data
    };

    this.events.push(event);

    if (this.debug) {
      console.log('[ConversionTracker]', eventType, data);
    }

    // Send to endpoint
    this.sendEvent(event);
  }

  async sendEvent(event) {
    try {
      // Use sendBeacon for reliable delivery on page unload
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
        navigator.sendBeacon(this.endpoint, blob);
      } else {
        // Fallback to fetch
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true
        });
      }
    } catch (error) {
      if (this.debug) {
        console.error('[ConversionTracker] Failed to send event:', error);
      }
    }
  }

  // Public API methods for manual tracking
  trackCalculatorStart(type) {
    this.track('calculator_start', { calculatorType: type });
  }

  trackCalculatorComplete(type, result) {
    this.track('calculator_complete', { 
      calculatorType: type, 
      result: result 
    });
  }

  trackPDFDownload(name) {
    this.track('pdf_download', { pdfName: name });
  }

  trackQuizStart(quizId) {
    this.track('quiz_start', { quizId: quizId });
  }

  trackQuizComplete(quizId, score) {
    this.track('quiz_complete', { 
      quizId: quizId, 
      score: score 
    });
  }

  trackContactSubmit(formType = 'contact') {
    this.track('lead_contact', { formType: formType });
  }

  trackNewsletterSignup(source) {
    this.track('lead_newsletter', { source: source });
  }

  trackCTAClick(ctaId, ctaText) {
    this.track('cta_click', { 
      ctaId: ctaId, 
      ctaText: ctaText 
    });
  }

  // Get session summary
  getSessionSummary() {
    const summary = {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      events: this.events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {})
    };
    return summary;
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.conversionTracker = new ConversionTracker({
    enabled: true,
    debug: false
  });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConversionTracker;
}
