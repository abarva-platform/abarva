# 2026-08-22-moves-gate-rationale-terminal-build — Moves Gate Rationale Terminal Build Wording

## Release ID

`2026-08-22-moves-gate-rationale-terminal-build`

## Status

`candidate`

## Plain-English Summary

Updates the Moves phase-gate approval rationale to match the actual sequencing: gate approval is submitted after required outputs reach terminal build status, not merely after outputs start. This keeps the persisted audit text aligned with the current governed batch behavior.

## Layer Impact

- Product layer: Moves gate-approval client wording and regression coverage only.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, tenant-data, or data-plane writes.

## Client Applicability

- All clients: Applies to Moves phase-gate approval rationale text.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Changes the phase-gate approval rationale from outputs being started to outputs reaching terminal build status.
- Adds regression coverage so the stale "outputs started" wording does not return.

## QA / Validation

Status: `passed`.

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx -t "supports the explorer, upload, aVa launcher, and gate ceremony interactions" --runInBand` — passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is audit text alignment with existing sequencing.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6666
- Local validation commands listed above.

## Known Gaps

- The full `MovesPhaseStandaloneClient` Jest suite still has unrelated existing failures around artifact URL expectations and older canary display-name assertions. This release validated the affected gate-ceremony path directly.
