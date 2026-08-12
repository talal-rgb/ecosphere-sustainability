# ADR 0007: Separate report content, generation jobs, and immutable artifacts

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Terrnix already produces carbon PDF and Excel files, while the enterprise platform requires executive, technical, board, audit, investor, and compliance reporting in PDF, Excel, Word, PowerPoint, and dashboard formats. Embedding generation directly in each product would duplicate lifecycle, provenance, permissions, metering, storage, and retry logic.

## Decision

Keep `reports` as the logical customer record. Store structured content as immutable hash-identified versions, queue format-specific generation jobs with explicit renderer versions, and register generated files as immutable private-storage artifacts. All product modules use this shared contract. Cross-tenant rendering runs through a separately credentialed, narrowly granted worker role.

## Consequences

One report can produce several consistent formats, generation retries are idempotent, and past outputs remain reproducible against their content and renderer versions. Renderers must accept the canonical content contract, artifact storage becomes operational infrastructure, and templates need governed schema evolution.

## Security and data effects

Tenant APIs remain protected by RLS, RBAC, and entitlements. The report worker receives only claimed job content and cannot access identity or billing data. Storage keys are organization-prefixed; content versions and artifact metadata are immutable and checksum-protected. Logs must not contain report content.

## Migration and rollback

Migration 009 extends the existing report domain without changing current synchronous endpoints. Rollback stops report workers and job creation. Existing content versions and artifacts remain readable; destructive schema rollback is not required. Renderer adapters can be disabled independently while legacy endpoints remain available.
