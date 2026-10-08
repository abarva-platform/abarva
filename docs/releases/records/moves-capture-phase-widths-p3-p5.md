# 2026-10-08-moves-capture-phase-widths — Per-phase section widths for the v2 capture grid (P3-P5)

## Release ID

`2026-10-08-moves-capture-phase-widths`

## Status

`candidate`

## Plain-English Summary

The v2 capture grid (shipped in the prior change) pairs short questions two-per-row and
lets structured editors span full width. But in the heavier phases — P3 Design, P4
Roadmap & Business Case, P5 Mobilize & Handoff — several questions carry long or tabular
answers (a 30/60/90 roadmap, the business case, the funding ask, a RACI/owner matrix, a
metrics table). Those were rendering as tall, cramped half-columns, and in a couple of
steps a wide section left an empty half-cell beside its partner.

A design review set a per-phase width for each section so that every 2-3 question step
resolves to a clean rectangle: a section is full-width when its answer is tabular,
multi-part, or a long narrative; short comparable prose stays paired side-by-side; and a
wide section only ever leads or trails its step (never strands a lone half-cell).

This is applied through the `sectionSpan` hint the grid already exposes — no change to the
grid CSS, the data contract, autosave, gates, or evidence. P1/P2 are unchanged.

## Layer Impact

- `global-control-lane` (presentation only): a new pure width-policy module
  (`src/lib/programs/moves-capture-section-width.ts`) and one `sectionSpan` prop wired at
  the `MovesCaptureFlow` mount in `MovesPhaseStandaloneClient`. No data, gate, or contract
  change. Width hints only take effect under the v2 capture flag.

## Client Applicability

- All clients: No (gated).
- Specific clients: No new identity logic.
- Internal only: No.
- Public/demo only: Effectively yes today — v2 capture is flag-gated.
- Feature flag: `moves_capture_v2` / `moves_workspace_v2`.

## Changes Included

- `src/lib/programs/moves-capture-section-width.ts` (new): `PHASE_WIDE_CAPTURE_SECTIONS`
  (the reviewed wide set for P3/P4/P5) + `captureSectionSpan(phase, section)` — a
  structured editor is always wide; a listed section is wide; everything else is
  single-column. Never returns "default" for a structured section.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: import and use
  `captureSectionSpan` in the capture `sectionSpan` prop (five added lines, one import).
- `src/lib/programs/__tests__/moves-capture-section-width.test.ts` (new): pins each
  phase's verdicts, the structured-always-wide floor, map-keys-exist, and THE design
  invariant — every P3/P4/P5 step resolves to a clean rectangle (no maximal run of
  single-column cells has odd length), which also catches a future question reorder.
- `docs/architecture/test-ci-coverage-census.json`: refreshed (covered +2 — absorbs a
  pre-existing 1-file drift on main plus this PR's one new suite; uncovered unchanged).

## QA / Validation

- `eslint` (0 new problems; 2 warnings pre-exist on main, confirmed by in-tree base lint),
  `tsc --noEmit` clean.
- `jest` new suite: 15/15 incl. the clean-rectangle invariant across all 9 P3-P5 steps.
- `jest` host + capture suites (MovesPhaseStandaloneClient, MovesCaptureFlowGrid,
  MovesCaptureFlowRouteSteps): 270/270 pass.
- Static harness rendered with the exact grid CSS: P4 "The case" (two business-case
  fields full-width stacked) and P5 "Go live" (heavy plan leading, clean pair below) —
  no orphan half-cells. Screenshots captured.
- `release:check` expected PASS (record added).

## Rollout Plan

Merge to main via squash; ships with the next normal web image build. Renders only under
the v2 capture flag. No migration, no env/flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: n/a (no runtime image change here).
- ACA runtime invariant / Worker image invariant: unaffected.
- Feature/env flag update path: none; uses existing `moves_capture_v2`.
- Live signed-in proof required: at next deploy, confirm P3-P5 capture steps render the
  reviewed widths for a flag-enabled tenant. Not claimed `live-proven` by this record.

## Rollback Plan

Revert the commit. The policy module is additive and the host change is one prop; reverting
restores the universal grid default (structured wide, plain single-column) with no data or
contract impact.

## Audit Evidence

- PR URL: (added on open)
- CI: lint + typecheck + lib/programs & strategic-moves jest suites.
- Screens: P4 "The case" + P5 "Go live" static-harness renders.

## Known Gaps

- P1/P2 widths were not part of this review; they keep the component default. If a later
  review wants them tuned, add their entries to `PHASE_WIDE_CAPTURE_SECTIONS` and extend
  the invariant test to those phases.
- The width policy keys on the current fixed step order; the invariant test fails loudly if
  a future question reorder would strand a half-cell, prompting a re-review.
