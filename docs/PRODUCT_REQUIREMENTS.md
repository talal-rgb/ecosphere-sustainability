# Terrnix Sustainability Operating System — Product Requirements

**Status:** Living document  
**Owner:** Terrnix Product and Engineering  
**Last updated:** 2026-08-11  
**Current delivery stage:** Shared platform foundation

## Product objective

Terrnix will be an enterprise AI Sustainability Operating System: one secure company workspace for sustainability data, evidence, calculations, collaboration, intelligence, training, and reporting. Carbon, ESG, energy, climate, CBAM, LCA, nature, water, consulting, and future products consume shared platform capabilities rather than creating separate identity, tenant, billing, evidence, AI, or reporting implementations.

The platform must serve a single consultant, an SME, or a multinational organization without changing its core tenancy model.

## Product principles

1. Public educational content and designated Free tools remain usable without authentication.
2. Professional and Enterprise work is authenticated and organization-scoped.
3. Authorization requires both role permission and subscription entitlement where applicable.
4. Organization data is private by default, auditable, portable, retention-aware, and region-aware.
5. Shared services are API-first and reusable by every product surface.
6. AI output is traceable to inputs, evidence, model/configuration, and human review state.
7. Enterprise integrations use versioned contracts, least privilege, idempotency, and observable delivery.

## Users and roles

Primary users are sustainability owners, administrators, managers, engineers, consultants, reviewers, auditors, and viewers. Internal Terrnix administrators and consultants operate through separate privileged workspaces and must not bypass tenant controls through customer-facing APIs.

The organization hierarchy supports organizations, nested business units, sites, facilities, projects, activities, reports, evidence, users, roles, and audit events. Project and resource assignments may narrow access in a future additive authorization layer; organization membership remains the first tenant boundary.

## Shared platform capabilities

| Capability | Required outcome | Delivery state |
| --- | --- | --- |
| Authentication | Email/password, Google, Microsoft; modular path to Azure AD, SAML, and enterprise SSO | Foundation implemented; activation gated by credentials |
| Organizations and permissions | Tenant hierarchy, memberships, eight system roles, granular permissions, row-level isolation | Organization, project, and hierarchy APIs implemented |
| Subscriptions and billing | Five plans, trials, lifecycle, tax/invoices, upgrades, proration, provider adapters | Entitlement model implemented; provider synchronization pending |
| Evidence and storage | Private versioned documents, retention, tags, links, soft deletion, audit history | Intake, search, tags, version history, retention-aware deletion, and restoration implemented |
| Document intelligence | Upload, scan, extract, classify, validate, store, link, insight, report | Durable intake and worker control plane implemented; provider processors pending |
| AI services | Metered OCR, classification, embeddings, recommendations, summaries, gap/risk/regulation/Q&A | Usage foundation implemented; orchestration pending |
| Reporting | Versioned executive, technical, board, audit, investor, and compliance outputs across standard formats | Report domain foundation implemented; renderer unification pending |
| Notifications | In-app/email events, deadlines, missing evidence, regulation/training/risk alerts | Data foundation implemented; delivery orchestration pending |
| Search | Permission-aware keyword and semantic discovery | Planned |
| API and integrations | Versioned API, webhooks, API keys, connector framework, sync health | Permission foundation implemented; contracts pending |
| Customer portal | Daily workspace for organizations, projects, evidence, reports, training, billing, KPIs, activity, and support | API foundation in progress |
| Admin portal | Controlled operations for customers, commerce, support, content, flags, analytics, and AI usage | Planned; separate privilege boundary required |
| Consulting and training | Client/consultant workspaces and context-aware training recommendations | Existing product capabilities to be connected to shared platform |
| Digital twin | One organization graph spanning facilities, processes, assets, suppliers, evidence, calculations, risks, and recommendations | Incremental shared-domain evolution |

## Commercial plans and gating

The canonical plans are Free, Starter, Professional, Business, and Enterprise. Plans expose data-driven features and limits for organizations, projects, team members, storage, documents, reports, AI credits, API access, support, and professional outputs. UI labels are explanatory only; server-side entitlement checks are authoritative. Provider product and price identifiers never become domain identifiers.

Billing must support Stripe first through a provider adapter, followed by enterprise invoices, bank transfer, and optional PayPal. Subscription state changes enter the platform only through a trusted billing boundary. Production payment work requires commercial, tax, privacy, and deployment approval.

## Customer workspace requirements

An authenticated user can select only an organization where they have an active membership. The portal will progressively expose:

- organization profile, usage, subscription, notifications, KPIs, and recent activity;
- member and role administration with plan limits;
- project creation and lifecycle across every product module;
- evidence upload, classification review, search, linking, and retention;
- calculations, approval workflows, recommendations, and unified reports;
- training, consulting collaboration, billing, support, integrations, and settings.

The first API slice provides organization profile/usage, member listing, project listing/filtering, and entitlement-gated project creation. The next slice exposes reusable, bounded business-unit, site, and facility collections with plan limits and audit history.

## Enterprise quality requirements

- PostgreSQL row-level security is forced on tenant data and tested with a non-owner application role.
- Sessions determine user identity; tenant headers select but never grant organization access.
- Audit events are append-only and hash-chained, with separately stored signed checkpoints planned.
- All list endpoints are bounded and paginated; mutations are validated, authorized, audited, and safe to retry where external events are involved.
- Secrets and document binaries are never committed. Private storage uses encryption, malware scanning, checksums, organization-prefixed keys, and short-lived signed access.
- Accessibility, privacy, localization, data residency, deletion/export, observability, backup/recovery, and incident response are release criteria, not post-launch additions.

## Success measures

- activation: verified account to first organization and first project;
- adoption: weekly active organizations, active team members, evidence coverage, completed workflows, and report generation;
- value: time to auditable output, evidence acceptance rate, recommendation completion, training completion, and retained emissions/energy/compliance improvements;
- commercial: trial conversion, expansion, retention, limit pressure, gross margin by AI/storage/report workload, and support burden;
- trust: cross-tenant security regressions, audit completeness, calculation reproducibility, AI review rate, availability, and recovery objectives.

## Delivery sequence

1. Complete identity, organization, project, authorization, entitlement, audit, and customer workspace APIs.
2. Add private evidence storage and the document-intelligence job pipeline.
3. Persist calculation workflows and unify enterprise report rendering.
4. Add billing synchronization, subscription lifecycle, usage metering, and customer billing UX.
5. Add notifications, permission-aware search, AI orchestration, and proactive customer success.
6. Add admin/consultant workspaces, training links, public API/webhooks, and prioritized connectors.
7. Grow the digital twin additively from verified shared data.

## Change control

This PRD changes with shipped behavior and approved scope. Material architecture decisions receive an ADR in `docs/adr/`. Completed implementation is extended, not replaced, unless an ADR documents the limitation, migration, risk, and rollback plan.
