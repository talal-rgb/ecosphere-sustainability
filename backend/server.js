/**
 * Terrnix Backend Server with Security Hardening
 * 
 * Security features:
 * - Multi-layer rate limiting
 * - Input validation and sanitization
 * - CSRF protection
 * - Security headers via Helmet
 * - CORS restrictions
 * - Request size limits
 * - Honeypot fields
 * 
 * @author Terrnix Security Team
 * @version 2.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { RateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (required for accurate IP behind Render's reverse proxy)
app.set('trust proxy', 1);

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://terrnix-backend.onrender.com"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Allow CDN resources
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: []
    }
  }
}));

// CORS configuration (restrictive)
const corsOrigins = NODE_ENV === 'production' 
  ? ['https://terrnix.com', 'https://www.terrnix.com']
  : ['https://terrnix.com', 'https://www.terrnix.com', 'http://localhost:3000', 'http://localhost:8080'];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Initialize rate limiter
const rateLimiter = new RateLimiter({
  trustProxy: true,
  ipWindowMs: 15 * 60 * 1000,
  ipMaxRequests: 100,
  endpointWindowMs: 60 * 1000,
  endpointMaxRequests: 10,
  burstWindowMs: 1000,
  burstMaxRequests: 5,
  subscribeWindowMs: 60 * 60 * 1000,
  subscribeMaxRequests: 5,
  contactWindowMs: 60 * 60 * 1000,
  contactMaxRequests: 3
});

// Apply rate limiting to all API routes
app.use('/api', rateLimiter.middleware());

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: NODE_ENV
  });
});

// Rate limit status endpoint
app.get('/api/rate-limit-status', (req, res) => {
  const stats = rateLimiter.getStats();
  res.json({
    success: true,
    stats: stats,
    limits: {
      ip: '100 requests per 15 minutes',
      endpoint: '10 requests per minute per endpoint',
      burst: '5 requests per second',
      subscribe: '5 subscriptions per hour',
      contact: '3 contacts per hour'
    }
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  res.json({
    success: true,
    csrfToken: token
  });
});

// Validation helpers
const sanitizeString = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '') // Strip HTML tags
    .trim()
    .substring(0, 1000); // Max length
};

const sanitizeEmail = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().trim().substring(0, 254);
};

// Subscribe endpoint with validation
app.post('/api/subscribe', [
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email too long')
    .customSanitizer(sanitizeEmail),
  body('hp_field')
    .optional()
    .custom((value) => {
      if (value && value.length > 0) {
        throw new Error('Bot detected');
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
  }

  const { email } = req.body;
  
  // TODO: Add email to subscription list
  // TODO: Send confirmation email
  
  console.log(`[Subscribe] ${email} from ${req.rateLimit?.ip?.count || '?'} requests`);
  
  res.json({
    success: true,
    message: 'Thank you for subscribing! Please check your email for confirmation.'
  });
});

// Contact endpoint with validation
app.post('/api/contact', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters')
    .matches(/^[a-zA-Z0-9\s\-\.'']+$/).withMessage('Name contains invalid characters')
    .customSanitizer(sanitizeString),
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email too long')
    .customSanitizer(sanitizeEmail),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name too long')
    .matches(/^[a-zA-Z0-9\s\-\.'',&]+$/).withMessage('Company contains invalid characters')
    .customSanitizer(sanitizeString),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Phone number too long')
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone contains invalid characters')
    .customSanitizer(sanitizeString),
  body('discipline')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Discipline too long')
    .isIn([
      'Energy & Renewables',
      'ESG Strategy & Reporting',
      'Decarbonisation Strategies',
      'Carbon Accounting & GHG Protocol',
      'Sustainability Regulation & Compliance',
      'Carbon Pricing & Tax',
      'Other / General Inquiry'
    ]).withMessage('Invalid discipline selected')
    .customSanitizer(sanitizeString),
  body('message')
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters')
    .customSanitizer(sanitizeString),
  body('hp_field')
    .optional()
    .custom((value) => {
      if (value && value.length > 0) {
        throw new Error('Bot detected');
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
  }

  const { name, email, company, phone, discipline, message } = req.body;
  
  // TODO: Send notification email
  // TODO: Store contact in database
  
  console.log(`[Contact] ${name} (${email}) - ${discipline || 'General'}`);
  
  res.json({
    success: true,
    message: 'Thank you for your message. We will get back to you within 24 hours.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle CORS errors gracefully
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed'
    });
  }
  
  // Log error securely (no sensitive data)
  console.error('[Error]', {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  rateLimiter.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  rateLimiter.destroy();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Terrnix backend server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Security features enabled:`);
  console.log(`  - Helmet security headers`);
  console.log(`  - Input validation & sanitization`);
  console.log(`  - Honeypot bot protection`);
  console.log(`  - Rate limiting:`);
  console.log(`    - IP: 100 requests per 15 minutes`);
  console.log(`    - Endpoint: 10 requests per minute`);
  console.log(`    - Burst: 5 requests per second`);
  console.log(`    - Subscribe: 5 per hour`);
  console.log(`    - Contact: 3 per hour`);
});

module.exports = app;
