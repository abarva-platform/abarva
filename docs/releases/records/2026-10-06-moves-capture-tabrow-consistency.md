# 2026-10-06-moves-capture-tabrow-consistency — One workspace tab row, consistent position across views

## Release ID

`2026-10-06-moves-capture-tabrow-consistency`

## Status

`candidate`

## Plain-English Summary

On a Move's phase page, the workspace tab row (Steps · Files & Evidence ·
Intelligence · Approvals) jumped position depending on which view was open. On
the Steps view the composition polish moved the tab row *into* the capture
workspace (below the "Paste client notes" area), where it sat lower and was
partly clipped; on Files & Evidence and Intelligence it sat higher, in the
shared shell below the phase rail. Same tab row, two different places — a layout
defect, not an intentional difference.

This renders the tab row in **one place — the shared shell, above the workspace
— for every view**, so its position is identical whether you are on Steps or any
other tab, and nothing clips it. The tab row's styling and switching behavior are
unchanged; only its placement on the Steps view is corrected. The other
composition-polish behavior (the stage head no longer repeating the phase title
the capture flow already states) is preserved.

## Layer Impact

Release lane: `global-control-lane` — shared Moves capture presentation. Renders
where `moves_capture_v2` (+ `moves_capture_composition_v1`) are on.

- `4 PRODUCTS` (Moves): presentation only. The tab row is always rendered in the
  shell; the capture workspace is no longer handed a tab row. No capture field,
  key, save, gate, evidence, or switching behavior changes.

## Client Applicability

- All clients: No — renders only where `moves_capture_v2` is on.
- Specific clients: the demo tenant used for the signed-in review.
- Internal only: No.
- Public/demo only: No.
- Feature flag: rides the existing `moves_capture_v2` /
  `moves_capture_composition_v1` (no new flag).

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — always render
  the tab row in the shell (drop the composition branch that moved it into the
  dock workspace on the Steps view); stop passing a tab row to the capture
  workspace.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — update the composition tab-row test to assert one tab row rendered in the
  shell (not inside the dock), still switching surfaces.

## QA / Validation

- `jest` (`MovesPhaseStandaloneClient`) — **PASS**: 212/212.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors (2 pre-existing unused-var warnings, unrelated).
- Signed-in visual walk — **NOT RUN** here; this fixes a defect the signed-in
  walk surfaced (tab row position/clipping on the Steps view). Confirmed by the
  updated component test and re-walk.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag change.

## Rollback Plan

Revert the PR — a presentation-only placement change; reverting restores the
prior (defective) behavior. No data or migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- No signed-in proof captured here; the re-walk confirms it. Part of the 3-day
  E2E smoke test.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.
- The one-tab-row-in-the-shell behavior is covered by the updated composition
  test in `MovesPhaseStandaloneClient.test.tsx`.
