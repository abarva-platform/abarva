# 2026-08-30-source-workspace-performance-cta-target — Source Performance CTA Target

## Release ID

`2026-08-30-source-workspace-performance-cta-target`

## Status

`candidate`

## Plain-English Summary

The Source workspace now sends the performance-evidence call to action to a contract that actually has loaded performance rows and unclaimed-credit coverage when that evidence exists. This prevents an executive workflow from landing on an unrelated contract with no performance evidence.

## Layer Impact

Layer 4 PRODUCTS; lane `global-control-lane`: updates only Source workspace selection behavior. The change reads existing coverage rows and does not modify intake data, adapters, canonical objects, read models, calculations, tenant routing, or data-plane content.

## Client Applicability

- All clients: Source workspace users with performance-credit coverage rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace route/provider behavior.

## Changes Included

- Source workspace executive shell prefers performance/unclaimed-credit coverage rows for the performance-evidence CTA target.
- Source workspace browser-surface test covers the case where the action row and performance-evidence row point at different contracts.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Verified by the repo-owned deploy workflow.
- Worker image invariant: Verified by the repo-owned deploy workflow when applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source workspace Optimize to Contract 360 performance drill-down.

## Rollback Plan

Revert the presentation-layer selection commit or roll back the ACA runtime to the prior verified image. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7169
- CI checks for the PR.
- ACA main deploy run after merge.
- Live signed-in Source workspace proof after deploy.

## Known Gaps

The CTA cannot create missing contract-detail period rows. If the selected contract has summary coverage but no detail-period rows, the page must continue to state the evidence limitation instead of charting a trend.
