# 2026-06-19-visual-director — Transformation PR4: Visual Director + the tree renderer (first real exhibits)

## Release ID

`2026-06-19-visual-director`

## Status

`candidate`

## Plain-English Summary

Transformation PR4 (depends on PR1–PR3). The first PR that emits **real exhibits** end-to-end. The
**Visual Director** turns a Story's exhibit plan into rendered SVGs: for each page it resolves the
exhibit type to a pipeline (model→engine adapter), renders a real SVG where one exists and the model
has the content, and otherwise emits a **gap-honest "exhibit pending" card** (never an empty or
fabricated visual). It **never throws** — a single bad exhibit degrades to a gap-card, the deck still
builds.

This PR wires the **value/economics family end-to-end (the Workforce Economics convergence)**: the
Value Model archetype now renders the estimate-twice **investment waterfall**, the **value tree**,
the **economics strip**, and the **decision scorecard** for real. It also adds the **tree renderer**
— the single biggest gap in the engine — which backs IssueTree / RootCauseTree / ValueTree /
DecisionTree (so Discover & Diagnose renders its issue + root-cause trees). The architecture / RACI /
org adapters remain gap-cards until the next PR (honestly flagged).

## Layer Impact

- **`global-control-lane`** — new `src/lib/deliverables/visual-director.ts` +
  `src/lib/visual-system/{tree-exhibit,gap-card,exhibit-adapters}.ts`. No schema, route, or runtime
  behavior change; not wired into the live generation path yet.

## Client Applicability

- All clients: **Yes** (shared engine), inert until wired. No feature flag, no client-specific
  behavior. Specific clients: No. Internal only: No. Public/demo only: No.

## Changes Included

- `src/lib/visual-system/tree-exhibit.ts` — NEW deterministic, gap-honest tree renderer (closes 4
  gap exhibit types).
- `src/lib/visual-system/gap-card.ts` — the honest "exhibit pending" placeholder.
- `src/lib/visual-system/exhibit-adapters.ts` — `MoveDecisionModel` → engine inputs (waterfall,
  economics strip, scorecard, value stack, value tree, claim/issue tree); each returns null when the
  model lacks content (→ gap-card, never fabricated).
- `src/lib/deliverables/visual-director.ts` — `renderStoryExhibits(story, model)` + `visualCoverage`.
- Tests: `tree-exhibit.test.ts` (5), `visual-director.test.ts` (8) + the PR3 suites still green.

## QA / Validation

- **PASS** — `jest`: 18/18 across the visual-system + visual-director suites (Value Model renders
  ValueWaterfall/ValueTree/KeyMessageCard/DecisionScorecard for real; MeasurementArchitecture
  degrades to a gap-card; Discover & Diagnose renders the issue + root-cause trees; an empty model
  degrades everything to gap-cards without throwing; the PR3 golden snapshots still pass).
- **PASS** — `tsc --noEmit` clean; `eslint` clean.
- **NOT-RUN (by design)** — no live/ACA path; the Visual Director output isn't wired into a
  deliverable render yet (PR5).

## Rollout Plan

Merge to `main` after PR3. No runtime effect. PR5 wires the rendered exhibits + the existing deck
shell into the deliverable renderer (PPTX primary, DOCX appendix).

## Rollback Plan

Revert the PR. Zero impact — no caller depends on it yet.

## Audit Evidence

- PR URL (added on open); CI run; the 18-test suite is the behavioral evidence.

## Known Gaps

- The architecture (layeredFlow/accountabilityMap/integrationMap/controlOverlay), RACI, org-model,
  governance, measurement, evidence-matrix, dependency-graph, and ownership adapters are not yet
  wired — those exhibit types render gap-cards (honestly flagged with the capability-map reason). The
  next PR adds them.
- `DecisionScorecard.referenceScore` is a relative FIT emphasis derived from the model's own
  recommendation (recommended vs rest) — presentational, not a measured client metric; it asserts no
  client-specific number. A real scoring input can replace it when available.
