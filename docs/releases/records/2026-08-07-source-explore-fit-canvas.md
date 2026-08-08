# 2026-08-07-source-explore-fit-canvas — Source Explore Single-Screen Canvas

## Release ID

`2026-08-07-source-explore-fit-canvas`

## Status

`candidate`

## Plain-English Summary

The Source Workspace Explore view is tightened into a contained analytics canvas. The page now prioritizes the selected slice, the grouped value chart, and the contract line items in one working viewport instead of pushing the useful inventory below the fold.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Workspace UI only. The Explore lens rendering changes, but the underlying governed Source read model and selection semantics are unchanged.
- Canonical model: No schema, adapter, or data-model changes.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/lenses/ExploreLens.tsx`
- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`

## QA / Validation

- `npx eslint "src/app/(maestro)/source/preview/workspace/lenses/ExploreLens.tsx" "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx" "src/app/(maestro)/source/preview/workspace/viewModel.tsx"` passed.
- `npx jest --runTestsByPath "src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts" --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.
- Local visual route load is blocked by Clerk sign-in in the worktree; signed-in browser proof is required after ACA deployment.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the resulting web image. After deployment, verify `/source/preview/workspace` signed in at normal desktop width and confirm the Explore tab fits as a single-screen canvas with contract line items visible.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Verify after deploy before claiming live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source Workspace Explore tab.

## Rollback Plan

Revert the UI PR and allow the main ACA deploy workflow to publish the previous Source Workspace layout. No data rollback is required.

## Audit Evidence

- Pull request and CI output for this release candidate.
- ACA deploy run and signed-in browser screenshots after merge.

## Known Gaps

- This release reshapes the Explore surface and adds the visible filtered contract inventory. It does not change the separate optimization workflow or data evidence depth.
