# Document Processing Worker Control Plane

## Purpose

Terrnix document workers consume the durable stages created by evidence finalization without exposing privileged queue operations through the public API. The control plane supports malware scanning, extraction, classification, validation, linking, and insight generation through the same lease and retry contract.

## Lease contract

`claimDocumentJob()` atomically selects one available supported stage with `FOR UPDATE SKIP LOCKED`, marks it processing, increments its attempt count, and assigns a worker ID. Abandoned processing jobs become claimable after the configured 30–1,800 second lease. Only the worker holding the current lease can complete or fail it.

Workers must use stable instance IDs, process one claimed job idempotently, and never log document contents or signed object credentials. The returned object locator is private infrastructure data.

## Completion and failure

- Malware results accept only `clean` or `infected`. Only clean evidence advances to extraction.
- Extraction stores structured data, model identity, and confidence before classification.
- Validation sets `complete` or `review_required`.
- Successful stages enqueue the next stage once; the database uniqueness constraint prevents duplicates.
- Retryable failures use exponential backoff from 30 seconds to one hour.
- Exhausted or explicitly non-retryable failures become terminal, update the evidence state, and append a system audit event.

The queue stores sanitized error codes, not provider responses, stack traces, or document content.

## Database isolation

The public API role remains subject to forced row-level security. A separate `terrnix_document_worker` role may use `BYPASSRLS` solely to claim work across organizations and receives narrow grants only on processing jobs, evidence versions, and audit events. Its connection string must differ from `DATABASE_URL`.

## Activation gates

The control plane is provider-neutral. Production execution still needs isolated malware-scanner infrastructure, parser/OCR adapters, private storage credentials, outbound-network policy, metrics/alerts, dead-letter operations, and deployment approval.
