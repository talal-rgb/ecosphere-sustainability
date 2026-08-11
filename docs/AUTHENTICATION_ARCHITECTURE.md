# Terrnix Authentication and Tenant Session Boundary

## Scope

This slice adds the authentication service boundary required by Terrnix professional features while preserving anonymous access to the public website and guest calculators.

Terrnix pins Better Auth `1.6.26` and uses its PostgreSQL adapter, database-backed sessions, email/password authentication, Google OAuth, and Microsoft OAuth. Provider configuration is conditional: an OAuth provider is unavailable unless both its client ID and client secret are configured.

## Security configuration

- Email/password accounts require verified email addresses.
- Passwords must be 12 to 128 characters.
- Password reset revokes existing sessions.
- Verification links expire after one hour.
- Sessions expire after seven days and refresh at most daily.
- OAuth access, refresh, and ID tokens are encrypted before database persistence.
- Implicit same-email account linking is disabled; users must explicitly link another provider.
- Cookies are HTTP-only, `SameSite=Lax`, and Secure in production.
- Better Auth origin and CSRF checks remain enabled.
- Authentication rate limits are stored in PostgreSQL.
- Only explicitly configured trusted origins can use credentialed browser requests.

Better Auth's Express handler is mounted before `express.json()`, as required for its request processing. Existing public API routes keep their current parsers and behavior.

References: [Better Auth Express integration](https://better-auth.com/docs/integrations/express), [security model](https://better-auth.com/docs/reference/security), [PostgreSQL adapter](https://better-auth.com/docs/adapters/postgresql), and [session management](https://better-auth.com/docs/concepts/session-management).

## Identity mapping

Authentication records live in the dedicated PostgreSQL `auth` schema. Every `auth.auth_users` row receives a server-generated `platform_user_id`; clients and OAuth profiles cannot set this field. A Better Auth database hook provisions the corresponding `platform.app_users` record under the row-level-security user context.

The authentication subject and platform UUID are kept separate. This prevents the shared product domain from depending on an identity-provider table design and keeps future SAML, Azure AD, or another provider replaceable.

## Tenant selection

An authenticated request establishes identity first. Organization-scoped routes then read `X-Terrnix-Organization-ID` only as a requested tenant selection. The database verifies an active membership under that platform user before setting `request.platformContext`. A caller cannot gain access by changing the header.

Two initial authenticated endpoints expose this boundary:

- `GET /api/platform/session` returns the current user's platform identity.
- `GET /api/platform/access` requires a verified organization membership and returns the effective role, permissions, plan, features, and limits.

Product routes must use the same session and tenant middleware before calling tenant-scoped services.

## First-party production topology

The preferred production topology is:

- application: `https://terrnix.com`;
- API and OAuth callbacks: `https://api.terrnix.com`;
- cookie domain: `terrnix.com`.

Using a Terrnix API subdomain keeps cookies first-party across the shared parent domain and avoids the reliability problems of third-party cookies when the browser calls a provider-owned API hostname. DNS, TLS, and deployment configuration are required before production activation.

Expected OAuth callbacks:

- `https://api.terrnix.com/api/auth/callback/google`
- `https://api.terrnix.com/api/auth/callback/microsoft`

## Deliberate boundaries

- Terrnix's platform organizations, roles, permissions, and subscriptions remain canonical; the Better Auth organization plugin is not used to create a competing authorization model.
- SAML/enterprise SSO is planned behind the Enterprise entitlement and is not enabled in this slice.
- No production secrets, OAuth applications, DNS changes, payment credentials, or deployment changes are included.
- Transactional verification/reset email uses Brevo with Zoho SMTP fallback; failed delivery aborts the authentication email operation.

Production activation requires database credentials, a high-entropy Better Auth secret, verified transactional email, OAuth credentials, API-domain DNS/TLS, and deployment approval.
