# Render staging setup

This runbook prepares a staging website, API, and persistent PostgreSQL database. It does not alter the existing production service and does not require custom domains initially.

## Security boundary

- Never copy production customer data into staging.
- Never put a password, connection URL, API key, OAuth secret, or storage credential in Git, a PR, deployment logs, or ordinary chat.
- The API runtime must use a non-owner PostgreSQL role with `NOBYPASSRLS`.
- Migration credentials must never be stored on the API service.
- Document, billing, and report workers use distinct narrowly granted roles. They must never share `DATABASE_URL`.
- The Blueprint uses a free API and the smallest paid PostgreSQL configuration. API cold starts are acceptable for validation; an expiring free database is not acceptable for persistent SaaS testing. Applying the Blueprint still requires account-owner cost approval.
- Tenant RLS, separate database roles, staging-only credentials, and an empty database public IP allow-list provide the required boundary. Pro workspace environment isolation is intentionally not required.

## Cost decision (verified 2026-09-15)

Render's public pricing lists Starter service compute at $0.05/hour, the smallest paid PostgreSQL compute at $6/month, and PostgreSQL storage at $0.30/GB/month. Confirm the dashboard total before creation because prices can change.

| Option | Persistent SaaS validation | Estimated monthly baseline | Tradeoff |
|---|---|---:|---|
| Paid API + paid PostgreSQL | Yes | $42.80 at 730 API hours and 1 GB database storage | Always-on API; unnecessary for an initially intermittent staging workflow. |
| Free API + paid PostgreSQL (selected) | Yes | $6.30 | API sleeps after 15 idle minutes and cold-starts; database remains durable. |
| Local/CI API + ephemeral test PostgreSQL | No | $0 infrastructure baseline | Valuable pre-merge validation, but it cannot verify persistence across real SaaS sessions and deployments. |

Static-site hosting is free within Render's included usage. A Pro workspace would add $25/month; its environment-isolation controls are not needed for this phase because staging has no production credentials or data and database RLS remains enforced.

Sources: https://render.com/pricing and https://render.com/docs/free

## Secure Render diagnosis access

The preferred method is an already authenticated browser tab:

1. Sign in at `https://dashboard.render.com` yourself.
2. Open the `terrnix-backend` service.
3. Attach that tab to OpenClaw Browser Relay.
4. Do not send a password, Render API key, deploy hook, connection URL, or environment-variable values.

If browser attachment is unavailable, provide only redacted screenshots of:

1. **Settings → Build & Deploy**: repository, branch, root directory, runtime, build command, start command, auto-deploy mode, instance type, region, and health-check path.
2. **Deploys**: live SHA/status/time and the last failed deploy's failure stage.
3. **Events / Logs**: start failures, out-of-memory exits, port binding, health-check failures, and request timeouts. Remove tokens, email addresses, request bodies, and environment values.

## Provision PostgreSQL before the Blueprint

This order avoids Render's initial `sync: false` prompt before the least-privilege application role exists.

1. In Render choose **New → Postgres**.
2. Configure:
   - Name: `terrnix-staging-postgres`
   - Database: `terrnix_staging`
   - Initial user: `terrnix_migration_staging`
   - Region: `Frankfurt`
   - PostgreSQL: `17`
   - Instance: `0.1 CPU / 256 MB` or larger
   - Storage: 1 GB initially; autoscaling off
3. Keep public inbound access disabled. If a local migration terminal requires temporary access, add only the operator's current public IP as a `/32` rule and remove it immediately after bootstrap.
4. In **Postgres → Info**, copy the migration connection URL only into a secure local shell prompt or password manager. Do not store it in the API service.
5. In the integrated repository's `backend` directory, enter it without putting it in shell history:

```bash
read -rsp "Migration database URL: " MIGRATION_DATABASE_URL
export MIGRATION_DATABASE_URL
echo
DATABASE_URL="$MIGRATION_DATABASE_URL" npm run db:migrate
```

## Create and grant runtime roles

In **Postgres → Info → Credentials**, click **New default credential** for each role below. Render only shows the current default credential's URLs, so immediately store each generated internal URL in its secure destination before creating the next credential.

| Render credential name | Grant command | Final environment variable |
|---|---|---|
| `terrnix_app_staging` | `TARGET_ROLE_KIND=application npm run db:grant-staging-role` | API service: `DATABASE_URL` |
| `terrnix_document_worker_staging` | `TARGET_ROLE_KIND=documentWorker npm run db:grant-staging-role` | Document worker: `DOCUMENT_WORKER_DATABASE_URL` |
| `terrnix_billing_staging` | `TARGET_ROLE_KIND=billing npm run db:grant-staging-role` | Billing webhook service: `BILLING_DATABASE_URL` |
| `terrnix_report_worker_staging` | `TARGET_ROLE_KIND=reportWorker npm run db:grant-staging-role` | Report worker: `REPORT_WORKER_DATABASE_URL` |

Run each grant command from `backend` while `MIGRATION_DATABASE_URL` remains in the secure shell environment. The script hardens role attributes and applies only the documented grants; it never prints a connection URL or password.

Remove the temporary PostgreSQL inbound-IP rule and unset the owner credential afterward:

```bash
unset MIGRATION_DATABASE_URL
```

## Create the Blueprint

1. Merge the reviewed staging PR to `main`.
2. In Render choose **New → Blueprint** and connect `talal-rgb/ecosphere-sustainability`.
3. Select `render.yaml`. Render should match the existing `terrnix-staging-postgres` database and propose:
   - `terrnix-staging` static site
   - `terrnix-staging-api` Node web service
   - the existing staging database
4. Review the paid cost before applying.
5. At the encrypted `DATABASE_URL` prompt, paste the internal URL for `terrnix_app_staging`.
6. Keep the generated `onrender.com` URLs until authentication, evidence, and tenant-isolation tests pass. Do not configure staging DNS yet.

`BETTER_AUTH_SECRET` is generated by Render. Do not copy or replace it unless deliberately rotating all staging sessions.

## API secrets and exact locations

Add these only in **Render → terrnix-staging-api → Environment**:

| Variable | Obtain from | Enables |
|---|---|---|
| `DATABASE_URL` | Render internal URL for `terrnix_app_staging` | Auth and tenant-scoped platform data |
| `EVIDENCE_STORAGE_BUCKET` | Staging-only private S3-compatible bucket | Evidence intake |
| `EVIDENCE_STORAGE_REGION` | Storage provider bucket settings | Request signing |
| `EVIDENCE_STORAGE_ENDPOINT` | S3-compatible provider endpoint; omit for AWS S3 | Provider routing |
| `AWS_ACCESS_KEY_ID` | Staging-only storage service account | Signed object operations |
| `AWS_SECRET_ACCESS_KEY` | Same storage service account | Signed object operations |
| `BREVO_API_KEY` | Brevo transactional staging key | Verification and reset emails |
| `CONTACT_FROM_EMAIL` | Verified staging sender | Sender identity |
| `CONTACT_TO_EMAIL` | Staging test inbox | Operational notifications |

Do not configure optional integrations until their validation phase:

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Microsoft OAuth: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`.
- SMTP fallback: `ZOHO_SMTP_HOST`, `ZOHO_SMTP_PORT`, `ZOHO_SMTP_USER`, `ZOHO_SMTP_PASS`.
- Stripe test mode only: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BILLING_DATABASE_URL`.

## Persistent database preflight

Configure these only in the secure terminal running the preflight:

- `STAGING_DATABASE_URL`
- `STAGING_DOCUMENT_WORKER_DATABASE_URL`
- `STAGING_BILLING_DATABASE_URL`
- `STAGING_REPORT_WORKER_DATABASE_URL`
- `STAGING_E2E_CONFIRM=persistent-staging`

Then run `npm run staging:preflight` from `backend`. It verifies:

- staging-named database and four distinct runtime roles;
- non-owner/non-superuser identities;
- application `NOBYPASSRLS` and dedicated worker `BYPASSRLS`;
- exact migration names and checksums;
- required platform relations;
- enabled and forced tenant RLS;
- allowed and forbidden privileges for every runtime role.

The preflight is read-only and refuses localhost or a database without a staging name.

After deployment, `/health` must report `environment: staging`, a resolvable `gitCommit` equal to the Render deploy SHA, and a fixed `buildDate`.
