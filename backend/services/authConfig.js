import crypto from 'node:crypto';
import { betterAuth } from 'better-auth';

import { getDatabasePool } from './database.js';
import { sendBrevoEmailWithTimeout } from './brevoEmail.js';
import { sendNotificationEmailWithTimeout } from './email.js';
import { provisionPlatformUser } from './platformIdentityService.js';

const production = process.env.NODE_ENV === 'production';
const baseURL = requiredUrl(process.env.BETTER_AUTH_URL, 'BETTER_AUTH_URL');
const secret = requiredSecret(process.env.BETTER_AUTH_SECRET);
const trustedOrigins = buildTrustedOrigins(baseURL);
const socialProviders = buildSocialProviders();

export const auth = betterAuth({
  appName: 'Terrnix',
  baseURL,
  basePath: '/api/auth',
  secret,
  database: getDatabasePool(),
  trustedOrigins,
  user: {
    modelName: 'auth_users',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    additionalFields: {
      platformUserId: {
        type: 'string',
        required: true,
        input: false,
        returned: true,
        fieldName: 'platform_user_id'
      }
    }
  },
  session: {
    modelName: 'auth_sessions',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      userId: 'user_id'
    },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24
  },
  account: {
    modelName: 'auth_accounts',
    fields: {
      accountId: 'account_id',
      providerId: 'provider_id',
      userId: 'user_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    encryptOAuthTokens: true,
    storeStateStrategy: 'database',
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      trustedProviders: ['email-password', 'google', 'microsoft'],
      allowDifferentEmails: false
    }
  },
  verification: {
    modelName: 'auth_verifications',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: 'Reset your Terrnix password',
        text: `A password reset was requested for your Terrnix account.\n\nReset password: ${url}\n\nIf you did not request this, you can ignore this email.`
      });
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: 'Verify your Terrnix email',
        text: `Verify your email address to activate your Terrnix account.\n\nVerify email: ${url}\n\nThis link expires in one hour.`
      });
    }
  },
  socialProviders,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            email: String(user.email).trim().toLowerCase(),
            name: String(user.name).trim(),
            platformUserId: crypto.randomUUID()
          }
        }),
        after: async (user) => {
          await provisionPlatformUser(getDatabasePool(), {
            userId: user.platformUserId,
            authSubject: user.id,
            email: user.email,
            displayName: user.name
          });
        }
      }
    }
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    storage: 'database',
    modelName: 'auth_rate_limits',
    fields: {
      lastRequest: 'last_request'
    }
  },
  advanced: {
    useSecureCookies: production,
    cookiePrefix: 'terrnix',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      path: '/'
    },
    database: {
      generateId: 'uuid',
      defaultFindManyLimit: 100
    },
    ...(process.env.AUTH_COOKIE_DOMAIN ? {
      crossSubDomainCookies: {
        enabled: true,
        domain: process.env.AUTH_COOKIE_DOMAIN
      }
    } : {})
  }
});

async function sendAuthEmail(message) {
  const primary = await sendBrevoEmailWithTimeout(message).catch((error) => ({ success: false, error: error.message }));
  if (primary.success) return;
  const fallback = await sendNotificationEmailWithTimeout(message).catch((error) => ({ success: false, error: error.message }));
  if (!fallback.success) {
    const error = new Error('Authentication email delivery is unavailable.');
    error.code = 'auth_email_unavailable';
    throw error;
  }
}

function buildSocialProviders() {
  const providers = {};
  const google = credentialPair('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET');
  if (google) providers.google = { clientId: google.clientId, clientSecret: google.clientSecret, prompt: 'select_account' };
  const microsoft = credentialPair('MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET');
  if (microsoft) {
    providers.microsoft = {
      clientId: microsoft.clientId,
      clientSecret: microsoft.clientSecret,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      prompt: 'select_account'
    };
  }
  return providers;
}

function credentialPair(idName, secretName) {
  const clientId = process.env[idName];
  const clientSecret = process.env[secretName];
  if (!clientId && !clientSecret) return null;
  if (!clientId || !clientSecret) throw configurationError(`${idName} and ${secretName} must be configured together.`);
  return { clientId, clientSecret };
}

function buildTrustedOrigins(authBaseURL) {
  const values = [new URL(authBaseURL).origin, process.env.ALLOWED_ORIGIN || 'https://terrnix.com'];
  if (process.env.AUTH_TRUSTED_ORIGINS) values.push(...process.env.AUTH_TRUSTED_ORIGINS.split(','));
  return [...new Set(values.map((value) => requiredUrl(value.trim(), 'AUTH_TRUSTED_ORIGINS')).map((value) => new URL(value).origin))];
}

function requiredUrl(value, name) {
  if (!value) throw configurationError(`${name} is required when authentication is enabled.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw configurationError(`${name} must be an absolute URL.`);
  }
  if (production && parsed.protocol !== 'https:') throw configurationError(`${name} must use HTTPS in production.`);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw configurationError(`${name} must use HTTP or HTTPS.`);
  return parsed.toString().replace(/\/$/, '');
}

function requiredSecret(value) {
  if (typeof value !== 'string' || value.length < 32) {
    throw configurationError('BETTER_AUTH_SECRET must contain at least 32 characters.');
  }
  return value;
}

function configurationError(message) {
  const error = new Error(message);
  error.code = 'auth_configuration_error';
  return error;
}
