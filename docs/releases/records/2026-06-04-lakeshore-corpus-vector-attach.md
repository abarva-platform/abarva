# 2026-06-04-lakeshore-corpus-vector-attach — Lakeshore Corpus Vector Attach

## Release ID

`2026-06-04-lakeshore-corpus-vector-attach`

## Status

`candidate`

## Plain-English Summary

Lakeshore corpus search now recognizes Lakeshore as a private-holdings tenant, routes Lakeshore corpus retrieval to the native Azure AI Search index loaded by the Lakeshore corpus loader, and hydrates vector-only matches back from Postgres before returning results. This turns the loaded Lakeshore pattern corpus from a standalone index into an attached runtime retrieval source.

## Layer Impact

- `client-data-lane`: Lakeshore-specific corpus retrieval is tenant-scoped through Lakeshore overlays and the `tenant_scope = lakeshore` Azure Search filter.
- `global-control-lane`: The shared corpus search helper now supports client-key-aware Azure index routing and vector-only result hydration for all callers.

## Client Applicability

- All clients: Shared corpus retrieval can hydrate Azure-only slugs before ranking.
- Specific clients: Lakeshore receives native Azure AI Search routing to `lakeshore-patterns-v1`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/corpus/azure-search.ts`: adds Lakeshore index routing and semantic configuration for `lakeshore-patterns-v1`.
- `src/lib/corpus/retrieval.ts`: includes overlay filters in Azure queries and hydrates Azure-only slugs from Postgres.
- `src/lib/corpus/industry-scope.ts`: adds Lakeshore/private-holdings corpus scopes.
- `src/app/api/corpus/search/route.ts`: passes the active `clientKey` into corpus retrieval.
- Focused tests for Lakeshore scope, Azure routing, and vector-only hydration.

## QA / Validation

- `jest src/lib/corpus/retrieval.test.ts src/lib/corpus/industry-scope.test.ts src/lib/corpus/azure-search.test.ts --runInBand` passed.
- Live Azure AI Search vector smoke against `lakeshore-patterns-v1` returned `PAT-LSH-D01-00095` as the top hit for a liquidity reserve query.
- Live runtime `searchCorpus()` smoke returned Lakeshore-only fused hits with `PAT-LSH-D01-00095` as the top result.
- Postgres count after corpus load: 100 distinct D01 Lakeshore patterns with search document IDs.
- Azure AI Search count after corpus load: 100 documents in `lakeshore-patterns-v1`.

## Rollout Plan

Merge to `main` through PR. Vercel picks up the runtime code change on the next deployment. The Azure Search index and Postgres corpus rows are already live in the Lakeshore pilot substrate.

## Rollback Plan

Revert this release PR to return corpus search to the previous generic `corpus-global` / `corpus-client-{clientId}` behavior. Loaded Lakeshore rows and Azure Search documents can remain in place; they will no longer be reached by the shared runtime helper until this attach slice is restored.

## Audit Evidence

- `reports/lakeshore-corpus-build/wave-1/vector-smoke-00100.json`
- `reports/lakeshore-corpus-build/wave-1/runtime-search-smoke-00100.json`
- `reports/lakeshore-corpus-build/wave-1/checkpoint.json`
- Focused Jest output in local execution logs.

## Known Gaps

The corpus is attached for the shared corpus search helper, but broader agent context-broker copy still contains legacy Pinecone wording for other retrieval lanes. That copy should be cleaned up in a separate architecture/documentation slice so it does not blur the current Lakeshore Azure AI Search path.
