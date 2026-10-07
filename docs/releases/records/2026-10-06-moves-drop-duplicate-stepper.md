# 2026-10-06-moves-drop-duplicate-stepper — One phase navigator on the capture Steps view

## Release ID

`2026-10-06-moves-drop-duplicate-stepper`

## Status

`candidate`

## Plain-English Summary

On the Steps view of a Move phase, two phase navigators rendered at once: the
legacy top gate stepper (per-phase gate-criteria counts, e.g. "3 of 3 gate
criteria", in the older light style) sat directly above the redesigned capture
flow's own phase bar (per-phase answered counts, e.g. "0 of 11 answered"). They
show different data, but two stacked phase menus — one old-styled, one new —
read as a contradiction and as an unfinished redesign.

This drops the legacy stepper on the Steps view when the capture composition is
active, so the capture flow's phase bar is the single navigator there. The
stepper still renders on Files, Intelligence, and Approvals, where the capture
bar does not render and it is the only phase navigator. Per-phase gate-criteria
status remains available in the Approvals tab (and, for an already-advanced
phase, in the gate-met notice). No gate, save, capture, or navigation behavior
changes — navigation on the Steps view is carried by the capture bar, which is
already clickable, tick-marked, and disabled-when-unreachable.

It is gated on the same `moves_capture_composition_v1` condition that already
drops the duplicate stage head (title/question/lede), so with that flag off the
page renders exactly as before.

## Layer Impact

Release lane: `global-control-lane` — shared Moves phase-workspace UI. No data,
schema, gate, or persistence change.

- `4 PRODUCTS` / Moves: the phase workspace renders one phase navigator on the
  Steps view instead of two.

## Client Applicability

- Workspaces with `moves_capture_composition_v1` active: the Steps view shows a
  single phase navigator.
- All other workspaces (flag off): unchanged.
- Internal only: No. Public/demo only: No. Feature flag: rides the existing
  composition flag; no new flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the legacy
  `MovePhaseTopStepper` is suppressed when `captureCompositionActive` and the
  workspace view is the phase (Steps) view.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — two tests: stepper absent on Steps with composition on and present on
  Approvals; stepper kept on Steps when the composition flag is off.

## QA / Validation

- `jest` (MovesPhaseStandaloneClient) — **PASS**: 214/214 (two added).
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` (changed files) — **PASS**: 0 errors.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next web image via the repo-owned
`aca-main-deploy` workflow. No new flag.

## Rollback Plan

Revert the PR. The legacy stepper renders on the Steps view again. No data or
migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret. The change performs no writes.

## Known Gaps

- The stepper and the capture bar still surface different measures (gate
  criteria vs answered). This change removes the visual duplication on the Steps
  view; a future option is to fold gate-criteria status into the capture bar so
  one navigator carries both.
- Host rendering is exercised by the added tests; the CSS-level stacking is not
  separately snapshotted.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.
