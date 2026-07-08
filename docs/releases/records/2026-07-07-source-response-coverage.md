# 2026-07-07-source-response-coverage — Source Responses coverage goes live on a multi-vendor fact model

## Release ID

`2026-07-07-source-response-coverage`

## Status

`candidate`

## Plain-English Summary

Phase 2 of making the six downstream Source insights real: the first **multi-vendor**
insight. Phase 1 (RFP clause coverage 3.1, Committed value 3.2, BAFO progress 3.3)
built per-lever signals on a `value_lever` entity kind. Responses coverage needs a
second axis — the **vendor** — so it could only ever render as a MODEL (every value
dimension shown "dodged"). This release designs the governed multi-vendor fact model
and flips **Responses coverage** live from a real upload.

- **New entity kind `vendor_lever`** — a fact of this kind captures "vendor V
  addressed lever L" via a canonical composite `entity_ref` `'<vendorId>::<leverKey>'`.
  Both halves are canonical: the lever half is validated against the archetype's
  `valueLeverRules` lever keys (a typo'd lever is rejected loudly at ingest); the
  vendor half is governed by presence (blank → rejected). No faked composite fact
  keys. The **vendor set is DERIVED from the response rows** (no separate registry —
  see the design doc's decision; `CONTRACT_TERMS_V1` already carries a `Vendor`
  entity-ref, so the event already has a governed notion of a vendor).
- **New signal fact `response_addressed`** — `entity_kind='vendor_lever'`,
  `unit='ratio'`, value 1 = addressed / 0.5 = partial / 0 = dodged (the same ratio
  representation `rfp_clause_present` reused — no new unit, no type/DB churn). Merged
  into the derived catalog with a full spec (keeps the "undescribed key throws" guard),
  exempt from the "every catalog key is a lever input" invariant.
- **Additive composite `entityRefColumns`** on `TemplateFactMap` — the structured
  map builds an `entity_ref` from TWO columns joined with `::` for a `vendor_lever`
  template, WITHOUT rewriting the single-column path. Every existing single-column
  template keeps working byte-for-byte (a test asserts each template declares exactly
  one of `entityRefColumn` / `entityRefColumns`).
- **New template `RESPONSE_COVERAGE_V1`** — one row per vendor × value lever
  (`Vendor`, `Lever Key`, `Addressed (1/0/0.5)`), uploaded on the Responses stage
  through the exact Phase-1 dropzone flow, persisting one `response_addressed`
  `vendor_lever` fact per cell.

`buildResponseCoverageInsight` now reads a per-vendor / per-lever response signal:
a lever's row is `answered` iff ANY vendor addressed (or partially addressed) it, and
each vendor's coverage across the levers is summarized (addressed / partial / dodged /
not-yet-answered + $ exposed). When any `response_addressed` fact exists the insight is
`provenance: 'live'` / `isModel: false`; when none exist the honest MODEL is preserved
unchanged. A vendor×lever with no fact stays "not yet answered", never fabricated. No
value-lever economic math changed. Everything stays behind `source_analytics`.

Evaluation should-cost (the second Shape-2 insight — per-vendor bid line items) is
designed in the doc but NOT built; it is the next increment.

## Layer Impact

- `global-control-lane`: shared Source app behavior. One new entity kind
  (`vendor_lever`); one new signal fact (`response_addressed`); an additive composite
  entity-ref option on the structured map; one new intake template
  (`RESPONSE_COVERAGE_V1`); a new Responses-stage scaffold with one dropzone task; a
  new per-vendor response read; the Responses coverage insight reading it (now
  carrying `isModel` + optional `vendors`); and the renderer keying its badge off
  `isModel` and rendering per-vendor coverage additively. Everything stays dark behind
  the existing `source_analytics` feature flag; un-enrolled tenants see no change.
- `client-data-lane`: **one additive DB migration** widening the `source_event_facts`
  `entity_kind` CHECK to admit `vendor_lever` (mirrors 3.1's `value_lever` migration).
  It only ADDS an allowed value; every existing row already satisfies the widened set,
  so no data migration. **This migration MUST be applied via the VNet migrate job
  (`job-abarva-db-migrate-lab-eastus`) at deploy time**, per the ACA data-build-job
  rule — it is NOT run from this branch or from localhost.

## Client Applicability

- All clients: no. Gated by the `source_analytics` feature flag; inert for tenants
  without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/fact-catalog.ts` — add `vendor_lever` to `FactEntityKind` +
  `FACT_ENTITY_KINDS`; add the `response_addressed` spec to
  `DOWNSTREAM_SIGNAL_FACT_SPECS` (entity_kind `vendor_lever`, unit `ratio`, source
  `extracted_vendor`).
- `supabase/migrations/20260707190000_source_event_facts_vendor_lever_kind.sql` —
  widen the `entity_kind` CHECK to include `vendor_lever` (additive; VNet-job applied).
- `src/lib/source/facts/template-fact-map.ts` — additive optional `entityRefColumns`
  + `COMPOSITE_ENTITY_REF_SEP`; new `RESPONSE_COVERAGE_V1` template
  (`rowEntity: 'vendor_lever'`, `entityRefColumns: ['Vendor','Lever Key']`, one column
  `Addressed (1/0/0.5)` → `response_addressed`), registered in `TEMPLATE_FACT_MAPS`.
- `src/lib/source/facts/extraction/structured-map.ts` — composite entity-ref
  resolution from `entityRefColumns` (canonical `::` join), with loud rejection of a
  blank composite part and (when `validLeverKeys` supplied) a non-canonical lever
  half; single-column behavior unchanged.
- `src/lib/source/facts/ingest/ingest-template-upload.ts` — for a composite template,
  resolve the archetype lever-key set and pass it as `validLeverKeys` so a phantom
  lever is rejected at ingest.
- `src/lib/source/facts/event-facts-reader.ts` — new `readVendorLeverResponses`:
  per-vendor / per-lever newest-non-stale read of `response_addressed`, splitting the
  composite entity_ref on the first `::`, deriving the vendor set; tenant-scoped.
- `src/lib/source/facts/view/step-insight-builder.ts` — `buildResponseCoverageInsight`
  takes a `VendorResponseSignal` and flips live vs model; per-vendor coverage builder +
  live headline; `BuildStepInsightInput.vendorResponses` threaded through
  `buildStepInsight`.
- `src/components/source/canvas/analytics/view-model.ts` — add `isModel` +
  optional `vendors` (`VendorCoverageView`) to `ResponseCoverageInsightView`.
- `src/components/source/canvas/analytics/insights/ResponseCoverageInsight.tsx` — badge
  keys off `insight.isModel`; additive per-vendor coverage block (LIVE only).
- `src/components/source/canvas/analytics/sample-view-model.ts` — new
  `SAMPLE_RESPONSES_STAGE` scaffold with the response-coverage dropzone task
  (`factTemplateCode: 'RESPONSE_COVERAGE_V1'`).
- `src/lib/source/facts/view/stage-analytics-builder.ts` — select the Responses
  scaffold for the Responses stage.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — on the Responses stage, read
  the vendor-response signal and pass it to `buildStepInsight`.
- Tests: `fact-catalog.test.ts` (`response_addressed` resolves as `vendor_lever` /
  ratio / extracted_vendor; `vendor_lever` admitted), `template-fact-map.test.ts`
  (`RESPONSE_COVERAGE_V1` composite binding + exactly-one-entity-ref invariant),
  `structured-map.test.ts` (composite `::` join, non-canonical-lever rejection,
  blank-vendor rejection, composite columns not unmapped; single-column suites stay
  green), `step-insight-builder.test.ts` (live per-vendor + per-lever coverage,
  live-empty, model-when-absent, model-when-undefined), `ResponseCoverageInsight.test.tsx`
  (renders per-vendor coverage live; no per-vendor block in MODEL).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran to
  completion (157-line log, 124 pre-existing `error TS` lines, byte-identical to the
  main baseline captured before the change). **Net-new = 0**: grepping the error log
  for every file changed in this branch returns no matches; the log is non-empty (157
  lines). **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `fact-catalog.test.ts`, `template-fact-map.test.ts`,
  `structured-map.test.ts`, `step-insight-builder.test.ts` (107 tests) +
  `ResponseCoverageInsight.test.tsx`, the ingest route suite, and
  `stage-analytics-builder.test.ts` (11 tests) — all green; existing single-column
  structured-map tests stay green. **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**

## Rollout Plan

Merge to `main` via squash. **Pending DB migration**
`20260707190000_source_event_facts_vendor_lever_kind.sql` must be applied via the
VNet migrate job (`job-abarva-db-migrate-lab-eastus`) at deploy time — it is additive
(only widens the `entity_kind` CHECK) and needs no data migration. No traffic shift,
no runtime image change, no flag change in this PR — the feature rides the existing
`source_analytics` flag. No deploy is performed by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged; not
  invoked by this PR).
- Shared runtime mutators: none. This PR does not mutate shared web traffic, revision
  weights, env vars, or the web Container App template.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected — no image or template mutation.
- Worker image invariant: unaffected — no worker job change.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag.
- Migration application: the `vendor_lever` CHECK-widening migration is applied by the
  VNet migrate job at deploy, not by this PR/branch.
- Live signed-in proof required: yes, before claiming `live-proven` — a signed-in
  Lakeshore Responses-stage upload of a `RESPONSE_COVERAGE_V1` sheet flipping the
  insight to live per-vendor coverage. Not claimed in this record.

## Rollback Plan

Revert the PR. The migration only widened a CHECK to admit a new `entity_kind`; it can
be left in place (harmless — no row requires it once the code is reverted) or unwound
by re-narrowing the CHECK after confirming no `vendor_lever` rows remain. Reverting the
app code fully disables the feature; any `response_addressed` rows already written
become inert (no reader consumes them once the code is reverted).

## Audit Evidence

- PR URL: see the branch `feat/source-response-coverage` PR on `abarva-platform/abarva`.
- Design docs: `docs/build/source-multivendor-fact-model.md` (Phase-2 multi-vendor
  model — the vendor-registry decision, the `vendor_lever` composite, the structured-map
  extension, and the next-increment Evaluation should-cost shape);
  `docs/build/source-downstream-insight-fact-model.md` (Phase-1 context — names Response
  coverage as Shape 2).
- tsc / eslint / jest output captured in the PR description and this record's QA section.
- Migration: `supabase/migrations/20260707190000_source_event_facts_vendor_lever_kind.sql`
  (pending VNet-job apply).

## Known Gaps

- Evaluation should-cost (the second Shape-2 insight — per-vendor bid line items,
  `entity_kind='vendor'` with multiple numeric bid fact keys) is designed in the doc
  but NOT built — the next increment.
- Shape 3 (time-series — Value realization) remains declared but not built.
- The per-vendor coverage renders additively over the existing per-lever bar chart; a
  richer vendor×lever matrix visualization is deferred (kept additive to avoid a
  renderer refactor of the existing chart + test).
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`. The `vendor_lever` migration is pending the VNet job.
</content>
