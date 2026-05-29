# 2026-05-28-packet-30-phase-2b-intelligence-retriever-reads — Packet 30 Phase 2B Intelligence Retriever Reads

## Release ID

`2026-05-28-packet-30-phase-2b-intelligence-retriever-reads`

## Status

`candidate`

## Plain-English Summary

This release moves three Intelligence ask retrievers off direct runtime Supabase reads and onto the Phase 2A Azure read boundary. The migrated retrievers are vendor retrieval, knowledge-source retrieval, and genome-pattern retrieval. This continues Packet 30 Phase 2B as a narrow read-only slice after the tenant-resolution slice.

## Layer Impact

- data-plane-lane: uses `azureRead` for read-only Intelligence retrieval.
- intelligence-lane: preserves returned source shapes and confidence behavior.
- runtime-app-lane: no UI behavior change intended.
- client-data-lane: no data changes.

## Client Applicability

- All clients: shared Intelligence ask retrieval no longer depends on direct Supabase runtime reads for these three retrievers.
- Apex Retail, Meridian Health, First Capital, Northstar, SkyHarbor: no tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- `retrieveVendor` now queries `tech_stack_items` and `clients` through `azureRead.query`.
- `retrieveKnowledge` now queries active `knowledge_sources` through `azureRead.query`.
- `retrievePattern` now queries `genome_patterns` through `azureRead.query`, retaining canonical-corpus fallback behavior.
- Added focused tests for vendor and knowledge retrievers.
- Updated the pattern retriever fallback test to mock the Azure read boundary.

## QA / Validation

Validation performed:

```text
npx jest src/lib/intelligence/ask/retrievers/pattern.test.ts src/lib/intelligence/ask/retrievers/vendor.test.ts src/lib/intelligence/ask/retrievers/knowledge.test.ts --runInBand
npx eslint src/lib/intelligence/ask/retrievers/pattern.ts src/lib/intelligence/ask/retrievers/vendor.ts src/lib/intelligence/ask/retrievers/knowledge.ts src/lib/intelligence/ask/retrievers/pattern.test.ts src/lib/intelligence/ask/retrievers/vendor.test.ts src/lib/intelligence/ask/retrievers/knowledge.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 3 suites / 5 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/warn, improved from `181 files / 759 import-helper matches` to `178 files / 750 import-helper matches`; broad matches improved from `329 files / 1699` to `327 files / 1685`.
- Diff whitespace check: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no retriever errors appeared.

## Rollout Plan

Merge after CI is green. Runtime behavior changed in shared Intelligence retrieval, so verify production deployment and run a lightweight production smoke after merge.

## Rollback Plan

Revert this PR to restore direct Supabase reads in the three retrievers.

## Audit Evidence

- Packet 30 Phase 2A established `azureRead`.
- Packet 30 Phase 2B first slice reduced the census to `181 / 759`.
- This slice reduces the census to `178 / 750` while keeping focused retriever tests green.

## Known Gaps

- This does not migrate Intelligence session-memory writes.
- This does not migrate Source value-chain write behavior.
- This does not enable blocking enforcement for the runtime Supabase import census; Phase 2D owns that.
