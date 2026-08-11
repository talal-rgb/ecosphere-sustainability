# ADR 0006: Preserve machine proposals and human reviews as separate immutable records

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Carbon Accounting Professional must extract activity data from customer evidence while preventing uncertain OCR, parsing, or classification output from silently becoming calculation input. Overwriting extracted JSON during review would erase provenance, make corrections difficult to reproduce, and weaken auditor confidence.

## Decision

Terrnix stores each extraction run, field proposal, source locator, and classification proposal as an immutable machine observation. Human acceptance, correction, or rejection is stored as an immutable numbered revision linked to that proposal. Each review write uses optimistic revision checking and the current evidence version.

The evidence version snapshots an entitlement-selected processing profile and confidence threshold at intake. Validation derives whether review is required from persisted confidence and completeness. Downstream linking is paused until required reviews are resolved; rejected classifications do not advance.

## Consequences

- Calculations can later reference both the original observation and effective reviewed value.
- Every correction remains attributable and reproducible without mutating history.
- Storage-only plans do not accidentally consume document-intelligence processing.
- Review storage grows append-only and requires retention/export handling with its parent evidence.
- Provider adapters must emit bounded schema-versioned fields and source locators.

## Security and data effects

All records are organization-scoped under forced row-level security. Reads require evidence access; review inserts require evidence-update permission and the document-intelligence entitlement. Worker credentials need narrow insert/select grants on proposal tables but no review-table writes. Sensitive corrected values remain in review records rather than being copied into audit event payloads.

## Migration and rollback

Migration 008 adds the processing snapshot and review tables without rewriting existing evidence. Existing versions default to storage-only. Before production activation, grant workers only the documented new proposal-table privileges. To roll back before activation, stop workers and revert the code/migration. After customer reviews exist, preserve records and use a reviewed forward migration rather than dropping provenance.
