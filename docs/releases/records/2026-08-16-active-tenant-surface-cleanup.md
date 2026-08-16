# 2026-08-16-active-tenant-surface-cleanup — Active Tenant Surface Cleanup

## Release ID

`2026-08-16-active-tenant-surface-cleanup`

## Status

`candidate`

## Plain-English Summary

Removes stale retired-tenant display paths from active runtime surfaces. The
Programs index now resolves only active tenant view models and uses the
authenticated active client name for visible page identity. The Strategic Moves
index shows the active tenant name in its header and empty state. The Admin Data
Layer Explorer filters the stored all-tenant quality artifact to active
canonical tenants before rendering live admin status and no longer prints
retired tenant keys in the visible page.

This change does not mutate tenant data, refresh projections, write canonical
tables, activate registries, update Active Tenant Access, or make a live-client
truth claim.

## Layer Impact

- `global-control-lane`: visible UI and post-deploy crawl posture for active
  signed-in surfaces.
- Layer 4 product surfaces only: Programs, Strategic Moves, and Admin Data
  Layer Explorer presentation. No Layer 1 intake, Layer 2 adapter, Layer 3
  canonical, Source cube, or data-plane state changes.

## Client Applicability

- All clients: active signed-in surfaces should not show retired tenant history
  as live status.
- Specific clients: active demo tenants only.
- Internal only: Admin Data Layer Explorer.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Narrows the Programs index view-model tenant options to the active tenant
  set.
- Threads the authenticated active client display name into Programs and
  Strategic Moves visible page copy.
- Filters the Admin Data Layer Explorer quality matrix to active canonical
  tenants before rendering.
- Summarizes retired registry records without printing retired tenant keys in
  the live admin page.
- Updates targeted tests for the active-only manifest projection state.

## QA / Validation

- Pass: `npx eslint 'src/app/programs/page.tsx' 'src/lib/programs/programs-page-view.ts' 'src/app/(maestro)/strategic-moves/page.tsx' 'src/components/strategic-moves/StrategicMovesHomeClient.tsx' 'src/app/(maestro)/admin/data-layer-explorer/page.tsx' 'src/lib/admin/__tests__/data-layer-explorer.test.ts'`.
- Pass: `npm test -- --runTestsByPath src/lib/admin/__tests__/data-layer-explorer.test.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`.
  - Note: Jest emitted pre-existing duplicate manual mock warnings for markdown
    parser mocks; the targeted suites passed 18/18.
- Pass: touched-file retired-name static check returned no findings.
- Pass: `npx tsc --noEmit`.
- Pass: `npm test -- --runTestsByPath src/__tests__/integration/programs/programs-index-page.test.ts --runInBand`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow may rebuild and deploy
the shared web image after merge; it is the only approved path that may shift
shared web traffic.

## Deployment Authority

- Repo-owned deploy workflow: permitted after merge and is the only deployment
  authority for shared Product/Lab web traffic.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- ACR build policy: unchanged.
- ACA runtime invariant: required if the repo-owned main ACA deploy runs.
- Worker image invariant: required if the repo-owned main ACA deploy runs.
- Live signed-in proof required: post-deploy crawl should re-check tenant
  identity findings.

## Rollback Plan

Revert this PR. No data rollback is required because this release performs no
data-plane mutation.

## Audit Evidence

- PR checks and merge commit.
- ACA deploy proof if the repo-owned main deploy workflow runs after merge.
- Post-deploy crawl result if the repo-owned crawl runs after deploy.

## Known Gaps

This fixes the active runtime rendering path touched by the latest crawl. It
does not classify or delete the remaining report-only retired tenant residue
inventory found by `validate:no-sunset-tenant-residue`.
