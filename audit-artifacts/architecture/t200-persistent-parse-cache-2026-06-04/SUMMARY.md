## T200 — Persistent parse cache

Status: Partial

Date: 2026-06-04

What was run

- `npx jest src/lib/ingestion/__tests__/content-hash-parse-cache.test.ts --runInBand`
- Inline cross-session persistent-store harness with tenant-isolation check

Evidence files

- `jest-content-hash-parse-cache.txt`
- `parse-cache-harness.json`

What passed

- Parse-cache tests passed.
- Harness proved:
  - first parse is a miss
  - second parse is a persistent-store hit after in-memory reset
  - identical bytes under another tenant scope do not reuse the first tenant's cache entry

Why this is not Done

- The persistent store here is a test harness `Map`, not a production durable store.
- Missing closure items:
  - production Postgres/Azure/evidence-ledger backed cache store
  - schema/worker wiring
  - live durable reuse proof in the target environment

Concrete remediation

- Wire the persistent parse-cache contract to the production durable store, then capture one real first-parse / second-parse reuse cycle and one cross-tenant isolation miss from the live environment.
