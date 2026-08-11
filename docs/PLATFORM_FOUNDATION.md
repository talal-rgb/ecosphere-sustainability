# Terrnix SaaS Platform Foundation

## Decision

Terrnix authenticated products use PostgreSQL as the system of record. The existing public website and guest calculators remain available without an account. Authenticated services connect through a dedicated, non-owner application role and set the verified user and organization context at the start of every transaction.

Authentication is intentionally separated from the product domain. An authentication adapter will map an external identity subject to `platform.app_users.auth_subject`; the platform schema does not depend on a particular identity provider. This keeps email/password, Google, Microsoft, and future enterprise SSO replaceable without restructuring projects, evidence, calculations, reports, or subscriptions.

## Shared domain

Migration `backend/db/migrations/001_platform_foundation.sql` establishes the shared layer for all Terrnix products:

- users, organizations, memberships, roles, and granular permissions;
- business units, sites, facilities, and projects;
- evidence documents, immutable file versions, tags, and retention metadata;
- calculations and evidence links;
- versioned reports and calculation links;
- plans, feature entitlements, subscriptions, and usage limits;
- notifications and AI usage records;
- append-only, hash-chained audit events.

The initial roles are Owner, Administrator, Manager, Engineer, Consultant, Reviewer, Auditor, and Read-only. Product APIs must check both permission and plan entitlement. Neither control replaces the other.

## Tenant isolation

Every tenant-owned table carries `organization_id`. PostgreSQL row-level security is enabled and forced, so repository queries cannot access another organization merely by changing a request parameter. The API must derive organization and user identifiers from the authenticated session and verified membership, never from an untrusted body or query string.

`withPlatformContext()` applies both identifiers transaction-locally with `set_config`. All tenant operations must run through this boundary. Cross-tenant read and write regression tests run against a non-superuser database role.

The migration role must not be used by the running API. The production application role must not own the platform tables and must not have `BYPASSRLS`.

Organization creation uses the narrowly scoped `platform.bootstrap_organization()` security-definer function so user, organization, first Owner membership, and Free subscription are created atomically. Its owner must remain the migration role; grant only `EXECUTE` on this function to the application role. Direct first-owner insertion is not permitted by RLS.

## Evidence security

This slice stores evidence metadata, version identity, SHA-256 digest, classification state, retention settings, and links. Binary uploads are not stored in PostgreSQL. The upload service must use private object storage with short-lived signed URLs, malware scanning, size/type validation, encryption, and an organization-prefixed object key.

File identity and storage metadata on a version are immutable. AI extraction status, confidence, structured output, and review metadata can change without changing the underlying evidence identity. Corrections to a source file create a new version.

## Audit integrity

Audit events are append-only and linked by SHA-256 hashes over canonical event data. A transaction-level advisory lock serializes each organization's chain so concurrent writes cannot create two successors to one event. Hash chaining detects database-level changes; production-grade tamper evidence should additionally export signed checkpoints to separately controlled storage.

## Commercial model

The migration seeds Free, Starter, Professional, Business, and Enterprise plans with central feature codes and optional limits. Feature gating is data-driven through `platform.plan_features`; UI labels must never be treated as authorization. Stripe or another billing provider will synchronize provider identifiers and subscription state into `platform.subscriptions` in a later slice.

Tenant sessions can read effective subscription entitlements but cannot write subscription state directly. Plan changes must come through the trusted billing synchronization boundary.

No payment credentials, checkout endpoints, or webhooks are included in this foundation.

## Migration workflow

```bash
cd backend
npm ci
DATABASE_URL=postgresql://... npm run db:migrate
npm test
```

The migration runner:

- takes a PostgreSQL advisory lock;
- applies sorted SQL files transactionally;
- records a SHA-256 checksum;
- refuses to continue if an already-applied migration was edited.

Never modify an applied migration. Add a new numbered migration.

## Delivery sequence

1. Authentication adapter and secure session-to-tenant middleware.
2. Organization, membership, project, and access APIs.
3. Private object-storage upload flow, scanning, and evidence review.
4. Carbon calculation persistence and report workflow.
5. Billing provider synchronization and customer portal.
6. ESG, Energy, Training, and specialized AI modules on the same shared layer.

Production rollout requires database credentials, identity-provider credentials, object-storage configuration, and explicit deployment approval.
