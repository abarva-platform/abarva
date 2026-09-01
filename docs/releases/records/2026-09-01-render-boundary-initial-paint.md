# `2026-09-01-render-boundary-initial-paint` — Render Boundary Initial Paint

## Release ID

`2026-09-01-render-boundary-initial-paint`

## Status

`candidate`

## Plain-English Summary

The product page now renders its executive shell directly instead of waiting on an additional lazy-loaded shell boundary. The change is intended to reduce perceived loading delay for the primary canvas while preserving the existing route-level loading state and chart rendering behavior.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 products: updates the page client rendering path only. No canonical data, tenant records, ingestion, projection, retrieval, or evidence policy behavior changes.

## Client Applicability

- All clients: users on the shared product route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Page client shell import path.
- Page executive shell top-level derived selector memoization.
- Focused UI test expectation for initial-paint rendering behavior.

## QA / Validation

- PASS: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`
- PASS: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: produced by the repo-owned workflow.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: not changed by this product-surface update.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected product routes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow.

## Audit Evidence

PR, CI, ACA deploy run, runtime invariant proof, and signed-in workspace proof after deployment.

## Known Gaps

This release does not change server-side data read latency or add new views. It only removes an extra client shell loading gate and memoizes repeated client rollups.
