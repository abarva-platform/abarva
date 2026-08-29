# 2026-08-29-source-impact-workspace-reader

## Release ID

`2026-08-29-source-impact-workspace-reader`

## Status

`candidate`

## Plain-English Summary

Updates the Source workspace reader so deterministic Source impact views and contract-depth period rows are read with the canonical Source tenant session before falling back to the older governed alias path. This lets already-loaded Source impact rows appear in the product workspace without changing the underlying data.

## Layer Impact

- `global-control-lane`: updates shared Source read-adapter behavior for product pages that render Source contract-depth facts.
- `client-data-lane`: no new rows or schema changes; the change exposes already-loaded governed Source rows through the existing read path.

## Client Applicability

All clients using canonical Source contract-depth and deterministic impact views. Current live proof is required on the approved synthetic demo slice only.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand`
- PASS: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand`
- PASS: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`
- PASS: `git diff --check`

## Rollout Plan

Merge by PR, deploy through the repo-owned Azure Container Apps main workflow, then run signed-in Source workspace proof against the deployed product route.

## Deployment Authority

- Repo-owned deploy workflow: required
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: recorded after deploy
- ACA runtime invariant: required after deploy
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: Source workspace must show deterministic claim cards, aVa grounding bundles, candidate opportunity total, and no cross-tenant strings.

## Rollback Plan

Revert the PR and redeploy the prior approved digest if the Source workspace reader regresses product behavior.

## Audit Evidence

Inspect the PR, deploy run, release checks, and signed-in Source workspace proof artifacts.

## Known Gaps

Live signed-in proof must be captured after deploy.
