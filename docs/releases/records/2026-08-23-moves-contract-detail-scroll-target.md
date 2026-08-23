# 2026-08-23-moves-contract-detail-scroll-target — Moves Contract Detail Scroll Target

## Release ID

`2026-08-23-moves-contract-detail-scroll-target`

## Status

`candidate`

## Plain-English Summary

Updates Moves workflow-row selection to scroll the active contract-detail pane below the fixed app header. Signed-in proof after the previous scroll polish showed the visible workflow pane uses the contract-detail container, so this follow-up targets that live container directly.

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

- Scrolls the live contract-detail pane into view when selecting a workflow row.
- Keeps the existing finder-detail fallback for alternate detail layouts.
- Adds the fixed-header scroll offset to the contract-detail pane.

## QA / Validation

Status: `passed`.

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

- PR URL: https://github.com/abarva-platform/abarva/pull/6670
- Signed-in proof that motivated the follow-up: `/tmp/nexus-moves-scroll-polish-proof.json`.
- Local validation commands listed above.

## Known Gaps

- This is a focused viewport polish change. It does not alter phase gates, approvals, evidence handling, persistence, or deliverable generation.
