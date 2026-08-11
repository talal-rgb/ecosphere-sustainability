# ADR 0001: Begin with a modular platform core

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Terrnix is evolving from a static site and several sustainability tools into a commercial platform. Authentication, organizations, billing, evidence, AI, reports, notifications, search, and integrations must be shared across products. Splitting every capability into a separately deployed service now would add network, deployment, tracing, data-consistency, and operational costs before service boundaries are stable.

## Decision

Build a modular monolith around one PostgreSQL system of record and one versioned API deployment initially. Each shared capability owns a clear module boundary, contract, tables, tests, and authorization rules. Product modules call those shared contracts and do not create competing user, organization, entitlement, evidence, AI-usage, or report domains.

Long-running document, report, notification, AI, and integration work will use durable jobs and idempotent handlers. A module may be extracted into a service when measured scaling, isolation, data residency, reliability, or team ownership requires it; extraction must preserve its API/event contract.

The public static site and guest tools remain independently deployable and consume authenticated services only when needed.

## Consequences

- Delivery remains fast and transaction boundaries remain explicit while the domain matures.
- Shared behavior is reusable without premature distributed-system complexity.
- Module ownership and import boundaries require active enforcement to avoid a tightly coupled monolith.
- Independent scaling is initially coarse-grained; high-cost workers should be isolated behind the job boundary first.

## Migration and rollback

This decision adds modules without changing public guest-tool behavior. Future extraction uses an adapter behind the existing contract. A new module can be disabled or its routes removed without rewriting the shared tenant domain.
