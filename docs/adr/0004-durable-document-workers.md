# ADR 0004: Use leased durable jobs for document intelligence

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Malware scanning, OCR, parsing, classification, validation, linking, and AI insights are slow, failure-prone, and provider-dependent. Running them inside upload HTTP requests would create timeouts, duplicate work, unclear retries, and weak auditability. Workers need cross-tenant queue visibility but must not receive general application or authentication access.

## Decision

Each evidence version advances through durable, unique stage jobs. Workers atomically claim supported jobs with row locks and `SKIP LOCKED`, hold bounded leases, and complete only jobs owned by their worker ID. Attempts are bounded; retryable failures use exponential backoff and terminal failures update evidence state and audit history.

The worker uses a separate database role and connection pool. The role may bypass RLS only because cross-tenant claiming is intrinsic to the queue, and it receives grants solely for processing jobs, evidence versions, and system audit events. The public API role never uses this connection.

Provider-specific scanners, OCR tools, and models implement adapters outside the control plane. They cannot alter stage order or authorization rules.

## Consequences

- HTTP latency and provider reliability no longer control document ingestion.
- Jobs are horizontally consumable, idempotent, observable, and recoverable after worker loss.
- A narrowly privileged cross-tenant credential becomes critical infrastructure and needs network restriction, rotation, monitoring, and separate secret management.
- Production remains blocked until real scanner/parser adapters and operational infrastructure are approved.

## Rollback

Stop worker processes and leave queued jobs durable. Evidence remains pending and unavailable to downstream workflows. Reverting worker code does not delete jobs or documents; schema changes, if later needed, use a forward migration.
