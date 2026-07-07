# 2026-07-06-source-analytics-ui — the redesigned three-beat Source canvas

## Release ID

`2026-07-06-source-analytics-ui`

## Status

`candidate`

## Plain-English Summary

The **surface** of the Source value-analytics layer — the redesigned event canvas that renders the
fact model and value-lever output as a decision surface, dark behind `source_analytics`. It is the
UI slice of the Wave-2 fan-out off the fact-model keystone.

- **`src/components/source/canvas/analytics/`** — the redesigned canvas. Each stage renders the
  **three-beat pattern**: Beat 1 an intel panel (what we know + provenance), Beat 2 a task
  checklist (what to provide next), Beat 3 a gate. Analytical stages also render the
  **value-type waterfall** — the classified value story: one band per canonical value type, each a
  **range** with confidence + citation. Components: `SourceAnalyticsCanvas`, `AnalyticsStageRail`,
  `ScopeAnalyticsStage`, `IntelPanel`, `TaskChecklist`, `ScopeGate`, `ValueWaterfall`,
  `ValueTypeChip`, `AvaLauncher`, plus `view-model.ts` (the presentation contract), `sample-view-model.ts`,
  `analytics-tokens.ts`.
- **`view-model.ts`** — the UI's presentation contract. Deliberately DECOUPLED from the evaluator
  domain types: `ValueWaterfallView`/`ValueWaterfallBandView` map 1:1 to the evaluators'
  `ValueWaterfall`/`ValueTypeBand` (`valueType` · `amountLow`/`amountHigh` ← `low`/`high` ·
  `confidence` · `state:'insufficient_evidence'` ← `insufficientLevers`), so the future
  evaluator→view adapter is trivial and the component tree stays free of domain coupling.
- **Honesty invariants, made executable** — a band with insufficient evidence renders
  **"needs evidence"**, never a fabricated $0; the total sums **only quantified** bands; the sample
  view-model is marked `provenance: 'sample'` so the canvas shows the "sample intelligence" note
  until the live evaluator wires in. Locked by `ValueWaterfall.honesty.test.tsx` (4 tests).
- **`src/app/(maestro)/source/events/[eventId]/page.tsx`** — gated: when `source_analytics` is ON
  for the tenant it renders `SourceAnalyticsCanvas`; when OFF it falls through to the **untouched**
  `UniversalCanvasShell`. Zero change to the live surface while the flag is off.

## Layer Impact

- `experimental`: the analytics canvas renders only when `source_analytics` is on (off for all) —
  the existing canvas is the default and is untouched.
- `global-control-lane`: the `canvas/analytics/` component library + view-model (inert unless the
  flag is on); the gated branch added to the event page.

## Client Applicability

- All clients: no behavior change — the flag is off; the existing `UniversalCanvasShell` renders.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off).

## Changes Included

- `src/components/source/canvas/analytics/*` (13 components + view-model + tokens + sample view-model + index).
- `src/components/source/canvas/analytics/__tests__/ValueWaterfall.honesty.test.tsx` (4 tests).
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — flag-gated branch to the analytics canvas.

## QA / Validation

- `npx jest` (honesty test) → **4 tests pass**: insufficient→"needs evidence" (never $0);
  quantified→range + confidence; total sums only quantified bands; sample exemplar marked
  `provenance:'sample'`. **pass.**
- `npx tsc --noEmit` (full project, 8 GB heap) → **0 errors** (view-model compiles against the
  merged evaluators/keystone types). **pass.**
- `npx eslint` on the slice → clean. **pass.**
- Not live-proven: the flag is off; the canvas renders sample intelligence only. **inert by design.**

## Rollout Plan

Merge to `main` via PR + squash. The canvas stays dark (`source_analytics` off). When a tenant is
enabled, the canvas first renders **sample intelligence** (honestly marked) until the evaluator
slice returns a live `StageAnalyticsView`; the live wiring (evaluators→view adapter) is the
remaining fan-out step. A live signed-in proof is required at first enablement.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — the analytics branch is unreachable while the flag is off; the
  default path is the untouched existing canvas.
- Migration run path: n/a for this slice (UI only; reads facts/levers when the flag + engine land).
- Feature/env flag update path: `includeTenants` in registry or `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: at first tenant enablement (not this slice — inert).

## Rollback Plan

Revert the PR. The analytics components are reachable only through the flag-gated branch; removing
them restores the event page to the existing canvas with no other effect.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint, architecture-rules, axe/lighthouse.
- The honesty test encodes the doctrine (insufficient≠$0, sample-marked provenance); the view-model
  header documents the 1:1 mapping to the evaluators' waterfall.

## Known Gaps

- The **evaluators→view adapter** (real `ValueWaterfall`/`StageAnalyticsView` → `*View`) is the
  wiring that flips a tenant from sample to live — the next fan-out step.
- Only the Scope stage exemplar is authored as sample; the other stages render their sample view as
  the analytics stages are populated.
