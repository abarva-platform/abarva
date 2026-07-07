# 2026-06-14-source-canvas-declutter-followup — Remove the redundant "what we still need" panel

## Release ID

`2026-06-14-source-canvas-declutter-followup`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Follow-up to `2026-06-14-source-canvas-gate-declutter` (#3506). Live verification showed the new
"What we still need" panel **duplicated** the Next-move card: the Next-move card already names the outstanding
items in plain language ("Clear sponsor sign-off, value target, archetype") with its own "0 of 3 cleared to
advance" line. Two lists of the same three items read as *more* clutter, not less.

This removes the separate panel. The decluttered right rail is now:

1. **The Next-move card** — the single calm "what to do / what to gather" focal point (unchanged).
2. **A collapsed "Review & approve the gate · N / M cleared" toggle** — the full gate machinery (criteria,
   mark-met, promote, approve-with-gaps) stays one click away; "Open gate checklist" expands + scrolls to it.
3. **A one-line footer** pointing to the Workspace for documents/evidence/vendor responses.

Net: one "what to gather" surface (the Next-move card), gate machinery collapsed. The gate-collapse behavior
shipped in #3506 is retained; only the duplicate panel is removed.

## Layer Impact

- `global-control-lane`: presentation-only change to `UniversalCanvasShell`'s `SourceDeclutteredWorkspace` —
  removes the `NeedsToGatherPanel` component, its styles, and the `criterionById` import; keeps the collapsed
  `GateTab` + toggle. No schema, API, data-plane, or runtime-dependency change.

## Client Applicability

- All clients: the decluttered rail no longer shows a duplicate "what we still need" list.
- Specific clients: SkyHarbor — where the duplication was seen live.
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated by `workspace_explorer_source`.

## Changes Included

- `UniversalCanvasShell.tsx`: remove `NeedsToGatherPanel` + `GATHER_*` styles + the `criterionById` /
  `SourceGateCriterion` import; `metCount` now computed directly from the criteria; the collapsed gate toggle
  and footer remain.
- `source-event-canvas-render.test.tsx`: the declutter test now asserts the Next-move card ("Next move") +
  collapsed gate toggle, and no longer expects the removed panel.

## QA / Validation

- PASS: `npx eslint` clean · `tsc --noEmit -p tsconfig.json` clean (only pre-existing missing optional deps).
- PASS: `jest source-event-canvas-render + source-canvas-gate-tab` — 43/43.
- Live: verified on ACA (SkyHarbor event) — rail shows the Next-move card + a collapsed "Review & approve the
  gate · 0 / 3 cleared ▸" toggle; gate blockers not rendered until expanded.

## Rollout Plan

Merge → CI → rebuild image (`az acr build`) → `containerapp update --revision-suffix` → shift 100% traffic →
confirm the single "what to gather" surface + collapsed gate on a SkyHarbor event.

## Rollback Plan

Revert the PR — restores the duplicate panel from #3506. No data/schema to unwind; the flag also gates the
whole decluttered surface.

## Audit Evidence

PR diff (panel removal + test + this record), CI checks, local eslint/tsc/jest output, and the live screenshot
showing the Next-move card already listing the three items (the duplication that motivated the removal).

## Known Gaps

- The Document Explorer's own item list (`/workspace`) is a separate surface and is unchanged by this work.
- "What to gather" still derives from gate criteria via the Next-move card; a bespoke evidence-task model
  (mapping each criterion to a concrete upload action) remains a future enhancement.
