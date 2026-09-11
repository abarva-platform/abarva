# 2026-09-10-source-command-design-fidelity - Source command design fidelity

## Release ID

`2026-09-10-source-command-design-fidelity`

## Status

`candidate`

## Plain-English Summary

Source Command Center now carries persisted contract-optimization opportunities into the portfolio action stream, so the default Levers story can use the same governed opportunity spine that Contract 360 uses. The Levers default also prefers a loaded cloud-consumption action set when one exists and avoids repeating a row title as filler copy.

## Layer Impact

Release lane: `global-control-lane`.

Layer 2 source adapter: widens the Source workspace portfolio adapter to read both the consumption opportunity view and persisted Source optimization opportunities, deduped by opportunity id.

Layer 4 product projection: changes the default Levers story selection and card copy fallback. It does not create new opportunities, load tenant data, change canonical tables, or alter finance realization rules.

## Client Applicability

- All clients: Source Command Center users receive the safer opportunity projection and Levers story behavior.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing Source workspace provider flags continue to govern the read path.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` - pass.
- `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` - pass.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` - pass.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` - pass.
- `git diff --check` - pass.

## Rollout Plan

Open a pull request, merge through the protected repository path, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved main image. No manual data mutation or direct shared-runtime update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: captured by the repo-owned deploy workflow after merge.
- ACA runtime invariant: must be verified after deploy.
- Worker image invariant: must be verified after deploy.
- Feature/env flag update path: no feature or environment flag update.
- Live signed-in proof required: Source `/source` Levers tab, Source top navigation, Command/Contracts/Levers/Evidence/Coverage tab visibility, and default Levers action-order story.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release does not write canonical or tenant data.

## Audit Evidence

Inspect the PR, merge commit, GitHub Actions deploy run, ACA runtime invariant output, and signed-in Source `/source` smoke proof.

## Known Gaps

This release does not reload, parse, enrich, or approve tenant contract data. If a contract is absent from persisted optimization opportunities, it still needs the governed data-build path before Source can show rich contract-specific levers for it.
