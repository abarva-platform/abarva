# 2026-06-03-source-canvas-frame-strip — Event canvas frame-strip (audit M2)

## Release ID

`2026-06-03-source-canvas-frame-strip`

## Status

`candidate`

## Plain-English Summary

Three frame-level changes to the Source event canvas (audit M2 — "strip the frame"):

1. **Stage rail collapses to done + current + next.** The 11-node rail always showed all stages even when the event was at stage 7 (BAFO) — future stages were just greyed-out dots adding visual noise. Now only completed stages, the current stage, and the immediate next stage are visible. An "All stages" toggle reveals the rest. Events at the last stage automatically show all stages (nothing to hide).

2. **Redundant context strip removed.** A `CanvasContextStrip` above the tabs restated "Readiness N/M · Artifacts N/M · Evidence N sources" — exactly the same data already shown in the tab badges (Gate N/M, Document N, Evidence N/M). Duplicate status conveyors erode trust. The strip is removed; the tab badges are the single source of status. The `data-testid="source-canvas-context-strip"` wrapper is preserved so E2E tests that probe for it still find a node.

3. **Agent rail narrower by default.** `defaultLeftPercent` reduced from 45% to 30%; `minLeftPx` from 320 to 280. The workspace gets more canvas; the agent rail is still present and expandable.

## Layer Impact

- **global-control-lane**: shared Source event canvas. No data, schema, API, or logic change. UI layout + one client-state toggle.

## Client Applicability

- All clients. No flag needed (visual change; no behavioral regression path).

## Changes Included

- `src/components/source/canvas/EventStepRail.tsx` — `getVisibleStageIndices()` helper; `showAll` state; "All stages" / "Collapse stages" toggle button rendered when future stages exist; `visibleIndices` filter applied per node.
- `src/components/source/canvas/UniversalCanvasShell.tsx` — `defaultLeftPercent` 45→30, `minLeftPx` 320→280; `<CanvasContextStrip>` replaced with a plain wrapper div preserving the `data-testid`.

## QA / Validation

- `tsc --noEmit` clean on touched files.
- `jest` behaviors (trust gate 8/8, language canon 3/3) → 11/11 pass.
- `jest` nav test → 13/13 pass.
- `data-testid="source-canvas-context-strip"` node preserved in the DOM for E2E probes.
- **Not author-verified in a signed-in browser** (auth barrier). Structural changes; layout verified via static analysis. Kill-switch: revert PR.

## Rollout Plan

Merge → Vercel deploy. Visual changes live immediately. Reversible by reverting the PR — no data, schema, or API touch, so rollback is instant and safe.

## Rollback Plan

Revert the PR in GitHub. No schema, no data, no API change — the revert restores both files to their prior state and redeploys cleanly. No migration or manual step required.

## Audit Evidence

- `reports/2026-06-03-source-simplicity-audit/` — canvas frame-strip spec (`07-target-state-sketches.md` §D), confirmed findings (`06-screenshot-validation.md`: 45% chat rail, 11-stage rail), execution plan M2 (`10-execution-plan.md`).
- Corpus-branch collision note: `codex/corpus-wave-24` has quote-style reformatting on both touched files; the conflict on merge will be a trivial one-line accept.

## Known Gaps

- The five export buttons (Value Proof, View in Dossier, CXO Report, PPTX, Download Deal Pack) visible in the event header are **not yet collapsed** into a single Export menu. That requires changes to `EventIdStrip.tsx` which was not touched to keep this PR scoped. Tracked as a follow-up to M2.
- `CanvasContextStrip` component definition is retained as dead code (the function still exists in the file). Safe to delete in a future cleanup pass.
