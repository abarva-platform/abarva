# 2026-06-03-source-canonical-portfolio-metrics — Source: one canonical portfolio metric, computed once

## Release ID

`2026-06-03-source-canonical-portfolio-metrics`

## Status

`candidate`

## Plain-English Summary

The Source surfaces disagreed about a tenant's own numbers. For Apex Retail, the Events surface showed **3 events / $74.0M at stake** while the Portfolio surface showed **2 events / $39.0M** — the same tenant, one click apart. The cause: each surface filtered and summed the event list its own way. The Events surface counted and summed *every* row returned by the database, including a duplicate row and a test-artifact event; the Portfolio surface first removed test artifacts, de-duplicated by event code, and excluded completed events from value.

This change introduces a single canonical computation (`computeSourcePortfolioMetrics`) that every Source portfolio surface now uses, so the headline event count and value can no longer differ between screens. A buyer who sees the same number everywhere can trust it; this is the first and most important fix from the 2026-06-03 Source simplicity audit (its "Tier 0" finding).

## Layer Impact

- **global-control-lane**: shared app/control-plane behavior. A new pure library module (`src/lib/source/portfolio-metrics.ts`) and a refactor of the Events page and Portfolio page to consume it. No client-data, schema, RLS, or ingestion change.

## Client Applicability

- All clients: yes — every tenant's Source Events and Portfolio surfaces now compute counts/value identically.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — this is a read-path correctness fix with no behavior to gate (the corrected, de-duplicated number is the only correct one).

## Changes Included

- New `src/lib/source/portfolio-metrics.ts` — `selectVisibleSourceEvents()` (canonical filtered+deduped set) and `computeSourcePortfolioMetrics()` (canonical KPI set: total, active, waiting, completed, attention, open value, oldest stage age). Wraps the existing, tested `computePortfolioKpis` math core.
- `src/app/(maestro)/source/events/page.tsx` — Events surface now routes counts and value through `computeSourcePortfolioMetrics`; the header no longer recomputes them inline over the unfiltered array. Empty-state check uses the visible set.
- `src/components/source/SourcePortfolioPage.tsx` — uses the shared `selectVisibleSourceEvents` instead of its own inline `dedupeByEventCode(filterOutTestArtifacts(...))`, so the two surfaces share one selection.
- New `src/__tests__/behaviors/source-portfolio-metrics.test.ts` — the automated "Trust Gate".

## QA / Validation

- `npx jest src/__tests__/behaviors/source-portfolio-metrics.test.ts` → **8 passed**. Covers: test-artifact exclusion, dedupe-by-code, completed excluded from value, oldest-age, idempotent selection, and the invariant that the canonical metrics equal `computePortfolioKpis(selectVisibleSourceEvents(raw))` — plus an assertion that the legacy unfiltered counting produced a different number (the bug this prevents).
- `npx tsc --noEmit` → no type errors in the touched files.
- `npx eslint` on the four changed files → clean.

## Rollout Plan

Merge to main → Vercel production deploy. No migration, no data backfill, no flag. On deploy, the Events surface begins showing the same de-duplicated count/value the Portfolio surface already showed.

## Rollback Plan

Revert the PR. Pure read-path refactor with no schema or data change, so revert is immediate and safe; surfaces return to their prior (inconsistent) behavior.

## Audit Evidence

- PR URL: _to be filled on push_
- Test output: 8/8 behaviors pass (see QA section).
- Audit source: `reports/2026-06-03-source-simplicity-audit/` — Tier-0 finding (`03-clutter-inventory.md`), execution plan M0 (`10-execution-plan.md`), and the CXO Bible's pre-flight Trust Gate (`09-source-cxo-testing-brief-target-state.html`).

## Known Gaps

- The event-canvas context strip (`UniversalCanvasShell`) also restates portfolio-ish counts; it is being consolidated in milestone M2 (it is mid-edit on another branch, so it is deliberately out of this PR).
- The Decision Queue's "N decisions need your attention" is a distinct metric (decision triggers, not sourcing events) and is intentionally not routed through this module.
- This PR consolidates the *computation*; the route/IA consolidation (4 home surfaces → 2) is milestone M1.
