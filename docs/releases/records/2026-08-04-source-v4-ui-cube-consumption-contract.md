# 2026-08-04-source-v4-ui-cube-consumption-contract - Source v4 UI Cube Consumption Contract

## Release ID

`2026-08-04-source-v4-ui-cube-consumption-contract`

## Status

`candidate`

## Plain-English Summary

Adds the product-facing contract for how the Source Workspace and aVa should consume the Source v4 Cube semantic layer. The change does not add new data or mutate runtime databases. It gives the UI a typed catalog of v4 Cube views, drill paths, visuals and honesty rules so richer Source visuals can be built against deployed semantic views instead of ad hoc queries.

## Layer Impact

- `global-control-lane`: Source Workspace now receives the Source v4 semantic catalog in its server payload and passes it to aVa surface context.
- `client-data-lane`: No schema or data change. The catalog points at the existing `source_v4_*` Cube views added in the prior Source v4 canary model release.

## Client Applicability

- All clients: none directly; the catalog is inert unless the Source Workspace consumes Source v4 semantics.
- Specific clients: the synthetic airline tenant is the only proven dataset for this v4 catalog.
- Internal only: operators and UI builders can inspect the contract document and tests.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/source-v4-cube-ui-catalog.ts`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- `docs/source/SOURCE_V4_UI_CUBE_CONSUMPTION_CONTRACT.md`

## QA / Validation

- Pass: `npx jest src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/data-model/source-v4-cube-ui-catalog.ts src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts src/app/'(maestro)'/source/preview/workspace/live/portfolioAdapter.ts src/app/'(maestro)'/source/preview/workspace/page.tsx src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow deploys the app payload; no data migration, Cube rebuild or operator job is required for this slice because it consumes the already deployed Source v4 Cube model.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release
- Approved image digest: assigned by ACA main deploy after merge
- ACA runtime invariant: required after deploy before claiming live app proof
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: yes, before claiming the Source Workspace UI is live-proven

## Rollback Plan

Revert this PR. The prior Source Workspace payload shape will be restored. No database rollback is needed.

## Audit Evidence

- PR URL and commit SHA after merge.
- Local Jest catalog proof and workspace view-model proof.
- ESLint, TypeScript and release-check output.
- ACA main deploy evidence after merge.

## Known Gaps

This release does not render the new Qlik-style canvases. It gives the UI/UX lane a tested Cube-backed contract to render from. Signed-in browser proof remains required for the visual workspace.
