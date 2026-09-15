# Staging end-to-end validation

The automated journey is split into two honest layers. Mocked adapter validation runs without external credentials; real integration validation remains blocked until staging accounts and resources are explicitly authorized.

## Automated journey

`npm run test:staging-e2e` in `backend/` prepares this ordered flow against a disposable PostgreSQL database whose name ends in `_e2e`:

1. Create users in the durable auth schema.
2. Capture and consume a mocked email-verification token.
3. Create a durable login session.
4. Create Organization A, business unit, site, facility, and project.
5. Initiate and finalize an evidence upload through a mock private-object-storage adapter.
6. Run malware scan, extraction, classification, and validation worker stages.
7. Complete human review and correction.
8. Calculate emissions and persist the immutable provenance ledger.
9. Create and retrieve a report definition/version.
10. Assert required audit events.
11. Logout by invalidating the session.
12. Login again with a new durable session and verify project, evidence, and calculation persistence.
13. Create Organization B and prove PostgreSQL RLS prevents reads and writes against Organization A evidence, calculations, reports, and audit events.

The test refuses to run unless `STAGING_E2E_CONFIRM=ephemeral-only` and `STAGING_TEST_DATABASE_URL` names an `_e2e` database. Setup is destructive only inside that disposable database.

## Mocked versus real validation

| Boundary | Automated now | Real staging validation still required |
|---|---|---|
| Email verification | Mock token is persisted and consumed | Brevo delivery, link routing, expiry, and replay behavior |
| Login/logout | Durable auth session rows and re-login persistence | Better Auth HTTP endpoints, cookies, CSRF/origin behavior, and browser restart |
| Evidence storage | Mock adapter validates server-owned object metadata flow | Signed upload, encryption, object HEAD, malware scanner, and private bucket policy |
| Document processing | Deterministic mock providers exercise every worker stage | Selected OCR/extraction/classification providers and failure retries |
| Carbon calculation | Real calculation and provenance services | Approved staging factor set and professional reviewer acceptance |
| Report | Real report persistence plus separate Excel/PDF smoke tests | Object delivery, download authorization, and visual acceptance |
| Tenant isolation | Real PostgreSQL roles and forced RLS | Repeat against the provisioned staging database and deployed HTTP API |

No mocked provider result should be reported as a successful external integration test.
