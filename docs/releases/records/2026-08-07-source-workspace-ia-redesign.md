# 2026-08-07-source-workspace-ia-redesign — Source Workspace IA Cleanup

## Release ID

`2026-08-07-source-workspace-ia-redesign`

## Status

`candidate`

## Plain-English Summary

The Source Workspace portfolio view now opens with a single Home synthesis and uses four top-level tabs instead of seven overlapping destinations. The left Explorer is now a drill-down surface for vendors, contracts, evidence, and sourcing events rather than a second copy of the top navigation. The change keeps the existing governed Source calculations and visualizations, but arranges them so the user sees the action story first.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source Workspace presentation and navigation changed. No canonical model, adapter, loader, Cube view, tenant data, or sourcing workflow backend changed.

## Client Applicability

- All clients: yes, for tenants using the Source Workspace preview surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source Workspace default portfolio tab changes from `Context` to `Home`.
- Portfolio tabs are reduced to `Home`, `Explore`, `Concentration & Leverage`, and `Renewals`.
- Agenda findings are moved into Home as the portfolio synthesis.
- Technical diagnostics and evidence reconciliation are collapsed behind a details section on Home.
- Concentration and leverage share one top-level tab with a lens switch.
- Explorer removes duplicated portfolio navigation, lists real vendors first, and suppresses zero-count contract filters.

## QA / Validation

- `npm test -- --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts --runInBand` passed.
- `npx eslint src/app/(maestro)/source/preview/workspace/viewModel.tsx src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` required before merge.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify `/source/preview/workspace` shows the four-tab IA and the merged Concentration & Leverage lens.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

Pull request, CI output, release-check output, ACA deploy run, and signed-in browser proof after deployment.

## Known Gaps

Live signed-in proof is pending until the merged image is deployed and an authenticated browser session is available.
