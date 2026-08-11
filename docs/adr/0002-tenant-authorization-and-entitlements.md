# ADR 0002: Enforce tenant isolation, RBAC, and entitlements independently

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Terrnix must support consultants, SMEs, and multinational organizations. A user may belong to multiple organizations with different roles, while a subscription controls commercial capabilities and limits. Treating a client-supplied organization ID, role label, or plan name as authorization would permit cross-tenant access or commercial bypass.

## Decision

PostgreSQL row-level security is the final tenant isolation boundary. Every tenant transaction sets a verified platform user and organization context. The session establishes identity; `X-Terrnix-Organization-ID` requests a tenant selection, and an active membership must verify it.

Each protected operation checks:

1. tenant isolation through row-level security;
2. a granular role permission for the action; and
3. a data-driven feature entitlement or limit when the action is commercially gated.

Neither RBAC nor entitlements imply the other. Billing providers synchronize trusted subscription state; clients cannot mutate it. Limits that can be consumed concurrently use a transaction-scoped organization/feature lock until reservation-based metering is introduced.

## Consequences

- Changing a header, UI role, or plan label cannot grant access.
- The same product API works across all plans and roles.
- Queries must always run through the platform transaction boundary, and tests must use a non-owner, non-`BYPASSRLS` role.
- High-volume usage will eventually need reservation ledgers rather than aggregate counts.

## Security, migration, and rollback

The application database role must not own platform tables. Migration and runtime credentials remain separate. New permissions and entitlements are additive seeded data. A feature can be disabled centrally without dropping customer data; rollback removes route exposure while retaining auditable records.
