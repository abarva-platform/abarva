# 2026-08-23-source-workspace-missing-contract-render — Source Missing Contract Render Guard

## Release ID

`2026-08-23-source-workspace-missing-contract-render`

## Status

`candidate`

## Plain-English Summary

Source Workspace now keeps a missing contract deep link in the contract surface and renders an explicit withheld-contract state. If the active Source provider does not return the requested contract row, the page does not fall back to the portfolio cockpit and does not substitute a different contract.

## Layer Impact

Lane: `global-control-lane`.

Products: Source Workspace rendering only. The change affects the client-side view model and contract canvas for a missing contract selection.

Canonical / source / projection / cube layers: No schema, data, adapter, cube, or projection mutation.

## Client Applicability

- All clients: Applies to Source Workspace deep links when the requested contract row is not returned by the active provider.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Workspace view model keeps missing contract selections in contract mode.
- Contract canvas renders a visible withheld-contract panel when no selected contract row is available.
- Focused unit coverage asserts the missing deep link remains in contract mode without substituting the first contract.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' --runInBand` — passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts'` — passed.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the next shared lab image from `main`.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime activation.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before live proof is claimed.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for any claim that the rendered Source Workspace behavior is live.

## Rollback Plan

Revert this PR and redeploy the previous known-good ACA image through the repo-owned deploy workflow.

## Audit Evidence

- PR URL: to be added when opened.
- Local Jest and ESLint results listed above.
- Browser proof: pending after deploy.

## Known Gaps

Live browser proof is pending until the change is merged, deployed, and rechecked against the Source Workspace route.
