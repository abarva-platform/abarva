# Source Workspace — fixture / fabrication audit

Scope: `src/app/(maestro)/source/preview/workspace/`, as built before this pass.
Produced before writing the live-data binding, per the binding-work request.

Ground truth for what's real: `src/lib/source/data-model/types.ts` (field names
verified against a real Postgres export, SkyHarbor_Postgres_Layers_Cube_Audit_20260802T182921)
and the already-shipped real pages `SourceVendorPortfolioPage.tsx` /
`SourceContract360Page.tsx` / `SourceSourcingOpportunitiesPage.tsx`.

## Legend

- **REAL** — has a governed `source.*` / `tower.*` / `doc.*` counterpart; bind directly.
- **DERIVE** — no dedicated table, but computable from real rows via an existing
  pure function in `vendor-contract-portfolio.ts` / `sourcing-opportunities.ts`.
- **REMOVE** — fabricated category with no governed source; drop rather than fake.
- **RELABEL** — real-ish concept, but the illustrative version overstates what's proven;
  narrow the label/claim to what the schema actually supports.

## `data.ts` constants

| Constant                                                             | Verdict                      | Notes                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOVERNED.{contracts,vendors,acv,spend,committed,autoRenew}`         | DERIVE                       | `summarizePortfolio()` over real `contract_vendor_360` rows.                                                                                                                                                                                                                                                                                                                                        |
| `GOVERNED.{appsExplicit,appsInferred,appsUnresolved}`                | DERIVE                       | `tierApplicationScopeByConfidence()` counts, real `contract_application_scope` rows.                                                                                                                                                                                                                                                                                                                |
| `GOVERNED.programs`                                                  | DERIVE                       | distinct `initiative_ref` count from `contract_initiative_dependency`.                                                                                                                                                                                                                                                                                                                              |
| `GOVERNED.docs`                                                      | DERIVE                       | count of `doc.extraction` rows for the tenant (not a fabricated 46).                                                                                                                                                                                                                                                                                                                                |
| `VENDORS[]` (28 illustrative vendors: Accenture, Microsoft, AWS…)    | REMOVE                       | replace entirely with real `contract_vendor_360` rows / `vendor_contract_portfolio`.                                                                                                                                                                                                                                                                                                                |
| `CONTRACTS[].{transition,modernization,ops,skills,region}`           | REMOVE                       | no governed column backs "transition lead time," "modernisation fit," "ops state," "skill scarcity," or "region." Only `concentration_note` is real, and it only backs 2 of these (skill/regional dependency) via substring match, already inside `computeContractLeverageSignals`.                                                                                                                 |
| `CONTRACTS[].{benchmark,marketTest,alts,evidence}`                   | REAL                         | maps to `benchmarking_clause`, (no real market-test column — REMOVE), `alternatives_available`, `source_confidence`/conflict flags.                                                                                                                                                                                                                                                                 |
| `VS{}` (per-contract value build-up)                                 | REMOVE                       | hand-picked numbers with no governed source. Rebuild from real `linked_budget_amount/linked_actual_amount` (financial exposure) and `service_credits_earned/claimed` (operational performance), honestly null where those rows don't exist.                                                                                                                                                         |
| `HEAT_COLS`, `HEAT_VENDOR`, `HEAT_CONTRACT`                          | REMOVE                       | 11-dimension strong/moderate/weak/unknown band matrix with hand-picked codes per vendor/contract — no formula, no governed source. Drop the heatmap; keep the leverage matrix (X/Y scatter), which IS real via `computeContractLeverageSignals`.                                                                                                                                                    |
| `OPPS[]` (readiness states, confidence, addressable spend, rule IDs) | REMOVE / DERIVE              | `computeSourcingOpportunities()` is real but returns only `{contractId, vendorRef, vendorName, contractName, annualValue, reasons, rationale}` — no `readiness` (act_now/evidence_required/…), no `confidence` label, no `addressable` spend, no `rule` version. Rebuild the Opportunities lens around the real 3-reason shape; do not keep the fabricated readiness/confidence/addressable fields. |
| `FINDINGS[]` (4 hand-written agenda findings w/ rule citations)      | REMOVE                       | no `narrative.finding_result` table confirmed to exist. Replace with narrative sentences generated live from real aggregates (same pattern as the Leadership Position block, which is already honest).                                                                                                                                                                                              |
| `COVERAGE[]` (14-domain hand-written coverage table)                 | RELABEL                      | rebuild per-domain state from whether the corresponding read-adapter call actually returned rows for this tenant (Available/Partial/Missing), not hand-written prose with invented counts.                                                                                                                                                                                                          |
| `SCOPE{}` (per-contract application table)                           | REAL                         | maps to `listContractApplicationScope()` + `tierApplicationScopeByConfidence()`. Field names differ slightly (`hosting_model`, `criticality`, `lifecycle_state`, `annual_run_cost`, `modernization_plan`) — remap, don't invent.                                                                                                                                                                    |
| `DOCS{}` (fabricated `DOC-4411` style rows, "Indexed"/"Not indexed") | REMOVE                       | replace with real `doc.extraction` rows (`source_file_id`, `source_page`, `concept_ref`, `confidence`, `review_state`).                                                                                                                                                                                                                                                                             |
| `PROGRAMS[]` (Conflict/Aligned + hand-written note)                  | REAL-ish                     | maps to `contract_initiative_dependency` (`initiative_project_name`, `status`, `major_risk_constraint`, `decision_needed`). No real "Conflict/Aligned" binary — show the real text fields instead of a fabricated flag.                                                                                                                                                                             |
| `SYS_ROWS`, `CONFLICT_ROWS`                                          | REMOVE / RELABEL             | `SYS_ROWS` (source system table) can be rebuilt honestly from which read-adapter calls returned rows. `CONFLICT_ROWS` has a real analogue: `annual_value_conflict_flag` / `total_committed_value_conflict_flag` on `contract_vendor_360` — rebuild from rows where those are `true`, don't hand-write four illustrative conflicts.                                                                  |
| `EVENT_STAGES`                                                       | KEEP AS DESIGNED-UNAVAILABLE | the design's own framing ("designed · unavailable," no sourcing-event data loaded) is already honest — no real `SourceEventExecution` table exists anywhere, illustrative or real. No change needed.                                                                                                                                                                                                |

## Local calculations to delete from React (`viewModel.tsx`)

All of these duplicate a real, tested pure function and must be replaced by a call
into `vendor-contract-portfolio.ts` / `sourcing-opportunities.ts` instead of being
recomputed client-side:

- `enrich()` / `reconcile()` → `computeRenewalExposure()`, real notice/expiry math (already handles "browser clock never drives renewal math" correctly for both).
- `concentration()` → `computeVendorConcentration()`.
- `weakSignals()` → `computeContractLeverageSignals()`.
- Sourcing-opportunity grouping in `buildViewModel.ts` → `computeSourcingOpportunities()`.
- Application-scope tiering → `tierApplicationScopeByConfidence()`.

## Post-binding accuracy check (2026-08-03, against the lab Cube proof)

Cross-referenced this binding against `source-sourcing-context-proof-20260803-final.zip`
(SHA-256 `429bd4fda8c6b8c824ccf6e6cb1e25e767604b57a0fadf8c092c5ce0e99c96e6`), the lab
operator's Cube semantic-model verifier run (`ok: true`, 8 cubes, 9 consumption
views, tenant `skyharbor_global`). Zero discrepancies against numbers this
binding already produces (119 contracts, 28 vendors, $1.4805B annual value;
`sourcing_contract_scope` 0 explicit / 3,373 inferred, matching this binding's
`tierApplicationScopeByConfidence` default; `sourcing_opportunities` real but
0 rows, matching the decision to compute opportunities client-side rather
than read a table).

One real gap surfaced: the verifier shows `consumption.sourcing_contract_v1`
(the view backing the `sourcing_contracts` cube) carries two governed
measures this binding does not yet surface anywhere —
`notice_90_day_count` (contracts with `notice_period_days <= 90`, a static
contract-term attribute, **not** the same thing as this binding's
`computeRenewalExposure(90).expiringWithinWindow`, which is end-date
proximity to the as-of date) and `average_confidence` / on
`sourcing_contract_scope`, `average_relationship_confidence`. This binding
only has the verifier's aggregate output for these views, not their full
row-level column schema, so it does not read from `consumption.sourcing_*`
directly — doing so without the real schema would risk guessing column
names. Flagged as a follow-up: add read-adapter functions for the
`consumption.sourcing_*` views once their schemas are exported the same way
`source.*` was (see `types.ts`'s header comment for the pattern), and decide
whether the curated Cube-backing views should replace the raw `source.*`
reads this binding currently uses.

## What stays client-side (presentation, not business calculation)

SVG chart geometry (Pareto bar layout, timeline layout, matrix quadrant layout,
context-map band layout), text measurement/fitting, tooltip positioning, explorer
tree open/closed UI state, tab navigation, responsive breakpoints, Ask aVa panel
chrome. None of these compute a financial or leverage figure — they lay out
figures the adapter already computed.
