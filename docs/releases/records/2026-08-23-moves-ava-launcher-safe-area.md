# 2026-08-23-moves-ava-launcher-safe-area — Moves aVa Launcher Safe Area

## Release ID

`2026-08-23-moves-ava-launcher-safe-area`

## Status

`candidate`

## Plain-English Summary

Adds bottom breathing room to the Moves phase workspace so the fixed `Ask aVa` launcher does not cover the lower gate checklist or approval content while a user reviews the final step.

## Layer Impact

- Product layer: Moves UI layout polish only.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, tenant-data, or data-plane writes.

## Client Applicability

- All clients: Applies to the Moves phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reserves additional bottom safe area in the Moves workspace shell.
- Positions the fixed aVa launcher and popover with browser safe-area inset support.
- Adds a regression test for the launcher safe-area styling contract.

## QA / Validation

Status: `pass`.

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand -t "reserves bottom safe area"`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pending rerun: `npm run release:check`
- Note: Full `MovesPhaseStandaloneClient.test.tsx` still has 4 unrelated assertion failures in existing tests; the new launcher safe-area regression passes.

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Determined by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, visual confirmation on a signed-in Moves phase page after deploy.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6680
- Local validation commands listed above.

## Known Gaps

- This is a focused viewport polish change. It does not alter phase gates, approvals, evidence handling, persistence, or deliverable generation.
