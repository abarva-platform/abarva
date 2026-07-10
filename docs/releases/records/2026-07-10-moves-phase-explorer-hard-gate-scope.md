# 2026-07-10-moves-phase-explorer-hard-gate-scope — Fix conflicting gate-criteria counts

## Release ID

`2026-07-10-moves-phase-explorer-hard-gate-scope`

## Status

`candidate`

## Plain-English Summary

The phase explorer sidebar shipped earlier today (`2026-07-10-moves-phase-explorer-sidebar`, PR
#4667) tallied *all* gate criteria (hard + soft), matching Source's `CanvasGateSidebar` convention.
Live-checking it surfaced a real inconsistency: the current phase's own "Meet the gate criteria"
tile on the same page counts *hard-severity* criteria only (soft criteria don't block advancement)
— so a Move at P3 showed "0 of 4" in the new sidebar right next to "0 of 2 met" in the existing
gate tile. Both numbers were individually correct, but two different "gate criteria" counts on one
screen reads as a bug, not a feature — the opposite of the deterministic clarity this sidebar was
built for. This release scopes the sidebar's tallies to hard-severity criteria only, exactly
mirroring `buildPhaseWorkflow`'s existing scoping (hard criteria, falling back to the full set
when a phase has none), so the sidebar and the gate tile can never disagree again.

## Layer Impact

- `global-control-lane`: same files as the original sidebar release — no new surface, a scoping
  fix inside the tally computation only.

## Client Applicability

- All clients: yes — no flag, matching the parent release.

## Changes Included

- `src/lib/programs/phase-explorer-tallies.ts`: added a `hardScope()` helper (hard criteria if any
  exist, else the full set) and applied it to every phase's total/met computation — done, current,
  and upcoming.
- `src/lib/programs/__tests__/phase-explorer-tallies.test.ts`: updated the current-phase test to
  the new hard-scoped expectation; added a fallback-to-full-set test; updated the upcoming-phase
  test to compute its expected total via the same hard-scope logic instead of raw criteria count.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: the client-safe fallback
  projection (used only if a caller omits the `phaseTallies` prop) gained the identical hard-only
  scoping, so the fallback path can never disagree with the server-computed path either.

## QA / Validation

- `npx eslint` on all changed files: PASS — 0 errors (isolated git worktree off `origin/main`,
  symlinked `node_modules`).
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .`: PASS — 0 errors, same worktree.
- `npx jest`: PASS — 4 suites, 25 tests (the tally-helper suite grew from 4 to 5 tests to cover the
  new fallback-to-full-set case; the 3 other suites touching this component still pass unchanged).
- Live post-deploy visual check: NOT YET RUN — pending merge/deploy. Plan: reload CANARY's P3 page
  and confirm the sidebar's "Design" row now reads the same total as the "Meet the gate criteria"
  tile beside it (both hard-scoped).

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → reload
CANARY's P3 phase page and confirm the sidebar tally for "Design" now matches the on-screen gate
tile's "N of M met" number exactly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see Rollout Plan.

## Rollback Plan

Revert the commit. Pure scoping-logic change inside a pure function and its client-side fallback
mirror; no data, migration, or flag impact.

## Audit Evidence

- Direct live comparison on CANARY's P3 page immediately after the parent release deployed:
  sidebar showed "0 of 4" for "Design" (current phase) while the adjacent gate-readiness tile
  showed "0 of 2 met" for the identical phase — confirmed as a real scoping mismatch, not a display
  glitch, by reading `buildPhaseWorkflow` in `phase-templates/phase-workflow.ts` (hard-only, with a
  full-set fallback) and comparing it to the sidebar's original all-criteria tally.
- Decision to match the hard-only scope (rather than change the existing gate tile to show all
  criteria) was made because the hard-only number is the one that actually gates advancement — the
  number a user needs when deciding "can I move forward" — matching the same audit thread as
  `2026-07-10-moves-phase-explorer-sidebar` (PR #4667) and `2026-07-10-moves-evidence-workbench-
  card-depth` (PR #4666).

## Known Gaps

- None identified for this specific scoping fix. The broader Known Gaps from the parent sidebar
  release (PhaseRail left in place, narrow-viewport hide-not-collapse, criteria-count vs.
  completion-prediction distinction) still apply unchanged.
