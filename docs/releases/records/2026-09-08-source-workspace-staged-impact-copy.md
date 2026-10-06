# 2026-09-08-source-workspace-staged-impact-copy — Source Workspace Staged Impact Copy

## Release ID

`2026-09-08-source-workspace-staged-impact-copy`

## Status

`candidate`

## Plain-English Summary

This release clarifies the Source 360 interim loading state when the workspace initially paints before the governed impact layer finishes hydrating. The page now uses explicit updating language instead of implying quantified opportunities are absent during that short deferred-load window.

## Layer Impact

`global-control-lane`: Source 360 rendering is shared product-surface behavior.

Layer 4 product substrate: Source 360 rendering now distinguishes impact-layer loading, impact-layer error, and genuinely empty impact states.

No Layer 1, Layer 2, Layer 3, schema, adapter, or client-scoped data changes are included.

## Client Applicability

- All clients: yes, for the Source 360 workspace when staged impact loading is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` threads the impact load state into the portfolio verdict content.
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` renders separate messages for loading, error, and ready-empty impact states.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` covers the deferred impact state so loading copy cannot regress into an empty-claim statement.

## QA / Validation

Pass:

- `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- `npm test -- WorkspaceExecutiveShell.performance.test.ts --runInBand`
- `npm test -- page-tenant-routing.test.ts --runInBand`
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`

Known warnings:

- Jest reports duplicate manual mocks for markdown utilities from existing test infrastructure. The targeted suites still pass.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA. After deployment, run a signed-in Source 360 read-only proof that confirms the staged-loading copy appears before the impact layer is ready and that the ready state still surfaces governed impact values.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, read-only Source 360 proof after deploy.

## Rollback Plan

Revert the PR to restore the previous ready-empty copy path. No data, schema, migration, or job rollback is required.

## Audit Evidence

After release, inspect the PR, GitHub Actions checks, ACA deploy run, runtime invariant output, and signed-in Source 360 proof artifacts for the staged loading and ready states.

## Known Gaps

This release does not change Source 360 chart design, data coverage, aVa behavior, Contract 360, Optimize, or data-build jobs. It only corrects the interim copy shown while the deferred impact layer hydrates.
