# 2026-08-20-moves-phase-reachability-status — Moves Phase Reachability Status

## Release ID

`2026-08-20-moves-phase-reachability-status`

## Status

`candidate`

## Plain-English Summary

Moves now explains a blocked future-phase request instead of silently landing the user on an earlier phase. The phase workspace also shows one above-fold phase story with current inputs, gate state, remaining blockers, next action, and artifact status.

## Layer Impact

Layer 4 Products: Updates the Moves product projection and navigation shell only. No canonical data, tenant input, adapter output, data-plane state, or runtime routing contract is changed.

## Client Applicability

- All clients: Moves users receive the clearer phase navigation and status behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Adds a shared Moves phase-navigation status helper used by the route guard and the rendered page status.
- Redirects future phase requests back to the current phase with a reviewable blocked-phase query parameter.
- Shows a blocked-phase callout with why the phase is blocked, required versus optional remaining items, and the primary next action.
- Reworks the phase progress card into one phase story covering inputs, workflow, gate, stage, remaining blockers, next action, and artifact status.

## QA / Validation

- `npx jest src/lib/programs/__tests__/phase-navigation-status.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 70 tests.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow will publish the product UI change.

## Deployment Authority

- Repo-owned deploy workflow: Yes.
- Shared runtime mutators: None outside the repo-owned main deploy.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Verify after deploy if runtime proof is requested.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Recommended for the affected Moves phase workspace.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

- Focused Jest command listed above.
- PR, CI, deploy, and optional signed-in proof to be attached after publication.

## Known Gaps

This release does not persist workbook proposal sets or accept/reject workbook responses. That remains the next governed-workbook slice.
