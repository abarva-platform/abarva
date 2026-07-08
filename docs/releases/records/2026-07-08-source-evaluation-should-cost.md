# 2026-07-08-source-evaluation-should-cost — Source Evaluation should-cost goes live from per-vendor bids

## Release ID

`2026-07-08-source-evaluation-should-cost`

## Status

`candidate`

## Plain-English Summary

Phase 2b — the LAST multi-vendor Source insight. Phase 2 (#4572) landed the
multi-vendor fact model (the `vendor_lever` composite + additive `entityRefColumns`
support) and flipped **Responses coverage** live. This release flips the second
Shape-2 insight, **Evaluation should-cost**, live from real per-vendor bids.

Evaluation should-cost is "the cheapest bid is a trap": the vendor cheapest on
HEADLINE price often loses once the retained-client cost its model pushes back on the
buyer and its weak-SLA-credit risk are priced in, so the lowest normalized TCO — not
the lowest sticker price — is the real winner. It shipped as a MODEL (illustrative
Vendor A/B/C) because no per-vendor bid fact existed. This release makes it live.

- **Three new per-vendor bid signal facts** in `DOWNSTREAM_SIGNAL_FACT_SPECS`, all
  `entity_kind='vendor'` (already an allowed kind — **NO new entity kind, NO
  migration**), each keyed by the vendor id in `entity_ref`:
  - `vendor_headline_bid` (`usd`) — the vendor's stated / list price over the term;
  - `vendor_retained_fte_delta` (`fte`) — the retained client/SME FTE the vendor's
    model assumes (a plain count);
  - `vendor_sla_credit_cap_pct` (`pct`) — the max fee-pool share recoverable as SLA
    credits (whole number).
  These are NEW keys distinct from `CONTRACT_TERMS_V1`'s `retained_fte_delta` /
  `credit_cap_pct` (those feed the transition + SLA value LEVERS; these are the
  should-cost normalization SIGNAL). Merged into the derived catalog with full specs
  (keeps the "undescribed key throws" guard), exempt from the "every catalog key is a
  lever input" invariant.
- **New template `VENDOR_BIDS_V1`** — `rowEntity: 'vendor'`, single
  `entityRefColumn: 'Vendor'` (reusing the existing single-column path — bid line
  items are per-vendor, **not** the composite per-vendor×lever path), with three fact
  columns (`Headline Bid (USD)`, `Retained FTE Delta`, `SLA Credit Cap (%)`). One row
  per vendor. Registered in `TEMPLATE_FACT_MAPS`. The bidding-vendor set is DERIVED
  from the distinct `Vendor` values (same rows-as-registry decision as Phase 2).
- **`buildShouldCostModelInsight` flips LIVE** when vendor-bid facts exist: it reads
  each vendor's real bid and runs the SAME deterministic normalization the model
  demonstrates (headline + retained-FTE debit at a fixed loaded cost + weak-SLA-credit
  risk vs a benchmark cap → normalized TCO), ranks the complete bids, and surfaces the
  trap (cheapest headline ≠ lowest normalized TCO) FROM the real facts.
  `provenance: 'live'` / `isModel: false` when ≥1 vendor-bid fact exists; the honest
  MODEL is preserved unchanged when none exist. A vendor missing an input is shown
  honestly as needs-evidence and is never ranked as the winner — never fabricated.

No value-lever economic math changed; the other insights, the gate engine, the
baseline guard, aVa, and the composite `vendor_lever` path are untouched. Everything
stays behind `source_analytics`. Deterministic, no LLM.

## Layer Impact

- `global-control-lane`: shared Source app behavior. Three new signal facts on the
  already-allowed `vendor` entity kind; one new intake template (`VENDOR_BIDS_V1`) on
  the existing single-column entity-ref path; a new Evaluation-stage scaffold with one
  dropzone task; a new per-vendor bid read (`readVendorBids`); the should-cost insight
  reading it (now carrying `isModel` + optional per-vendor `needsEvidence`); and the
  renderer keying its badge off `isModel` and rendering a needs-evidence marker.
  Everything stays dark behind the existing `source_analytics` feature flag;
  un-enrolled tenants see no change.
- `client-data-lane`: **NO migration.** `entity_kind='vendor'` is already an allowed
  value in the `source_event_facts` CHECK (present since before this branch), so the
  three new signal facts persist with no schema change. No VNet migrate job is
  required by this release.

## Client Applicability

- All clients / all tenants: no — this feature is gated by the `source_analytics`
  feature flag and is inert for any tenant not enrolled in it. When a tenant IS
  enrolled, the change reaches that tenant's Source Evaluation stage for every event
  (it is not further client-scoped).
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab) receive
  it; all other tenants receive nothing.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/fact-catalog.ts` — add the three per-vendor bid specs to
  `DOWNSTREAM_SIGNAL_FACT_SPECS`: `vendor_headline_bid` (usd), `vendor_retained_fte_delta`
  (fte), `vendor_sla_credit_cap_pct` (pct), all `entity_kind='vendor'`, source
  `extracted_vendor`. No entity-kind change (vendor already allowed).
- `src/lib/source/facts/template-fact-map.ts` — new `VENDOR_BIDS_V1` template
  (`rowEntity: 'vendor'`, `entityRefColumn: 'Vendor'`, three columns → the three bid
  signals), registered in `TEMPLATE_FACT_MAPS`. Single-column path reused unchanged.
- `src/lib/source/facts/event-facts-reader.ts` — new `readVendorBids`: per-vendor
  newest-non-stale read of the three `vendor`-kind bid facts, keyed by the vendor id in
  `entity_ref`, deriving the vendor set; a missing input stays undefined (never
  fabricated); tenant-scoped (RLS).
- `src/lib/source/facts/view/step-insight-builder.ts` — `buildShouldCostModelInsight`
  takes an optional `VendorBidSignal` and flips live vs model; a deterministic
  per-vendor `normalizeVendorBid` (headline + retained-FTE debit at $195k/FTE +
  weak-SLA-credit risk vs a 15% benchmark) + a live ranking/headline builder that
  surfaces the trap and lists needs-evidence vendors without ranking them;
  `BuildStepInsightInput.vendorBids` threaded through `buildStepInsight`.
- `src/components/source/canvas/analytics/view-model.ts` — add `isModel` to
  `ShouldCostInsightView` and optional `needsEvidence` to `ShouldCostVendorView`.
- `src/components/source/canvas/analytics/insights/ShouldCostInsight.tsx` — badge keys
  off `insight.isModel` (was hardcoded `isModel`); render a per-vendor needs-evidence
  marker when a live bid is incomplete.
- `src/components/source/canvas/analytics/sample-view-model.ts` — new
  `SAMPLE_EVALUATION_STAGE` scaffold with the vendor-bids dropzone task
  (`factTemplateCode: 'VENDOR_BIDS_V1'`).
- `src/lib/source/facts/view/stage-analytics-builder.ts` — select the Evaluation
  scaffold for the Evaluation stage.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — on the Evaluation stage, read
  the vendor-bid signal (`readVendorBids`) and pass it to `buildStepInsight` (inside
  the existing `source_analytics`-gated branch).
- Tests: `fact-catalog.test.ts` (the three vendor-bid signals resolve under
  `entity_kind='vendor'` with the right units + source; no migration implied),
  `template-fact-map.test.ts` (`VENDOR_BIDS_V1` single-column binding of the three
  facts + the exactly-one-entity-ref invariant),
  `step-insight-builder.test.ts` (live normalization + trap detection from real
  per-vendor bids; no-flip case; needs-evidence for a missing input; live-empty; model
  when absent/undefined), `ShouldCostInsight.test.tsx` (renders LIVE badge from real
  bids while still surfacing the flip; MODEL badge unchanged).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran to
  completion (157-line log, 124 pre-existing `error TS` lines, byte-identical to the
  main baseline captured before the change). **Net-new = 0**: grepping the error log
  for every file changed in this branch returns no matches; the log is non-empty (157
  lines). **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `fact-catalog.test.ts`, `template-fact-map.test.ts`,
  `step-insight-builder.test.ts`, `ShouldCostInsight.test.tsx` (90 tests) +
  `structured-map.test.ts` (27 tests, unchanged) — all green; existing tests stay
  green. **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**
- No migration in this release (nothing to apply via the VNet job), so no VNet
  migrate-job note is required.

## Rollout Plan

Merge to `main` via squash. **No DB migration** — `entity_kind='vendor'` is already an
allowed value, so the three new signal facts persist with no schema change and no VNet
migrate job. No traffic shift, no runtime image change, no flag change in this PR — the
feature rides the existing `source_analytics` flag. No deploy is performed by this
change.

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
  Lakeshore Evaluation-stage upload of a `VENDOR_BIDS_V1` sheet flipping should-cost to
  live per-vendor normalized TCO. Not claimed in this record.

## Rollback Plan

Revert the PR. No migration was applied, so there is nothing to unwind at the DB layer.
Reverting the app code fully disables the feature; any `vendor_headline_bid` /
`vendor_retained_fte_delta` / `vendor_sla_credit_cap_pct` rows already written become
inert (no reader consumes them once the code is reverted).

## Audit Evidence

- PR URL: see the branch `feat/source-evaluation-should-cost` PR on
  `abarva-platform/abarva`.
- Design doc: `docs/build/source-multivendor-fact-model.md` (build order item 2 —
  Evaluation should-cost per-vendor bid line items, `entity_kind='vendor'`,
  `VENDOR_BIDS_V1` single-column template — the shape governed here).
- tsc / eslint / jest output captured in the PR description and this record's QA section.
- No migration file added or applied.

## Known Gaps

- Shape 3 (time-series — Value realization) remains declared but not built.
- The live should-cost renders over the existing grouped/stacked bar chart with an
  additive per-vendor needs-evidence marker; a richer bid-tabulation matrix is deferred
  (kept additive to avoid a renderer refactor of the existing chart + test).
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`.
