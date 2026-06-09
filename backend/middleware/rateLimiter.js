/**
 * Terrnix Rate Limiter Middleware
 * 
 * Provides multi-layer rate limiting for API endpoints:
 * - Per-IP rate limiting (prevents abuse from single sources)
 * - Per-endpoint rate limiting (prevents endpoint-specific abuse)
 * - Burst protection (prevents traffic spikes)
 * 
 * Risk Addressed: No rate limiting on backend API (Risk 8.0/10)
 * 
 * @author Terrnix Security Team
 * @version 1.0.0
 */

class RateLimiter {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      // Per-IP limits
      ipWindowMs: options.ipWindowMs || 15 * 60 * 1000, // 15 minutes
      ipMaxRequests: options.ipMaxRequests || 100, // 100 requests per window
      
      // Per-endpoint limits (stricter)
      endpointWindowMs: options.endpointWindowMs || 60 * 1000, // 1 minute
      endpointMaxRequests: options.endpointMaxRequests || 10, // 10 requests per minute
      
      // Burst protection
      burstWindowMs: options.burstWindowMs || 1000, // 1 second
      burstMaxRequests: options.burstMaxRequests || 5, // 5 requests per second
      
      // Subscription endpoint (stricter due to email abuse risk)
      subscribeWindowMs: options.subscribeWindowMs || 60 * 60 * 1000, // 1 hour
      subscribeMaxRequests: options.subscribeMaxRequests || 5, // 5 subscriptions per hour per IP
      
      // Contact endpoint
      contactWindowMs: options.contactWindowMs || 60 * 60 * 1000, // 1 hour
      contactMaxRequests: options.contactMaxRequests || 3, // 3 contacts per hour per IP
      
      // Cleanup interval
      cleanupIntervalMs: options.cleanupIntervalMs || 5 * 60 * 1000, // 5 minutes
      
      // Skip successful requests from counting (optional)
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      
      ...options
    };
    
    // In-memory store (use Redis in production)
    this.store = new Map();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), this.config.cleanupIntervalMs);
    
    // Trust proxy setting (for accurate IP behind reverse proxy)
    this.trustProxy = options.trustProxy || false;
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    if (this.trustProxy && req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * Generate store key
   */
  getKey(identifier, type = 'ip') {
    return `${type}:${identifier}`;
  }

  /**
   * Get or create rate limit entry
   */
  getEntry(key, windowMs) {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      const newEntry = {
        count: 0,
        resetTime: now + windowMs,
        firstRequest: now
      };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    return entry;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key, maxRequests, windowMs) {
    const entry = this.getEntry(key, windowMs);
    entry.count++;
    
    return {
      allowed: entry.count <= maxRequests,
      count: entry.count,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Main middleware function
   */
  middleware(options = {}) {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const endpoint = req.path || req.url;
      const now = Date.now();
      
      // Determine endpoint-specific limits
      let limits = {
        windowMs: this.config.endpointWindowMs,
        maxRequests: this.config.endpointMaxRequests
      };
      
      // Apply stricter limits for specific endpoints
      if (endpoint.includes('/subscribe')) {
        limits = {
          windowMs: this.config.subscribeWindowMs,
          maxRequests: this.config.subscribeMaxRequests
        };
      } else if (endpoint.includes('/contact')) {
        limits = {
          windowMs: this.config.contactWindowMs,
          maxRequests: this.config.contactMaxRequests
        };
      }
      
      // Check IP-based rate limit
      const ipKey = this.getKey(clientIP, 'ip');
      const ipResult = this.isAllowed(ipKey, this.config.ipMaxRequests, this.config.ipWindowMs);
      
      // Check endpoint-specific rate limit
      const endpointKey = this.getKey(`${clientIP}:${endpoint}`, 'endpoint');
      const endpointResult = this.isAllowed(endpointKey, limits.maxRequests, limits.windowMs);
      
      // Check burst protection
      const burstKey = this.getKey(`${clientIP}:burst`, 'burst');
      const burstResult = this.isAllowed(burstKey, this.config.burstMaxRequests, this.config.burstWindowMs);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit-IP', ipResult.limit);
      res.setHeader('X-RateLimit-Remaining-IP', ipResult.remaining);
      res.setHeader('X-RateLimit-Reset-IP', new Date(ipResult.resetTime).toISOString());
      res.setHeader('X-RateLimit-Limit-Endpoint', endpointResult.limit);
      res.setHeader('X-RateLimit-Remaining-Endpoint', endpointResult.remaining);
      res.setHeader('X-RateLimit-Reset-Endpoint', new Date(endpointResult.resetTime).toISOString());
      
      // Check if any limit is exceeded
      if (!ipResult.allowed) {
        return this.handleLimitExceeded(res, 'IP rate limit exceeded', ipResult.resetTime);
      }
      
      if (!endpointResult.allowed) {
        return this.handleLimitExceeded(res, 'Endpoint rate limit exceeded', endpointResult.resetTime);
      }
      
      if (!burstResult.allowed) {
        return this.handleLimitExceeded(res, 'Burst rate limit exceeded', burstResult.resetTime);
      }
      
      // Attach rate limit info to request for logging
      req.rateLimit = {
        ip: ipResult,
        endpoint: endpointResult,
        burst: burstResult
      };
      
      next();
    };
  }

  /**
   * Handle rate limit exceeded
   */
  handleLimitExceeded(res, message, resetTime) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: message,
      retryAfter: retryAfter,
      documentation: 'https://terrnix.com/rate-limits'
    });
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[RateLimiter] Cleaned up ${cleaned} expired entries. Active: ${this.store.size}`);
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      activeEntries: this.store.size,
      config: this.config
    };
  }

  /**
   * Destroy cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Express.js integration helper
function createExpressMiddleware(options = {}) {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RateLimiter, createExpressMiddleware };
}

if (typeof window !== 'undefined') {
  window.RateLimiter = RateLimiter;
}
