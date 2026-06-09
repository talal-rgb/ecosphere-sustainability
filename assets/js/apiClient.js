/**
 * Terrnix API Client
 * 
 * Wrapper around fetch() that integrates rate limiting,
 * error handling, and retry logic.
 * 
 * Usage:
 *   apiClient.subscribe(email).then(...)
 *   apiClient.contact(data).then(...)
 * 
 * @author Terrnix Security Team
 * @version 1.0.0
 */

class ApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://terrnix-backend.onrender.com';
    this.rateLimitHelper = window.rateLimitHelper || new RateLimitHelper();
  }

  /**
   * Make API request with rate limiting
   */
  async request(endpoint, options = {}, endpointType = 'default') {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.rateLimitHelper.fetchWithRateLimit(
        url,
        {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        },
        endpointType
      );
      
      const data = await response.json();
      return { success: true, data, response };
    } catch (error) {
      // Check if it's a rate limit error
      if (error.message && error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'RATE_LIMIT',
          message: error.message
        };
      }
      
      return {
        success: false,
        error: 'NETWORK',
        message: error.message || 'Network error. Please try again.'
      };
    }
  }

  /**
   * Subscribe to newsletter
   */
  async subscribe(email) {
    return this.request(
      '/api/subscribe',
      {
        method: 'POST',
        body: JSON.stringify({ email })
      },
      'subscribe'
    );
  }

  /**
   * Submit contact form
   */
  async contact(formData) {
    return this.request(
      '/api/contact',
      {
        method: 'POST',
        body: JSON.stringify(formData)
      },
      'contact'
    );
  }
}

// Create global instance
const apiClient = new ApiClient();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, apiClient };
}

if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
  window.apiClient = apiClient;
}
