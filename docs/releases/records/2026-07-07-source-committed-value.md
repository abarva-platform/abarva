# 2026-07-07-source-committed-value — Source committed value goes live (Selection stage) on the value_lever fact model

## Release ID

`2026-07-07-source-committed-value`

## Status

`candidate`

## Plain-English Summary

Slice 3.2 of making the six downstream Source insights real, and the second
per-lever (Shape-1) insight built on the `value_lever` fact model that Slice 3.1
(RFP clause coverage, #4558) proved. The `✦ Intelligence` tab's Selection-stage
insight — **Committed value** — could only render as a MODEL: it showed each value
lever's target band with no way to record what the executed award actually
committed. This release adds the one governed signal fact + intake template that
flips it LIVE from a real upload, and reads committed-vs-target per lever.

It follows the exact 3.1 principle: extend the governed fact model via the existing
`entity_ref` dimension plus the hand-authored signal-fact registry — never fake
composite keys. Concretely:

- A new hand-authored **signal fact** `committed_value_usd` (`entity_kind`
  `value_lever`, unit `usd`, source `extracted_contract`): the value the executed
  award/contract locked for a lever, in USD over the contract term. It is a
  total-over-term figure on the same basis as the lever's computed target band, so
  committed can be compared directly against target. It is merged into the derived
  fact catalog with a full spec, keeping the "an undescribed fact key throws at
  build" guarantee, and is exempt from the "every catalog key is a lever input"
  invariant (a signal is read by an insight builder, not the value math).
- A new intake template **`COMMITTED_VALUE_V1`**: one row per value lever (the
  `Lever Key` column) with a single `Committed Value (USD)` column. Uploaded on the
  Selection stage through the exact Slice-1/2/3.1 dropzone flow (`factTemplateCode`
  on the task → `/facts/ingest-file` → the shared deterministic map/validate/write
  core), it persists one `committed_value_usd` `value_lever` fact per lever.

`buildCommittedValueInsight` now takes the per-lever committed map: when award facts
exist the insight is `provenance: 'live'` / `isModel: false`, each bar carrying the
committed value against its target band (a lever with no award fact is shown as
awaiting-award, never fabricated as $0), and a coverage headline (committed total
across N of M levers); when none exist the honest MODEL is preserved unchanged. No
value-lever economic math changed. Everything stays behind `source_analytics`.

**No new DB migration** — the `source_event_facts` `entity_kind` CHECK already
admits `value_lever` (migration `20260707130000_...` from #4558).

## Layer Impact

- `global-control-lane`: shared Source app behavior. New signal fact
  `committed_value_usd` in `fact-catalog.ts`; one new intake template
  (`COMMITTED_VALUE_V1`); a new Selection-stage scaffold with one dropzone task; a
  new per-lever committed-value read; and the committed-value insight + component
  reading it (committed-vs-target). Everything stays dark behind the existing
  `source_analytics` feature flag; un-enrolled tenants see no change.
- No `client-data-lane` change: **no new migration** — the `value_lever` entity
  kind (and its CHECK constraint) already shipped in #4558.

## Client Applicability

- All clients: no. Gated by the `source_analytics` feature flag; inert for tenants
  without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/fact-catalog.ts` — add the `committed_value_usd` spec to
  `DOWNSTREAM_SIGNAL_FACT_SPECS` (`value_lever` / `usd` / `extracted_contract`);
  merged + collide-guarded by the existing `buildFactCatalog()`. No new entity kind
  needed (`value_lever` already present).
- `src/lib/source/facts/template-fact-map.ts` — new `COMMITTED_VALUE_V1` template
  (`rowEntity: 'value_lever'`, entityRefColumn `Lever Key`, one column
  `Committed Value (USD)` → `committed_value_usd`), registered in
  `TEMPLATE_FACT_MAPS`.
- `src/lib/source/facts/event-facts-reader.ts` — new `readCommittedValueLevers`:
  per-lever, newest-non-stale read of the `committed_value_usd` signal, tenant-scoped,
  admitting only finite non-negative committed $ (never fabricates a magnitude).
- `src/lib/source/facts/view/step-insight-builder.ts` — `buildCommittedValueInsight`
  takes the committed map and flips live vs model; new live committed-vs-target
  headline; `BuildStepInsightInput.committedValueByLeverKey` threaded through
  `buildStepInsight`.
- `src/components/source/canvas/analytics/view-model.ts` — `CommittedValueBarView`
  gains an optional `committed`; `CommittedValueInsightView` gains `isModel`.
- `src/components/source/canvas/analytics/insights/CommittedValueInsight.tsx` — the
  renderer is now model-aware (badge/note key off `isModel`), annotates the
  committed value on each live bar (awaiting-award otherwise), and swaps the "goes
  live when" flip line for a live footnote.
- `src/components/source/canvas/analytics/sample-view-model.ts` — new
  `SAMPLE_SELECTION_STAGE` scaffold with the award-commitments dropzone task
  (`factTemplateCode: 'COMMITTED_VALUE_V1'`).
- `src/lib/source/facts/view/stage-analytics-builder.ts` — select the Selection
  scaffold for the Selection stage (falls back to the Scope exemplar otherwise).
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — sample
  fallback returns `SAMPLE_SELECTION_STAGE` for the Selection stage.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — on the Selection stage,
  read the committed map and pass it to `buildStepInsight`.
- Tests: `fact-catalog.test.ts` (`committed_value_usd` resolves as `value_lever` /
  `usd` / `extracted_contract`), `template-fact-map.test.ts` (`COMMITTED_VALUE_V1`
  binding), `step-insight-builder.test.ts` (live committed-vs-target, live-empty,
  all-committed, model-when-absent), `CommittedValueInsight.test.tsx` (live badge +
  no flip line + live footnote).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran
  to completion (non-empty ~168-line log; 132 pre-existing `error TS` lines from the
  canvas workstream baseline, none introduced here). **Net-new = 0**: grepping the
  error log for every file changed in this branch returns no matches. **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `fact-catalog.test.ts`, `template-fact-map.test.ts`,
  `step-insight-builder.test.ts`, `stage-analytics-builder.test.ts`,
  `CommittedValueInsight.test.tsx`, `RfpClauseInsight.test.tsx` — all green.
  **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**

## Rollout Plan

Merge to `main` via squash. **No DB migration in this PR** — the `value_lever`
entity kind and its CHECK constraint already shipped in #4558. No traffic shift, no
runtime image change, no flag change — the feature rides the existing
`source_analytics` flag. No deploy is performed by this change.

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
  Lakeshore Selection-stage upload of a `COMMITTED_VALUE_V1` sheet flipping the
  insight to live. Not claimed in this record.

## Rollback Plan

Revert the PR. There is no schema change to unwind (the `value_lever` CHECK is from
#4558 and other value_lever facts, e.g. `rfp_clause_present`, still use it).
Reverting the app code fully disables committed-value LIVE with no data cleanup;
any `committed_value_usd` rows already ingested simply become inert.

## Audit Evidence

- PR URL: see the branch `feat/source-committed-value` PR on `abarva-platform/abarva`.
- Design doc: `docs/build/source-downstream-insight-fact-model.md` (Committed value
  is the Shape-1 insight with signal fact `committed_value_usd`).
- tsc / eslint / jest output captured in the PR description and this record's QA
  section.
- No migration in this PR (value_lever already admitted by
  `supabase/migrations/20260707130000_source_event_facts_value_lever_kind.sql`).

## Known Gaps

- Shape 2 (per-vendor / vendor×lever — Response coverage, Evaluation should-cost)
  and Shape 3 (time-series — Value realization) remain declared but not built. The
  last Shape-1 signal `bafo_concession_captured_usd` (BAFO progress) is named in the
  design doc but not yet added.
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`.
