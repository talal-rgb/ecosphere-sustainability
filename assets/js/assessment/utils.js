/**
 * Terrnix Assessment Engine - Utilities
 * Shared helpers for validation, formatting, and DOM manipulation
 */

const AssessmentUtils = {
  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  },

  /**
   * Format a date for display
   */
  formatDate(date, options = {}) {
    const d = new Date(date);
    const defaults = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('en-GB', { ...defaults, ...options });
  },

  /**
   * Debounce function calls
   */
  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Sanitise user input to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Deep clone an object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Get nested object value by path string
   */
  getByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  },

  /**
   * Set nested object value by path string
   */
  setByPath(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((acc, part) => {
      if (!acc[part]) acc[part] = {};
      return acc[part];
    }, obj);
    target[last] = value;
  },

  /**
   * Generate a random string
   */
  randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Calculate percentage
   */
  percentage(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Smooth scroll to element
   */
  scrollTo(el, offset = 0) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  },

  /**
   * Parse UTM parameters from URL
   */
  parseUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
      term: params.get('utm_term')
    };
  },

  /**
   * Store UTM params in sessionStorage
   */
  storeUtmParams() {
    const utms = this.parseUtmParams();
    if (utms.source) {
      sessionStorage.setItem('assessment_utm', JSON.stringify(utms));
    }
  },

  /**
   * Retrieve stored UTM params
   */
  getStoredUtmParams() {
    try {
      return JSON.parse(sessionStorage.getItem('assessment_utm')) || {};
    } catch {
      return {};
    }
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssessmentUtils;
}
