/**
 * Terrnix Client-Side Rate Limit Helper
 * 
 * Provides client-side rate limiting as defense-in-depth.
 * This complements server-side rate limiting but does not replace it.
 * 
 * Features:
 * - Per-endpoint request tracking
 * - Exponential backoff for retries
 * - User-friendly error messages
 * - Local storage persistence (optional)
 * 
 * @author Terrnix Security Team
 * @version 1.0.0
 */

class RateLimitHelper {
  constructor(options = {}) {
    this.config = {
      // Default limits (should match server-side)
      subscribeLimit: options.subscribeLimit || 5,
      subscribeWindow: options.subscribeWindow || 60 * 60 * 1000, // 1 hour
      contactLimit: options.contactLimit || 3,
      contactWindow: options.contactWindow || 60 * 60 * 1000, // 1 hour
      
      // Retry configuration
      maxRetries: options.maxRetries || 3,
      baseRetryDelay: options.baseRetryDelay || 1000, // 1 second
      
      // Storage
      useLocalStorage: options.useLocalStorage !== false,
      storagePrefix: options.storagePrefix || 'terrnix_ratelimit_',
      
      ...options
    };
    
    // In-memory store
    this.requests = new Map();
    
    // Load from localStorage if available
    if (this.config.useLocalStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Get storage key for endpoint
   */
  getStorageKey(endpoint) {
    return `${this.config.storagePrefix}${endpoint}`;
  }

  /**
   * Load request history from localStorage (encrypted if available)
   */
  async loadFromStorage() {
    try {
      // Use encrypted storage if available
      if (typeof encryptedStorage !== 'undefined' && encryptedStorage.isAvailable) {
        const keys = encryptedStorage.keys();
        for (const key of keys) {
          if (key.startsWith(this.config.storagePrefix)) {
            const data = await encryptedStorage.getItem(key);
            if (data) {
              const endpoint = key.replace(this.config.storagePrefix, '');
              this.requests.set(endpoint, JSON.parse(data));
            }
          }
        }
        return;
      }
      
      // Fallback to plain localStorage
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.config.storagePrefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            const endpoint = key.replace(this.config.storagePrefix, '');
            this.requests.set(endpoint, JSON.parse(data));
          }
        }
      }
    } catch (e) {
      console.warn('[RateLimitHelper] Failed to load from localStorage:', e);
    }
  }

  /**
   * Save request history to localStorage (encrypted if available)
   */
  async saveToStorage(endpoint) {
    if (!this.config.useLocalStorage) return;
    
    try {
      const requests = this.requests.get(endpoint);
      if (requests) {
        const data = JSON.stringify(requests);
        
        // Use encrypted storage if available
        if (typeof encryptedStorage !== 'undefined' && encryptedStorage.isAvailable) {
          await encryptedStorage.setItem(this.getStorageKey(endpoint), data);
        } else {
          localStorage.setItem(this.getStorageKey(endpoint), data);
        }
      }
    } catch (e) {
      console.warn('[RateLimitHelper] Failed to save to localStorage:', e);
    }
  }

  /**
   * Get request history for endpoint
   */
  getRequests(endpoint) {
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }
    return this.requests.get(endpoint);
  }

  /**
   * Clean old requests outside the window
   */
  cleanOldRequests(endpoint, windowMs) {
    const requests = this.getRequests(endpoint);
    const now = Date.now();
    const cutoff = now - windowMs;
    
    const filtered = requests.filter(time => time > cutoff);
    this.requests.set(endpoint, filtered);
    this.saveToStorage(endpoint);
    
    return filtered;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(endpoint, limit, windowMs) {
    const requests = this.cleanOldRequests(endpoint, windowMs);
    
    return {
      allowed: requests.length < limit,
      count: requests.length,
      limit: limit,
      remaining: Math.max(0, limit - requests.length),
      resetTime: requests.length > 0 ? requests[0] + windowMs : Date.now() + windowMs
    };
  }

  /**
   * Record a request
   */
  recordRequest(endpoint) {
    const requests = this.getRequests(endpoint);
    requests.push(Date.now());
    this.requests.set(endpoint, requests);
    this.saveToStorage(endpoint);
  }

  /**
   * Check subscription rate limit
   */
  canSubscribe() {
    return this.isAllowed('subscribe', this.config.subscribeLimit, this.config.subscribeWindow);
  }

  /**
   * Check contact rate limit
   */
  canContact() {
    return this.isAllowed('contact', this.config.contactLimit, this.config.contactWindow);
  }

  /**
   * Record subscription attempt
   */
  recordSubscribe() {
    this.recordRequest('subscribe');
  }

  /**
   * Record contact attempt
   */
  recordContact() {
    this.recordRequest('contact');
  }

  /**
   * Get time until next allowed request
   */
  getRetryAfter(endpoint, windowMs) {
    const requests = this.getRequests(endpoint);
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - Date.now()) / 1000);
    return Math.max(0, retryAfter);
  }

  /**
   * Format retry after for display
   */
  formatRetryAfter(seconds) {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  /**
   * Create fetch wrapper with rate limiting
   */
  async fetchWithRateLimit(url, options = {}, endpointType = 'default') {
    // Check client-side rate limit first
    let check;
    if (endpointType === 'subscribe') {
      check = this.canSubscribe();
    } else if (endpointType === 'contact') {
      check = this.canContact();
    } else {
      check = { allowed: true };
    }

    if (!check.allowed) {
      const retryAfter = this.getRetryAfter(
        endpointType,
        endpointType === 'subscribe' ? this.config.subscribeWindow : this.config.contactWindow
      );
      
      throw new Error(
        `Rate limit exceeded. Please try again in ${this.formatRetryAfter(retryAfter)}.`
      );
    }

    // Record the request
    if (endpointType === 'subscribe') {
      this.recordSubscribe();
    } else if (endpointType === 'contact') {
      this.recordContact();
    }

    // Make the request with retry logic
    let lastError;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Handle 429 Too Many Requests
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : this.config.baseRetryDelay * Math.pow(2, attempt);
          
          if (attempt < this.config.maxRetries) {
            await this.sleep(delay);
            continue;
          }
          
          throw new Error(
            `Server rate limit exceeded. Please try again in ${this.formatRetryAfter(Math.ceil(delay / 1000))}.`
          );
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx except 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.baseRetryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all rate limit data
   */
  clear() {
    this.requests.clear();
    
    if (this.config.useLocalStorage) {
      try {
        // Use encrypted storage clear if available
        if (typeof encryptedStorage !== 'undefined') {
          encryptedStorage.clear();
        } else {
          const keys = Object.keys(localStorage);
          for (const key of keys) {
            if (key.startsWith(this.config.storagePrefix)) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch (e) {
        console.warn('[RateLimitHelper] Failed to clear localStorage:', e);
      }
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      subscribe: this.canSubscribe(),
      contact: this.canContact()
    };
  }
}

// Create global instance
const rateLimitHelper = new RateLimitHelper();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RateLimitHelper, rateLimitHelper };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RateLimitHelper = RateLimitHelper;
  window.rateLimitHelper = rateLimitHelper;
}
