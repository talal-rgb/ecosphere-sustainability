# Evidence Intake and Document Processing Boundary

## API lifecycle

1. An authenticated tenant member calls `POST /api/platform/evidence/uploads` with project, document metadata, file size, media type, and a lowercase SHA-256 digest.
2. Terrnix validates permission and the `document_uploads.monthly` entitlement, reserves capacity, chooses a private quarantine key, and returns a short-lived signed PUT URL plus required headers.
3. The client uploads directly to private storage using those exact headers.
4. The client calls `POST /api/platform/evidence/uploads/:uploadId/finalize`.
5. Terrnix checks storage metadata and atomically creates the evidence record, immutable version, audit event, and queued malware-scan job.

The client never supplies `storage_provider`, `storage_bucket`, or `object_key`. The legacy internal metadata helper is not exposed as an API route.

## Accepted intake formats

The first boundary accepts PDF, JPEG, PNG, TIFF, CSV, XLS, and XLSX up to 50 MiB. File extensions are not trusted; the future malware/extraction worker must inspect magic bytes and reject type mismatches before promotion from quarantine.

## Processing stages

`malware_scan → extract → classify → validate → link → insights`

Each stage has one durable job per evidence version, bounded attempts, availability/lock fields, sanitized error codes, and structured results. Workers must be idempotent and use short leases. A completed malware scan updates the version status and queues extraction only when the object is clean.

Production still requires:

- private bucket credentials and encryption policy;
- lifecycle cleanup for expired quarantine objects;
- an isolated malware-scanning worker and state-aware object access policy;
- document parsers/OCR with resource limits and sandboxing;
- worker observability, retry/dead-letter handling, and operational runbooks;
- explicit database, storage, and deployment approval.
