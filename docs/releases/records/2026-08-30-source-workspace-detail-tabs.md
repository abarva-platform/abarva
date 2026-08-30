# 2026-08-30-source-workspace-detail-tabs — Source Workspace Detail Tabs

## Release ID

`2026-08-30-source-workspace-detail-tabs`

## Status

`candidate`

## Plain-English Summary

The Source workspace contract-detail view now follows the intended seven-tab shape and shows a clear evidence claim guardrail on each detail tab. The evidence page keeps operator-facing labels primary and moves raw read-model names into subordinate lineage text.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: Source workspace presentation only. No canonical data, loader, adapter, migration, or tenant data is changed.

## Client Applicability

- All clients: Source workspace users who can access the workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing workspace routing and provider selection only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`

## Rollout Plan

Merge through a pull request. The repository-owned Azure Container Apps main deployment workflow builds and deploys the updated web image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source workspace route.

## Rollback Plan

Revert the pull request and allow the repository-owned deployment workflow to publish the previous Source workspace presentation.

## Audit Evidence

Inspect the pull request, CI/deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This does not add new evidence rows, new cubes, document parsing, or a new data load. It only brings the presentation closer to the intended Source workspace contract.
