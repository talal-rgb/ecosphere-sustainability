# ADR 0010: Snapshot immutable calculation lineage

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

An evidence link alone cannot reproduce a carbon result. Audit-ready calculations must retain the exact reviewed field, source locator, conversion, classification, factor version, formula, actor, and time used.

## Decision

Every document-derived activity calculation writes one immutable lineage record in the same transaction as the calculation and evidence link. Factor data is snapshotted from an approved versioned bundle. Unresolved or rejected review output cannot be calculated, scope/factor conflicts are rejected, low-confidence factors require explicit acceptance, and only deterministic allow-listed unit conversions are permitted. Idempotency keys prevent duplicate ledger entries.

## Consequences

- Results remain reproducible if factor catalogs or extraction models later change.
- Corrections require a new calculation/version instead of mutation.
- Ledger storage intentionally duplicates the small factor snapshot needed for audit.
- Provider-specific factor registries must satisfy the same provenance contract.

## Security and data effects

Lineage is tenant-scoped under forced row-level security and requires both calculation and evidence read permissions. Inserts require calculation-create permission and the authenticated actor. Immutable triggers protect records even from broad application writes.

## Migration and rollback

Migration 012 adds the feature entitlement and lineage table without rewriting existing calculations. Before production activation it may be reverted with the corresponding service. Once customer calculations exist, retain lineage and use forward migrations rather than deleting audit records.
