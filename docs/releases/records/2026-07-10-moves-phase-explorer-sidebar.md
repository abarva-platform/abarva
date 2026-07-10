# 2026-07-10-moves-phase-explorer-sidebar — Persistent left phase journey for Moves

## Release ID

`2026-07-10-moves-phase-explorer-sidebar`

## Status

`candidate`

## Plain-English Summary

Source was designed with a persistent left-side "explorer" — a Stripe-style deterministic step
list showing every stage at once with a live met/total tally, so progress and what's left are
never a guess (`CanvasGateSidebar.tsx`). Moves never got the equivalent: its only phase indicator
is `PhaseRail`, a thin horizontal row of dots (phase-level only, no tallies, no persistent view of
the whole journey). This release adds `MovePhaseExplorer` — a new persistent left sidebar, mounted
on every Move's phase page, listing P0 through P5 (+ the Tower handoff) with a real "met of total"
gate-criteria tally per phase: phases already completed show fully met (they couldn't have
advanced otherwise), the current phase shows its live, real gate-criteria count, and phases not
yet reached show 0 of their canonical total. Completed phases are clickable (jump back to review);
the current and future phases are not links, since you cannot skip ahead — the page already
redirects that attempt with an explanation banner.

Totals come from the exact same canonical gate-rule catalog (`governance.gateCriteriaForPhase`)
that the gate-approval flow evaluates against, computed server-side in the phase page and passed
down as a plain prop — so the explorer can never fabricate a count or drift from what actually
gates advancement. The existing horizontal `PhaseRail` is left in place (not removed) as a
secondary compact indicator; this is intentionally additive, not a replacement, to keep the change
scoped and low-risk.

## Layer Impact

- `global-control-lane`: every Move's phase page, for every tenant — no flag, no tenant gate.
  `MovePhaseExplorer` is a new, self-contained component; `StrategicMovePhaseClient`'s layout gained
  a wrapping flex row (sidebar + existing content), and the phase page now computes and passes one
  new prop. No existing prop, class name, or behavior was removed.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag. Shipped straight to all tenants per
  explicit direction (this is a core navigation fix, not an experiment).

## Changes Included

- `src/lib/programs/phase-explorer-tallies.ts` (new): `getMovePhaseTallies(move)` — pure,
  deterministic per-phase tally rows, server-only (imports `governance.gateCriteriaForPhase`).
- `src/lib/programs/__tests__/phase-explorer-tallies.test.ts` (new): 4 tests covering completed /
  current / upcoming phase tally logic and full-journey row ordering.
- `src/components/strategic-moves/MovePhaseExplorer.tsx` (new): the sidebar component. Completed
  phases render as `Link`s; current/upcoming render as plain rows (not clickable).
- `src/components/strategic-moves/MovePhaseExplorer.module.css` (new): scoped styles using the
  same locked design tokens (`#f8f7f4` ground, Georgia headings, black active state) as
  `EvidenceWorkbench.module.css`.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`: computes
  `getMovePhaseTallies(move)` server-side, passes as the new `phaseTallies` prop.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: accepts the optional
  `phaseTallies` prop (with a client-safe fallback projection if omitted, so the explorer never
  fabricates a count even without the prop); mounts `<MovePhaseExplorer>` as a persistent left
  column, sibling to the existing `AgentDock`/workspace content, for both the active-phase
  workbench view and the completed-phase summary view.
- `src/components/strategic-moves/StrategicMoves.module.css`: two new layout classes
  (`.phaseBody` flex row, `.phaseBodyMain` flex:1) wrapping the existing content; no existing
  class changed.

## QA / Validation

- `npx eslint` on all changed/added files: PASS — 0 errors (re-run in an isolated git worktree off
  `origin/main` with a symlinked `node_modules`, not just the local working tree).
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .`: PASS — 0 errors, same isolated
  worktree.
- `npx jest` — 4 test suites, 24 tests, all PASS: the new tally-helper suite (4 tests) plus the 3
  existing `StrategicMovePhaseClient`/phase-capture suites that touch this component (20 tests),
  confirming no regression to existing capture/workbench/upload-guidance behavior.
- Live post-deploy visual check: NOT YET RUN — pending merge/deploy. Plan: open a real Move at
  P0 (sidebar should show P0 as current, P1–P5 upcoming with "0 of N"), then a Move mid-journey
  (should show completed phases as clickable/done, current phase's live tally, later phases
  upcoming), on at least two different tenants.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → open Move
phase pages across at least two tenants and multiple phases (P0, mid-journey, P5) and confirm the
sidebar renders with correct tallies and that completed-phase links navigate correctly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none — no flag introduced.
- Live signed-in proof required: yes — see Rollout Plan.

## Rollback Plan

Revert the commit. No migration, no data mutation, no flag to unwind — purely additive
UI/component/prop changes; `PhaseRail` and all pre-existing behavior are untouched, so a revert
returns exactly to the prior UI with zero cleanup.

## Audit Evidence

- Investigated via a subagent that read `CanvasGateSidebar.tsx` (Source) and `PhaseRail.tsx`
  (Moves) side by side and confirmed: Source's sidebar shows all stages + per-stage gate tallies
  (driven by a stage-order array + a flat gate-criteria list — not Source-specific); Moves'
  `PhaseRail` shows phase-level dots only, no tallies, no persistent journey view.
- This release adapts that exact pattern (stage-order → `PHASE_LABELS_SHORT`/`TOTAL_PHASES`;
  gate-criteria list → `gateCriteriaForPhase` per phase + `move.gateCriteria` for the live phase)
  rather than inventing a new one.
- Builds directly on the same-day `2026-07-10-moves-evidence-workbench-card-depth` release (PR
  #4666) — both are part of the same Moves phase-workspace polish/parity thread this session.

## Known Gaps

- `PhaseRail` (the horizontal dot row) is left in place, not removed — the sidebar is additive.
  Whether to retire the horizontal rail now that the sidebar exists is a follow-up call, not made
  here, to keep this change's blast radius small.
- The sidebar hides below 900px viewport width (`@media (max-width: 900px)`) rather than
  collapsing into a compact/expandable form — narrow-viewport treatment is a follow-up, not
  addressed in this release.
- Per-phase totals for phases not yet reached come from the canonical gate-rule catalog
  (`gateCriteriaForPhase`), which is accurate for total criteria count but does not attempt to
  predict which of those criteria will end up hard vs. soft-waived by the time that phase is
  actually reached — the tally is a criteria-count, not a completion prediction.
