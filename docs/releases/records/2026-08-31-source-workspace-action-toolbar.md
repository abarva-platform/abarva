# 2026-08-31-source-workspace-action-toolbar - Source Workspace Action Toolbar

## Release ID

`2026-08-31-source-workspace-action-toolbar`

## Status

`candidate`

## Plain-English Summary

This improves the Source workspace header action area so evidence and graph
navigation reads as a deliberate operator toolbar instead of two small inline
buttons. The page behavior and data reads do not change.

## Layer Impact

Layer 4 - Product projection. Lane: `global-control-lane`. The change affects
only the Source workspace browser surface and the focused product-surface test
that asserts the toolbar contract.

## Client Applicability

- All clients: Source workspace users see the updated action toolbar.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace action control receives an explicit action-toolbar label.
- Evidence and graph action buttons receive dedicated toolbar styling.
- Focused Source workspace browser-surface test asserts the toolbar contract.

## QA / Validation

- pass - Local focused test: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`.
- pass - Focused ESLint: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`.
- pass - TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- pass - Release control check: `npm run release:check`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps
deploy workflow builds and deploys the approved main commit.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace header should show the
  updated action toolbar and preserve the horizontal workspace navigation.

## Rollback Plan

Revert the toolbar component/CSS change and redeploy through the same protected
main workflow.

## Audit Evidence

- Pull request: pending.
- CI: pending.
- Deployment: pending.
- Live proof: pending.

## Known Gaps

This is a toolbar-fidelity change only. Full visual parity against every design
artifact detail remains a separate tab-by-tab QA step.
