# 2026-07-05-moves-list-lifecycle-progress — Lifecycle % complete on the Moves list

## Release ID

`2026-07-05-moves-list-lifecycle-progress`

## Status

`candidate` — verified live on the Moves list before merge.

## Plain-English Summary

Adds a portfolio-level **% complete** to the Moves list: under each Move's phase
label, a small live progress meter shows how far the Move has advanced through the
five delivery phases — P0 = 0%, P1 = 20%, … P5 (→ Tower) = 100%. It's derived
from the Move's `currentPhase`, so it's always current, and it gives an at-a-glance
read of progress across the whole portfolio. Per-phase gate detail stays in the
phase workbench.

## Layer Impact

- `global-control-lane`: the shared Moves list (`MoveListTable`) + a pure helper
  (`moveLifecyclePct`). Presentation only; no data or route change.

## Client Applicability

- All clients: yes — every tenant's Moves list.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/move-list-format.ts` — `moveLifecyclePct(move)`
  (`clamp(currentPhase,0,5)/5 → %`), pure/tested.
- `src/components/strategic-moves/MoveListTable.tsx` — a live progress meter under
  the phase label (hidden for archived rows).
- `src/components/strategic-moves/StrategicMoves.module.css` — meter styles
  (design-system tokens).
- `src/components/strategic-moves/__tests__/move-list-format.test.ts` — regression
  test for the helper.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `jest move-list-format` → **PASS** (8/8, incl. new). `tsc` + `eslint` clean.
- Live proof before merge: the Moves list shows the meter with the correct % per
  Move (e.g. a P2 Move reads 40%).

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy".
- Shared runtime mutators: none.
- Live signed-in proof required: yes — meter renders the correct %.

## Rollback Plan

Revert the PR. Presentation-only; no data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: jest + tsc + eslint clean.

## Known Gaps

- Per-phase gate % on the rail and the overview-header rollup are follow-ups; this
  slice covers the list. The workbench already shows the current phase's gate %.
