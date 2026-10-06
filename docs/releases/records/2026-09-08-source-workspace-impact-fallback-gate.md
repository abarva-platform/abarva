# 2026-09-08-source-workspace-impact-fallback-gate — Source Workspace Impact Fallback Gate

## Release ID

`2026-09-08-source-workspace-impact-fallback-gate`

## Status

`candidate`

## Plain-English Summary

This release keeps Source 360 from blocking the full impact response on a derived fallback when the physical action, claim-card, and aVa grounding views already contain usable executive impact rows. The workspace still derives impact rows when the physical views are empty or incomplete for action-card display.

## Layer Impact

`global-control-lane`: Source 360 impact loading behavior is shared product-surface behavior.

Layer 4 product substrate: the workspace continues to prefer physical impact views and uses the slower derived fallback only when required to produce action cards and grounding.

No Layer 1, Layer 2, Layer 3, schema, adapter, or client-scoped data changes are included.

## Client Applicability

- All clients: yes, for the Source 360 workspace full-impact read path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts` narrows the derived-impact fallback gate to action-card and action-grounding completeness.
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts` adds a regression that complete physical action views do not trigger the derived consumption fallback.

## QA / Validation

Pass before merge:

- `npm test -- portfolioAdapter.ecl.test.ts --runInBand`
- `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- `npm test -- WorkspaceExecutiveShell.performance.test.ts --runInBand`
- `npm test -- page-tenant-routing.test.ts --runInBand`
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'`

Known warnings:

- Jest reports duplicate manual mocks for markdown utilities from existing test infrastructure. The targeted passing suites still pass.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA. After deployment, run a signed-in Source 360 read-only timing proof that compares the full-impact portfolio request against the prior slow path and confirms the page still renders action/evidence rows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, read-only Source 360 timing and content proof after deploy.

## Rollback Plan

Revert the PR to restore the previous broader derived-impact fallback gate. No data, schema, migration, or job rollback is required.

## Audit Evidence

After release, inspect the PR, GitHub Actions checks, ACA deploy run, runtime invariant output, and signed-in Source 360 timing proof artifacts.

## Known Gaps

This release does not reduce the size of the deferred portfolio JSON payload. It targets the full-impact server miss path that previously spent time recomputing rows already available from physical views.
