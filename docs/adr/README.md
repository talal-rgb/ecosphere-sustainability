# Architecture Decision Records

ADRs record durable Terrnix platform choices. Once accepted, an ADR is not rewritten to change history; a later ADR supersedes it. Small implementation details remain in code and module documentation.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-modular-platform-core.md) | Begin with a modular platform core | Accepted |
| [0002](0002-tenant-authorization-and-entitlements.md) | Enforce tenant isolation, RBAC, and entitlements independently | Accepted |
| [0003](0003-private-evidence-intake.md) | Quarantine and verify evidence before processing | Accepted |
| [0004](0004-durable-document-workers.md) | Use leased durable jobs for document intelligence | Accepted |
| [0005](0005-provider-neutral-billing-ledger.md) | Keep billing state provider-neutral and event-driven | Accepted |
| [0006](0006-event-driven-notifications.md) | Separate notification events, user inbox state, and channel delivery | Accepted |
| [0007](0007-versioned-report-engine.md) | Separate report content, generation jobs, and immutable artifacts | Accepted |
| [0008](0008-permission-aware-search-index.md) | Reapply resource permissions at the unified search index | Accepted |

New records use the next number and include context, decision, consequences, security/data effects, migration, and rollback considerations.
