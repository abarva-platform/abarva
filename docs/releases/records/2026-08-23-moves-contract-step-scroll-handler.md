# 2026-08-23-moves-contract-step-scroll-handler — Moves Contract Step Scroll Handler

## Release ID

`2026-08-23-moves-contract-step-scroll-handler`

## Status

`candidate`

## Plain-English Summary

Adds the fixed-header scroll behavior to the compact Moves contract-step layout. Signed-in proof showed this is the active layout on the phase workspace, so selecting input or workflow rows now scrolls the detail pane into view.

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

- Adds a shared contract-detail scroll helper in the compact Moves phase layout.
- Invokes the helper from input-row and workflow-row selection in that layout.

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

- PR URL: https://github.com/abarva-platform/abarva/pull/6672
- Signed-in proof that identified the missing handler path: `/tmp/nexus-moves-scroll-contract-detail-workflow-count.json`.
- Local validation commands listed above.

## Known Gaps

- This is a focused viewport polish change. It does not alter phase gates, approvals, evidence handling, persistence, or deliverable generation.
