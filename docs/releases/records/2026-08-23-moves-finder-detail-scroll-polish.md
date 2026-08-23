# 2026-08-23-moves-finder-detail-scroll-polish — Moves Finder Detail Scroll Polish

## Release ID

`2026-08-23-moves-finder-detail-scroll-polish`

## Status

`candidate`

## Plain-English Summary

Keeps the Moves phase detail panel visible when a workflow step is selected from the left rail. This prevents the selected step content from landing partially under the fixed app header.

## Layer Impact

- Product layer: Moves UI scroll behavior only.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, tenant-data, or data-plane writes.

## Client Applicability

- All clients: Applies to Moves phase workspace navigation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a fixed-header scroll offset to the finder detail panel.
- Scrolls the detail panel into view after selecting a workflow row.

## QA / Validation

Status: `passed with noted test gap`.

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx -t "clicking a phase-input row updates the detail pane" --runInBand` — failed on a pre-existing stale canary display-name assertion unrelated to this scroll behavior.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- `npm run release:check`

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, visual confirmation on a signed-in Moves phase page after deploy.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6668
- Local validation commands listed above.

## Known Gaps

- This is a focused viewport polish change. It does not alter phase gates, approvals, evidence handling, persistence, or deliverable generation.
- The existing finder-layout test named above still asserts an older canary display name. This PR does not change that fixture or display-name behavior.
