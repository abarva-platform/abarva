# 2026-06-06-corpus-client-index-publish — Tenant-scoped corpus publish routing

## Release ID

`2026-06-06-corpus-client-index-publish`

## Status

`candidate`

## Plain-English Summary

Corpus patterns published from an authenticated tenant session now carry the tenant key through the publish path. Lakeshore-authored corpus patterns are uploaded to the Lakeshore native Azure AI Search index with a `tenant_scope` marker, while other client-private corpus patterns continue to publish to their generic private client index. This protects the corpus-last Lakeshore work from being loaded through the wrong search surface.

## Layer Impact

- `client-data-lane`: Changes corpus authoring publish behavior and Azure AI Search document routing for tenant-scoped corpus patterns.
- `global-control-lane`: Extends the shared corpus mutation context to include the authenticated client key used by corpus routes.

## Client Applicability

- All clients: generic private corpus publish continues to route to `corpus-client-{clientId}`.
- Specific clients: Lakeshore corpus publish routes to the Lakeshore native index, `lakeshore-patterns-v1`, when the authenticated client key is Lakeshore.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/api/corpus/_route-utils.ts` now includes `clientKey` in corpus mutation context.
- `src/lib/corpus/authoring.ts` passes `clientId` and `clientKey` into Azure Search upload during publish.
- `src/lib/corpus/azure-search.ts` routes Lakeshore uploads to the Lakeshore native index and annotates those documents with `tenant_scope = lakeshore`.
- `src/lib/corpus/types.ts` records the optional `clientKey` in mutation context.
- `src/lib/corpus/azure-search.test.ts` adds focused coverage for Lakeshore and non-Lakeshore upload routing.

## QA / Validation

- `npx jest src/lib/corpus/azure-search.test.ts src/lib/corpus/retrieval.test.ts --runInBand` passed, 5 tests.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` is expected to pass after this record is included.
- `npx tsc --noEmit --pretty false` was started as a full typecheck validation for the branch.

## Rollout Plan

Merge to `main`, then deploy through the normal Vercel production path. No database migration or manual data backfill is required. The change becomes active for future corpus publish operations.

## Rollback Plan

Revert the PR. Existing published documents remain where they were already uploaded; if a bad publish occurs, retire the affected corpus pattern and republish after rollback or fix-forward.

## Audit Evidence

- Focused Jest output for corpus Azure Search and retrieval tests.
- Git diff showing publish context now carries `clientId` and `clientKey`.
- CI release-control and typecheck results on the PR.

## Known Gaps

This does not generate or load the Lakeshore corpus itself. It removes a routing risk that should be corrected before private Lakeshore corpus rows are published.
