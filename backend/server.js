/**
 * Terrnix Backend Server — Unified API
 *
 * Merged from:
 * - Live backend (chat, carbon calculator, reports)
 * - PR #30 (contact forms, newsletter, lead persistence, health checks)
 *
 * Endpoints:
 * - GET  /health
 * - GET  /api/health/integrations
 * - GET  /api/admin/lead-stats
 * - GET  /api/factors/status
 * - POST /api/chat
 * - POST /api/carbon/ingest
 * - POST /api/carbon/calculate
 * - POST /api/reports/excel
 * - POST /api/reports/pdf
 * - POST /api/contact
 * - POST /api/subscribe
 *
 * Security:
 * - Helmet security headers
 * - CORS restrictions
 * - Input validation
 * - Rate limiting
 * - Admin token protection
 *
 * @version 3.0.0
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import { pathToFileURL } from 'url';
import { createExpressMiddleware } from './middleware/rateLimiter.js';
import { createSessionContextMiddleware, createTenantContextMiddleware } from './middleware/authContext.js';
import { createPlatformRouter } from './routes/platform.js';

// Live backend services
import { buildChatInput, chatResponseSchema } from './services/terrnixPrompt.js';
import { calculateFootprint } from './services/carbonEngine.js';
import { getFactorBundle } from './services/factorProvider.js';
import { buildExcelReport, buildPdfReport } from './services/reportExporter.js';
import { parseActivityUpload } from './services/activityIngestion.js';
import { authNodeHandler, isAuthConfigured } from './services/auth.js';
import { getBillingPool } from './services/billingDatabase.js';
import { ingestBillingEvent } from './services/billingEvents.js';
import { getDatabasePool } from './services/database.js';
import { getAccessSnapshot } from './services/platformService.js';
import { createStripeBillingProvider } from './services/stripeBillingProvider.js';

// PR #30 services
import { sendNotificationEmailWithTimeout, verifyConnection } from './services/email.js';
import { sendBrevoEmailWithTimeout } from './services/brevoEmail.js';
import { addContact } from './services/brevo.js';
import { saveLead, getHealthStatus, getStats, isWritableSync } from './services/leadStore.js';

// Assessment services
import { saveCertificate, findCertificate, generateCertificateId, getHealthStatus as getCertHealthStatus } from './services/certificateStore.js';
import { sendAssessmentResultsEmail } from './services/assessmentEmail.js';

// Make getHealthStatus backward-compatible (sync wrapper)
const getHealthStatusSync = () => getHealthStatus();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://terrnix.com';
const activityUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, file, callback) => {
    const accepted = /\.(csv|xlsx)$/i.test(file.originalname || '') && [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ].includes(file.mimetype);
    if (!accepted) {
      const error = new Error('Only CSV and XLSX activity files are accepted.');
      error.status = 400;
      error.code = 'unsupported_file_type';
      return callback(error);
    }
    callback(null, true);
  }
});

// Request logging middleware — log EVERY request before any other middleware
app.use((req, res, next) => {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  req.reqId = reqId;
  console.log(`[${reqId}] REQUEST ${req.method} ${req.path}`);
  
  // Log response status when finished
  res.on('finish', () => {
    console.log(`[${reqId}] RESPONSE ${res.statusCode} in ${Date.now() - parseInt(reqId.split('-')[1])}ms`);
  });
  
  next();
});

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
  crossOriginEmbedderPolicy: false,
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

// CORS configuration
const corsOrigins = NODE_ENV === 'production'
  ? [allowedOrigin, 'https://terrnix.com', 'https://www.terrnix.com']
  : [allowedOrigin, 'https://terrnix.com', 'https://www.terrnix.com', 'http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.indexOf(origin) !== -1) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Admin-Token', 'X-Terrnix-Organization-ID'],
  credentials: true,
  maxAge: 86400
}));

// Better Auth requires the unparsed request body. Keep these handlers before
// express.json(); guest tools and all existing public endpoints remain anonymous.
app.all('/api/auth', authNodeHandler);
app.all('/api/auth/*splat', authNodeHandler);

const billingWebhookLimit = createExpressMiddleware({
  trustProxy: false,
  endpointMaxRequests: 120,
  endpointWindowMs: 60_000,
  burstMaxRequests: 30
});
app.post('/api/billing/stripe/webhook', billingWebhookLimit, express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  try {
    const provider = createStripeBillingProvider();
    const event = provider.verifyAndMapWebhook(req.body, req.get('Stripe-Signature'));
    const payloadSha256 = crypto.createHash('sha256').update(req.body).digest('hex');
    const result = await ingestBillingEvent(getBillingPool(), event, payloadSha256);
    res.json({ received: true, status: result.status });
  } catch (error) {
    next(error);
  }
});

// Parse ordinary API payloads conservatively while allowing larger calculation
// and report payloads. Express skips parsers when a body is already parsed.
app.use(
  ['/api/carbon/calculate', '/api/reports/excel', '/api/reports/pdf'],
  express.json({ limit: '2mb' })
);
app.use(express.json({ limit: '32kb' }));

// Apply abuse protection to every API route. Express already resolves the trusted
// proxy address, so the limiter does not trust user-supplied forwarding headers.
const apiRateLimit = createExpressMiddleware({
  trustProxy: false,
  burstMaxRequests: 20
});
app.use('/api', apiRateLimit);

const requireSession = createSessionContextMiddleware();
const requireTenant = createTenantContextMiddleware();

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'terrnix-website-api',
    repo: 'talal-rgb/ecosphere-sustainability',
    version: 'brevo-primary-2026-06-26',
    commit: process.env.RENDER_GIT_COMMIT || 'unknown',
    deployedAt: new Date().toISOString(),
    time: new Date().toISOString()
  });
});

app.get('/api/platform/session', requireSession, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.authContext.userId,
      email: req.authContext.email,
      displayName: req.authContext.displayName
    }
  });
});

app.get('/api/platform/access', requireSession, requireTenant, async (req, res, next) => {
  try {
    const access = await getAccessSnapshot(getDatabasePool(), req.platformContext);
    res.json({ success: true, access });
  } catch (error) {
    next(error);
  }
});

app.use('/api/platform', createPlatformRouter({
  requireSession,
  requireTenant,
  databasePoolResolver: getDatabasePool
}));

app.get('/api/health/integrations', (_req, res) => {
  const health = getHealthStatusSync();
  const allHealthy = health.leadStorageWritable && health.emailConfigured && health.brevoConfigured;

  res.json({
    success: true,
    status: allHealthy ? 'healthy' : 'degraded',
    integrations: {
      emailConfigured: health.emailConfigured,
      brevoConfigured: health.brevoConfigured,
      leadStorageWritable: health.leadStorageWritable
    },
    timestamp: new Date().toISOString()
  });
});

// Lead storage stats (admin only)
app.get('/api/admin/lead-stats', (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_API_TOKEN;

  if (!expectedToken) {
    return res.status(503).json({
      success: false,
      message: 'Admin token not configured'
    });
  }

  if (adminToken !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const stats = getStats();
  res.json({
    success: true,
    stats: {
      totalLeads: stats.totalLeads,
      fileSize: stats.fileSizeHuman,
      writable: stats.writable
    }
  });
});

// ============================================
// LIVE BACKEND ENDPOINTS (Preserved)
// ============================================

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('REPLACE_WITH')) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.get('/api/factors/status', async (_req, res, next) => {
  try {
    const bundle = await getFactorBundle({});
    res.json({ ok: true, metadata: bundle.metadata, local_factor_version: bundle.local?.metadata?.version || 'unknown' });
  } catch (err) {
    next(err);
  }
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { message, pageContext = '', visitorGoal = '' } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });
    if (message.length > 4000) return res.status(400).json({ error: 'message must be 4000 characters or fewer' });
    if (typeof pageContext !== 'string' || pageContext.length > 500) return res.status(400).json({ error: 'pageContext must be 500 characters or fewer' });
    if (typeof visitorGoal !== 'string' || visitorGoal.length > 500) return res.status(400).json({ error: 'visitorGoal must be 500 characters or fewer' });

    const client = getOpenAIClient();
    if (!client) {
      return res.status(503).json({
        error: 'OPENAI_API_KEY is not configured',
        safe_message: 'Terrnix AI is not connected yet. Add OPENAI_API_KEY to the VPS .env file.'
      });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
      input: buildChatInput({ message, pageContext, visitorGoal }),
      text: {
        format: {
          type: 'json_schema',
          name: 'terrnix_sustainability_answer',
          schema: chatResponseSchema,
          strict: true
        }
      },
      store: false
    });

    let payload;
    try {
      payload = JSON.parse(response.output_text || '{}');
    } catch {
      payload = {
        answer: response.output_text || 'Terrnix AI returned an empty answer.',
        key_points: [],
        methods: [],
        sources: [],
        confidence: 'medium',
        next_steps: ['Use the Terrnix calculator or contact a sustainability expert for detailed support.'],
        disclaimer: 'Educational information only; not legal, financial, regulatory, or assurance advice.'
      };
    }
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

app.post('/api/carbon/calculate', async (req, res, next) => {
  try {
    const activityData = req.body || {};
    if (activityData.activities !== undefined && !Array.isArray(activityData.activities)) {
      return res.status(400).json({ error: 'invalid_activities', safe_message: 'activities must be an array.' });
    }
    if (activityData.activities?.length > 5000) {
      return res.status(400).json({ error: 'activity_limit_exceeded', safe_message: 'A calculation is limited to 5000 activity rows.' });
    }
    const factorBundle = await getFactorBundle(activityData);
    res.json(calculateFootprint(activityData, factorBundle));
  } catch (err) {
    next(err);
  }
});

app.post('/api/carbon/ingest', activityUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file_required', safe_message: 'Upload one CSV or XLSX file in the file field.' });
    }
    const ingestion = await parseActivityUpload({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    });
    res.json({
      ...ingestion,
      calculation_input: {
        organization: String(req.body?.organization || '').trim().slice(0, 200) || 'Not provided',
        reportingPeriod: String(req.body?.reportingPeriod || '').trim().slice(0, 100) || 'Not provided',
        activities: ingestion.activities
      }
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/reports/excel', async (req, res, next) => {
  try {
    const activityData = req.body || {};
    const factorBundle = await getFactorBundle(activityData);
    const result = calculateFootprint(activityData, factorBundle);
    const workbookBuffer = await buildExcelReport(result, activityData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="terrnix-carbon-report.xlsx"');
    res.send(workbookBuffer);
  } catch (err) {
    next(err);
  }
});

app.post('/api/reports/pdf', async (req, res, next) => {
  try {
    const activityData = req.body || {};
    const factorBundle = await getFactorBundle(activityData);
    const result = calculateFootprint(activityData, factorBundle);
    const pdfBuffer = await buildPdfReport(result, activityData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="terrnix-carbon-report.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// ============================================
// PR #30 ENDPOINTS (Contact, Newsletter)
// ============================================

// Validation helpers
const sanitizeString = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000);
};

const sanitizeEmail = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().trim().substring(0, 254);
};

// ============================================
// ASYNC HELPERS — fire-and-forget with timeout
// Never block HTTP response on external services
// ============================================

function withTimeout(promise, timeoutMs, context) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${context} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

function fireAndForget(promise, context) {
  promise.catch(err => {
    console.error(`[Async] ${context} failed:`, err.message);
  });
}

// Subscribe endpoint
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
  const reqId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${reqId}] request_received /api/subscribe`);

  // 1. ALWAYS persist lead first (source of truth)
  const leadResult = await saveLead({
    type: 'newsletter',
    email,
    source: 'newsletter-form',
    name: null,
    company: null,
    message: null
  });
  console.log(`[${reqId}] lead_saved success=${leadResult.success}`);
  if (!leadResult.success) {
    console.error(`[${reqId}] CRITICAL: Lead persistence failed:`, leadResult.error);
  }

  // 2. Return success immediately — do NOT wait for email or Brevo
  res.json({
    success: true,
    message: 'Thank you for subscribing! Please check your email for confirmation.'
  });
  console.log(`[${reqId}] response_sent`);

  // 3. Fire-and-forget: Brevo notification email PRIMARY (5s timeout)
  console.log(`[${reqId}] brevo_notification_started`);
  fireAndForget(
    withTimeout(
      sendBrevoEmailWithTimeout({
        subject: 'New Terrnix Newsletter Subscriber',
        text: `New subscriber: ${email}\nDate: ${new Date().toISOString()}\nSource: terrnix.com`
      }, 5000),
      5000,
      'Brevo subscribe notification'
    ).then(result => {
      if (result.success) {
        console.log(`[${reqId}] brevo_notification_sent messageId=${result.messageId}`);
      } else {
        console.error(`[${reqId}] brevo_notification_failed error="${result.error}"`);
        // Fallback to Zoho SMTP
        console.log(`[${reqId}] zoho_fallback_started`);
        fireAndForget(
          withTimeout(
            sendNotificationEmailWithTimeout({
              subject: 'New Terrnix Newsletter Subscriber',
              text: `New subscriber: ${email}\nDate: ${new Date().toISOString()}\nSource: terrnix.com`
            }, 5000),
            5000,
            'Zoho fallback subscribe'
          ).then(fbResult => {
            if (fbResult.success) {
              console.log(`[${reqId}] zoho_fallback_sent messageId=${fbResult.messageId}`);
            } else {
              console.error(`[${reqId}] zoho_fallback_failed error="${fbResult.error}" code=${fbResult.code || 'none'}`);
            }
          })
           .catch(err => console.error(`[${reqId}] zoho_fallback_exception error="${err.message}"`)),
          'Zoho fallback subscribe'
        );
      }
    })
     .catch(err => {
       console.error(`[${reqId}] brevo_notification_exception error="${err.message}"`);
       // Fallback to Zoho SMTP
       console.log(`[${reqId}] zoho_fallback_started`);
       fireAndForget(
         withTimeout(
           sendNotificationEmailWithTimeout({
             subject: 'New Terrnix Newsletter Subscriber',
             text: `New subscriber: ${email}\nDate: ${new Date().toISOString()}\nSource: terrnix.com`
           }, 5000),
           5000,
           'Zoho fallback subscribe'
         ).then(fbResult => {
           if (fbResult.success) {
             console.log(`[${reqId}] zoho_fallback_sent messageId=${fbResult.messageId}`);
           } else {
             console.error(`[${reqId}] zoho_fallback_failed error="${fbResult.error}" code=${fbResult.code || 'none'}`);
           }
         })
          .catch(err2 => console.error(`[${reqId}] zoho_fallback_exception error="${err2.message}"`)),
         'Zoho fallback subscribe'
       );
     }),
    'Brevo subscribe notification'
  );

  // 4. Fire-and-forget: Brevo contact sync (5s timeout)
  console.log(`[${reqId}] brevo_async_deferred`);
  setTimeout(() => {
    console.log(`[${reqId}] brevo_async_started`);
    fireAndForget(
      withTimeout(
        addContact(email),
        5000,
        'Subscribe Brevo'
      ).then(() => console.log(`[${reqId}] brevo_async_finished`))
       .catch(() => console.log(`[${reqId}] brevo_async_failed`)),
      'Subscribe Brevo'
    );
  }, 100);
});

// Contact endpoint
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
  body('sourceUrl')
    .optional()
    .trim()
    .isURL({ require_protocol: true, protocols: ['http','https'] }).withMessage('Invalid source URL')
    .isLength({ max: 2048 }).withMessage('Source URL too long'),
  body('submissionTimestamp')
    .optional()
    .trim()
    .isISO8601().withMessage('Invalid timestamp format'),
  body('utmSource')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('UTM source too long')
    .matches(/^[a-zA-Z0-9_\-\.\s]+$/).withMessage('UTM source contains invalid characters'),
  body('utmMedium')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('UTM medium too long')
    .matches(/^[a-zA-Z0-9_\-\.\s]+$/).withMessage('UTM medium contains invalid characters'),
  body('utmCampaign')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('UTM campaign too long')
    .matches(/^[a-zA-Z0-9_\-\.\s]+$/).withMessage('UTM campaign contains invalid characters'),
  body('referrer')
    .optional()
    .trim()
    .isLength({ max: 2048 }).withMessage('Referrer too long'),
  body('leadScore')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Lead score must be 0-100'),
  body('hp_field')
    .optional()
    .custom((value) => {
      if (value && value.length > 0) {
        throw new Error('Bot detected');
      }
      return true;
    })
], async (req, res) => {
  const reqId = `con-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${reqId}] handler_started /api/contact`);

  const errors = validationResult(req);
  console.log(`[${reqId}] validationResult completed, errors=${errors.isEmpty() ? 'none' : errors.array().length}`);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    for (const e of errors.array()) {
      const field = e.path || e.param || 'general';
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(e.msg);
    }
    console.log(`[${reqId}] validation_failed, returning 400`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      fieldErrors,
      errors: errors.array().map(e => e.msg)
    });
  }

  console.log(`[${reqId}] validation_passed`);
  const { name, email, company, phone, discipline, message, sourceUrl, submissionTimestamp, utmSource, utmMedium, utmCampaign, referrer, leadScore } = req.body;
  console.log(`[${reqId}] request_received /api/contact`);

  // 1. ALWAYS persist lead first (source of truth)
  const leadResult = await saveLead({
    type: 'contact',
    name,
    email,
    company,
    message,
    source: 'contact-form',
    discipline,
    phone,
    sourceUrl,
    submissionTimestamp,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    leadScore
  });
  console.log(`[${reqId}] lead_saved success=${leadResult.success}`);
  if (!leadResult.success) {
    console.error(`[${reqId}] CRITICAL: Lead persistence failed:`, leadResult.error);
  }

  // 2. Return success immediately — do NOT wait for email
  res.json({
    success: true,
    message: 'Thank you for your message. We will get back to you within 24 hours.'
  });
  console.log(`[${reqId}] response_sent`);

  // 3. Fire-and-forget: Brevo notification email PRIMARY (5s timeout)
  const notificationText = `New contact form submission on terrnix.com

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Phone: ${phone || 'Not provided'}
Discipline: ${discipline || 'General Inquiry'}
Lead Score: ${leadScore ?? 'N/A'}/100

Message:
${message}

---
Attribution:
Source URL: ${sourceUrl || 'N/A'}
Submission Time: ${submissionTimestamp || 'N/A'}
UTM Source: ${utmSource || 'N/A'}
UTM Medium: ${utmMedium || 'N/A'}
UTM Campaign: ${utmCampaign || 'N/A'}
Referrer: ${referrer || 'N/A'}

---
Server Time: ${new Date().toISOString()}
Request ID: ${reqId}`;

  console.log(`[${reqId}] brevo_notification_started`);
  fireAndForget(
    withTimeout(
      sendBrevoEmailWithTimeout({
        subject: `New Contact: ${name} — ${discipline || 'General Inquiry'}`,
        text: notificationText
      }, 5000),
      5000,
      'Brevo contact notification'
    ).then(result => {
      if (result.success) {
        console.log(`[${reqId}] brevo_notification_sent messageId=${result.messageId}`);
      } else {
        console.error(`[${reqId}] brevo_notification_failed error="${result.error}"`);
        // Fallback to Zoho SMTP
        console.log(`[${reqId}] zoho_fallback_started`);
        fireAndForget(
          withTimeout(
            sendNotificationEmailWithTimeout({
              subject: `New Contact: ${name} — ${discipline || 'General Inquiry'}`,
              text: notificationText
            }, 5000),
            5000,
            'Zoho fallback contact'
          ).then(fbResult => {
            if (fbResult.success) {
              console.log(`[${reqId}] zoho_fallback_sent messageId=${fbResult.messageId}`);
            } else {
              console.error(`[${reqId}] zoho_fallback_failed error="${fbResult.error}" code=${fbResult.code || 'none'}`);
            }
          })
           .catch(err => console.error(`[${reqId}] zoho_fallback_exception error="${err.message}"`)),
          'Zoho fallback contact'
        );
      }
    })
     .catch(err => {
       console.error(`[${reqId}] brevo_notification_exception error="${err.message}"`);
       // Fallback to Zoho SMTP
       console.log(`[${reqId}] zoho_fallback_started`);
       fireAndForget(
         withTimeout(
           sendNotificationEmailWithTimeout({
             subject: `New Contact: ${name} — ${discipline || 'General Inquiry'}`,
             text: notificationText
           }, 5000),
           5000,
           'Zoho fallback contact'
         ).then(fbResult => {
           if (fbResult.success) {
             console.log(`[${reqId}] zoho_fallback_sent messageId=${fbResult.messageId}`);
           } else {
             console.error(`[${reqId}] zoho_fallback_failed error="${fbResult.error}" code=${fbResult.code || 'none'}`);
           }
         })
          .catch(err2 => console.error(`[${reqId}] zoho_fallback_exception error="${err2.message}"`)),
         'Zoho fallback contact'
       );
     }),
    'Brevo contact notification'
  );
});

// ============================================
// ASSESSMENT ENDPOINTS
// ============================================

// POST /api/assessment/lead — Store assessment participant
app.post('/api/assessment/lead', [
  body('fullName')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters')
    .matches(/^[a-zA-Z0-9\s\-\.''']+$/).withMessage('Name contains invalid characters')
    .customSanitizer(sanitizeString),
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email too long')
    .customSanitizer(sanitizeEmail),
  body('assessmentId')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Assessment ID too long')
    .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('Assessment ID contains invalid characters'),
  body('assessmentName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Assessment name too long')
    .customSanitizer(sanitizeString),
  body('score')
    .isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('maturityLevel')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Maturity level too long')
    .matches(/^[a-zA-Z0-9\s\-]+$/).withMessage('Maturity level contains invalid characters'),
  body('categoryScores')
    .optional()
    .isObject().withMessage('Category scores must be an object'),
  body('certificateId')
    .optional()
    .trim()
    .matches(/^TRX-CAA-\d{8}-[A-F0-9]{8}$/).withMessage('Invalid certificate ID format'),
  body('assessmentConsent')
    .isBoolean({ strict: true }).withMessage('Assessment consent must be a boolean')
    .custom((value) => {
      if (value !== true) {
        throw new Error('Assessment consent is required');
      }
      return true;
    }),
  body('consentTimestamp')
    .optional()
    .isISO8601().withMessage('Invalid consent timestamp format'),
  body('submissionTimestamp')
    .optional()
    .isISO8601().withMessage('Invalid submission timestamp format'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name too long')
    .matches(/^[a-zA-Z0-9\s\-\.'',&]+$/).withMessage('Company contains invalid characters')
    .customSanitizer(sanitizeString),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Industry too long')
    .customSanitizer(sanitizeString),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Country too long')
    .customSanitizer(sanitizeString),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Job title too long')
    .customSanitizer(sanitizeString),
  body('newsletterConsent')
    .optional()
    .isBoolean({ strict: true }).withMessage('Newsletter consent must be a boolean'),
  body('sourceUrl')
    .optional()
    .trim()
    .isURL({ require_protocol: true, protocols: ['http','https'] }).withMessage('Invalid source URL')
    .isLength({ max: 2048 }).withMessage('Source URL too long'),
  body('referrer')
    .optional()
    .trim()
    .isLength({ max: 2048 }).withMessage('Referrer too long'),
  body('utmSource')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('UTM source too long')
    .matches(/^[a-zA-Z0-9_\-\.\s]+$/).withMessage('UTM source contains invalid characters'),
  body('utmMedium')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('UTM medium too long')
    .matches(/^[a-zA-Z0-9_\-\.\s]+$/).withMessage('UTM medium contains invalid characters'),
  body('utmCampaign')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('UTM campaign too long')
    .matches(/^[a-zA-Z0-9_\-\.\s]+$/).withMessage('UTM campaign contains invalid characters'),
  body('reportDownloaded')
    .optional()
    .isBoolean({ strict: true }).withMessage('reportDownloaded must be a boolean'),
  body('certificateDownloaded')
    .optional()
    .isBoolean({ strict: true }).withMessage('certificateDownloaded must be a boolean'),
  body('hp_field')
    .optional()
    .custom((value) => {
      if (value && value.length > 0) {
        throw new Error('Bot detected');
      }
      return true;
    })
], async (req, res) => {
  const reqId = `ast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${reqId}] handler_started /api/assessment/lead`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    for (const e of errors.array()) {
      const field = e.path || e.param || 'general';
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(e.msg);
    }
    console.log(`[${reqId}] validation_failed`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      fieldErrors,
      errors: errors.array().map(e => e.msg)
    });
  }

  const {
    fullName, email, assessmentId, assessmentName, score, maturityLevel,
    categoryScores, certificateId, assessmentConsent, consentTimestamp,
    submissionTimestamp, company, industry, country, jobTitle,
    newsletterConsent, sourceUrl, referrer, utmSource, utmMedium, utmCampaign,
    reportDownloaded, certificateDownloaded
  } = req.body;

  console.log(`[${reqId}] request_received /api/assessment/lead assessment=${assessmentId}`);

  // Generate certificate ID if not provided
  let finalCertId = certificateId;
  if (!finalCertId) {
    finalCertId = generateCertificateId();
    console.log(`[${reqId}] generated_certificate_id=${finalCertId}`);
  }

  // Determine achievement label from score
  let achievementLabel = 'Certificate of Completion';
  if (score >= 85) achievementLabel = 'Advanced Achievement';
  else if (score >= 70) achievementLabel = 'Practitioner Achievement';
  else if (score >= 50) achievementLabel = 'Foundation Achievement';

  // 1. Save certificate record
  const certResult = await saveCertificate({
    certificateId: finalCertId,
    participantName: fullName,
    assessmentId,
    assessmentName: assessmentName || 'Carbon Accounting Readiness Assessment',
    issueDate: new Date().toISOString(),
    score,
    maturityLevel,
    achievementLabel,
    status: 'active'
  });
  console.log(`[${reqId}] certificate_saved success=${certResult.success} id=${certResult.certificateId}`);

  if (!certResult.success) {
    console.error(`[${reqId}] CRITICAL: Certificate storage failed:`, certResult.error);
    return res.status(500).json({
      success: false,
      message: 'Failed to store certificate. Please try again.',
      error: 'certificate_storage_failed'
    });
  }

  // 2. Save assessment lead
  const leadResult = await saveLead({
    type: 'assessment',
    name: fullName,
    email,
    company: company || null,
    message: `Assessment: ${assessmentName || assessmentId}\nScore: ${score}/100\nMaturity: ${maturityLevel}\nCertificate: ${certResult.certificateId}\nNewsletter: ${newsletterConsent === true ? 'yes' : 'no'}`,
    source: 'assessment-form',
    discipline: 'Assessment Participant',
    sourceUrl: sourceUrl || null,
    submissionTimestamp: submissionTimestamp || new Date().toISOString(),
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    utmCampaign: utmCampaign || null,
    referrer: referrer || null,
    leadScore: score
  });
  console.log(`[${reqId}] lead_saved success=${leadResult.success}`);

  if (!leadResult.success) {
    console.error(`[${reqId}] CRITICAL: Lead persistence failed:`, leadResult.error);
  }

  // 3. Return success immediately with certificate ID
  res.status(201).json({
    success: true,
    message: 'Assessment results saved successfully',
    certificateId: certResult.certificateId,
    verificationUrl: `https://terrnix.com/certificate/verify/?id=${certResult.certificateId}`
  });
  console.log(`[${reqId}] response_sent certificateId=${certResult.certificateId}`);

  // 4. Fire-and-forget: Send participant email
  const verificationUrl = `https://terrnix.com/certificate/verify/?id=${certResult.certificateId}`;
  fireAndForget(
    sendAssessmentResultsEmail({
      to: email,
      participantName: fullName,
      assessmentName: assessmentName || 'Carbon Accounting Readiness Assessment',
      score,
      maturityLevel,
      certificateId: certResult.certificateId,
      verificationUrl
    }).then(result => {
      if (result.success) {
        console.log(`[${reqId}] participant_email_sent messageId=${result.messageId}`);
      } else {
        console.error(`[${reqId}] participant_email_failed error="${result.error}"`);
      }
    }).catch(err => {
      console.error(`[${reqId}] participant_email_exception error="${err.message}"`);
    }),
    'Assessment participant email'
  );
});

// GET /api/certificate/verify — Verify certificate authenticity
app.get('/api/certificate/verify', (req, res) => {
  const reqId = `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { id } = req.query;

  console.log(`[${reqId}] certificate_verify id=${id}`);

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      valid: false,
      message: 'Certificate ID is required'
    });
  }

  // Validate certificate ID format
  if (!/^TRX-CAA-\d{8}-[A-F0-9]{8}$/.test(id)) {
    console.log(`[${reqId}] invalid_format id=${id}`);
    return res.status(400).json({
      valid: false,
      message: 'Invalid certificate ID format'
    });
  }

  const certificate = findCertificate(id);

  if (!certificate) {
    console.log(`[${reqId}] certificate_not_found id=${id}`);
    return res.status(404).json({
      valid: false,
      message: 'Certificate not found'
    });
  }

  if (certificate.status !== 'active') {
    console.log(`[${reqId}] certificate_revoked id=${id} status=${certificate.status}`);
    return res.status(404).json({
      valid: false,
      message: 'Certificate has been revoked'
    });
  }

  console.log(`[${reqId}] certificate_valid id=${id}`);
  res.json({
    valid: true,
    certificateId: certificate.certificateId,
    participantName: certificate.participantName,
    assessmentName: certificate.assessmentName,
    issueDate: certificate.issueDate,
    score: certificate.score,
    maturityLevel: certificate.maturityLevel,
    achievementLabel: certificate.achievementLabel
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, _next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed'
    });
  }

  if (err instanceof multer.MulterError || err.status === 400) {
    return res.status(400).json({
      error: err.code || 'invalid_upload',
      safe_message: err.message || 'The uploaded activity file could not be processed.'
    });
  }

  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500 && err.code) {
    return res.status(err.status).json({
      success: false,
      error: err.code,
      safe_message: err.message
    });
  }

  console.error(`[${req.reqId || 'unknown'}] ${err.name || 'Error'}: ${err.message || 'Unhandled error'}`);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    safe_message: NODE_ENV === 'development' ? err.message : 'Something went wrong. Check the Terrnix API logs.'
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

export function startServer(port = PORT) {
  // Verify email connection on startup without blocking readiness.
  setTimeout(() => {
    verifyConnection().then(ok => {
      if (!ok) {
        console.warn('[Startup] Email service not fully configured. Check ZOHO_SMTP_* env vars.');
      }
    }).catch(err => {
      console.error('[Startup] Email verification error:', err.message);
    });
  }, 100).unref?.();

  const server = app.listen(port, () => {
    const address = server.address();
    const listeningPort = typeof address === 'object' && address ? address.port : port;
    console.log(`Terrnix unified backend running on port ${listeningPort}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Allowed origin: ${allowedOrigin}`);
    console.log('Endpoints:');
    console.log('  - GET  /health');
    console.log('  - GET  /api/health/integrations');
    console.log('  - ALL  /api/auth/*');
    console.log('  - GET  /api/platform/session');
    console.log('  - GET  /api/platform/access');
    console.log('  - GET  /api/platform/organization');
    console.log('  - GET  /api/platform/members');
    console.log('  - GET  /api/platform/projects');
    console.log('  - POST /api/platform/projects');
    console.log('  - GET/POST /api/platform/business-units');
    console.log('  - GET/POST /api/platform/sites');
    console.log('  - GET/POST /api/platform/facilities');
    console.log('  - POST /api/platform/evidence/uploads');
    console.log('  - POST /api/platform/evidence/uploads/:uploadId/finalize');
    console.log('  - GET  /api/platform/evidence');
    console.log('  - GET  /api/platform/evidence/:evidenceId');
    console.log('  - POST/DELETE /api/platform/evidence/:evidenceId/tags');
    console.log('  - DELETE /api/platform/evidence/:evidenceId');
    console.log('  - POST /api/platform/evidence/:evidenceId/restore');
    console.log('  - POST /api/billing/stripe/webhook');
    console.log('  - GET  /api/platform/billing');
    console.log('  - GET  /api/platform/billing/invoices');
    console.log('  - GET  /api/platform/billing/usage');
    console.log('  - GET/PUT /api/platform/notifications and preferences');
    console.log('  - GET  /api/admin/lead-stats');
    console.log('  - GET  /api/factors/status');
    console.log('  - POST /api/chat');
    console.log('  - POST /api/carbon/calculate');
    console.log('  - POST /api/carbon/ingest');
    console.log('  - POST /api/reports/excel');
    console.log('  - POST /api/reports/pdf');
    console.log('  - POST /api/contact');
    console.log('  - POST /api/subscribe');
    console.log('  - POST /api/assessment/lead');
    console.log('  - GET  /api/certificate/verify');
    console.log(`Email notifications: ${process.env.ZOHO_SMTP_USER ? 'enabled' : 'disabled (configure ZOHO_SMTP_USER)'}`);
    console.log(`Brevo integration: ${process.env.BREVO_API_KEY ? 'enabled' : 'disabled (configure BREVO_API_KEY)'}`);
    console.log(`Lead storage: ${isWritableSync() ? 'writable' : 'NOT WRITABLE — check permissions'}`);
    console.log(`Authentication: ${isAuthConfigured() ? 'configured' : 'disabled (configure database and auth secrets)'}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}

export default app;
