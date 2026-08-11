# Terrnix Backend Security — Deployment Guide

## Overview

This directory contains the production Terrnix API, its rate limiter, locked dependencies, and security regression tests.

The Carbon Activity Ingestion API is documented in [`../docs/CARBON_ACTIVITY_INGESTION.md`](../docs/CARBON_ACTIVITY_INGESTION.md). Structured uploads are processed in memory, capped at 5 MiB and 5,000 rows, and are not persisted by the ingestion endpoint.

The authenticated SaaS domain, tenant-isolation model, evidence metadata, entitlements, and database migration workflow are documented in [`../docs/PLATFORM_FOUNDATION.md`](../docs/PLATFORM_FOUNDATION.md). These services are not exposed through public routes until authenticated session middleware is delivered.

## Security Risk Addressed

**Finding:** No rate limiting on backend API (Risk 8.0/10)
- **Before:** Unlimited requests allowed → vulnerable to brute force, spam, DDoS
- **After:** Multi-layer rate limiting → 429 responses when limits exceeded

## Rate Limits

| Layer | Limit | Window | Applies To |
|-------|-------|--------|------------|
| IP | 100 requests | 15 minutes | All API endpoints |
| Endpoint | 10 requests | 1 minute | Per endpoint per IP |
| Burst | 20 requests | 1 second | All API requests per IP |
| Subscribe | 5 requests | 1 hour | `/api/subscribe` |
| Contact | 3 requests | 1 hour | `/api/contact` |

## Files

```
backend/
├── middleware/
│   └── rateLimiter.js    # Core rate limiting logic
├── test/                 # Security and report regression tests
├── server.js             # Production Express application
├── package.json          # Dependency and test commands
├── package-lock.json     # Reproducible dependency resolution
└── DEPLOYMENT.md         # This file
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm ci
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

## Rate Limiter Integration

```javascript
import { createExpressMiddleware } from './middleware/rateLimiter.js';

const apiRateLimit = createExpressMiddleware({
  trustProxy: false,
  burstMaxRequests: 20
});

app.use('/api', apiRateLimit);
```

## Render.com Deployment

### Environment Variables

Set these in your Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `ALLOWED_ORIGIN` | `https://terrnix.com` | Browser origin allowed by CORS |
| `DATABASE_URL` | Secret PostgreSQL connection string | Dedicated non-owner, non-`BYPASSRLS` application role |
| `DATABASE_SSL` | `require` | Require verified TLS for the database connection |
| `DATABASE_POOL_MAX` | `10` | Maximum application connections per service instance |
| `BETTER_AUTH_SECRET` | Secret, 32+ random characters | Session, state, and token encryption key |
| `BETTER_AUTH_URL` | `https://api.terrnix.com` | Public API origin used for auth routes and callbacks |
| `AUTH_TRUSTED_ORIGINS` | `https://terrnix.com,https://www.terrnix.com` | Allowed credentialed frontend origins |
| `AUTH_COOKIE_DOMAIN` | `terrnix.com` | Shared parent domain for first-party cookies |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth application credentials | Optional Google login |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Entra application credentials | Optional Microsoft login |
| `MICROSOFT_TENANT_ID` | `common` or tenant UUID | Microsoft account audience |
| `EVIDENCE_STORAGE_BUCKET` | Private bucket name | Quarantine and evidence object storage |
| `EVIDENCE_STORAGE_REGION` | Provider region | S3 request signing region |
| `EVIDENCE_STORAGE_ENDPOINT` | Optional HTTPS endpoint | S3-compatible provider endpoint |
| `EVIDENCE_STORAGE_KMS_KEY_ID` | Optional KMS key ID | Customer-managed server-side encryption |
| `EVIDENCE_UPLOAD_URL_SECONDS` | `600` | Signed upload lifetime (60–900 seconds) |
| `DOCUMENT_WORKER_DATABASE_URL` | Separate secret connection string | Dedicated least-privilege processing role; never the public API role |
| `DOCUMENT_WORKER_POOL_MAX` | `2` | Maximum database connections per worker process |

Before an authenticated-platform deployment, run database migrations with a separate migration role:

```bash
cd backend
npm ci
DATABASE_URL=postgresql://migration-role:... npm run db:migrate
npm run check
npm test
```

Do not give the runtime application role table ownership or `BYPASSRLS`. Never run migrations automatically from a public request or application startup.

The runtime role needs data access without ownership. RLS protects `platform`; the `auth` schema is reachable only from the backend service:

```sql
GRANT USAGE ON SCHEMA platform, auth TO terrnix_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO terrnix_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO terrnix_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO terrnix_app;
```

After migrations, explicitly grant the application role access to the bootstrap entry point; it is revoked from `PUBLIC`:

```sql
GRANT EXECUTE ON FUNCTION platform.bootstrap_organization(
  uuid, uuid, text, text, text, text, text, text, text
) TO terrnix_app;
```

Keep that function owned by the migration role. Subscription writes are intentionally unavailable to tenant sessions and will be performed by a separately authorized billing integration.

Document workers require cross-tenant queue claiming, so use a separate role that is never available to the public API. `BYPASSRLS` is acceptable only with narrow table grants:

```sql
CREATE ROLE terrnix_document_worker LOGIN BYPASSRLS;
GRANT USAGE ON SCHEMA platform TO terrnix_document_worker;
GRANT SELECT, INSERT, UPDATE ON platform.document_processing_jobs TO terrnix_document_worker;
GRANT SELECT, UPDATE ON platform.evidence_versions TO terrnix_document_worker;
GRANT SELECT, INSERT ON platform.audit_events TO terrnix_document_worker;
```

Do not grant this role access to users, memberships, subscriptions, auth tables, or arbitrary tenant data. Rotate its credential independently and restrict network access to worker infrastructure.

Before enabling authentication, configure the API domain and register these OAuth callback URLs with the providers:

- `https://api.terrnix.com/api/auth/callback/google`
- `https://api.terrnix.com/api/auth/callback/microsoft`

See [`../docs/AUTHENTICATION_ARCHITECTURE.md`](../docs/AUTHENTICATION_ARCHITECTURE.md) for the identity and tenant boundary.

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
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Modify rateLimiter.js to use redis.get/redis.set instead of Map
```

### 2. Monitoring

Add logging for rate limit events:

```javascript
// In your route handlers
app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
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
# Test endpoint limit (the 11th request should return 429)
for i in {1..11}; do
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

## Support

For questions or issues with rate limiting:
1. Check Render logs for errors
2. Verify `app.set('trust proxy', 1)` is active on Render
3. Test with `curl -v` to see headers
4. Run `npm test` and `npm audit` before deployment
