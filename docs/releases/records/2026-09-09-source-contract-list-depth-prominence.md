# 2026-09-09-source-contract-list-depth-prominence — Source Contract List Depth Prominence

## Release ID

`2026-09-09-source-contract-list-depth-prominence`

## Status

`candidate`

## Plain-English Summary

Promotes loaded contract-depth and action-backed contracts into Source Contract 360 discovery, including the default contract list, search ranking, selected-vendor grouped contracts, and Vendor 360 drilldowns. This keeps evidence-backed contract detail reachable from normal vendor/contract navigation instead of requiring a user to know the exact deep link, and badges off-register vendor-grouped rows as depth-layer records.

## Layer Impact

Affected lane: `public-demo`.

Layer 4 products: updates Source Workspace / Contract 360 list, search, and vendor presentation. The change reads existing governed register, evidence-coverage, and action-candidate projections. It does not create, recalculate, or persist business facts. Portfolio headline metrics and concentration math remain governed by `source.contract_360` register rows, not synthetic display rows.

## Client Applicability

- All clients: Source Contract 360 list/search/vendor drilldown when supplemental depth or action rows exist.
- Specific clients: none.
- Internal only: none.
- Public/demo only: no special demo-only behavior.
- Feature flag: none.

## Changes Included

Adds display-only focused-list rows for contracts that are present in evidence-coverage or action-candidate projections but not yet present in the portfolio register list. Updates search ranking so exact contract IDs still win, while vendor searches prefer loaded depth/action matches before older register-only rows. Updates vendor grouping so selected vendors collect contracts by explicit contract refs, vendor ref, and normalized vendor name across register and supplemental rows. Adds a depth-layer badge for grouped vendor contracts that are visible through supplemental projections rather than the register. Does not route supplemental rows into `WorkspaceViewModel.summary()` or `WorkspaceViewModel.concentration()`.

## QA / Validation

- Local targeted test: pass — `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand`; includes a guard that portfolio summary/concentration stay on register rows.
- Lint: pass — `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/viewModel.tsx'`.
- Typecheck: pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Release check: pass — `npm run release:check`.
- PR checks: not-run.
- Live signed-in Source smoke after deploy: not-run.

## Rollout Plan

Merge through PR, deploy the approved main SHA through the repo-owned Azure Container Apps main workflow, prove the digest-pinned runtime invariant, then run a live signed-in Source workspace smoke against the Contract 360 list, search, and selected-vendor drilldown flow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: not authorized outside the repo-owned deploy workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: Source Workspace / Contract 360 list, search, and vendor drilldown.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data rollback is required because this is presentation-only.

## Audit Evidence

Inspect the PR, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source smoke output.

## Known Gaps

No data-layer gap is introduced by this change. The focused list and vendor drilldown still depend on existing governed evidence and action rows; contracts without loaded evidence remain summarized as registry rows.
