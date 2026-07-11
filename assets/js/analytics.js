/**
 * Terrnix Analytics Foundation
 * Version: 1.0
 * Date: 2026-06-29
 * Status: DISABLED until real IDs are configured
 *
 * This file implements:
 * - Google Analytics 4 (GA4) with custom events
 * - Google Tag Manager (GTM) loader
 * - Microsoft Clarity heatmaps and recordings
 * - Scroll depth tracking
 * - Outbound link tracking
 *
 * INSTRUCTIONS:
 * 1. Obtain real IDs from ANALYTICS_SETUP_GUIDE.md
 * 2. Replace all placeholder values below
 * 3. Set analyticsEnabled = true
 * 4. Deploy and verify
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION — REPLACE PLACEHOLDERS BEFORE DEPLOYMENT
  // ============================================================

  const CONFIG = {
    // Set to TRUE after replacing all placeholders and deploying
    enabled: true,

    // Google Analytics 4 Measurement ID
    // Format: G-XXXXXXXXXX (10 characters after G-)
    ga4Id: 'G-MVBZJTV3S9',

    // Google Tag Manager Container ID
    // Format: GTM-XXXXXXX (7 characters after GTM-)
    gtmId: 'GTM-XXXXXXX',

    // Microsoft Clarity Project ID
    // Format: alphanumeric string (e.g., "abcdefghij")
    clarityId: 'xf95a67vp9',

    // Scroll depth thresholds (%)
    scrollDepths: [50, 90],

    // Debug mode (logs events to console, no actual tracking)
    debug: false
  };

  // ============================================================
  // DO NOT EDIT BELOW THIS LINE
  // ============================================================

  // Prevent double-loading
  if (window.terrnixAnalyticsLoaded) return;
  window.terrnixAnalyticsLoaded = true;

  // State tracking
  const trackedEvents = new Set();
  const trackedScrollDepths = new Set();

  /**
   * Log helper for debug mode
   */
  function logDebug(label, data) {
    if (CONFIG.debug || !CONFIG.enabled) {
      console.log(`[Terrnix Analytics] ${label}:`, data);
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  function initGA4() {
    if (!CONFIG.ga4Id || CONFIG.ga4Id === 'G-XXXXXXXXXX') {
      logDebug('GA4 skipped', 'Placeholder ID detected');
      return;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ga4Id}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', CONFIG.ga4Id, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
      custom_map: {
        'custom_parameter_1': 'article_title',
        'custom_parameter_2': 'article_category',
        'custom_parameter_3': 'calculator_type',
        'custom_parameter_4': 'quiz_name',
        'custom_parameter_5': 'cta_location'
      }
    });

    window.gtag = gtag;
    logDebug('GA4 initialized', CONFIG.ga4Id);
  }

  /**
   * Initialize Google Tag Manager
   */
  function initGTM() {
    if (!CONFIG.gtmId || CONFIG.gtmId === 'GTM-XXXXXXX') {
      logDebug('GTM skipped', 'Placeholder ID detected');
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${CONFIG.gtmId}`;
    document.head.appendChild(script);

    logDebug('GTM initialized', CONFIG.gtmId);
  }

  /**
   * Initialize Microsoft Clarity
   */
  function initClarity() {
    if (!CONFIG.clarityId || CONFIG.clarityId === 'CLARITY_PROJECT_ID') {
      logDebug('Clarity skipped', 'Placeholder ID detected');
      return;
    }

    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CONFIG.clarityId);

    logDebug('Clarity initialized', CONFIG.clarityId);
  }

  /**
   * Track a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} parameters - Event parameters
   */
  function trackEvent(eventName, parameters = {}) {
    if (!CONFIG.enabled) {
      logDebug('EVENT (disabled)', { eventName, parameters });
      return;
    }

    // Prevent duplicate tracking
    const eventKey = JSON.stringify({ eventName, parameters });
    if (trackedEvents.has(eventKey)) {
      logDebug('EVENT (duplicate skipped)', { eventName, parameters });
      return;
    }
    trackedEvents.add(eventKey);

    // Send to GA4
    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    // Send to dataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...parameters
    });

    logDebug('EVENT', { eventName, parameters });
  }

  /**
   * Track article view
   */
  function trackArticleView() {
    const articleMeta = document.querySelector('meta[property="og:title"]');
    const articleTitle = articleMeta ? articleMeta.content : document.title;
    const articleUrl = window.location.pathname;
    const articleCategory = document.querySelector('meta[property="article:section"]')?.content || 'unknown';

    trackEvent('article_view', {
      article_title: articleTitle,
      article_url: articleUrl,
      article_category: articleCategory,
      page_location: window.location.href,
      page_title: document.title
    });
  }

  /**
   * Track calculator events
   */
  function initCalculatorTracking() {
    // Calculator start
    document.addEventListener('click', function(e) {
      const calcStart = e.target.closest('[data-track="calculator_start"]');
      if (calcStart) {
        trackEvent('calculator_start', {
          calculator_type: calcStart.dataset.calculatorType || 'carbon_footprint',
          cta_location: calcStart.dataset.ctaLocation || 'article_body'
        });
      }
    });

    // Calculator complete (should be called from calculator logic)
    window.trackCalculatorComplete = function(calculatorType, resultValue) {
      trackEvent('calculator_complete', {
        calculator_type: calculatorType,
        result_value: resultValue
      });
    };
  }

  /**
   * Track quiz events
   */
  function initQuizTracking() {
    // Quiz start
    document.addEventListener('click', function(e) {
      const quizStart = e.target.closest('[data-track="quiz_start"]');
      if (quizStart) {
        trackEvent('quiz_start', {
          quiz_name: quizStart.dataset.quizName || 'csrd_readiness',
          cta_location: quizStart.dataset.ctaLocation || 'article_body'
        });
      }
    });

    // Quiz complete (called from quiz logic)
    window.trackQuizComplete = function(quizName, score) {
      trackEvent('quiz_complete', {
        quiz_name: quizName,
        quiz_score: score
      });
    };

    // Quiz lead submit (email capture)
    window.trackQuizLeadSubmit = function(quizName, emailDomain) {
      trackEvent('quiz_lead_submit', {
        quiz_name: quizName,
        email_domain: emailDomain
      });
    };
  }

  /**
   * Track PDF download
   */
  function initPDFTracking() {
    document.addEventListener('click', function(e) {
      const pdfLink = e.target.closest('a[href$=".pdf"], [data-track="pdf_download"]');
      if (pdfLink) {
        trackEvent('pdf_download', {
          pdf_name: pdfLink.dataset.pdfName || pdfLink.href.split('/').pop(),
          pdf_location: pdfLink.dataset.pdfLocation || window.location.pathname
        });
      }
    });
  }

  /**
   * Track contact form submission
   */
  function initContactTracking() {
    document.addEventListener('submit', function(e) {
      const contactForm = e.target.closest('[data-track="contact_submit"]');
      if (contactForm) {
        trackEvent('contact_submit', {
          form_type: contactForm.dataset.formType || 'consultation_request',
          page_location: window.location.pathname
        });
      }
    });
  }

  /**
   * Track newsletter signup
   */
  function initNewsletterTracking() {
    document.addEventListener('submit', function(e) {
      const newsletterForm = e.target.closest('[data-track="newsletter_signup"]');
      if (newsletterForm) {
        trackEvent('newsletter_signup', {
          signup_location: newsletterForm.dataset.signupLocation || 'sidebar',
          page_location: window.location.pathname
        });
      }
    });
  }

  /**
   * Track consultation CTA clicks
   */
  function initCTATracking() {
    document.addEventListener('click', function(e) {
      const cta = e.target.closest('[data-track="consultation_cta_click"]');
      if (cta) {
        trackEvent('consultation_cta_click', {
          cta_text: cta.textContent.trim().substring(0, 50),
          cta_location: cta.dataset.ctaLocation || 'article_body',
          page_location: window.location.pathname
        });
      }
    });
  }

  /**
   * Track LinkedIn/social link clicks
   */
  function initSocialTracking() {
    document.addEventListener('click', function(e) {
      const socialLink = e.target.closest('a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com"]');
      if (socialLink) {
        trackEvent('linkedin_click', {
          link_url: socialLink.href,
          link_location: window.location.pathname
        });
      }
    });
  }

  /**
   * Track scroll depth
   */
  function initScrollTracking() {
    let maxScroll = 0;

    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        CONFIG.scrollDepths.forEach(function(threshold) {
          if (maxScroll >= threshold && !trackedScrollDepths.has(threshold)) {
            trackedScrollDepths.add(threshold);
            trackEvent(`scroll_depth_${threshold}`, {
              page_location: window.location.pathname,
              page_title: document.title,
              scroll_percentage: threshold
            });
          }
        });
      }
    });
  }

  /**
   * Track all outbound links
   */
  function initOutboundLinkTracking() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href^="http"]');
      if (link && !link.href.includes(window.location.hostname)) {
        trackEvent('outbound_link_click', {
          link_url: link.href,
          link_text: link.textContent.trim().substring(0, 50),
          link_domain: new URL(link.href).hostname,
          page_location: window.location.pathname
        });
      }
    });
  }

  /**
   * Main initialization
   */
  function init() {
    if (!CONFIG.enabled) {
      console.log('[Terrnix Analytics] DISABLED — Set CONFIG.enabled = true and replace placeholder IDs to activate');
      return;
    }

    // Initialize tracking platforms
    initGA4();
    initGTM();
    initClarity();

    // Initialize event tracking
    initCalculatorTracking();
    initQuizTracking();
    initPDFTracking();
    initContactTracking();
    initNewsletterTracking();
    initCTATracking();
    initSocialTracking();
    initScrollTracking();
    initOutboundLinkTracking();

    // Track article view if on an article page
    if (document.querySelector('meta[property="og:type"][content="article"]')) {
      trackArticleView();
    }

    console.log('[Terrnix Analytics] ACTIVE — Tracking enabled');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose trackEvent globally for inline usage
  window.terrnixTrack = trackEvent;

})();
