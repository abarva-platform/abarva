# Knowledge Cube Render Gates — airline-demo-new

Covers every measure/dimension defined in `clients/shared/21-phase3c2e-executable-data-layer/cube/
knowledge_consumption_model.yml` (7 models, 15 measures — worktree `nexus-phase3c2e-execution`), cross-checked
against `proof/airline-e2e-data-quality-lineage-audit-2026-07-29/cube-lineage.csv` for this tenant's actual
parity status per measure. **A render gate is a condition that must independently re-verify true at query
time — it is never satisfied by a `passed` parity flag alone**, because this audit found that flag can be
`passed` while meaning "0 Cube rows equal 0 Postgres rows," which is parity, not correctness (see
`open_critical_gap_count` below).

Design note surfaced while building this document: `clients/shared/20-phase3c2d-consumption-contracts/
CUBE_MEASURE_AND_DIMENSION_CATALOG.xlsx` (the design catalog) and the shipped `knowledge_consumption_model.yml`
have **independently drifted from each other** — the design doc still lists `RiskControlPortfolio` and
`ProgramPortfolio` as two separate Cube domains and defines different measures (`entity_count`,
`legacy_platform_count`) than what actually shipped. This predates and is independent of any
airline-demo-new-specific data defect; it is called out inline below wherever it affects a gate.

---

## EnterpriseKnowledge

### `evidence_coverage_pct`

- **SQL:** `evidence_coverage * 100` on `consumption.enterprise_brief_v1`
- **Cube parity status today:** `cube_gap` — not reported among the closure record's 4 `passed` or 4
  `not_applicable` measures; status unaccounted for (`cube-lineage.csv`).
- **Render gate:** `enterprise_brief_v1` row exists for (tenant, baseline) AND `evidence_coverage` is a
  non-null numeric between 0 and 1 AND the row's `authority_state = accepted`.
- **Safe empty state:** render "Coverage not yet certified" — never a 0% bar, since 0% and "not computed" are
  visually indistinguishable to an executive reader and this measure has no confirmed parity status either way.

### `open_critical_gap_count`

- **SQL:** `COUNT(*)` on `consumption.evidence_gap_v1` filtered `severity = 'critical'`
- **Cube parity status today:** reported `passed` — **but this is the audit's central warning case.**
  `evidence_gap_v1` is 0 rows against a confirmed 650-row risk mapping (SD-05). A `passed` parity check
  between 0 Cube rows and 0 Postgres rows is not evidence any real risk data reached the projection.
- **Render gate:** `evidence_gap_v1` total row count (unfiltered) must be independently re-verified `> 0` and
  reconciled against the 650-row `risk-register.csv` source **in addition to** the Cube/Postgres parity check
  passing. Parity passing alone is explicitly **not sufficient** for this measure.
- **Safe empty state:** if the independent re-verification has not been performed, render "Gap count withheld
  — pipeline re-verification pending," never "0 open critical gaps." This is the single highest-consequence
  render gate in this document: shipping this measure ungated is what SD-05 calls "a materially misleading
  UX outcome, not a clean bill of health."

---

## ApplicationPortfolio

### `application_count`

- **SQL:** `COUNT(application_id)` on `consumption.application_inventory_v1`
- **Cube parity status today:** `passed`, and independently corroborated — 1,405 published of 1,495 source
  rows, 6.0% attrition, "Plausible" (best-corroborated application-family measure in the whole audit).
- **Render gate:** `application_inventory_v1` populated with `content_hash` present.
- **Safe empty state:** N/A for this measure today (closest to render-ready of anything in this document) —
  still gate on `content_hash` presence so a future re-load with a stale hash cannot silently render.

### `critical_application_count`, `end_of_life_application_count`, `unowned_application_count`

- **SQL:** each a `COUNT WHERE` filter on `criticality`, `lifecycle_state`, `owner_ref` respectively.
- **Cube parity status today:** `not_reported` for all three (`cube-lineage.csv`) — `lineage_gap`. Could not
  confirm the sampled source CSV even carries a `criticality` field.
- **Render gate:** the specific filtered field (`criticality` / `lifecycle_state` / `owner_ref`) must be
  confirmed present and populated on `application_inventory_v1` rows, independently of the base
  `application_count` measure being ready — a table being populated for identity fields does not imply its
  derived-filter fields are populated.
- **Safe empty state:** hide these three measures from any Cube-backed tile until each field's presence is
  independently confirmed; do not assume they inherit `application_count`'s readiness.

---

## TechnologyEstate

### `integration_count`

- **SQL:** overrides `sql_table` to `consumption.relationship_edge_v1`, filtered to relationship types
  `integrates_with` / `feeds` / `depends_on` — **it does not read `technology_estate_v1` despite the model's
  own name**, an internal inconsistency in the YAML independent of tenant data.
- **Cube parity status today:** `not_reported`, `cube_gap`. No confirmed 1:1 mapping between the 6,200-row
  `integration-middleware-inventory.csv` source and this filtered subset of `relationship_edge_v1`.
- **Render gate:** the three named relationship types must be confirmed populated in `relationship_edge_v1`
  with a documented, row-count-proven fold from the 6,200-row integration source before this measure renders
  as anything but "Not yet reconciled."
- **Safe empty state:** omit the tile; do not substitute `technology_estate_v1`'s row count (1,405 — itself
  unexplained, see `investigate_before_register` in the registry amendments) as a stand-in.

---

## DataAnalyticsEstate

### `data_product_count`

- **SQL:** `COUNT(data_product_id)` on `consumption.data_product_inventory_v1`
- **Cube parity status today:** `not_reported`, `cube_gap`. `data_product_inventory_v1` is **not** one of the
  14 objects declared in `CONSUMPTION_PROJECTION_REGISTRY.json` at all (SD-04) — this is contract drift, not
  a data-not-ready state.
- **Render gate:** `data_product_inventory_v1` must be formally registered in
  `CONSUMPTION_PROJECTION_REGISTRY.json` with a real `source_publication` (see
  `KNOWLEDGE_PROJECTION_REGISTRY_AMENDMENTS.json`) before this measure may be treated as governed, regardless
  of whether the underlying 6,580 rows exist.
- **Safe empty state:** treat as `PROJECTION_MISSING` at the governance layer even though rows exist — render
  "Not yet a governed measure," not a live count from an ungoverned table.

---

## VendorContractPortfolio

### `vendor_count`

- **SQL:** `COUNT DISTINCT payload->>'vendor_ref'` on `consumption.vendor_contract_inventory_v1`
- **Cube parity status today:** `passed`, corroborated (420 = 420 exact match to `vendor-register.csv`) — the
  best-corroborated vendor-family measure.
- **Render gate:** `vendor_contract_inventory_v1` populated with `content_hash` present.
- **Safe empty state:** N/A today; still gate on `content_hash`.

### `active_contract_count`, `contract_renewal_exposure`

- **SQL:** count/sum filtered by `contract_state` / `renewal_exposure_usd`, both assuming **contract grain**.
- **Cube parity status today:** `not_reported`, `lineage_gap`. The underlying table is proven at **vendor**
  grain (420 rows), not contract grain (820 real contract rows) — SD-07.
- **Render gate:** the table's grain must be independently confirmed contract-level (820-row-consistent)
  before either measure renders; a vendor-grain table cannot correctly answer a contract-level count or sum.
- **Safe empty state:** render "Contract-level detail not yet governed — showing vendor-level committed value
  only" rather than a contract count computed against a vendor-grain table.

### `vendor_concentration_pct`

- **SQL:** literal string `"null"` in the shipped YAML — **not a computed measure, a stub** (SD-12).
- **Cube parity status today:** `cube_gap` by construction; cannot ever pass parity since it computes nothing.
- **Render gate:** this measure must not render under any condition until its SQL body is replaced with a
  real `MAX(spend)/SUM(spend)` computation (per the design catalog's own definition) backed by accepted
  contract + metric evidence.
- **Safe empty state:** the "Material vendors" tile this measure would back (in the currently `dormant`
  Operations & Vendor Exposure package) must render "Not yet computed," never a blank/0% bar that could be
  misread as "no concentration risk." **Do not activate that package at all until this is fixed (SD-12) and
  its dashboard binding's Cube-domain-name mismatch is fixed (SD-13).**

---

## RelationshipGraph

### `accepted_relationship_count`

- **SQL:** `COUNT WHERE authority_state = 'accepted'` on `consumption.relationship_edge_v1`
- **Cube parity status today:** `passed`, and the best-corroborated relationship-layer result in the entire
  audit (60,000 source rows plausibly consolidate to 16,605 published edges, order-of-magnitude consistent
  with the working ledger).
- **Render gate:** in addition to parity passing, `endpoint_catalog_backed = true` must hold for every counted
  row (see registry amendment on `relationship_edge_v1`) — today an unknown fraction of the 16,605 accepted
  edges may include `capability`-origin (SD-08) or `service_tower`-origin (SD-14) endpoints with no backing
  catalog, which parity alone would not catch.
- **Safe empty state:** if `endpoint_catalog_backed` cannot yet be computed, render the count with a footnote
  ("includes an unverified number of label-only endpoints") rather than presenting it as fully clean — this is
  the one measure closest to being genuinely render-ready, and the footnote is a stopgap, not a permanent gate.

---

## ProgramRiskControl

### `program_at_risk_count`

- **SQL:** `COUNT WHERE` a risk-status filter on `consumption.module_knowledge_packet_v1`
- **Cube parity status today:** `cube_gap` — `module_knowledge_packet_v1` is registered but absent from the
  12-object populated breakdown entirely; the 190-row program source family has no confirmed landing anywhere.
- **Render gate:** `module_knowledge_packet_v1` confirmed populated for the program object type, independently
  re-verified against the 190-row `program-portfolio.csv` source.
- **Safe empty state:** omit the tile entirely; do not render 0 as "no programs at risk."

### `decision_readiness_score`

- **SQL:** `AVG` of a `decision_readiness_score` payload field on the same table.
- **Cube parity status today:** `cube_gap`, same underlying-table gap as above.
- **Render gate:** same as `program_at_risk_count`, plus: the `decision_readiness_score` field itself must be
  confirmed to exist in the payload and to be computed from the ratified readiness taxonomy (GAP-05 in the
  gap register) rather than an ad hoc per-program guess.
- **Safe empty state:** omit the tile.

**Design-doc drift note:** `CUBE_MEASURE_AND_DIMENSION_CATALOG.xlsx` defines this pair of measures under two
_separate_ domains, `ProgramPortfolio.program_at_risk_count` and `RiskControlPortfolio.open_critical_gap_count`
— the shipped YAML combines them into one `ProgramRiskControl` model. `clients/shared/
22-operations-vendor-analytics/SEMANTIC_BINDING.json` was written against the design doc's two-domain shape
and references `RiskControlPortfolio`/`ProgramPortfolio` names that do not exist in the shipped model (SD-13).
**Any render-gate check for this dashboard binding must resolve to the real domain name, `ProgramRiskControl`,
before that package is ever activated** — currently harmless only because the package is `dormant`.

---

## Domains named in the contract but not shipped (`SourceEvent`, `TowerOutcomes`, `KnowledgeCoverage`)

`CUBE_SEMANTIC_MODEL_CONTRACT.md`'s "Initial domains" list names 10 domains: EnterpriseKnowledge,
ApplicationPortfolio, TechnologyEstate, DataAnalyticsEstate, VendorContractPortfolio, ProgramPortfolio,
RiskControlPortfolio, SourceEvent, TowerOutcomes and KnowledgeCoverage. The shipped
`knowledge_consumption_model.yml` implements 7 (folding ProgramPortfolio+RiskControlPortfolio into
`ProgramRiskControl` as noted above) and **does not implement `SourceEvent`, `TowerOutcomes`, or
`KnowledgeCoverage` at all.**

- **`KnowledgeCoverage.evidence_coverage_pct`** (the design catalog's version, distinct from
  `EnterpriseKnowledge.evidence_coverage_pct` above) would back the Evidence & gaps "Coverage by domain" table
  directly — **render gate: this Cube domain must first be implemented in the YAML before any measure under
  it can have a render gate at all.**
- **`SourceEvent.decision_readiness_score`** — the design catalog states `null_behavior: "null until Source
evidence families loaded"`, i.e. this measure is _designed_ to be commonly null; that is a correct,
  contract-honest null behavior, but the domain does not exist yet to enforce it.
- **`TowerOutcomes`** — needed for the Module Handoffs "Receiving-module confirmation" matrix row (Tower must
  track a handed-off outcome against Knowledge's evidence and readiness); does not exist in the shipped model.

**Render gate for all three:** none can render today under any condition — they require Cube-model
implementation work independent of any airline-demo-new data-plane fix.

---

## Cross-cutting render-gate rule (applies to every measure above)

Per the lineage audit's own summary: **7 of the 15 shipped measures have no reported parity status at all**
(neither `passed`, `failed`, nor explicitly `not_applicable`). A missing parity status must be treated
identically to a `failed` one for render-gate purposes — **absence of a parity result is not evidence of
correctness** and must never be read as an implicit pass. Every render gate in this document therefore
requires an explicit, current, re-derivable parity result, not merely the absence of a reported failure.
