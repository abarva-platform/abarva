# Persistent Parse Cache Contract

## Purpose

Backlog row T200 requires parse-cache reuse beyond one server process. The
production target is simple: the same client scope, content hash, parser id,
parser version, and policy version should reuse the same approved parse result
across sessions instead of re-running expensive document parsing.

## Cache Key

The durable key must include:

- client or tenant cache scope;
- MIME type;
- parser id;
- parser version;
- SHA-256 content hash.

The existing helper in `src/lib/ingestion/content-hash-parse-cache.ts` builds
and normalizes that key. Cache scope is mandatory for production use; unscoped
keys are allowed only for local or non-client fixtures.

## Required Runtime Behavior

Runtime processors should call `withContentHashParseCache` with a
`persistentStore` implementation when a durable store is available.

The lookup order is:

1. active in-memory cache;
2. persistent store;
3. parser execution;
4. best-effort persistent write.

Persistent-store failures must not break parsing. They are cost/performance
misses, not user-facing ingestion failures.

## Approved Persistent Stores

The durable implementation should be one of:

- client data-plane Postgres table with RLS/service-role boundaries;
- Azure Blob metadata/object store scoped to the one client data plane;
- evidence-ledger-backed parse artifact table once the evidence ledger schema
  owns parsed source artifacts.

Do not use shared cross-client storage without client scope in the key and
without the same isolation controls used for source artifacts.

## Commit Boundary

A persistent cache hit does not mean the parsed output is approved evidence.
The consuming pipeline still must enforce malware scan, sensitivity scan,
template validation, parser confidence, human approval, and evidence-ledger
commit rules before indexing or using the result in recommendations.

## Current Repo State

The repo now has a tested persistent-store adapter contract. It does not yet
include the production Postgres/Azure implementation, table migration, or
evidence-ledger runtime write path. T200 remains in progress until one of those
durable stores is wired and verified end to end.
