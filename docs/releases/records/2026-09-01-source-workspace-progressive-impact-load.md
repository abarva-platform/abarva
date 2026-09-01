# 2026-09-01-source-workspace-progressive-impact-load — Source Workspace Progressive Impact Load

## Release ID

`2026-09-01-source-workspace-progressive-impact-load`

## Status

`candidate`

## Plain-English Summary

The workspace route now paints the governed contract book before the heavier evidence and action layer finishes loading. The page labels the evidence-depth hydration state in the persistent workspace toolbar, then swaps in the full evidence/action payload when it is ready. This keeps initial paint responsive while preserving the rule that evidence-backed claims only appear after the supporting layer is loaded.

## Layer Impact

`global-control-lane`: Layer 4 product projection behavior changed for the `Source Workspace` route and portfolio API. The canonical and consumption data layers are unchanged.

## Client Applicability

- All clients: `Source Workspace` users receive the progressive loading behavior and regression coverage.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing provider override behavior is unchanged.

## Changes Included

- `Source Workspace` portfolio API accepts an explicit impact-load mode and reports load timing/mode headers.
- The workspace client fetches a deferred-impact payload initially, then hydrates the full impact payload in the background.
- `Source Workspace` shell shows the current evidence-depth load state in the persistent toolbar.
- Regression tests cover chart palette safety, unresolved supplier display safety, persistent navigation, contract graph structure, and progressive API loading.

## QA / Validation

- `jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts --runInBand` passed.
- `eslint` passed on touched Source Workspace files and tests.
- `git diff --check` passed.

## Rollout Plan

Merge through pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or data-build job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the ACA main deploy workflow.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: Must remain unchanged or match the deploy workflow invariant.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify initial paint, full hydration, navigation, graph tab, and chart rendering.

## Rollback Plan

Revert the pull request and redeploy the previous approved image through the ACA main deploy workflow.

## Audit Evidence

Inspect the pull request, scoped test output, eslint output, deploy workflow run, ACA runtime invariant proof, and signed-in `Source Workspace` proof after deployment.

## Known Gaps

Live signed-in proof requires an account/session with access to a populated `Source Workspace` data set.
