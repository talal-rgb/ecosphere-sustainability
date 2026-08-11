# Terrnix Enterprise Report Engine

The report engine is a shared platform service. Carbon, ESG, energy, compliance, CBAM, LCA, nature, water, training, and consulting products publish structured report content; they do not own file-generation lifecycles.

## Domain model

- A report is the customer-facing logical record attached to one organization project.
- A template definition declares one of six audiences: executive, technical, board, audit, investor, or compliance, plus supported output formats.
- Content versions are immutable canonical JSON with SHA-256 identity and a source manifest for calculation, evidence, method, and AI provenance.
- Generation jobs bind one content version, format, and renderer version. Stable idempotency keys make retries safe.
- Artifacts are immutable private-storage records for PDF, Excel, Word, PowerPoint, or interactive dashboard output.
- Calculation and evidence links keep every report traceable to the Digital Twin source records.

## Runtime boundary

Customer APIs create reports, append content versions, list reports, and queue entitled output jobs. A dedicated `BYPASSRLS` report-worker role leases jobs across tenants, receives only the selected structured content, renders it, stores it privately, and registers checksum-protected artifact metadata. It cannot manage users, subscriptions, billing, or evidence binaries.

The existing synchronous carbon PDF and Excel exporters remain unchanged. Adapter work will invoke them through this worker contract, then add Word, PowerPoint, and dashboard renderers. This preserves Milestone 2 behavior while moving all future products onto the shared lifecycle.

## Controls

- Basic executive PDF/Excel output uses `reports.basic`; other report audiences and Word, PowerPoint, or dashboard output use `reports.professional`.
- Usage is consumed transactionally when a unique generation job is accepted.
- Report content and artifacts are append-only. Corrections create a new content version and new artifacts.
- Worker claims use bounded leases, `SKIP LOCKED`, attempt limits, sanitized error codes, and exponential retry delays.
- Storage keys are organization-prefixed and artifact media types must match the requested format.
- Artifact download will use short-lived signed URLs after the shared storage adapter is connected.
