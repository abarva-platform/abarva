# 2026-09-10-source-command-impact-union-date - Source command impact union date

## Release ID

`2026-09-10-source-command-impact-union-date`

## Status

`candidate`

## Plain-English Summary

Source Command Center impact hydration now keeps the legacy opportunity view and the persisted optimization spine on the same date-field type when they are unioned for portfolio levers. This prevents a valid optimization spine from disappearing behind an empty Levers state when the direct impact read executes against Postgres.

## Layer Impact

Release lane: `global-control-lane`.

Layer 2 source adapter: narrows a direct-read SQL contract in the Source workspace portfolio adapter by casting the legacy decision date to text before it is unioned with persisted optimization deadlines.

Layer 4 product projection: restores the Levers action-order story when governed action rows are present. It does not create, mutate, reload, enrich, or approve tenant data.

## Client Applicability

- All clients: Source Command Center users benefit from the corrected impact hydration query.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing Source workspace provider flags continue to govern the read path.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` - pass.
- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` - pass.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` - required before merge.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` - required before merge.
- `git diff --check` - required before merge.
- `npm run release:check` - required before merge.

## Rollout Plan

Open a pull request, merge through the protected repository path, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved main image. No manual data mutation or direct shared-runtime update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: captured by the repo-owned deploy workflow after merge.
- ACA runtime invariant: must be verified after deploy.
- Worker image invariant: must be verified after deploy.
- Feature/env flag update path: no feature or environment flag update.
- Live signed-in proof required: Source `/source` Levers tab must show the action-order story when governed action rows exist, with the main application navigation and Source tabs visible.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release does not write canonical or tenant data.

## Audit Evidence

Inspect the PR, merge commit, GitHub Actions deploy run, ACA runtime invariant output, and signed-in Source `/source` smoke proof.

## Known Gaps

This release does not reload, parse, enrich, or approve tenant contract data. It only fixes the impact hydration read path so existing governed action rows can render.
