# Knowledge UI Data Model Gap Register — airline-demo-new

**Companion to:** `KNOWLEDGE_UI_DATA_BINDING_MATRIX.csv` (62 rows, all 10 review areas).
**Source of truth for data-plane facts cited here:** `reports/airline-e2e-data-quality-lineage-audit-2026-07-29.md`
and its proof bundle `proof/airline-e2e-data-quality-lineage-audit-2026-07-29/` (`semantic-defects.csv` = SD-01
through SD-15, `cube-lineage.csv`, `product-readiness-defects.md`).
**Source of truth for the intended contract:** `clients/shared/20-phase3c2d-consumption-contracts/` (on worktree
`nexus-consumption-3c2d`) and `clients/shared/21-phase3c2e-executable-data-layer/` (on worktree
`nexus-phase3c2e-execution`) — **neither directory exists on `feat/tower-tfamily-mart`**; this register was built
by reading them on their own worktrees, same environment-mismatch finding the lineage audit itself flagged.

This register does not repeat the matrix row-by-row. It groups the 62 matrix rows into **13 distinct underlying
gaps** — the same gap blocks many UI rows at once, and the point of a gap register is to fix the gap once, not
patch each symptom. Every gap below names every matrix row it blocks by component name and `ui_mode`.

Zero of the 62 matrix rows are `SUPPORTED_AND_RECONCILED` today. That is not a drafting choice — it is the
honest read of the lineage audit's own verdict ("not client-demo-ready") applied consistently to every UI
surface a client would actually see.

---

## How to read severity here

- **Blocker (P0)** — fixing this unblocks the largest number of matrix rows, or produces a materially
  misleading signal (a false "clean" state) if shipped as-is.
- **Structural (P1)** — a canonical-model gap. No amount of data-plane fixing closes this; it requires a
  ratified addition to the Enterprise Information Architecture (Layer 3) or its governed field contracts.
- **Governance/contract drift (P1)** — the data exists, but the contract that is supposed to govern it does
  not match reality. Fixing this is a registration/documentation act, not a data-plane rebuild.
- **Data-not-ready (P2)** — the projection and its contract are correctly specified; the pipeline that
  populates it has a confirmed defect.
- **Operational build (P3)** — legitimately UI-state, not canonical knowledge; blocked only by not being
  built yet, not by any data-model question.

---

## P0 — Blockers

### GAP-01 — `evidence_gap_v1` is 0 rows against a confirmed 650-row risk mapping (SD-05)

The single highest-fanout defect in the whole audit. `evidence_gap_v1` backs, directly or via rollup, **7
matrix rows**: Brief → _Condition strip_; Explore → _Risks and controls inventory table_; Evidence & gaps →
_Decision-readiness summary tiles_, _Decisions-and-what-closes-them list_, _Coverage-by-domain table_,
_Contradictions list_ (partially), _Open gaps list_; Cross-cutting → _Uncertified-gap-view notice_. Every one
of these would currently render a **false "clean" signal** — 0 open gaps, 0 critical risks, "everything is
decision-ready" — for a tenant that documented 650 real risk rows, including a high-severity
supplier-concentration risk. `cube-lineage.csv` confirms the Cube measure `open_critical_gap_count` is reported
`passed` parity, which the audit explicitly calls out as **not evidence the underlying risk data ever reached
the projection** — 0 Cube rows matching 0 Postgres rows passes a parity check trivially.

**Fix owner:** data-plane (Codex lane). **Not fixable from the UI layer** — no render-gate change makes zero
rows correct; the pipeline must actually be re-run and independently re-verified against the 650-row
`risk-register.csv` source.

### GAP-02 — KPI/metrics family: 420 source rows → 0 rows under any of 3 inconsistently-named tables (SD-06)

Blocks **5 matrix rows**: Explore → _Measures (KPIs) inventory table_; Current versus target → _Trajectory
chart_ (its historical half); Brief → _Benchmarks_ (needs a real tenant value to plot against a cohort bar);
aVa → _Global search_ (Measures result group); and indirectly every aVa answer or Brief interpretation that
would cite a measured value. Three different names are in play across the pipeline
(`metric_catalog_v1`, `metric_observation_v1` registered-but-unconfirmed, and the raw `kpi-sla-catalog.csv`) —
this is a naming/wiring defect, not a missing source.

**Fix owner:** data-plane. Requires picking **one** governed name and wiring the source through it end to end.

### GAP-03 — `consumption.module_knowledge_packet_v1` unpopulated for this tenant

Blocks **7 matrix rows**, and is the connective tissue for essentially every cross-module feature in the
prototype: aVa → _scope banner_, _answer card_, _refusal case_ (all three depend on the packet); Module
handoffs → _Handoff modal_, _Receiving-module confirmation_ (both — every one of Moves/Tower/Source/
Intelligence is declared in `MODULE_CONSUMPTION_MAPPING.xlsx` to consume this exact object); Explore →
_Programmes inventory table_; Decision readiness → _Readiness quadrant scatter_. The projection is registered
and its shape is well-specified (`AVA_KNOWLEDGE_PACKET_MAPPING.xlsx`), but the lineage audit reports it
"absent from the reported breakdown entirely" — likely 0 rows or unbuilt (Sec 2, Sec 8).

**Fix owner:** data-plane, after GAP-01/02/04/05 are closed (the packet would otherwise assemble from broken
inputs).

### GAP-04 — Two of the largest source families have no governed destination (SD-03, SD-04)

- **Infrastructure/cloud** (10,000 rows, the single largest source family in the whole corpus) has **no
  projection anywhere** — not in the registry, not in the actual published object counts. Blocks Explore →
  _Infrastructure and cloud inventory table_ entirely (`PROJECTION_MISSING`).
- **Data products** (1,250 source rows) are _governed_ to land in `domain_summary_v1` per
  `CANONICAL_TO_PUBLICATION_MAPPING.xlsx`, but the table the Cube model and the closure record actually read is
  a different, **undeclared** 6,580-row `consumption.data_product_inventory_v1`. This is contract drift, not a
  missing pipeline — the data exists, the governance doesn't. Blocks Explore → _Data products inventory table_.

**Fix owner:** data-plane for infra (needs a new projection + Cube model); governance/registry owner for data
products (needs `data_product_inventory_v1` registered in `CONSUMPTION_PROJECTION_REGISTRY.json` with a real
`source_publication`, or the Cube model stopped from reading an ungoverned table).

---

## P1 — Structural (canonical-model) gaps

### GAP-05 — No "readiness" taxonomy exists in the canonical model

The UI's 5-value readiness classification (Decision-ready / Directional / Blocked — missing input / Blocked —
sources disagree / Not assessed) appears throughout the prototype but is not a declared enum anywhere in
`baseline_metadata` (which only defines `authority_state` / `freshness_state` / `availability_state` — none of
which map 1:1 onto it). Blocks **5 matrix rows**: Brief → _Goals_, _Decision quadrant lanes_, _Condition strip_
(partially); Evidence & gaps → _Decision-readiness summary tiles_, _Decisions-and-what-closes-them list_. Even
once ratified, this taxonomy's inputs are GAP-01/GAP-02, so this is a two-layer fix.

**Fix owner:** canonical-model owner (ratify the enum + its derivation rule) then data-plane (wire GAP-01/02
first).

### GAP-06 — No "Decision" or "Contradiction" tracking object in the canonical model

Enterprise IA's Layer 3 object table (Organization / BusinessFunction / BusinessProcess / Capability /
Application / Platform / Vendor / Tool / Program / Initiative / AIUseCase / Risk / Metric / Evidence /
Interview) has no object for a trackable **Decision** (owner, readiness, what closes it) or a trackable
**Contradiction** (two conflicting accepted sources, owner, days-open, downstream effect). `availability_state`
already includes `conflicting` as a value, but no object records the _pair_ of conflicting statements and what
they block. Blocks **3 matrix rows**: Evidence & gaps → _Decisions-and-what-closes-them list_,
_Contradictions list_; Brief → _Decision quadrant lanes_ (partially). SD-02 (a `service_tower` disagreement
between an application row and its own linked contract row) is a live, concrete example of exactly the
contradiction shape this object would need to track.

**Fix owner:** canonical-model owner. New object types, new relationship verbs (`blocked_by`, `contests`).

### GAP-07 — No current/target state distinction anywhere in the object model

Neither `relationship_node_v1`/`relationship_edge_v1` nor any canonical object carries a `state_scope`
(current|target) or `target_approval_state` (proposed|approved) field. This single gap blocks **4 matrix
rows** across three different review areas at once — proof that it is one structural fix, not four separate
ones: Relationships → _Current-vs-target overlay toggle_; Current versus target → _Compare canvas_,
_Trajectory chart_ (its projected half); Brief → _Goals_ (targets are inherently target-state).

**Fix owner:** canonical-model owner. This is the highest-leverage single structural fix in this register by
row count relative to effort — one field pair, four UI rows unblocked.

### GAP-08 — No "Goal" object distinct from Program/Initiative, and no "value at stake" field

The Enterprise IA object table has no Goal object; Program/Initiative do not carry an explicit expected-value
field. Blocks **2 matrix rows**: Brief → _Goals_; Decision readiness → _Readiness quadrant scatter_ (the
prototype's own aVa answer for this exact chart admits "Value at stake ... is estimated from dependency scope,
not from a funded business case" — i.e., the design already knows this field doesn't really exist).

**Fix owner:** canonical-model owner.

### GAP-09 — No business-problem/lens taxonomy mapped to canonical BusinessFunction/Capability

The 9-lens navigation (understand / irops / crew / baggage / loyalty / revenue / mro / airport / ai) is
hardcoded in prototype JS with no canonical backing. Blocks 1 matrix row directly (Brief → _Lens picker_) but
is the scoping mechanism for every other Brief/Explore/Relationships/Evidence row, so its absence is a
silent risk multiplier even though each individual row already carries its own independent gate.

**Fix owner:** canonical-model owner, in partnership with whichever team owns the client-facing taxonomy per
industry.

### GAP-10 — Row-level provenance fields not confirmed present on inventory objects

The row-detail-drawer pattern used across every Explore table ("source: register export, June 2026; last
reviewed: 30 Jun 2026, data architecture") needs a specific reviewer+date pairing per row. The governance-layer
`ProvenanceSchema` (source_file, ingestion_run_id, parse_method, committed_at, indexed_at) exists conceptually
in `context-corpus-policy.ts`, but is not confirmed wired to the row grain of `application_inventory_v1`,
`vendor_contract_inventory_v1`, or `evidence_gap_v1` in `CONSUMPTION_OBJECT_AND_FIELD_CONTRACT.xlsx`'s sampled
21 fields. Blocks Explore → _Row detail drawer_ and, by extension, the Evidence half of every drawer in the
product.

**Fix owner:** field-contract owner — likely an additive extension to the existing objects, not a new object.

---

## P1 — Governance / contract drift (data exists, governance doesn't match it)

### GAP-11 — `vendor_contract_inventory_v1` grain ambiguity: proven at vendor grain (420), not contract grain (820) (SD-07)

Blocks the contract-level columns of Explore → _Vendors inventory table_ (Renewal, Grain, per-contract
obligations) and two Cube measures (`active_contract_count`, `contract_renewal_exposure`), both `not_reported`
in parity per `cube-lineage.csv`. The prototype's own UI already labels every vendor row "Vendor level" in its
Grain column — a tell that the design already anticipated this exact ambiguity.

**Fix owner:** data-plane, to prove or fix the grain; documentation owner regardless of outcome.

### GAP-12 — `vendor_concentration_pct` Cube measure is a literal `null` SQL stub bound to a live tile (SD-12), and its dashboard binding references non-existent Cube domain names (SD-13)

Currently harmless only because the Operations & Vendor Exposure package is `status: "dormant"`. Blocks nothing
in the reviewed prototype directly (it isn't a Knowledge-mode component), but is recorded here because
activating that package without fixing both defects first would immediately break. Flagged for the receiving
team, not represented as its own matrix row.

**Fix owner:** data-plane (fix the SQL stub) + whoever owns `clients/shared/22-operations-vendor-analytics/
SEMANTIC_BINDING.json` (fix the domain-name mismatch: it references `RiskControlPortfolio`/`ProgramPortfolio`;
the shipped `knowledge_consumption_model.yml` only defines a single combined `ProgramRiskControl`). Note this
same drift also appears in the **design catalog itself** — `CUBE_MEASURE_AND_DIMENSION_CATALOG.xlsx` still
lists `ProgramPortfolio` and `RiskControlPortfolio` as two separate models, meaning the design doc and the
shipped YAML have independently drifted from each other, upstream of any tenant-specific data issue.

### GAP-13 — No consumption-safe projection exposes `source_registry.source` to any product surface

The single most-verified table in the entire pipeline (25/25 rows, raw-verified 2026-07-28) has **zero**
product-facing exposure, because Enterprise IA's own Layer 5 rule 3 ("a product may not read Layer 1 or Layer
2 directly") correctly forbids reading it directly, and no consumption-layer projection has been built to
expose it lawfully. Blocks **2 matrix rows**: Brief → _Sources list_; Evidence & gaps → _Sources / "where it
came from" list_. This is the one gap in this register that is ironic rather than concerning — the data is the
best-corroborated in the whole build; only its lawful path to the UI is missing.

**Fix owner:** data-plane, to add a thin `consumption.source_registry_summary_v1`-style projection.

---

## P2 — Data-not-ready (contract correct, pipeline broken or unconfirmed for this tenant)

These rows have a **correctly specified** governed projection; the defect is entirely in whether the pipeline
populated it for `airline-demo-new`. No canonical-model or contract change is required — only re-running,
re-verifying, or (for the `capability`/`service_tower` cases) filtering the load.

| Gap                                                                                                                                                                                             | Matrix rows blocked                                                                                                         | Lineage-audit citation     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `application_inventory_v1`'s `application_type` field carries a QA dedup flag (`'regional duplicate'`) as if it were a business taxonomy value                                                  | Explore → _Applications inventory table_                                                                                    | SD-01                      |
| `service_tower` disagrees between an application row and its own linked contract row for the same `contract_id`                                                                                 | Explore → _Applications inventory table_, _Vendors inventory table_                                                         | SD-02                      |
| 3,000 of 60,000 relationship rows originate from a free-text `capability` field with no backing catalog anywhere in the 25-file corpus                                                          | Relationships → _Graph canvas nodes_, _Graph canvas edges_, _Relationship list view_                                        | SD-08                      |
| `service_tower` relationship endpoints (9,000 rows) are label-only, not ID-backed (internally consistent, but not governed)                                                                     | Relationships → _Graph canvas nodes_, _Graph canvas edges_                                                                  | SD-14                      |
| `parser-visible-source-manifest.csv` enumerates only 10 of ~25 landed source files                                                                                                              | Would understate the _Sources list_ rows once GAP-13 is closed                                                              | SD-11                      |
| Executive-perspective / interview source family is structurally empty (0 structured CSVs, 1 narrative .md only)                                                                                 | Brief → _Purpose and priorities_, _Leadership perspectives_                                                                 | Lineage audit Sec 3        |
| Enterprise identity is narrative-only, not structured — no fleet-register CSV family exists for the specific stat tiles the Identity panel needs                                                | Brief → _Identity panel_                                                                                                    | Lineage audit Sec 3, Sec 4 |
| Integrations (6,200 rows) and Programmes (190 rows) have no confirmed landing anywhere                                                                                                          | Explore → _Integrations inventory table_, _Programmes inventory table_; Decision readiness → _Readiness quadrant scatter_   | Lineage audit Sec 3        |
| Review-decision control totals (112,201 accepted / 152,029 deferred / 0 rejected) are asserted by one self-reported record only, contradicted in timing by the sole available raw execution log | **Cross-cutting trust caveat on every count in this register** — every row above ultimately traces back through this ledger | SD-10 (critical)           |

`evidence_coverage_pct`/`open_critical_gap_count`-adjacent components additionally inherit whatever the
"Withheld / not-measured / not-loaded / not-assessed explanation panel" row resolves to (Evidence & gaps mode):
the _contract_ for this panel is correct (`PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md`), but
`product-readiness-defects.md` states plainly that no renderer exists yet anywhere in the repo to prove the
contract is actually honored end to end. That is a P2 item in its own right — it is the one component whose
job is to catch every other P2 item above, and it does not yet exist.

---

## P3 — Operational UI builds (not canonical, not blocked by any data-model gap)

Per the ground rules, these are legitimately UI-state or ephemeral session content, not tenant knowledge, and
must **not** be added to `CONSUMPTION_PROJECTION_REGISTRY.json`:

| Component                                             | Matrix `ui_mode`                | What's needed                                                                                                                                                                                                  |
| ----------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save view / Export actions, Shareable saved-view link | Explore, Saved views and export | A `saved_view` operational table (owner, filters, columns, sort, share scope) — **and** the prototype's own open design decision on personal-vs-shared-by-default must be resolved before schema design starts |
| aVa suggested questions                               | aVa                             | A question-template table tagged by lens; must gate each suggestion against whether its target answer would actually pass the aVa answer-card render gate                                                      |
| aVa docking controls                                  | aVa                             | Pure UI chrome; only needs a backing table if docking preference is meant to persist across sessions                                                                                                           |
| Preset question picker                                | Relationships                   | Hardcoded in prototype JS; becomes a real operational table once the graph itself is real                                                                                                                      |
| "Design notes" mode                                   | Brief                           | Should not ship as a product mode at all — superseded by this contract package                                                                                                                                 |
| Models-disabled zero-model baseline banner            | Cross-cutting                   | Needs a real model-availability flag + deterministic-fallback routing table; also presumes every other component is already proven model-free, which is not yet true                                           |
| Completion workbench                                  | Evidence & gaps                 | No UX has been designed yet — cannot specify data requirements until it is                                                                                                                                     |

---

## Cross-reference index (gap → matrix rows)

| Gap ID | Matrix components blocked                                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-01 | Condition strip; Risks and controls inventory table; Decision-readiness summary tiles; Decisions-and-what-closes-them list; Coverage-by-domain table; Open gaps list; Uncertified-gap-view notice |
| GAP-02 | Measures (KPIs) inventory table; Trajectory chart; Benchmarks; Global search                                                                                                                      |
| GAP-03 | aVa scope banner; aVa answer card; aVa refusal case; Handoff modal; Receiving-module confirmation; Programmes inventory table; Readiness quadrant scatter                                         |
| GAP-04 | Infrastructure and cloud inventory table; Data products inventory table                                                                                                                           |
| GAP-05 | Goals; Decision quadrant lanes; Condition strip; Decision-readiness summary tiles; Decisions-and-what-closes-them list                                                                            |
| GAP-06 | Decisions-and-what-closes-them list; Contradictions list; Decision quadrant lanes                                                                                                                 |
| GAP-07 | Current-vs-target overlay toggle; Compare canvas; Trajectory chart; Goals                                                                                                                         |
| GAP-08 | Goals; Readiness quadrant scatter                                                                                                                                                                 |
| GAP-09 | Lens picker (and transitively scopes every other component)                                                                                                                                       |
| GAP-10 | Row detail drawer (and every Evidence sub-tab across every drawer in the product)                                                                                                                 |
| GAP-11 | Vendors inventory table                                                                                                                                                                           |
| GAP-12 | (Operations & Vendor Exposure package — not a Knowledge-mode matrix row; flagged for the receiving team)                                                                                          |
| GAP-13 | Sources list (Brief); Sources / "where it came from" list (Evidence & gaps)                                                                                                                       |
