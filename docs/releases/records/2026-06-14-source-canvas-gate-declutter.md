# 2026-06-14-source-canvas-gate-declutter — Calm "what we still need" rail; collapse the gate machinery

## Release ID

`2026-06-14-source-canvas-gate-declutter`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

The decluttered Source canvas right rail still showed the **full gate checklist** (every criterion,
mark-met buttons, promote, approve-with-gaps) expanded by default. A VP/Maestro/CXO opening a stage saw a
control panel, not "what do I need to do next." This change makes the default rail calm and Screen-1-consistent:

1. **New "What we still need" panel** — the default view. It lists the stage's *outstanding* gate criteria in
   plain language (title + one-line description), with a single "Add evidence in the Workspace" affordance.
   When nothing is outstanding it reads "Everything this stage needs is in. You're clear to advance."
2. **The full gate machinery is collapsed** behind a `Review & approve the gate · N / M cleared` toggle. It
   stays one click away — and "Open gate checklist" (the next-move card / `gate` target) now *expands* it and
   scrolls to it, instead of scrolling to an already-open wall of controls.
3. **A one-line footer** ("Everything else … lives in the Workspace") replaces the longer inline help block.

Net: the canvas leads with the next move + what to gather; the gate controls are available, not in your face.

## Layer Impact

- `global-control-lane`: presentation-only change to `UniversalCanvasShell`'s decluttered workspace
  (`SourceDeclutteredWorkspace`). New `NeedsToGatherPanel`; the inline `GateTab` is now rendered behind a
  collapse toggle (default closed). No schema, API, data-plane, or runtime-dependency change. The gate's
  behavior, criteria, and promotion logic are unchanged — only its default visibility.

## Client Applicability

- All clients: the decluttered rail leads with "what we still need" and collapses the gate by default.
- Specific clients: SkyHarbor — where the cluttered rail was flagged live by the founder.
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated by `workspace_explorer_source` (the decluttered canvas). With the flag off, the legacy
  tabbed workspace is unchanged.

## Changes Included

- `UniversalCanvasShell.tsx`: `SourceDeclutteredWorkspace` now renders `NeedsToGatherPanel` (outstanding gate
  criteria in plain language) + a collapsible gate (`source-canvas-gate-toggle`, default closed) wrapping the
  existing `GateTab`; `runNextMoveTarget("gate")` sets the gate open before scrolling. New `NeedsToGatherPanel`
  component + supporting style tokens; import `criterionById` / `SourceGateCriterion` from canonical-specs.
- `source-event-canvas-render.test.tsx`: the declutter test now asserts the calm panel + collapsed gate
  (`source-canvas-needs-to-gather`, `source-canvas-gate-toggle`, no expanded `source-canvas-gate-blockers`).

## QA / Validation

- PASS: `npx eslint` clean on the changed component · `tsc --noEmit -p tsconfig.json` clean (no errors
  attributable to this change; pre-existing missing optional deps `@azure-rest/ai-document-intelligence`,
  `@axe-core/playwright` are present in CI).
- PASS: `jest source-event-canvas-render + source-canvas-gate-tab` — 43/43.
- Pending: live re-check on ACA — default rail shows "What we still need" + collapsed gate; "Open gate
  checklist" expands and scrolls to the gate.

## Rollout Plan

Merge → CI → rebuild image (`az acr build`) → `containerapp update --revision-suffix` → shift 100% traffic →
open a SkyHarbor event and confirm the calm rail + the collapse toggle behavior.

## Rollback Plan

Revert the PR — restores the always-expanded inline gate and the prior help copy. No data/schema to unwind;
the feature flag also gates the whole decluttered surface.

## Audit Evidence

PR diff (decluttered workspace + new panel + collapse toggle + test + this record), CI checks, local
eslint/tsc/jest output, and the live screenshots the founder flagged (the cluttered right rail showing the
full file/criteria list) that motivated the change, plus the post-deploy screenshot of the calm rail.

## Known Gaps

- "What we still need" is derived from gate-criterion titles/descriptions (the best available signal). It is
  not yet a bespoke "evidence to gather" model — criterion phrasing is gate-oriented, not procurement-task
  oriented. A future pass could map each outstanding criterion to a concrete artifact/upload action.
- The Document Explorer's own item list (`/workspace`) is a separate surface and is not decluttered by this
  change; if its "All items N" list also reads as a file dump, that is a follow-up there.
