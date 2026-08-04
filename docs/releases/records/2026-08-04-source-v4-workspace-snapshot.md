# 2026-08-04-source-v4-workspace-snapshot - Source v4 Workspace Snapshot

## Release ID

`2026-08-04-source-v4-workspace-snapshot`

## Status

`candidate`

## Plain-English Summary

Adds a compact Source v4 aggregate snapshot to the Source Workspace server payload. The richer Source v4 dataset stays in Postgres/Cube; the page receives summarized counts, sums, top-N drill starters and availability states so UI builders can render Qlik-style exploration without sending raw extract rows to the browser.

## Layer Impact

- `global-control-lane`: Source Workspace payload shape now includes `v4Snapshot` beside the existing semantic catalog.
- `client-data-lane`: No schema, load, migration or data mutation. The snapshot reads the existing Source v4 lab/prod-parity tables and marks missing table families as unavailable instead of converting gaps into zero value.

## Client Applicability

- All clients: code path is available but returns an empty/missing snapshot when v4 Source tables are absent.
- Specific clients: the synthetic airline tenant is the only currently proven Source v4 dataset.
- Internal only: UI and aVa builders can use the typed snapshot contract.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/source-v4-workspace-snapshot.ts`
- `src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- `docs/source/SOURCE_V4_UI_CUBE_CONSUMPTION_CONTRACT.md`

## QA / Validation

- Pass: `npx jest src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`
- Pass: `npx eslint src/lib/source/data-model/source-v4-workspace-snapshot.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts src/lib/source/data-model/source-v4-cube-ui-catalog.ts src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts src/app/'(maestro)'/source/preview/workspace/live/portfolioAdapter.ts src/app/'(maestro)'/source/preview/workspace/page.tsx src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow deploys the app payload. No database migration, Cube rebuild, operator data load or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release
- Approved image digest: assigned by ACA main deploy after merge
- ACA runtime invariant: required after deploy before claiming live app proof
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: yes, before claiming visual behavior is live-proven

## Rollback Plan

Revert this PR. The Source Workspace will keep the existing contract/vendor payload and semantic catalog without the v4 aggregate snapshot. No database rollback is needed.

## Audit Evidence

- PR URL and commit SHA after merge.
- Local Jest, ESLint, TypeScript and release-check output.
- ACA main deploy and runtime-invariant evidence after merge.

## Known Gaps

This release does not redesign the Source Workspace visuals. It gives the UI/UX lane a tested aggregate payload to render from.
