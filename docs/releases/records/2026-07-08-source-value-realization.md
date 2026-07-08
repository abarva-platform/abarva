# 2026-07-08-source-value-realization — Source Value realization goes live from realized-to-date actuals

## Release ID

`2026-07-08-source-value-realization`

## Status

`candidate`

## Plain-English Summary

Phase 3 — the LAST downstream Source insight. RFP clause coverage (3.1),
Committed value (3.2), BAFO progress (3.3), and the Phase 2 / 2b multi-vendor
insights (Responses coverage, Evaluation should-cost) are all live on main. This
release flips the final one, **Value realization**, live.

Value realization is the pay-off read of the whole event: how much of the value
the award committed is actually being REALIZED. It shipped as a MODEL (a committed
track with a `null` realized track) because no realized-value fact existed. This
release makes it live from a **realized-to-date snapshot per lever**.

Scope decision (important): `source_event_facts` has no period/time dimension, and
adding one is a heavier data-plane change. So this release lands the tractable
first increment — a **realized-to-date SNAPSHOT per lever** (cumulative realized
value captured so far), NOT a per-period ramp. This flips the insight from MODEL to
a live realized-vs-committed read using the exact same per-lever `value_lever`
pattern as Committed value (3.2). The full per-period time-series (Shape 3 in the
design doc) is honestly DEFERRED — the snapshot renders as the current realized
point on the committed track, never a fabricated ramp.

- **One new signal fact `realized_value_usd`** in `DOWNSTREAM_SIGNAL_FACT_SPECS`,
  `entity_kind='value_lever'` (already an allowed kind — **NO new entity kind, NO
  migration**), `unit='usd'` total-over-term (the same basis `committed_value_usd`
  and the lever band use, so realized-to-date compares directly against committed
  and target), `source='enterprise_inventory'` (the run/SLA/productivity actuals
  record). Keyed by the canonical lever key in `entity_ref`. Merged into the derived
  catalog with a full spec (keeps the "undescribed key throws" guard), exempt from
  the "every catalog key is a lever input" invariant.
- **New template `VALUE_REALIZATION_V1`** — `rowEntity: 'value_lever'`,
  `entityRefColumn: 'Lever Key'`, one fact column `Realized Value To Date (USD)` →
  `realized_value_usd`. One row per value lever. Registered in `TEMPLATE_FACT_MAPS`.
  Mirrors `COMMITTED_VALUE_V1` exactly.
- **`buildValueRealizationInsight` flips LIVE** when realized facts exist: per lever,
  the realized-to-date value (its `realized_value_usd` fact) is shown against the
  lever's committed reference (its target-band midpoint). The realized-to-date TOTAL
  is marked as the CURRENT (final) period's realized point on the committed track;
  earlier periods stay pending (`null`) — a snapshot, not a fabricated ramp.
  `provenance: 'live'` / `isModel: false` when ≥1 realized fact exists; the honest
  MODEL (pending realized track) is preserved unchanged when none exist. A lever with
  no realized fact stays "not yet realized" — never fabricated.

No value-lever economic math changed; the other insights, the gate engine, the
baseline guard, aVa, and the vendor paths are untouched. Everything stays behind
`source_analytics`. Deterministic, no LLM.

## Layer Impact

- `global-control-lane`: shared Source app behavior. One new signal fact on the
  already-allowed `value_lever` entity kind; one new intake template
  (`VALUE_REALIZATION_V1`) on the existing single-column entity-ref path; a new
  Value-stage scaffold with one dropzone task; a new per-lever realized read
  (`readRealizedValueLevers`); the value-realization insight reading it (now carrying
  `isModel` + optional per-lever `bars`); and the renderer keying its badge off
  `isModel` and rendering a per-lever realized-to-date-vs-committed list. Everything
  stays dark behind the existing `source_analytics` feature flag; un-enrolled tenants
  see no change.
- `client-data-lane`: **NO migration.** `entity_kind='value_lever'` is already an
  allowed value in the `source_event_facts` CHECK (added by migration
  `20260707130000_source_event_facts_value_lever_kind.sql`, already on main), so the
  new signal fact persists with no schema change. No VNet migrate job is required by
  this release.

## Client Applicability

- All clients / all tenants: no — this feature is gated by the `source_analytics`
  feature flag and is inert for any tenant not enrolled in it. When a tenant IS
  enrolled, the change reaches that tenant's Source Value stage for every event (it is
  not further client-scoped).
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab) receive
  it; all other tenants receive nothing.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/fact-catalog.ts` — add the `realized_value_usd` spec to
  `DOWNSTREAM_SIGNAL_FACT_SPECS`: `entity_kind='value_lever'`, `unit='usd'`, source
  `enterprise_inventory`. No entity-kind change (value_lever already allowed).
- `src/lib/source/facts/template-fact-map.ts` — new `VALUE_REALIZATION_V1` template
  (`rowEntity: 'value_lever'`, `entityRefColumn: 'Lever Key'`, one column →
  `realized_value_usd`), registered in `TEMPLATE_FACT_MAPS`. Single-column path reused
  unchanged.
- `src/lib/source/facts/event-facts-reader.ts` — new `readRealizedValueLevers`:
  per-lever newest-non-stale read of the `value_lever`-kind `realized_value_usd` fact,
  keyed by the canonical lever key in `entity_ref`; only finite non-negative values
  admitted (a bad cell never fabricates); tenant-scoped (RLS). Returns
  `signalPresent:false` + empty map when no rows → MODEL.
- `src/lib/source/facts/view/step-insight-builder.ts` — `buildValueRealizationInsight`
  takes an optional `realizedByLeverKey` map and flips live vs model; per-lever
  realized-to-date-vs-committed `bars`; the realized-to-date total marked on the
  current (final) period only (snapshot, not a ramp); a live headline
  (`valueRealizationLiveHeadline`) reporting realized total + coverage vs committed;
  `BuildStepInsightInput.realizedValueByLeverKey` threaded through `buildStepInsight`.
- `src/components/source/canvas/analytics/view-model.ts` — add `isModel` and optional
  `bars: ValueRealizationBarView[]` to `ValueRealizationInsightView`; new
  `ValueRealizationBarView` (leverKey/label/valueType/committed/optional realized).
- `src/components/source/canvas/analytics/insights/ValueRealizationInsight.tsx` — badge
  keys off `insight.isModel` (was hardcoded `isModel`); render the per-lever
  realized-to-date-vs-committed list (a lever with no realized fact reads "Not yet
  realized", never fabricated) when `bars` present.
- `src/components/source/canvas/analytics/sample-view-model.ts` — new
  `SAMPLE_VALUE_STAGE` scaffold with the realized-value-actuals dropzone task
  (`factTemplateCode: 'VALUE_REALIZATION_V1'`). The Value stage is Atlas-owned in the
  rail; the scaffold keeps the dropzone + insight consistent with how the other stages
  render.
- `src/lib/source/facts/view/stage-analytics-builder.ts` + `SourceAnalyticsCanvas.tsx`
  — select the Value scaffold for the Value stage (live-path builder + sample fallback).
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — on the Value stage, read the
  realized-value signal (`readRealizedValueLevers`) and pass it to `buildStepInsight`
  (inside the existing `source_analytics`-gated branch).
- Tests: `fact-catalog.test.ts` (the `realized_value_usd` signal resolves under
  `entity_kind='value_lever'` with usd unit + `enterprise_inventory` source; no
  migration implied), `template-fact-map.test.ts` (`VALUE_REALIZATION_V1` single-column
  binding of the realized fact + catalog no-drift), `step-insight-builder.test.ts` (live
  realized-vs-committed per lever; snapshot marked on the current period only; live-empty
  assessed-nothing read; MODEL when absent/undefined; dispatch flip through
  `buildStepInsight`), `ValueRealizationInsight.test.tsx` (LIVE badge + per-lever snapshot
  list with an honest "not yet realized" row; MODEL badge unchanged, no snapshot list).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran to
  completion (157-line log, 124 pre-existing `error TS` lines, byte-identical file set to
  the main baseline captured before the change). **Net-new = 0**: grepping the error log
  for every file changed in this branch returns no matches; the log is non-empty (157
  lines). **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `fact-catalog.test.ts`, `template-fact-map.test.ts`,
  `step-insight-builder.test.ts`, `ValueRealizationInsight.test.tsx` (95 tests) +
  `stage-analytics-builder.test.ts` / `ingest-template-upload.test.ts` (7 tests,
  unchanged) — all green; existing tests stay green. **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**
- No migration in this release (nothing to apply via the VNet job), so no VNet
  migrate-job note is required.

## Rollout Plan

Merge to `main` via squash. **No DB migration** — `entity_kind='value_lever'` is already
an allowed value, so the new signal fact persists with no schema change and no VNet
migrate job. No traffic shift, no runtime image change, no flag change in this PR — the
feature rides the existing `source_analytics` flag. No deploy is performed by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged; not
  invoked by this PR).
- Shared runtime mutators: none. This PR does not mutate shared web traffic, revision
  weights, env vars, or the web Container App template.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected — no image or template mutation.
- Worker image invariant: unaffected — no worker job change.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag.
- Migration application: none — no migration in this release.
- Live signed-in proof required: yes, before claiming `live-proven` — a signed-in
  Lakeshore Value-stage upload of a `VALUE_REALIZATION_V1` sheet flipping value
  realization to a live realized-to-date-vs-committed read. Not claimed in this record.

## Rollback Plan

Revert the PR. No migration was applied, so there is nothing to unwind at the DB layer.
Reverting the app code fully disables the feature; any `realized_value_usd` rows already
written become inert (no reader consumes them once the code is reverted).

## Audit Evidence

- PR URL: see the branch `feat/source-value-realization` PR on `abarva-platform/abarva`.
- Design doc: `docs/build/source-downstream-insight-fact-model.md` (Value realization =
  "Shape 3 — time-series"; this release lands the realized-to-date SNAPSHOT increment and
  defers the full per-period time-series).
- tsc / eslint / jest output captured in the PR description and this record's QA section.
- No migration file added or applied.

## Known Gaps

- Per-period time-series (Shape 3, full) is DEFERRED. `source_event_facts` has no period
  dimension; this release lands a realized-to-date SNAPSHOT (one `realized_value_usd`
  fact per lever) and renders it as the current realized point on the committed track.
  A true per-period realized ramp needs a period-scoped fact model (`entity_ref =
  <leverKey>@<period>` or a dedicated realized-value table) — a heavier data-plane change
  noted here and in the design doc as the next enhancement.
- The committed reference per lever in the Value insight is the lever's target-band
  midpoint (the same committed roll-up the model has always shown), not the executed
  `committed_value_usd` fact — the Value stage reads only the realized signal. Wiring the
  award's real per-lever committed figure into the Value insight is a small follow-up.
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`.
