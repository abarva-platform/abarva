# 2026-07-07-source-rfp-clause-coverage — Source RFP clause coverage goes live + the governed fact-model extension it needs

## Release ID

`2026-07-07-source-rfp-clause-coverage`

## Status

`candidate`

## Plain-English Summary

Slice 3.1 of making the six downstream Source insights real. The `✦ Intelligence`
tab's RFP-stage insight — **RFP clause coverage** — could only ever render as a
MODEL: every value lever was shown as "exposed / to require" because the fact model
had no place to record whether the RFP draft actually protects a lever with a
clause. This release adds the small, governed fact-model extension that closes that
gap and flips RFP clause coverage LIVE from a real upload.

The extension follows one principle: extend the governed fact model via the
existing `entity_ref` dimension plus a hand-authored signal-fact registry — never
fake composite keys like `rfp_clause_present.AMS.VOLUME_BAND`. Concretely:

- A new fact **entity kind `value_lever`**: a fact of this kind hangs off a
  canonical archetype lever key via `entity_ref` (e.g. `AMS.VOLUME_BAND_PRICING`),
  so a per-lever signal is one fact key with one row per lever — never a mangled
  key.
- A new hand-authored **signal fact** `rfp_clause_present` (0/1 on the existing
  `ratio` unit; 1 = the RFP draft requires the lever's clause). It is merged into
  the derived fact catalog with a full spec, keeping the "an undescribed fact key
  throws at build" guarantee, but exempt from the "every catalog key is a lever
  input" invariant because a signal is read by an insight builder, not the value
  math.
- A new intake template **`RFP_CLAUSES_V1`**: one row per value lever (the
  `Lever Key` column) with a single `Clause Included (1/0)` column. Uploaded on the
  RFP stage through the exact Slice-1/2 dropzone flow (`factTemplateCode` on the
  task → `/facts/ingest-file` → the shared deterministic map/validate/write core),
  it persists one `rfp_clause_present` `value_lever` fact per lever.

`buildRfpClauseInsight` now reads the set of lever keys whose `rfp_clause_present`
fact = 1: a lever is protected when present, exposed otherwise; when any such fact
exists the insight is `provenance: 'live'` / `isModel: false` with a coverage
headline (N of M lever clauses present); when none exist the honest MODEL is
preserved unchanged. No value-lever economic math changed. Everything stays behind
`source_analytics`.

## Layer Impact

- `global-control-lane`: shared Source app behavior. New fact entity kind
  `value_lever` + a signal-fact registry in `fact-catalog.ts`; one new intake
  template (`RFP_CLAUSES_V1`); a new RFP-stage scaffold with one dropzone task; a
  new per-lever RFP-clause presence read; and the RFP clause-coverage insight
  reading it. Everything stays dark behind the existing `source_analytics` feature
  flag; un-enrolled tenants see no change.
- `client-data-lane`: one additive DB migration widens the `source_event_facts`
  `entity_kind` CHECK constraint to admit `value_lever`. No data migration — the
  constraint only ADDS an allowed value; every existing row already satisfies the
  widened set.

## Client Applicability

- All clients: no. Gated by the `source_analytics` feature flag; inert for tenants
  without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `docs/build/source-downstream-insight-fact-model.md` — new design doc: the three
  fact shapes the six downstream insights need, the `entity_ref` + signal-fact
  principle, the boolean-as-`ratio` decision, and the governance contract.
- `src/lib/source/facts/fact-catalog.ts` — add `'value_lever'` to `FactEntityKind`
  + `FACT_ENTITY_KINDS`; add `DOWNSTREAM_SIGNAL_FACT_SPECS` (with the
  `rfp_clause_present` spec) + `isSignalFactKey`; merge the signal specs into
  `buildFactCatalog()` with a collide-with-lever-key guard.
- `src/lib/source/facts/template-fact-map.ts` — new `RFP_CLAUSES_V1` template
  (`rowEntity: 'value_lever'`, entityRefColumn `Lever Key`, one column
  `Clause Included (1/0)` → `rfp_clause_present`), registered in
  `TEMPLATE_FACT_MAPS`.
- `src/lib/source/facts/event-facts-reader.ts` — new `readRfpClausePresentLeverKeys`:
  per-lever, newest-non-stale read of the `rfp_clause_present` signal, tenant-scoped.
- `src/lib/source/facts/view/step-insight-builder.ts` — `buildRfpClauseInsight`
  takes the presence set and flips live vs model; new live coverage headline;
  `BuildStepInsightInput.rfpClausePresentLeverKeys` threaded through `buildStepInsight`.
- `src/components/source/canvas/analytics/sample-view-model.ts` — new
  `SAMPLE_RFP_STAGE` scaffold with the RFP clause-checklist dropzone task
  (`factTemplateCode: 'RFP_CLAUSES_V1'`).
- `src/lib/source/facts/view/stage-analytics-builder.ts` — select the RFP scaffold
  for the RFP stage (falls back to the Scope exemplar for other stages).
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — sample
  fallback returns `SAMPLE_RFP_STAGE` for the RFP stage.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — on the RFP stage, read the
  clause-presence set and pass it to `buildStepInsight`.
- `supabase/migrations/20260707130000_source_event_facts_value_lever_kind.sql` —
  widen the `entity_kind` CHECK to admit `value_lever`.
- Tests: `fact-catalog.test.ts` (signal-fact invariants + `rfp_clause_present`
  resolves as `value_lever`), `template-fact-map.test.ts` (`RFP_CLAUSES_V1`
  binding), `step-insight-builder.test.ts` (live protected/exposed, live-empty,
  all-present, model-when-absent).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran
  to completion (167-line log, 131 pre-existing `error TS` lines matching the main
  baseline from the canvas workstream). **Net-new = 0**: grepping the error log for
  every file changed in this branch returns no matches. **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `fact-catalog.test.ts`, `template-fact-map.test.ts`,
  `structured-map.test.ts`, `step-insight-builder.test.ts`,
  `stage-analytics-builder.test.ts`, `RfpClauseInsight.test.tsx` — 85 tests, all
  green. **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**

## Rollout Plan

Merge to `main` via squash. The additive DB migration
(`20260707130000_source_event_facts_value_lever_kind.sql`) applies through the
standard migrate path; it only widens a CHECK constraint and is safe to apply
before or after the app rolls. No traffic shift, no runtime image change, no flag
change in this PR — the feature rides the existing `source_analytics` flag. No
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
  Lakeshore RFP-stage upload of an `RFP_CLAUSES_V1` sheet flipping the insight to
  live. Not claimed in this record.

## Rollback Plan

Revert the PR. The DB migration is additive (widened CHECK); a rollback would
re-narrow the constraint, which is only safe once no `value_lever` rows exist —
delete any `rfp_clause_present` rows first if reverting the schema. In practice,
reverting the app code alone (leaving the widened constraint in place) fully
disables the feature with no data cleanup, since nothing else writes `value_lever`
facts.

## Audit Evidence

- PR URL: see the branch `feat/source-rfp-clause-coverage` PR on
  `abarva-platform/abarva`.
- Design doc: `docs/build/source-downstream-insight-fact-model.md`.
- tsc / eslint / jest output captured in the PR description and this record's QA
  section.
- Migration: `supabase/migrations/20260707130000_source_event_facts_value_lever_kind.sql`.

## Known Gaps

- Shape 2 (per-vendor / vendor×lever — Response coverage, Evaluation should-cost)
  and Shape 3 (time-series — Value realization) are declared in the design doc but
  NOT built in this slice. The other two Shape-1 signals (`committed_value_usd`,
  `bafo_concession_captured_usd`) are named but not yet added.
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`.
