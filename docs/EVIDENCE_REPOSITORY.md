# Evidence Repository API

## Scope

The authenticated evidence repository provides one shared source for carbon, ESG, energy, compliance, consulting, and future Terrnix products. All operations use the verified user/organization transaction context and PostgreSQL row-level security.

## Resources

- `GET /api/platform/evidence` — bounded search and filtering by project, document type, classification, extraction, malware status, tag, and free text.
- `GET /api/platform/evidence/:evidenceId` — metadata, retention, tags, immutable versions, uploader history, linked calculations, and derived report links.
- `POST /api/platform/evidence/:evidenceId/tags` — idempotently add a normalized tag.
- `DELETE /api/platform/evidence/:evidenceId/tags/:tag` — remove a tag with an audit event.
- `DELETE /api/platform/evidence/:evidenceId` — retention-aware soft deletion with a required reason.
- `POST /api/platform/evidence/:evidenceId/restore` — restore soft-deleted evidence.

The secure upload-intent endpoint accepts an optional `evidenceId`. When present, finalization appends the next immutable version under a document lock. Concurrent finalizations cannot skip or overwrite a version; one wins and stale sessions return `version_conflict`.

## Search and visibility

Search combines a PostgreSQL full-text vector over document name/type with exact tag filters and bounded substring matching. Normal listings exclude soft-deleted evidence. Viewing deleted evidence or setting `includeDeleted=true` additionally requires `evidence.delete`.

Object keys, buckets, extracted document contents, and signed download links are never returned by repository list/detail responses. Download authorization will be a separate clean-status and retention-aware service.

## Retention and deletion

Legal hold always blocks soft deletion. A future `retention_until` date blocks deletion until the date is reached. Soft deletion preserves versions, object identity, calculation/report links, and audit history; it does not physically delete storage objects.

Physical purge is intentionally out of scope until Terrnix has approved legal retention rules, customer data-processing terms, backup behavior, and a separately audited purge workflow. Restoration clears deletion metadata but preserves both deletion and restoration audit events.
