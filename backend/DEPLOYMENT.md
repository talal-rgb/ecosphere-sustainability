# Terrnix Backend Rate Limiting — Deployment Guide

## Overview

This directory contains the rate limiting middleware and example server for the Terrnix backend API. Rate limiting prevents abuse, protects against DDoS attacks, and ensures fair resource usage.

## Security Risk Addressed

**Finding:** No rate limiting on backend API (Risk 8.0/10)
- **Before:** Unlimited requests allowed → vulnerable to brute force, spam, DDoS
- **After:** Multi-layer rate limiting → 429 responses when limits exceeded

## Rate Limits

| Layer | Limit | Window | Applies To |
|-------|-------|--------|------------|
| IP | 100 requests | 15 minutes | All API endpoints |
| Endpoint | 10 requests | 1 minute | Per endpoint per IP |
| Burst | 5 requests | 1 second | All requests |
| Subscribe | 5 requests | 1 hour | `/api/subscribe` |
| Contact | 3 requests | 1 hour | `/api/contact` |

## Files

```
backend/
├── middleware/
│   └── rateLimiter.js    # Core rate limiting logic
├── server.js             # Example Express server with integration
├── package.json          # Dependencies
└── DEPLOYMENT.md         # This file
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Test Rate Limiting

```bash
# Should succeed
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Should fail after 5 requests in 1 hour
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test2@example.com"}'
```

## Integration with Existing Backend

If you already have a backend server on Render:

### Option A: Copy Middleware Only

1. Copy `middleware/rateLimiter.js` to your existing backend
2. Import and use in your Express app:

```javascript
const { RateLimiter } = require('./middleware/rateLimiter');

const rateLimiter = new RateLimiter({
  trustProxy: true // Required for Render
});

app.use('/api', rateLimiter.middleware());
```

### Option B: Use Full Server Example

1. Replace your existing `server.js` with the provided one
2. Add your existing route handlers
3. Update environment variables on Render

## Render.com Deployment

### Environment Variables

Set these in your Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `TRUST_PROXY` | `true` | Trust Render's reverse proxy |
| `RATE_LIMIT_IP_MAX` | `100` | IP limit (optional) |
| `RATE_LIMIT_IP_WINDOW` | `900000` | IP window in ms (optional) |

### Important: Trust Proxy Setting

Render uses reverse proxies, so `req.ip` won't be accurate without:

```javascript
app.set('trust proxy', 1);
```

This is already configured in the example server.

## Production Considerations

### 1. Redis Backend (Recommended)

For production with multiple server instances, replace the in-memory store with Redis:

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Modify rateLimiter.js to use redis.get/redis.set instead of Map
```

### 2. Monitoring

Add logging for rate limit events:

```javascript
// In your route handlers
app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.path} from ${req.ip}`);
  next();
});
```

### 3. Alerting

Set up alerts for:
- High 429 response rates (possible attack)
- Unusual traffic patterns
- Rate limit store size (memory usage)

### 4. Whitelisting

Add IP whitelisting for trusted sources:

```javascript
const WHITELISTED_IPS = ['127.0.0.1'];

// In middleware, before rate limit check
if (WHITELISTED_IPS.includes(clientIP)) {
  return next();
}
```

## Testing

Run the test suite:

```bash
npm test
```

Manual test with curl:

```bash
#!/bin/bash
# Test burst limit (should fail after 5)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3000/api/subscribe \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test$i@example.com\"}"
  echo " - Request $i"
done
```

## Response Headers

When rate limiting is active, these headers are included:

```
X-RateLimit-Limit-IP: 100
X-RateLimit-Remaining-IP: 95
X-RateLimit-Reset-IP: 2024-01-01T00:15:00.000Z
X-RateLimit-Limit-Endpoint: 5
X-RateLimit-Remaining-Endpoint: 4
X-RateLimit-Reset-Endpoint: 2024-01-01T00:01:00.000Z
```

When limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "success": false,
  "error": "Too Many Requests",
  "message": "Endpoint rate limit exceeded",
  "retryAfter": 3600,
  "documentation": "https://terrnix.com/rate-limits"
}
```

## Rollback

If issues occur, disable rate limiting by removing the middleware:

```javascript
// Comment out or remove this line
// app.use('/api', rateLimiter.middleware());
```

## Support

For questions or issues with rate limiting:
1. Check Render logs for errors
2. Verify `trust proxy` is enabled
3. Test with `curl -v` to see headers
4. Review rate limit status at `/api/rate-limit-status`
