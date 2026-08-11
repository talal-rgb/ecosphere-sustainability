# ADR 0008: Reapply resource permissions at the unified search index

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

A shared search index can leak sensitive titles, snippets, counts, or metadata even when source tables are protected by RLS. Querying every source table independently would duplicate ranking and make semantic search difficult to govern.

## Decision

Maintain compact organization-scoped search documents with source identity and version. RLS re-evaluates the underlying resource permission for each entity type on every index read. Product services update the index in the same transaction as source mutations. Semantic providers may supply candidates later, but PostgreSQL permission filtering remains authoritative before results are returned.

## Consequences

All products share ranking, filters, facets, and future embedding adapters while search results remain permission-aware. Product modules must publish and retire index records consistently. New entity types require explicit read/write permission mappings before they can be indexed.

## Security and data effects

Index documents contain only compact discovery text and safe metadata, never document binaries, raw extracted evidence, credentials, or private provider payloads. Cross-tenant and unauthorized entity rows are hidden by forced RLS, including facet counts. Action URLs are relative to prevent open redirects.

## Migration and rollback

Migration 010 creates the search catalog and permissions without altering source tables. Rollback disables the search route and stops index publication. Source records remain authoritative; the index can be safely rebuilt or discarded with a reviewed forward migration.
