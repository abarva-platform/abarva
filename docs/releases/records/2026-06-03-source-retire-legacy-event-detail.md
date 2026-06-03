# 2026-06-03-source-retire-legacy-event-detail — Retire the superseded legacy Source event-detail component

## Release ID

`2026-06-03-source-retire-legacy-event-detail`

## Status

`candidate`

## Plain-English Summary

The Source event canvas was rebuilt some time ago on `UniversalCanvasShell`, but the old 2,292-line `SourceEventDetailPage.tsx` component was left behind. It is **not rendered by any route** (the `/source/events/[eventId]` route imports `UniversalCanvasShell`; the route's default export merely shares the name). It was kept alive only by a suite of integration tests that asserted on its *file contents* — so it was reporting "coverage" for UI a user can never reach.

This change retires the dead component and the tests that pinned it. It removes a large concentration of internal-jargon leaks the simplicity audit flagged (the legacy file held most of the `deterministic` / `PAT_SRC` usages) and deletes false coverage. No user-facing behavior changes — the component was already unreachable.

## Layer Impact

- **global-control-lane**: dead-code removal in the shared app. No runtime path changes (the component was unrendered). No schema/RLS/data change.

## Client Applicability

- All clients: no behavior change (unreachable code removed).
- Feature flag: none.

## Changes Included

- **Deleted** `src/components/source/SourceEventDetailPage.tsx` (2,292 LOC, no module importers; unrendered).
- **Deleted** 5 content-assertion test suites that read the dead file: `source-src42-commercial-canvas-tabs`, `source-src43-pricing-completeness-drilldown`, `source-src44-bafo-scenario-compare`, `source-src45-transition-readiness`, `source-src46-award-decision`.
- **Edited** `programs-detail-prog23-source-link.test.ts` — removed the dead-component block; kept the live `ProgramDetailPage` + `buildProgramSourceLinkView` coverage; fixed two pre-existing single-vs-double-quote assertion failures while in the file.
- **Edited** `src/__tests__/hygiene/shell-v2-mode-layout.test.ts` — removed the dead file from its Rule 1/3/4 surface lists.

## QA / Validation

- `npx tsc --noEmit` → clean on touched files (one pre-existing unrelated `@axe-core/playwright` dev-type error remains on main).
- `jest programs-detail-prog23-source-link` → **14/14 pass**.
- `jest shell-v2-mode-layout` → 20/21; the one failure (`Rule 5 — AppTopBar nav labels`) is **pre-existing on origin/main** and untouched by this change.
- No dangling references to the deleted component (grep + tsc).

## Rollout Plan

Merge to main → Vercel deploy. No runtime path change.

## Rollback Plan

Revert the PR; the component returns from git history. Safe (it was unreachable).

## Audit Evidence

- Audit source: `reports/2026-06-03-source-simplicity-audit/` — "two parallel event-detail implementations" finding (`03-clutter-inventory.md` S3), execution plan M1 (`10-execution-plan.md`).
- PR URL: _to be filled on push_

## Known Gaps

- **Feature gap surfaced (follow-up needed):** `buildPricingCompletenessView`, `buildAwardDecisionView`, and `buildTransitionReadinessView` were used **only** by the retired component — so pricing-completeness drilldown, award-decision, and transition-readiness views are **absent from the live canvas**. These lib functions are intentionally left in place (pure logic, no longer referenced) as candidates to wire into `UniversalCanvasShell`, or to delete if the canvas's equivalents suffice. Tracked as a separate task.
- **Hygiene gap:** the shell-v2 Mode-B governance rule no longer covers the Source detail surface (the new canvas uses `AgentDock`, not `AtlasDrawer`/`RibbonSynthesis`). Reconcile when M2 restructures the canvas.
