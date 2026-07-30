# Knowledge UI Implementation Plan — airline-demo-new

Sequenced, contract-first. The order below is deliberate and inverts how this kind of surface usually gets
built under deadline pressure: **design the UX and its data requirements first, define the target contracts
second, diagnose the current model against those targets third, fix the model and reconcile the data fourth,
and only then wire the UI.** Querying whatever tables already exist and papering over the gaps in React is
explicitly the failure mode this plan exists to avoid — it is also, not coincidentally, how the tenant ended up
with a Cube measure whose SQL body is the literal string `null` (SD-12) bound to a live dashboard tile.

---

## Where the prototype and this analysis sit in that sequence already

| Step                            | Status                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. UX design                    | **Done** — the prototype (`xdc-script.js`) is a complete, high-fidelity argument for the UX. Its own embedded notes say so explicitly: "This prototype is the argument; that document is the contract." |
| 2. Component data requirements  | **Done** — `KNOWLEDGE_UI_DATA_BINDING_MATRIX.csv`, 62 rows                                                                                                                                              |
| 3. Target read-model contracts  | **Done** — `KNOWLEDGE_TARGET_READ_MODEL_CONTRACTS.md`, `KNOWLEDGE_CUBE_RENDER_GATES.md`, `KNOWLEDGE_GRAPH_BINDING_CONTRACT.md`, `KNOWLEDGE_AVA_CONTEXT_CONTRACT.md`                                     |
| 4. Current-model gap analysis   | **Done** — `KNOWLEDGE_DATA_MODEL_GAP_REGISTER.md` (13 root-cause gaps), `KNOWLEDGE_PROJECTION_REGISTRY_AMENDMENTS.json`                                                                                 |
| 5. Projection/model corrections | **Not started** — this is the next real engineering work, and it is data-plane work, not UI work (see `KNOWLEDGE_CODEX_DATA_LAYER_HANDOFF.csv`)                                                         |
| 6. Reconciled data              | **Not started** — depends on 5                                                                                                                                                                          |
| 7. UI binding                   | **Not started, and must not start before 5 and 6 close for the specific components being built**                                                                                                        |

This document governs steps 5–7. Steps 1–4 are complete as of this package.

---

## Phase 0 — Prerequisite, before any of the phases below: fix the environment/process problem

The lineage audit's own top finding applies to this whole plan: **the consumption contracts, the Cube
semantic model, and the source corpus all live on unmerged worktrees** (`nexus-consumption-3c2d`,
`nexus-phase3c2e-execution`, and ~10 more `codex/airline-*` branches), not on `main` or on
`feat/tower-tfamily-mart`. This package itself was only possible to write by reading three different
worktrees side by side. Before Phase 1 below can be executed by a normal engineering workflow (not a
one-off audit), these packages must be merged to a single branch of record, or the plan itself will
re-fragment across worktrees the same way the tenant's build did.

**Exit criterion:** `clients/shared/20-phase3c2d-consumption-contracts/`,
`clients/shared/21-phase3c2e-executable-data-layer/`, and the airline-demo-new source-corpus/execution-evidence
tree are all reachable from one branch that PRs can target.

---

## Phase 1 — Structural canonical-model ratification (GAP-05, GAP-06, GAP-07, GAP-08, GAP-09)

These five gaps are **not data problems** — no amount of re-running a pipeline closes them. They require a
ratification decision at the Layer 3 (Enterprise Information Architecture) level:

1. Ratify a readiness-state taxonomy (GAP-05) — the 5-value enum used throughout the prototype.
2. Ratify `Decision` and `Contradiction` as canonical object types (GAP-06), with their relationship verbs
   (`blocked_by`, `contests`, `advances`).
3. Ratify `state_scope` (current|target) and `target_approval_state` (proposed|approved) as fields on
   relationship nodes/edges and on any object needing a current/target pairing (GAP-07) — this is the
   single highest-leverage fix in the whole package: one field pair unblocks four matrix rows across three
   review areas at once.
4. Ratify a `Goal` object (or explicitly decide Program/Initiative absorbs it with a `value_at_stake` field
   added) (GAP-08).
5. Ratify a business-problem/lens taxonomy mapped to BusinessFunction/Capability (GAP-09) — owned jointly
   with whoever defines per-industry lens sets (this tenant's 9 airline lenses are not the same 9 a healthcare
   tenant would need).

**Why this phase must come before Phase 2, not after:** every consumption projection and Cube model built on
top of an unratified object type has to be rebuilt the moment the object type changes shape. Building the
projection first and the object second is exactly the "layer confusion" AGENTS.md calls the most expensive
class of mistake in this codebase.

**Exit criterion:** Enterprise IA's object table (`docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`
Sec 4) is amended with the new object types and fields, reviewed and merged.

---

## Phase 2 — Governance/contract-drift corrections (GAP-04, GAP-11, GAP-12/13 from the Cube doc, GAP-13)

Data exists; the contract doesn't match it, or a contract exists with no lawful path to the UI. These are
registration and documentation acts, not rebuilds — cheaper than Phase 3 and should be sequenced before it:

1. Register `consumption.data_product_inventory_v1` in `CONSUMPTION_PROJECTION_REGISTRY.json` with a real
   `source_publication`, after reconciling the 1,250-row mapping-doc figure against its actual 6,580 rows
   (SD-04) — do not register blindly against whichever number is bigger.
2. Resolve `technology_estate_v1`'s identity question (is it distinct from `application_inventory_v1`, or a
   denormalized copy?) before registering or continuing to read it in Cube.
3. Document (or fix) `vendor_contract_inventory_v1`'s grain (SD-07) — vendor-level today, contract-level
   claimed by two Cube measures.
4. Fix `vendor_concentration_pct`'s null-SQL stub and the `SEMANTIC_BINDING.json` Cube-domain-name mismatch
   (SD-12, SD-13) before the Operations & Vendor Exposure package is ever activated — it is currently
   `dormant`, which is the only reason this is not already a live incident.
5. Add `consumption.source_registry_summary_v1` so the best-verified table in the entire pipeline
   (`source_registry.source`, 25/25 raw-verified) has a lawful, governed path to the UI at all (GAP-13).

**Exit criterion:** `CONSUMPTION_PROJECTION_REGISTRY.json` amendments from
`KNOWLEDGE_PROJECTION_REGISTRY_AMENDMENTS.json` are merged; no Cube model reads an unregistered
`consumption.*` table.

---

## Phase 3 — Data-plane pipeline fixes (GAP-01, GAP-02, GAP-03, GAP-04's infra half)

This is the highest-consequence phase and the one with the clearest acceptance tests, because the lineage
audit already specified exactly what "fixed" looks like for each:

1. **GAP-01 (SD-05):** re-run and independently re-verify the risk → `evidence_gap_v1` mapping against the
   650-row `risk-register.csv` source. Single most demo-visible defect in the audit.
2. **GAP-02 (SD-06):** consolidate the KPI pipeline under one name (`consumption.metric_observation_v1`),
   retire the other two candidate names, and independently re-verify against the 420-row `kpi-sla-catalog.csv`
   source.
3. **GAP-04's infra half (SD-03):** build `consumption.infrastructure_inventory_v1` against the 10,000-row
   `cloud-infrastructure-inventory.csv` source — the largest family in the corpus, currently the single
   largest untraced dataset in the whole build.
4. **GAP-03:** build `module_knowledge_packet_v1` for this tenant — but only **after** 1–3 above close, since
   a packet assembled from broken `evidence_gap_v1`/`metric_observation_v1` inputs would itself be wrong even
   if it reports as "populated."
5. Additionally, while in this data: fix SD-01 (`application_type` QA-flag-as-taxonomy), SD-02
   (`service_tower` disagreement), and decide the disposition of SD-08/SD-14 (`capability`/`service_tower`
   relationship endpoints with no backing catalog — add a real catalog, or exclude them from accepted).
6. Close SD-10 before any of the review-decision control totals (112,201 accepted / 152,029 deferred) are
   quoted anywhere client-facing — either produce the "operator proof bundle" the authority record refers to,
   or get live DB access to independently re-derive the breakdown.

**Exit criterion:** every acceptance test named in `KNOWLEDGE_TARGET_READ_MODEL_CONTRACTS.md` sections 5–9 and
13 passes, independently re-verified (not just re-asserted) the same way the lineage audit itself insisted on
for relationships (Sec 7: "independently recomputed, not copied").

---

## Phase 4 — Tenant wiring and live-proof gates (per AGENTS.md's own runtime-invariant discipline)

Only after Phases 1–3 close for a given component's dependencies:

1. Register `airline-demo-new` in `CANONICAL_TENANTS.ts` — currently absent everywhere, correctly, per the
   freeze manifest's own `disallowed_actions_until_baseline_publication` rule (SD-15, a positive finding to
   preserve, not a blocker to route around).
2. Wire each product surface (Home/Knowledge first, since it's the subject of this package) module by module,
   gating each on the specific matrix rows whose Phase 1–3 dependencies have closed — **not all-or-nothing**.
   A component whose data closes early should ship early; one still blocked should stay behind its render
   gate.
3. Run the required live signed-in client proof per AGENTS.md's ACA runtime-invariant rule before claiming
   anything is "live" — a release record may say `merged` or `deployed`; it may not say `live-proven` until
   that proof is captured.

---

## Phase 5 — UI binding, component by component, gated by this package's own render gates

Only now does React/implementation work begin, and it begins **per component**, gated exactly as
`KNOWLEDGE_UI_DATA_BINDING_MATRIX.csv`'s `render_gate` column specifies for that row — not as one big-bang
launch. Suggested build order, following the dependency chain the phases above establish:

1. Explore → Applications, Vendors tables (best-corroborated source data; still need field extensions per
   GAP-10, but the base identity data is real today) — earliest-buildable once Phase 2/3's field extensions
   land.
2. Relationships → graph canvas, once `endpoint_catalog_backed` filtering (Phase 1/3) is enforced.
3. Evidence & gaps → coverage table, open gaps list, once GAP-01 closes.
4. Explore → Measures table, Brief → benchmarks/trajectory, once GAP-02 closes.
5. aVa → refusal case first (needs the least — just `known_gaps` being honest), then the full answer card
   once `module_knowledge_packet_v1` populates (Phase 3 step 4).
6. Module handoffs → last, since they depend on the packet plus every receiving module's own readiness.

---

## What is `SUPPORTED_AND_RECONCILED` today, and could be implemented now

**None.** Zero of the 62 matrix rows classify as `SUPPORTED_AND_RECONCILED`. This is stated plainly rather
than stretched, because the ground rules for this package explicitly require not assuming the canonical model
is either sufficient or insufficient without verification — and verification here, consistently applied,
comes up empty for full reconciliation on every single component, for three compounding reasons:

1. **The tenant is not wired into any product surface at all** (SD-15) — there is no live signed-in client
   proof possible for anything yet, which this package treats as a hard requirement for the
   `SUPPORTED_AND_RECONCILED` label, not an optional nice-to-have.
2. **Even the best-corroborated data families carry real, confirmed defects** — applications
   (SD-01, SD-02), vendors (SD-07), relationships (SD-08, SD-14) — so "the projection is populated and
   plausible" (which several rows genuinely are) is a different, weaker claim than "reconciled," which this
   package reserves for Canonical SQL = Publication = Consumption = Cube = API = UI all agreeing, per
   `CONSUMPTION_RECONCILIATION_TEST_PLAN.md`'s own definition — and that test plan's own reconciliation
   ledger for airline-demo-new shows every cell as `TBD`.
3. **7 of 15 Cube measures have no reported parity status at all**, and the 4 that do include at least one
   (`open_critical_gap_count`) whose `passed` status the audit itself flags as misleading (0=0 parity, not
   correctness).

**What is closest, and should be prioritized first once Phase 3 closes:** `application_inventory_v1`'s core
identity/hosting/lifecycle fields and `relationship_edge_v1`'s `accepted_relationship_count` are the two
measures the lineage audit independently re-verified as plausible and best-corroborated. They are the
shortest path to a first genuinely `SUPPORTED_AND_RECONCILED` component, but even they need the field
extensions (GAP-10) and endpoint-catalog filtering (Section 6 of the Graph Binding Contract) closed first to
be trusted at the UI layer, not just at the row-count layer.
