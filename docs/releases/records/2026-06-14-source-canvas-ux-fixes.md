# 2026-06-14-source-canvas-ux-fixes — Next-move button routing + remove context-free Deliverables nav

## Release ID

`2026-06-14-source-canvas-ux-fixes`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Fixes three UX issues found walking the live Source canvas as a CXO:

1. **"Open gate checklist" wrongly triggered an "Advance this event?" confirm.** The decluttered canvas's
   next-move card hardwired its primary button to the advance handler, ignoring the action's target. Now it
   routes by target: advance → advance; gate → smooth-scroll to the gate checklist that already lives inline
   on the canvas; document/evidence → the Document Explorer.
2. **"Open document workspace" did nothing.** The secondary handler only matched `gate`/`evidence`, so the
   `document` target was a no-op. It now routes through the same target router and opens the Document Explorer.
3. **"Deliverables" removed as a top-nav destination.** Generating a deliverable detached from any event is
   the context-free anti-pattern the Workspace reset replaces; deliverables are generated in-event-context
   via the event's Generate chip + the per-event Workspace. The standalone route still exists; it is just no
   longer a confusing top-nav entry point.

## Layer Impact

- `global-control-lane`: `UniversalCanvasShell` decluttered-canvas next-move routing + a scroll anchor on the
  inline gate; `SourceSubNav` drops the Deliverables tab. No schema, API, or runtime-dependency change.

## Client Applicability

- All clients: the two next-move buttons now behave correctly; the Deliverables top-nav tab is gone.
- Specific clients: SkyHarbor — where the broken buttons + context-free tab were found live.
- Internal only: None.
- Public/demo only: None.
- Feature flag: the decluttered canvas is behind `workspace_explorer_source`.

## Changes Included

- `UniversalCanvasShell.tsx`: `runNextMoveTarget(target)` router for the decluttered next-move card (primary
  + secondary); `id="stage-gate-checklist"` anchor on the inline GateTab; import the target type.
- `SourceSubNav.tsx`: remove the `deliverables` tab from `SOURCE_SUBNAV_TABS_V2`.

## QA / Validation

- PASS: `npx eslint` clean on both files · `tsc --noEmit` clean for both files (3 remaining errors are
  pre-existing missing optional deps in unrelated files — `@azure-rest/ai-document-intelligence`,
  `@axe-core/playwright` — present in CI).
- Pending: live re-click on ACA — "Open gate checklist" scrolls to the gate (no advance confirm); "Open
  document workspace" opens the Explorer; Deliverables tab absent.

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift 100% traffic → re-click the two buttons + check nav.

## Rollback Plan

Revert the PR — restores the prior button wiring and the Deliverables tab. No data/schema to unwind.

## Audit Evidence

PR diff (canvas routing + subnav + this record), CI checks, local eslint/tsc output, and the live screenshots
(the "Advance this event to Open gate checklist?" browser confirm; the dead "Open document workspace" button;
the context-free Deliverables page) that motivated each fix.

## Known Gaps

- Deeper decluttering of the gate section (collapse the full checklist/promotion controls until needed) and
  the standalone `/source/deliverables` page's eventual removal/repurpose remain follow-ups.
