# 2026-09-08-source-workspace-impact-prefetch — Source Workspace Impact Prefetch

## Release ID

`2026-09-08-source-workspace-impact-prefetch`

## Status

`candidate`

## Plain-English Summary

This release starts the governed impact-layer request immediately after the lightweight workspace response arrives. The workspace still paints its initial contract-book view quickly, but the deeper action and evidence rows are no longer held behind an extra browser timer.

## Layer Impact

`global-control-lane`: Source 360 staged loading behavior is shared product-surface behavior.

Layer 4 product substrate: the workspace loader still renders the initial portfolio response before the full impact layer, but starts the full request immediately to reduce the updating window.

No Layer 1, Layer 2, Layer 3, schema, adapter, or client-scoped data changes are included.

## Client Applicability

- All clients: yes, for the Source 360 workspace staged loading path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx` removes the client-side full-impact idle timer.
- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx` starts the full impact fetch immediately after the deferred response resolves.
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts` asserts the immediate full-impact request path and guards against reintroducing the timer.

## QA / Validation

Pass before merge:

- `npm test -- page-tenant-routing.test.ts --runInBand`
- `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- `npx eslint 'src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts'`
- `npm run release:check`

Known warnings:

- Jest reports duplicate manual mocks for markdown utilities from existing test infrastructure. The targeted passing suite still passes.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA. After deployment, run a signed-in Source 360 read-only proof that confirms the full-impact API request starts promptly and the ready state still renders governed action/evidence rows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, read-only Source 360 timing proof after deploy.

## Rollback Plan

Revert the PR to restore the previous timer-based full-impact request. No data, schema, migration, or job rollback is required.

## Audit Evidence

After release, inspect the PR, GitHub Actions checks, ACA deploy run, runtime invariant output, and signed-in Source 360 timing proof artifacts.

## Known Gaps

This release does not reduce the size of the deferred portfolio payload. It only removes the artificial browser-timer delay before the full impact request begins.
