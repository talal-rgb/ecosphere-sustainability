/**
 * Terrnix Assessment Engine - Analytics
 * GA4 event tracking for assessment lifecycle
 */

class AssessmentAnalytics {
  constructor(config) {
    this.config = config;
    this.enabled = this.checkGA4();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
  }

  checkGA4() {
    return typeof gtag !== 'undefined' && typeof gtag === 'function';
  }

  generateSessionId() {
    return 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Base tracking method
   */
  track(eventName, params = {}) {
    if (!this.enabled) {
      console.warn('[Analytics] GA4 not available, event not tracked:', eventName);
      return;
    }

    const eventParams = {
      ...this.getBaseParams(),
      ...params
    };

    gtag('event', eventName, eventParams);

    // Store for debugging
    this.events.push({
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString()
    });

    // Debug log in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Analytics]', eventName, eventParams);
    }
  }

  getBaseParams() {
    return {
      assessment_id: this.config.id,
      assessment_name: this.config.metadata?.title || this.config.id,
      assessment_version: this.config.version,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    };
  }

  // Assessment lifecycle events
  trackView(source = null, utm = {}) {
    this.track('assessment_view', {
      source: source || document.referrer || 'direct',
      utm_source: utm.source || null,
      utm_medium: utm.medium || null,
      utm_campaign: utm.campaign || null
    });
  }

  trackStart() {
    this.track('assessment_start', {
      start_time: new Date().toISOString()
    });
  }

  trackProgress(questionId, questionNumber, category, progressPct) {
    this.track('assessment_progress', {
      question_id: questionId,
      question_number: questionNumber,
      category: category,
      progress_pct: Math.round(progressPct)
    });
  }

  trackComplete(score, maturityLevel, durationSeconds, completionRate) {
    this.track('assessment_complete', {
      score: score,
      maturity_level: maturityLevel,
      duration_seconds: Math.round(durationSeconds),
      completion_rate: Math.round(completionRate)
    });
  }

  trackAbandon(lastQuestion, progressPct, timeSpent) {
    this.track('assessment_abandon', {
      last_question: lastQuestion,
      progress_pct: Math.round(progressPct),
      time_spent_seconds: Math.round(timeSpent / 1000)
    });
  }

  // Conversion events
  trackParticipantDetails(hasNewsletterConsent, leadScore, leadTier) {
    this.track('participant_details', {
      has_newsletter_consent: hasNewsletterConsent,
      lead_score: leadScore,
      lead_tier: leadTier
    });
  }

  trackCertificateDownload(score, certificateType) {
    this.track('certificate_download', {
      score: score,
      certificate_type: certificateType
    });
  }

  trackReportDownload(score) {
    this.track('report_download', {
      score: score
    });
  }

  trackConsultationClick(location, consultationType) {
    this.track('consultation_click', {
      cta_location: location,
      consultation_type: consultationType
    });
  }

  // Engagement events
  trackNewsletterConsent(consentGranted) {
    this.track('newsletter_consent', {
      consent_granted: consentGranted
    });
  }

  trackArticleClick(articleId, articleTitle) {
    this.track('recommended_article_click', {
      article_id: articleId,
      article_title: articleTitle
    });
  }

  trackCalculatorClick(calculatorId, calculatorTitle) {
    this.track('recommended_calculator_click', {
      calculator_id: calculatorId,
      calculator_title: calculatorTitle
    });
  }

  trackShareClick(method) {
    this.track('share_click', {
      share_method: method
    });
  }

  // Navigation events
  trackPrevious(fromQuestion, toQuestion) {
    this.track('assessment_previous', {
      from_question: fromQuestion,
      to_question: toQuestion
    });
  }

  trackReview(questionsReviewed) {
    this.track('assessment_review', {
      questions_reviewed: questionsReviewed
    });
  }

  trackLeadFormView() {
    this.track('assessment_lead_form_view', {});
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents() {
    return this.events;
  }

  /**
   * Get session duration
   */
  getDuration() {
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssessmentAnalytics;
}
