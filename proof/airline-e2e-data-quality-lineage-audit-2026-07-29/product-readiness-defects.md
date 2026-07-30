# Product-readiness defects — airline-demo-new

Audit date: 2026-07-29. Scope note read first: **`airline-demo-new` is not wired into any
product surface today.** `src/config/tenants/CANONICAL_TENANTS.ts` was checked on the main
checkout (`feat/tower-tfamily-mart`) and on the most complete data-plane worktree
(`nexus-tenant-sunset-20260729`, branch `codex/fix-aca-hygiene-transient-20260729`); neither
registers a tenant keyed `airline-demo-new`. The only registered airline tenant is
`skyharbor-air` ("Airline Demo" / SkyHarbor), a **different, older, already-live** tenant — do
not confuse the two. This matches the source-corpus freeze manifest's own
`disallowed_actions_until_baseline_publication: wire_home_intelligence_source_moves_or_tower_to_new_tenant_baseline`
and the foundation-closure record's `next_allowed_gates` (governed HTTP provider binding and
Clerk identity mapping are listed as **not yet done**).

**Consequence for this section**: there are currently no live end-user-visible defects for
`airline-demo-new`, because there is no end-user surface pointed at it. What follows are
forward-looking defects — conditions in the data plane and consumption/Cube layer that **would**
become the listed UX blockers the moment this tenant is wired to Home/Source/Intelligence/Moves/
Tower/Cube/Superset/Observable, based on the evidence gathered for the full audit (see the main
report and `semantic-defects.csv` for source citations).

## Blockers that would surface immediately on wiring

1. **Empty KPI/metrics panels.** `metric_catalog_v1` (and the registry's `metric_observation_v1`)
   both show zero populated rows against a 420-row KPI source family that matches the planned
   scale exactly. Any KPI tile in Home/Tower would render as an empty/`not_measured` state on
   day one, not as a partial-coverage state — see `semantic-defects.csv` SD-06.

2. **False "no critical gaps" signal.** `consumption.evidence_gap_v1` is 0 rows despite a
   confirmed mapping from 650 risk-register rows. The Cube measure `open_critical_gap_count`
   reads this table and is reported as "passed" parity — but 0 Cube rows matching 0 Postgres
   rows is not evidence the underlying risk data ever reached the projection. An executive
   panel showing "0 open critical gaps" for an airline that documented 650 risks (including
   high-severity supplier-concentration risk) is a materially misleading UX outcome, not a
   clean bill of health — SD-05.

3. **Undocumented tables feeding real UI numbers.** `data_product_inventory_v1` (6,580 rows,
   feeds the Cube `DataAnalyticsEstate.data_product_count` measure and, per the source strategy
   docs, the Home "domain summary" surface) has no entry in
   `CONSUMPTION_PROJECTION_REGISTRY.json`'s 14 governed objects. If Home renders a number from
   this table today, it is rendering from an ungoverned source with no `build_gate`,
   `partial_data_behavior`, or `required_metadata` contract behind it — SD-04.

4. **Vendor concentration tile would always be empty/null.** The "Material vendors" tile in the
   (currently `status: dormant`) Operations & Vendor Exposure package is bound to
   `vendor_concentration_pct`, whose Cube SQL body is the literal string `"null"` — a stub, not
   an implementation. If this dormant package is ever activated without fixing the measure, the
   tile will silently show null forever — SD-12.

5. **Relationship graph would render meaningless nodes.** 3,000 of the 60,000 relationship rows
   originate from `capability` values (free text like "station recovery") with no backing
   catalog anywhere in the 25-file source corpus. If the accepted subset of these reaches
   `relationship_node_v1`/`relationship_edge_v1`, the Home Relationships graph would show nodes
   with no evidence trail back to any source document — exactly the "relationship graphs with
   meaningless nodes/edges" defect category this audit was asked to watch for — SD-08.

## Naming/label defects that would read as raw or unpolished

6. **`application_type='regional duplicate'`** — a data-quality/dedup flag stored as if it were
   a business taxonomy value (application-platform-inventory.csv, `APP-AIRDN-0001`). If surfaced
   verbatim in a UI dropdown or filter, this reads as an internal QA artifact, not a real
   category — SD-01.

7. **Inconsistent `service_tower` labeling** between linked records (an application and its own
   contract disagree on service tower for the same `contract_id`) would produce contradictory
   tower groupings in Tower/Source views if surfaced without reconciliation — SD-02.

8. **`parser-visible-source-manifest.csv` covers only 10 of ~25 landed source files** — this is
   a design-time documentation gap, not a live rendering defect, but it means the one
   human-readable "what did the client actually give us" manifest in the corpus package would
   understate the true source inventory by more than half if shown to a client during a review
   session — SD-11.

## Dashboard/semantic-binding drift (Superset/Observable, currently dormant)

9. `clients/shared/22-operations-vendor-analytics/SEMANTIC_BINDING.json` references Cube domain
   names `RiskControlPortfolio` and `ProgramPortfolio` that do not exist in the shipped
   `knowledge_consumption_model.yml` (which defines a single combined `ProgramRiskControl`
   model). This is currently harmless only because the package's own `status` field is
   `"dormant"` — activating it without fixing the binding would break tile resolution
   immediately — SD-13.

## What is correctly absent (not a defect)

- No canary/admin/internal text, no disabled aVa rail, and no fixture-fallback behavior were
  found for this tenant, because nothing renders it yet. `PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md`
  correctly defines a `not_measured`/`withheld`/`candidate` vocabulary that, if honored by the
  eventual UI layer, would prevent the "counts without executive meaning" and "missing becomes
  zero" failure modes for the _other_ parts of the estate that did land cleanly (applications,
  vendors, relationships). The risk is specifically that `evidence_gap_v1=0` and
  `metric_catalog_v1=0` look identical, at the data layer, to "no gaps, all is well" — the empty
  vs. zero distinction the contract demands has to be enforced by whichever renderer eventually
  consumes these tables, and that renderer does not exist yet to verify.
