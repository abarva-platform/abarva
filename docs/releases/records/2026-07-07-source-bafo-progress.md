# 2026-07-07-source-bafo-progress — Source BAFO progress goes live on the value_lever fact model

## Release ID

`2026-07-07-source-bafo-progress`

## Status

`candidate`

## Plain-English Summary

Slice 3.3 of making the six downstream Source insights real, and the third to use
the `value_lever` per-lever fact pattern that Slices 3.1 (RFP clause coverage) and
3.2 (Committed value) established. The `✦ Intelligence` tab's BAFO-stage insight —
**BAFO progress** — could only ever render as a MODEL: every value lever showed
`captured: 0` against its target because the fact model had no place to record how
much concession the BAFO round actually booked for a lever. This release flips BAFO
progress LIVE from a real upload, reusing the exact governed fact-model extension
3.1/3.2 already put on `main`.

- **No new fact entity kind, no migration.** BAFO reuses the existing
  `value_lever` entity kind and the existing widened `source_event_facts`
  `entity_kind` CHECK (added by 3.1's migration
  `20260707130000_source_event_facts_value_lever_kind.sql`). A per-lever signal is
  still one fact key, one row per lever, keyed by the canonical lever key in
  `entity_ref` — never a faked composite key.
- A new hand-authored **signal fact** `bafo_concession_captured_usd` (a
  total-over-term $ figure on the existing `usd` unit — the same basis the lever's
  computed target band is expressed in, so captured compares directly against
  target; source `extracted_vendor`, because a BAFO round is a vendor submission).
  It is merged into the derived fact catalog with a full spec, keeping the
  "undescribed fact key throws at build" guarantee, and is exempt from the "every
  catalog key is a lever input" invariant because a signal is read by an insight
  builder, not the value math.
- A new intake template **`BAFO_CONCESSIONS_V1`**: one row per value lever (the
  `Lever Key` column) with a single `Concession Captured (USD)` column. Uploaded on
  the BAFO stage through the exact Slice-1/2/3.1/3.2 dropzone flow
  (`factTemplateCode` on the task → the shared deterministic map/validate/write
  core), it persists one `bafo_concession_captured_usd` `value_lever` fact per lever.

`buildBafoProgressInsight` now reads the per-lever captured map: a lever's
`captured` is its `bafo_concession_captured_usd` fact where present, else 0 /
still-open (never fabricated), compared against its computed target band. When any
concession fact exists the insight is `provenance: 'live'` / `isModel: false` with a
captured-vs-target coverage headline (captured total across N of M levers); when
none exist the honest MODEL is preserved unchanged. No value-lever economic math
changed. Everything stays behind `source_analytics`.

## Layer Impact

- `global-control-lane`: shared Source app behavior. One new signal fact
  (`bafo_concession_captured_usd`) in `fact-catalog.ts`; one new intake template
  (`BAFO_CONCESSIONS_V1`); a new BAFO-stage scaffold with one dropzone task; a new
  per-lever concession read; the BAFO progress insight reading it (now carrying
  `isModel`); and the BAFO insight renderer keying its badge off `isModel`.
  Everything stays dark behind the existing `source_analytics` feature flag;
  un-enrolled tenants see no change.
- `client-data-lane`: **no DB migration.** The `source_event_facts` `entity_kind`
  CHECK already admits `value_lever` (widened by 3.1); this slice only adds another
  `value_lever` signal fact key, which needs no schema change.

## Client Applicability

- All clients: no. Gated by the `source_analytics` feature flag; inert for tenants
  without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/fact-catalog.ts` — add the `bafo_concession_captured_usd`
  spec to `DOWNSTREAM_SIGNAL_FACT_SPECS` (entity_kind `value_lever`, unit `usd`,
  source `extracted_vendor`).
- `src/lib/source/facts/template-fact-map.ts` — new `BAFO_CONCESSIONS_V1` template
  (`rowEntity: 'value_lever'`, entityRefColumn `Lever Key`, one column
  `Concession Captured (USD)` → `bafo_concession_captured_usd`), registered in
  `TEMPLATE_FACT_MAPS`.
- `src/lib/source/facts/event-facts-reader.ts` — new `readBafoConcessionLevers`:
  per-lever, newest-non-stale read of the `bafo_concession_captured_usd` signal,
  finite/non-negative only, tenant-scoped.
- `src/lib/source/facts/view/step-insight-builder.ts` — `buildBafoProgressInsight`
  takes the captured map and flips live vs model; new live captured-vs-target
  headline; `BuildStepInsightInput.bafoConcessionByLeverKey` threaded through
  `buildStepInsight`.
- `src/components/source/canvas/analytics/view-model.ts` — add `isModel` to
  `BafoProgressInsightView`; clarify `captured` semantics (live-from-fact vs 0).
- `src/components/source/canvas/analytics/insights/BafoProgressInsight.tsx` — badge
  and note key off `insight.isModel` instead of hardcoding model.
- `src/components/source/canvas/analytics/sample-view-model.ts` — new
  `SAMPLE_BAFO_STAGE` scaffold with the BAFO concession-actuals dropzone task
  (`factTemplateCode: 'BAFO_CONCESSIONS_V1'`).
- `src/lib/source/facts/view/stage-analytics-builder.ts` — select the BAFO scaffold
  for the BAFO stage (falls back to the Scope exemplar for other stages).
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — sample
  fallback returns `SAMPLE_BAFO_STAGE` for the BAFO stage.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — on the BAFO stage, read the
  concession map and pass it to `buildStepInsight`.
- Tests: `fact-catalog.test.ts` (`bafo_concession_captured_usd` resolves as
  `value_lever` / usd / extracted_vendor), `template-fact-map.test.ts`
  (`BAFO_CONCESSIONS_V1` binding), `step-insight-builder.test.ts` (live
  captured-vs-target, live-empty, all-captured, model-when-absent, model-when-
  undefined), `BafoProgressInsight.test.tsx` (renders live when captured present).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran
  to completion (167-line log, 131 pre-existing `error TS` lines matching the main
  baseline captured before the change). **Net-new = 0**: grepping the error log for
  every file changed in this branch returns no matches. **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `fact-catalog.test.ts`, `template-fact-map.test.ts`,
  `step-insight-builder.test.ts`, `BafoProgressInsight.test.tsx` — 78 tests, all
  green. **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**

## Rollout Plan

Merge to `main` via squash. **No DB migration** — the `value_lever` `entity_kind`
CHECK is already in place from 3.1. No traffic shift, no runtime image change, no
flag change in this PR — the feature rides the existing `source_analytics` flag. No
deploy is performed by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged;
  not invoked by this PR).
- Shared runtime mutators: none. This PR does not mutate shared web traffic,
  revision weights, env vars, or the web Container App template.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected — no image or template mutation.
- Worker image invariant: unaffected — no worker job change.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag.
- Live signed-in proof required: yes, before claiming `live-proven` — a signed-in
  Lakeshore BAFO-stage upload of a `BAFO_CONCESSIONS_V1` sheet flipping the insight
  to live. Not claimed in this record.

## Rollback Plan

Revert the PR. There is no schema change to unwind. Reverting the app code fully
disables the feature; any `bafo_concession_captured_usd` rows already written become
inert (no reader consumes them once the code is reverted) and can be left in place
or deleted at leisure.

## Audit Evidence

- PR URL: see the branch `feat/source-bafo-progress` PR on `abarva-platform/abarva`.
- Design doc: `docs/build/source-downstream-insight-fact-model.md` (BAFO is a
  Shape-1 per-lever insight; `bafo_concession_captured_usd` is its named signal).
- tsc / eslint / jest output captured in the PR description and this record's QA
  section.
- Migration: none required (reuses 3.1's
  `20260707130000_source_event_facts_value_lever_kind.sql`).

## Known Gaps

- Shape 2 (per-vendor / vendor×lever — Response coverage, Evaluation should-cost)
  and Shape 3 (time-series — Value realization) are declared in the design doc but
  NOT built. With BAFO live, all three Shape-1 signals (`rfp_clause_present`,
  `committed_value_usd`, `bafo_concession_captured_usd`) now exist.
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`.
