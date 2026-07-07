# 2026-06-03-persistent-parse-cache-contract — Persistent Parse Cache Contract

## Release ID

`2026-06-03-persistent-parse-cache-contract`

## Status

`candidate`

## Plain-English Summary

The content-hash parse cache can now use a persistent store adapter. This lets
future ingestion workers reuse parser output across sessions when a durable
client-scoped store is wired, while preserving the existing in-memory fast path
and failing open if persistence is unavailable.

## Layer Impact

- `global-control-lane`: Extends shared parse-cache infrastructure with a
  durable-store contract and cache-source metadata.
- `client-data-lane`: Defines the client-scoped persistent cache boundary that
  future Postgres, Azure Blob, or evidence-ledger stores must obey.

## Client Applicability

- All clients: Applies to shared parser infrastructure once a persistent store
  is configured by the consuming runtime.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/ingestion/content-hash-parse-cache.ts` accepts an optional
  `persistentStore`, checks it after memory misses, and writes through after
  parser execution.
- `src/lib/ingestion/__tests__/content-hash-parse-cache.test.ts` proves reuse
  after clearing process memory and proves parsing still succeeds when the
  persistent store fails.
- `docs/architecture/azure/PERSISTENT_PARSE_CACHE_CONTRACT.md` records the
  durable cache key, allowed stores, and approval boundary.

## QA / Validation

- PASS: `npx jest src/lib/ingestion/__tests__/content-hash-parse-cache.test.ts --runInBand` (6 tests passed; Jest reported pre-existing duplicate manual mock warnings).
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx eslint src/lib/ingestion/content-hash-parse-cache.ts src/lib/ingestion/__tests__/content-hash-parse-cache.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected main merge queue. This is a contract-level runtime
change; no production persistent store becomes active until a caller provides a
durable store implementation.

## Rollback Plan

Revert the PR to remove the persistent-store adapter and return the cache to
memory-only behavior. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2949.
- CI: pending at PR open.
- Local QA: focused Jest, TypeScript, eslint, diff whitespace, and release control pass locally before PR.

## Known Gaps

This does not add the production Postgres/Azure/evidence-ledger store, schema,
or worker wiring. T200 should remain `In progress` until durable storage is
implemented and verified end to end.
