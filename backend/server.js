/**
 * Terrnix Backend Server with Rate Limiting
 * 
 * Example Express.js server demonstrating rate limiting integration.
 * This should be adapted to your existing backend deployment on Render.
 * 
 * @author Terrnix Security Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const { RateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for accurate IP behind Render's reverse proxy)
app.set('trust proxy', 1);

// CORS configuration (restrictive)
const corsOptions = {
  origin: [
    'https://terrnix.com',
    'https://www.terrnix.com',
    'http://localhost:3000', // Development
    'http://localhost:8080'  // Development
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit body size

// Initialize rate limiter
const rateLimiter = new RateLimiter({
  trustProxy: true, // Required for Render
  
  // IP-based limits
  ipWindowMs: 15 * 60 * 1000,      // 15 minutes
  ipMaxRequests: 100,               // 100 requests per 15 min
  
  // Endpoint-specific limits
  endpointWindowMs: 60 * 1000,      // 1 minute
  endpointMaxRequests: 10,          // 10 requests per minute per endpoint
  
  // Burst protection
  burstWindowMs: 1000,              // 1 second
  burstMaxRequests: 5,              // 5 requests per second
  
  // Subscription endpoint (stricter)
  subscribeWindowMs: 60 * 60 * 1000, // 1 hour
  subscribeMaxRequests: 5,           // 5 subscriptions per hour per IP
  
  // Contact endpoint
  contactWindowMs: 60 * 60 * 1000,   // 1 hour
  contactMaxRequests: 3,             // 3 contacts per hour per IP
});

// Apply rate limiting to all API routes
app.use('/api', rateLimiter.middleware());

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

// Subscribe endpoint
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email address'
    });
  }
  
  // TODO: Add email to subscription list
  // TODO: Send confirmation email
  
  console.log(`[Subscribe] ${email} from ${req.rateLimit.ip.count} requests`);
  
  res.json({
    success: true,
    message: 'Thank you for subscribing! Please check your email for confirmation.'
  });
});

// Contact endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, company, phone, discipline, message } = req.body;
  
  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required'
    });
  }
  
  // Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email address'
    });
  }
  
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
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
  console.log(`Rate limiting enabled:`);
  console.log(`  - IP: 100 requests per 15 minutes`);
  console.log(`  - Endpoint: 10 requests per minute`);
  console.log(`  - Burst: 5 requests per second`);
  console.log(`  - Subscribe: 5 per hour`);
  console.log(`  - Contact: 3 per hour`);
});

module.exports = app;
