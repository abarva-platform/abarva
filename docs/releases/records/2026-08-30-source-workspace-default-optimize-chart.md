# 2026-08-30-source-workspace-default-optimize-chart — Source Default Optimize Chart

## Release ID

`2026-08-30-source-workspace-default-optimize-chart`

## Status

`candidate`

## Plain-English Summary

The Source workspace Optimize page now shows a chart on its default action-queue view when governed action rows are available. This keeps the executive surface visual without creating unsupported value claims.

## Layer Impact

Layer 4 PRODUCTS; lane `global-control-lane`: updates only the Source workspace presentation layer. Existing action-candidate rows are summarized visually; no intake files, adapters, canonical tables, projections, tenant routing, or calculations are changed.

## Client Applicability

- All clients: Source workspace users with action-candidate rows available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace route/provider behavior.

## Changes Included

- Source workspace executive shell renders the action-mix Recharts component on the default Optimize action queue.
- Source workspace browser-surface test adds a positive action-row fixture and asserts the chart renders without showing realized-savings language.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Verified by the repo-owned deploy workflow.
- Worker image invariant: Verified by the repo-owned deploy workflow when applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source workspace Optimize tab.

## Rollback Plan

Revert the presentation-layer commit or roll back the ACA runtime to the prior verified image. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7167
- CI checks for the PR.
- ACA main deploy run after merge.
- Live signed-in Source workspace proof after deploy.

## Known Gaps

This does not add new action rows or finance confirmation. If no governed action rows are loaded, the page continues to show the existing empty state.
