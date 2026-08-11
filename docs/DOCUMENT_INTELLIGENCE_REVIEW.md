# Document Intelligence Review Contract

## Purpose

Terrnix converts clean private evidence into structured, source-located proposals without silently treating uncertain machine output as verified customer data. Professional, Business, and Enterprise subscriptions can review extracted fields and carbon classifications through the shared platform API.

## Processing contract

Each evidence version snapshots a server-selected processing profile and confidence threshold from the active entitlement configuration. Storage-only evidence stops after a clean malware scan. Document-intelligence evidence advances through extraction, classification, and validation.

Extraction workers submit a bounded schema version, provider/model identity, overall confidence, structured payload, and unique field proposals. Every field includes confidence plus a page, row, sheet/cell, or bounding-box locator. Classification proposals can identify the document type, carbon activity type, Scope 1/2/3, and a relevant Scope 3 category. Missing, undetermined, explicitly uncertain, or below-threshold mappings require review.

Validation derives review state from persisted proposals. It does not trust a provider's assertion that review is unnecessary. Evidence requiring review does not enter the linking stage.

## Human correction and provenance

Machine extraction runs, fields, classifications, and every human decision are immutable. A correction creates a new numbered review revision; it never overwrites the machine observation or earlier correction. Review writes require the current evidence version and expected target revision, preventing stale browser sessions from silently replacing newer work.

The API returns the original proposal, unit, confidence, provider/model, schema version, source locator, and latest attributable review. Correction audit events record target/review identifiers, revisions, decisions, and workflow resolution without duplicating sensitive extracted values into the audit payload. Corrected values remain in the tenant-isolated review record. Once all required items are resolved, Terrnix queues evidence-to-activity linking. Rejected classifications remain rejected and do not advance.

## API

- `GET /api/platform/evidence/:evidenceId/review`
- `POST /api/platform/evidence/:evidenceId/review`

Both routes require an authenticated tenant context. Reads require `evidence.read`; writes require `evidence.update`. Both require the `document_intelligence.review` entitlement. Tenant row-level security remains authoritative.

## Claims and assurance boundary

These controls support audit-ready, traceable, evidence-backed, reproducible, version-controlled, reviewer-friendly calculations. They do not certify or independently assure a carbon inventory. Certification and assurance remain the responsibility of an independent qualified verifier.
