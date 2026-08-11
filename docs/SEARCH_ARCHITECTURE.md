# Terrnix Unified Search

Terrnix Search provides one tenant-scoped discovery contract for organizations, projects, evidence, calculations, reports, training, regulations, recommendations, and future Digital Twin resources.

## Current implementation

- Product services publish compact search documents transactionally with their source record.
- Titles, keywords, and body text use weighted PostgreSQL full-text search, with bounded substring fallback for names and keywords.
- Results support entity and project filters, pagination, relevance ordering, excerpts, and permission-filtered facets.
- Each document carries a source version and SHA-256 content identity. Replayed unchanged indexing calls are no-ops.
- Project creation, evidence creation/finalization, and report content versioning already use this contract.
- Deletion is soft and removes the result immediately while preserving operational traceability.

## Authorization invariant

Search never grants access. RLS first requires the current organization and `search.read`, then maps every entity type back to its underlying resource permission. A viewer without `evidence.read`, for example, cannot discover evidence titles, counts, snippets, or metadata even when the same query returns visible projects and reports.

## Semantic search path

Embeddings will be produced by the shared AI Platform from the same versioned search document, stored in a region-compatible vector provider, and referenced by opaque index identifiers. Semantic candidates must be joined back through the PostgreSQL permission-filtered document set before returning results. Keyword search remains the deterministic fallback if the vector provider is unavailable.
