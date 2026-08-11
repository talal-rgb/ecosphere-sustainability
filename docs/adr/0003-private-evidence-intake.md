# ADR 0003: Quarantine and verify evidence before processing

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Evidence contains sensitive company data and drives calculations, audit conclusions, AI extraction, and reports. Allowing browsers to choose a bucket, provider, or object key would weaken tenant isolation. Treating a claimed upload as complete without verifying size, type, and digest would break provenance. Processing unscanned files could expose workers and downstream parsers to malicious content.

## Decision

Terrnix issues short-lived PUT URLs for a server-generated organization quarantine key. The signed request binds content length, media type, SHA-256 checksum, encryption, metadata, and `If-None-Match: *`, so the object cannot be overwritten through the same intent. Buckets remain private.

The browser receives the signed URL and required headers but not control over storage provider, bucket, or key. An upload-session reservation counts against monthly plan limits while active. Finalization reads object metadata from storage and compares byte size, media type, and checksum before atomically creating the evidence document, immutable file version, audit event, and first durable processing job.

The first job is always malware scanning. Extraction, classification, validation, linking, insights, and reporting follow only through durable stage transitions. Quarantined evidence is not downloadable or usable by calculations until the security and review policies for its state permit it.

## Consequences

- Upload traffic bypasses the API process while authorization and provenance remain server-controlled.
- A failed or abandoned upload leaves an expiring reservation that can be reclaimed safely.
- S3 and S3-compatible providers share one adapter; provider credentials remain server-side.
- Processing requires workers, retry/dead-letter rules, scanner isolation, and access policies that keep objects unavailable until clean.
- Verification adds a storage metadata request before finalization.

## Rollback

Disable the evidence upload routes. Existing finalized evidence and audit records remain intact. Expired quarantine objects and upload-session rows can be removed through a separately reviewed retention job. Migration 004 is additive and should be reversed only through a forward migration after confirming no sessions or processing jobs exist.
