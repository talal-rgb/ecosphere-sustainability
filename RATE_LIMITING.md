# Terrnix Rate Limiting Implementation

## Overview

This implementation adds multi-layer rate limiting to the Terrnix platform to prevent abuse, protect against DDoS attacks, and ensure fair resource usage.

**Security Risk Addressed:** No rate limiting on backend API (Risk 8.0/10)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client        │────▶│  Rate Limit      │────▶│  Backend API    │
│   (Browser)     │     │  Helper (JS)     │     │  (Render)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐          ┌──────────────┐
                        │ localStorage │          │ Rate Limiter │
                        │ (client)     │          │ Middleware   │
                        └──────────────┘          │ (server)     │
                                                  └──────────────┘
```

## Rate Limits

| Layer | Limit | Window | Applies To | Enforcement |
|-------|-------|--------|------------|-------------|
| **IP** | 100 requests | 15 minutes | All API endpoints | Server |
| **Endpoint** | 10 requests | 1 minute | Per endpoint per IP | Server |
| **Burst** | 5 requests | 1 second | All requests | Server |
| **Subscribe** | 5 requests | 1 hour | `/api/subscribe` | Server + Client |
| **Contact** | 3 requests | 1 hour | `/api/contact` | Server + Client |

## Files Added

### Backend (Server-Side)

```
backend/
├── middleware/
│   └── rateLimiter.js      # Core rate limiting middleware
├── server.js                # Example Express server
├── package.json             # Dependencies
└── DEPLOYMENT.md            # Deployment guide
```

### Frontend (Client-Side)

```
assets/js/
├── rateLimitHelper.js       # Client-side rate limiting
└── apiClient.js             # API client with rate limit integration
```

### Documentation

```
RATE_LIMITING.md             # This file
```

## Server-Side Implementation

### Features

- **Multi-layer protection:** IP-based, endpoint-specific, and burst protection
- **Configurable limits:** Per-endpoint customization for different risk profiles
- **Rate limit headers:** `X-RateLimit-*` headers for client awareness
- **Automatic cleanup:** Expired entries cleaned every 5 minutes
- **Graceful degradation:** Returns 429 with `Retry-After` header

### Response Headers

Successful requests include:
```
X-RateLimit-Limit-IP: 100
X-RateLimit-Remaining-IP: 95
X-RateLimit-Reset-IP: 2024-01-01T00:15:00.000Z
X-RateLimit-Limit-Endpoint: 5
X-RateLimit-Remaining-Endpoint: 4
X-RateLimit-Reset-Endpoint: 2024-01-01T00:01:00.000Z
```

Rate limited responses include:
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

## Client-Side Implementation

### Features

- **Pre-flight checks:** Prevents requests that would exceed limits
- **Request tracking:** Persists in localStorage across sessions
- **Exponential backoff:** Retries with increasing delays
- **User-friendly messages:** Shows time until retry is allowed
- **Fallback support:** Works even if scripts fail to load

### Usage

```javascript
// Subscribe with automatic rate limiting
apiClient.subscribe('user@example.com')
  .then(result => {
    if (result.success) {
      console.log('Subscribed!');
    } else {
      console.log('Error:', result.message);
    }
  });

// Contact form with rate limiting
apiClient.contact({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!'
}).then(result => {
  // Handle result
});
```

## Deployment

### Backend (Render.com)

1. Copy `backend/middleware/rateLimiter.js` to your backend repository
2. Integrate into your Express app:

```javascript
const { RateLimiter } = require('./middleware/rateLimiter');

const rateLimiter = new RateLimiter({
  trustProxy: true // Required for Render
});

app.use('/api', rateLimiter.middleware());
```

3. Set environment variable: `TRUST_PROXY=true`
4. Deploy to Render

### Frontend (GitHub Pages)

The frontend changes are already integrated:
- `rateLimitHelper.js` and `apiClient.js` are loaded in `index.html`
- Form handlers use `apiClient` when available
- Fallback to direct `fetch()` if scripts fail to load

## Testing

### Test Rate Limiting

```bash
# Test burst limit (should fail after 5)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://terrnix-backend.onrender.com/api/subscribe \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test$i@example.com\"}"
  echo " - Request $i"
done
```

### Verify Headers

```bash
curl -I https://terrnix-backend.onrender.com/api/rate-limit-status
```

## Monitoring

### Metrics to Track

- **429 response rate:** Should be < 1% under normal traffic
- **Rate limit store size:** Monitor memory usage
- **Top blocked IPs:** Identify attack patterns
- **Endpoint-specific limits:** Tune if too restrictive

### Alerts

Set up alerts for:
- 429 rate > 5% (possible attack)
- Store size > 10,000 entries (memory pressure)
- Single IP blocked > 10 times (persistent attacker)

## Rollback

If issues occur:

1. **Disable server-side:** Comment out `app.use('/api', rateLimiter.middleware())`
2. **Disable client-side:** Remove script tags from HTML
3. **Clear client data:** `localStorage.clear()` in browser console

## Future Enhancements

- [ ] Redis backend for distributed rate limiting
- [ ] CAPTCHA integration after repeated limits
- [ ] IP reputation scoring
- [ ] Geographic rate limiting
- [ ] WebSocket rate limiting
- [ ] GraphQL query complexity limiting

## References

- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [RFC 6585 - HTTP Status Code 429](https://tools.ietf.org/html/rfc6585)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
