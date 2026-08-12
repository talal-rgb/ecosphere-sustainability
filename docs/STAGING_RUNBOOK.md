# Terrnix SaaS staging runbook

Staging is an isolated pre-production environment. It must never use production customer records, production OAuth applications, live payment credentials, or a publicly readable evidence bucket.

## Required services

- PostgreSQL 17 with separate migration, API, document-worker, billing, and report-worker roles.
- Private S3-compatible object storage with a staging-only bucket, blocked public access, encryption, and short-lived signed uploads.
- Staging-only authentication origin and cookie namespace.
- Test SMTP inbox. OAuth providers remain disabled until staging callback credentials are supplied.
- Document and report workers using their dedicated database roles.
- Stripe test-mode keys and webhook endpoint only; live mode is prohibited.

## Required non-secret build metadata

Set `DEPLOYMENT_ENVIRONMENT=staging`, `GIT_COMMIT` to the exact deployed SHA, and `BUILD_DATE` to one ISO-8601 timestamp created by the deployment job. A deployment is invalid if `/health.gitCommit` is `unknown`, cannot be resolved in this repository, or differs from the deployment job SHA.

## Promotion sequence

1. Provision a new empty staging database and storage bucket.
2. Create the least-privilege roles and grants from `backend/DEPLOYMENT.md`.
3. Apply migrations 001 through 013 with the migration role.
4. Start the API with staging-only origins and credentials.
5. Start document and report workers with their dedicated roles.
6. Confirm `/health` version, commit, build date, and environment.
7. Run the two-organization journey and retain its CI/deployment evidence.
8. Confirm the public site and guest tools still work without an authenticated session.

## Current automated proof

`Validate Backend and Platform / PostgreSQL tenant isolation` runs every platform PR against a clean PostgreSQL 17 database. It applies the complete migration chain, uses a non-owner/non-`BYPASSRLS` API role, creates two organizations, builds Organization A's hierarchy and project, completes a private-evidence intake transaction, and proves Organization B cannot read or write Organization A data or audit events.

This CI proof does not replace persistent staging validation of email delivery, OAuth callbacks, object transfer, worker execution, report artifacts, or Stripe test-mode webhooks. Those checks require staging-only external endpoints and credentials.
