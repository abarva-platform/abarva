# 2026-08-31-source-workspace-graph-subtab-label - Source Workspace Graph Subtab Label

## Release ID

`2026-08-31-source-workspace-graph-subtab-label`

## Status

`candidate`

## Plain-English Summary

This updates one Source workspace graph subtab label so the product navigation matches the approved design contract language. The page behavior and data reads do not change.

## Layer Impact

Layer 4 - Product projection. Lane: `global-control-lane`. The change affects only the Source workspace browser surface label and the focused product-surface test that asserts the label is present.

## Client Applicability

- All clients: Source workspace users see the updated graph subtab label.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace graph subtab label changed from `Spine` to `Mapping spine`.
- Focused Source workspace browser-surface test updated to assert the design-contract label.

## QA / Validation

- pass - Local focused test: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`.
- pass - Focused ESLint: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`.
- pass - TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- pass - Release control check: `npm run release:check`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the approved main commit.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace graph tab should show `Mapping spine`.

## Rollback Plan

Revert the label change and redeploy through the same protected main workflow.

## Audit Evidence

- Pull request: https://github.com/abarva-platform/abarva/pull/7177
- CI: pending.
- Deployment: pending.
- Live proof: pending.

## Known Gaps

This is a label-fidelity change only. Full tab-by-tab Source 360 CXO story rehearsal remains a separate QA step.
