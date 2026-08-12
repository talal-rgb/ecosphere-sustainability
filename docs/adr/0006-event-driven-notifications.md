# ADR 0006: Separate notification events, user inbox state, and channel delivery

- Status: Accepted
- Date: 2026-08-11

## Context

Every Terrnix product needs proactive customer-success communication. Direct email calls inside product code would duplicate consent logic, make retries unsafe, and couple transactions to external providers.

## Decision

Products publish idempotent tenant-scoped domain events. The shared service creates personal notification records according to user preferences and transactionally enqueues opted-in external channels in a durable outbox. In-app state, event history, preferences, and delivery state remain separate.

## Consequences

Product operations stay independent of provider availability, retries cannot duplicate inbox items, and channel workers can be activated or replaced centrally. There is additional schema and a worker lifecycle to operate. An event vocabulary and templates will require governance as modules are added.

## Security and data effects

Row-level security restricts feeds and preferences to their user. Cross-user publishing requires an explicit permission and active membership. Email and push default off. Event payloads and metadata must contain only the minimum information needed to render the message.

## Migration and rollback

Migration 008 extends the existing notification table and adds preferences, immutable events, and delivery outbox tables. Rollback disables publishers and workers first; the new tables can remain dormant. Removing columns or records requires a separately reviewed forward migration.
