# ECL Clean Break Integrated Execution Plan

**Status:** execution contract.  
**Date:** 2026-08-24  
**Owner lane:** global-control-lane for schema/routing contracts, client-data-lane for ECL data loads.

This document is the shared plan for agents working on the ECL clean break. It is not a conceptual
reopen. It is the execution map for finishing the new Enterprise Context Layer across source rooms,
canonical/context layers, commercial layers, projections, cubes, serving views, product routes,
browser QA, and staged legacy retirement.

W2 is also constrained by
[meridian-demo-findings-20260824.json](./meridian-demo-findings-20260824.json). The ten findings in
that spec are not optional demo copy; they are deterministic assertions the source room, canonical
layers, projections, serving views, and browser proof must be able to demonstrate without inventing
facts in the UI.

The decision is simple:

> Product pages read ECL serving views only. No product reads pre-ECL data-plane tables. No silent
> fallback. A page either renders a valid ECL projection or renders an explicit refusal/gap state.

---

## 1. Four-Lane Completion Status

Do not report a single aggregate percentage for ECL completion. The program has four different
finish lines, and blending them is what made completion unclear.

The committed machine-readable status lives at
[`ecl-four-lane-completion-status.json`](./ecl-four-lane-completion-status.json). Regenerate it with:

```bash
npm run ecl:completion-status:write -- --ref <named-ref>
```

When a live product proof exists, pass its explicit artifacts:

```bash
npm run ecl:completion-status:write -- \
  --ref <named-ref> \
  --live-proof-summary <compact-summary.json> \
  --browser-operator-summary <browser-operator/summary.json> \
  --eval-operator-summary <eval-operator/summary.json> \
  --run-id <github-run-id> \
  --digest <sha256-or-image>
```

Required lane status shape:

```json
{ "lane": "L-PROOF", "slice": "surfaces_findings_eval_default_route_proof", "status": "complete", "numerator": 63, "denominator": 63, "run_id": "32995332853", "digest": "sha256:...", "timestamp": "2026-08-26T17:48:19.000Z" }
```

Current committed status, measured from the post-cutover proof artifact:

| Lane | What It Means | Current | Status |
|---|---|---:|---|
| `L-CUTOVER` | Home, Source, Tower and Intelligence default entry routes serve ECL | **4/4** | complete |
| `L-PROOF` | 40 named surfaces, F1-F10 and aVa baseline/ablation proof | **63/63** | complete |
| `L-CLEANUP` | Legacy data-plane assets classified and retired or retained | **25/851** | pending |
| `L-CLIENT` | Real workbook/source-family adapters proven end to end | **3/14** | pending |

The product proof denominator is intentionally not the same as route count:

| Product-Proof Metric | Current | Denominator |
|---|---:|---:|
| Default entry routes accepted | 4 | 4 |
| Named surfaces browser-proven | 40 | 40 |
| Findings demonstrable on default routes | 10 | 10 |
| aVa baseline accepted | 13 | 13 |
| aVa ablation accepted | 0 | 13 |

The serving denominator remains **40 surfaces** for this clean-break plan: Home 16, Tower 9, Source
9, Intelligence 6. Any broader surface mapping must amend this table and provide
`serving.serving_contract` owner/date rows before it changes the denominator.

Client-intake progress is split on purpose:

| Client-Readiness Metric | Current | Denominator | Meaning |
|---|---:|---:|---|
| Source-family landing into `ecl_source` | 14 | 14 | All workbook/source-room families can land as governed `source_file` and `source_record` rows. |
| Canonical/context adapters | 3 | 14 | Three families have proven adapters into canonical ECL objects/measures/relationships. |

Source-family landing does not count as canonical adapter completion. It proves intake can be
received and hashed without forcing partially mapped rows into product semantics.

---

## 2. Layer Design

The physical model is a new ECL substrate, not a rename of legacy tables.

```
Layer 1  Intake / source room
Layer 2  Adapters / source ingestion
Layer 3  Canonical context and commercial spine
Layer 4  Product projections and cubes
Layer 5  Serving views
Layer 6  Product pages
```

### Layer 1 - Intake / Source Room

| Family | Purpose | Current dense target |
|---|---|---:|
| SP01 Documents and Interviews | Evidence docs, interview notes, contract docs | 220 source rows, 720 documents downstream |
| SP02 HRIS | Workforce, role, organization, people counts | 360 |
| SP03 CMDB | Applications and systems | 750 |
| SP04 Data, BI, ETL | Reports, marts, ETL tooling, data products, job volumes | 360 |
| SP05 Infrastructure | Hosting, platforms, data centers, cloud, network, storage | 220 |
| SP06 Finance / ERP | Spend, GL, budget, program cost | 480 |
| SP07 PPM | Programs, initiatives, value plan | 140 |
| SP08 Vendor / Contract | Contracts, vendors, service lines, terms | 230 |
| SP09 GRC | Risks, controls, audit, compliance | 200 |
| SP10 KPI / Operations | Business and operational KPI baseline | 260 |
| SP11 AI Usage / Models | AI tools, usage, agents, model operations, value | 360 |
| SP12 Evidence Room | Evidence artifacts and references | 500 |
| SP13 Data Flows / Integrations | Interfaces, feeds, data movement | 1,350 |
| SP14 Deployments / Hosting | Application deployments and environments | 1,650 |

Layer 1 accepts partial data. Completeness is not required. Truthfulness is required:

- Unknown is not zero.
- Missing SLA data remains missing SLA data.
- Synthetic directional benchmarks must not wear `source_recorded` basis.
- Client-attested, synthetic, model-inferred, and document-extracted values must remain visibly
  different all the way to product pages.

### Layer 2 - `ecl_source`

| Table | Purpose | Populated by |
|---|---|---|
| `ecl_source.source_file` | One row per intake/source-room file with origin and hash | Dense source-room generator now; all-family client-shaped landing adapter |
| `ecl_source.source_record` | One row per raw source row with basis, value state, and source hash | Source-room/source-file adapter and all-family client-shaped landing adapter |
| `ecl_source.document` | Evidence and contract documents | Document/evidence source-room adapter |
| `ecl_source.document_extraction` | Page/span facts extracted from documents | Document extraction adapter |

Required proof:

- `source_file.origin` is enforced and distinguishes `client_intake` from `synthetic_generator`.
- Field hashes are stable.
- Page/span values are real offsets, not constants.
- Partial rows are counted and preserved.

### Layer 3 - `ecl_context`

| Table | Purpose | Populated by |
|---|---|---|
| `ecl_context.object_type_catalog` | Object type, grain, counting class | Schema/catalog migration |
| `ecl_context.object` | Canonical typed objects: app, deployment, platform, vendor, org, process, etc. | Context builder |
| `ecl_context.relationship` | Tenant-composite relationship graph | Context builder |
| `ecl_context.metric_definition` | Metric dictionary with units/directionality | Context builder |
| `ecl_context.measure` | Deterministic measures with basis/review state | Context builder |
| `ecl_context.snapshot` | Build snapshot identity | Context builder |
| `ecl_context.context_pack` | Compiled context pack | Context/review builder |

Planned AI initiative spine extension:

| Artifact | Purpose | Completion rule |
|---|---|---|
| `ai_use_case` objects | Canonical initiative/use-case objects using the existing `object_type_catalog` | Use the existing object catalog; do not create a second catalog. |
| `ai_initiative_v` | Typed view over initiative-grain objects | `application_v` must exclude `ai_use_case`; deployments and use cases cannot enter application counts. |
| `ecl_context.ai_initiative_profile` | One-to-one profile table for the 23 capture-template fields | Tenant-composite FK to `ecl_context.object`; no gate fields hidden only in JSON. |

Typed views are required for safe consumption:

- `application_v`
- `application_deployment_v`
- `business_object_v`
- `technical_component_v`

Counting rule:

- Application deployments cannot enter application counts.
- Report, ETL, script, user, and workload volumetrics are measures unless the underlying thing is a
  declared canonical object.

AI initiative relationship vocabulary:

- Reuse existing relationship verbs for platform, data, supplier, contract, usage, and funding
  links: `DEPENDS_ON`, `HOSTED_ON`, `CONSUMES`, `SUPPLIED_BY`, `COVERED_BY`, `USED_BY`, and
  `FUNDED_BY`.
- Add exactly two verbs when the spine is built: `BASELINE_OF` and `TARGET_OF`.
- Do not add `GATED_BY`; gate state belongs on the profile/review evidence path, not in the
  relationship dictionary.

### Layer 3B - `ecl_commercial`

| Table | Purpose | Populated by |
|---|---|---|
| `ecl_commercial.contract` | Contract header and vendor scope | Commercial builder |
| `ecl_commercial.contract_service_line` | Service tower and rate/term granularity | Commercial builder |
| `ecl_commercial.contract_scope` | Contract-to-object scope links | Commercial builder |
| `ecl_commercial.invoice_line` | AP invoice facts and variance | Finance/commercial builder |
| `ecl_commercial.sla_observation` | SLA actuals, credits, misses | SLA/commercial builder |

Commercial proof rules:

- Money cannot be claimable from unverified document extraction.
- Contract scope must resolve to canonical objects.
- Benchmark basis must be `model_inferred` or similarly soft unless it comes from client-approved
  market data.
- Vendor concentration and contract value distribution must pass plausibility gates.

### Layer 3C - `ecl_review`

| Table | Purpose | Populated by |
|---|---|---|
| `ecl_review.review_event` | Human or system review events by subject | Review builder |

Review events must have exactly one subject. They can attach to source records, contracts,
invoices, SLA observations, or context packs.

### Layer 4 - `ecl_projection`

Projection spine:

| Table | Purpose |
|---|---|
| `projection_manifest` | One manifest per product/surface/snapshot |
| `projection_entry` | Canonical projection rows |
| `projection_entry_object_ref` | FK-backed object references |
| `projection_entry_metric_ref` | FK-backed metric references |
| `projection_entry_source_record_ref` | FK-backed source-record references |
| `projection_entry_document_extraction_ref` | FK-backed document-extraction references |
| `projection_entry_measure_ref` | FK-backed measure references |
| `projection_entry_relationship_ref` | FK-backed relationship references |

Built product projections:

| Surface | Current state |
|---|---|
| `home_enterprise_landscape` | Built and populated in Azure readback |
| `tower_command_center` | Built and populated in Azure readback |
| `source_contract_360` | Built and populated in Azure readback |
| `source_vendor_360` | Built and populated in Azure readback |
| `source_value_levers` | Built and populated in Azure readback |
| `source_event_workspace` | Built and populated in Azure readback |
| `intelligence_context_pack` | Built and populated in Azure readback |
| `tower_value_chain` | Built locally; Azure reload/readback pending |
| `tower_evidence_queue` | Built locally; Azure reload/readback pending |
| `tower_ai_portfolio` | Built locally; Azure reload/readback pending |
| `intelligence_pattern_evidence` | Built locally; Azure reload/readback pending |
| `intelligence_question_context` | Built locally; Azure reload/readback pending |

W2 projection surfaces built locally:

| Surface | Why it matters |
|---|---|
| `tower_value_chain` | Tower needs claim -> observation -> measure -> evidence trace, not only command center summary. |
| `tower_evidence_queue` | Gated claims need reasons and next evidence action. |
| `tower_ai_portfolio` | AI portfolio/current-state value use cases need deterministic source rows and review state. |
| `intelligence_pattern_evidence` | Intelligence needs pattern evidence/citations, not only context-pack summary. |
| `intelligence_question_context` | Question answering needs deterministic context packs and source citations. |

Projection rules:

- Every reference that matters is FK-backed. No governed references hidden only in JSON.
- A surface with an admission gate carries the gate result.
- Refused rows carry refusal payload; admitted rows carry no refusal payload.
- Pages render refusal, not an empty result pretending to be complete.

### Layer 4B - Cubes

| Table | Purpose |
|---|---|
| `cube_manifest` | Cube identity and version |
| `cube_slice` | Slice by surface/object/snapshot |
| `cube_slice_metric` | FK-backed metric membership |
| `cube_slice_measure` | FK-backed measure membership |

Cube rules:

- Metric dictionary FK is mandatory.
- Units must match metric definitions.
- Cube JSON is cache/display only; it does not govern references.

### Layer 5 - `serving`

`serving` is the clean-break contract for products. Product code should not read
`ecl_source`, `ecl_context`, `ecl_commercial`, `ecl_review`, or raw `ecl_projection` tables after
cutover.

Required serving artifacts:

| Artifact | Target |
|---|---:|
| Home views | 16 |
| Tower views | 9 |
| Source views | 9 |
| Intelligence views | 6 |
| `serving.serving_contract` | 1 row per view with owner, due date, proof state |

### Serving Surface Enumeration

This is the product-surface contract the serving layer must satisfy. `build_state` describes the
current serving schema state, not visual/browser proof.

| surface_key | product | serving view | ecl backing | build_state |
|---|---|---|---|---|
| `home_executive_brief` | Home | `serving.home_executive_brief` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_our_business` | Home | `serving.home_our_business` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_strategy_value_creation` | Home | `serving.home_strategy_value_creation` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_how_we_operate` | Home | `serving.home_how_we_operate` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_technology_data` | Home | `serving.home_technology_data` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_performance_value` | Home | `serving.home_performance_value` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_leadership_perspective` | Home | `serving.home_leadership_perspective` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_needs_attention` | Home | `serving.home_needs_attention` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_current_state_architecture` | Home | `serving.home_current_state_architecture` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_current_state_data_flow` | Home | `serving.home_current_state_data_flow` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_loaded_record` | Home | `serving.home_loaded_record` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_browse_record` | Home | `serving.home_browse_record` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_applications_systems` | Home | `serving.home_applications_systems` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_vendor_contracts` | Home | `serving.home_vendor_contracts` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_infrastructure_platforms` | Home | `serving.home_infrastructure_platforms` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `home_data_assets_integrations` | Home | `serving.home_data_assets_integrations` | `ecl_projection.home_enterprise_landscape` | `serving_built` |
| `tower_command_center` | Tower | `serving.tower_command_center` | `ecl_projection.tower_command_center` | `serving_built` |
| `tower_value_proof` | Tower | `serving.tower_value_proof` | `ecl_projection.tower_value_chain` | `serving_built` |
| `tower_decision_lanes` | Tower | `serving.tower_decision_lanes` | `ecl_projection.tower_value_chain` | `serving_built` |
| `tower_evidence` | Tower | `serving.tower_evidence` | `ecl_projection.tower_evidence_queue` | `serving_built` |
| `tower_recommended_actions` | Tower | `serving.tower_recommended_actions` | `ecl_projection.tower_evidence_queue` | `serving_built` |
| `tower_ai_portfolio` | Tower | `serving.tower_ai_portfolio` | `ecl_projection.tower_ai_portfolio` | `serving_built` |
| `tower_cost_lens` | Tower | `serving.tower_cost_lens` | `ecl_projection.tower_value_chain` | `serving_built` |
| `tower_risk_lens` | Tower | `serving.tower_risk_lens` | `ecl_projection.tower_evidence_queue` | `serving_built` |
| `tower_adoption_lens` | Tower | `serving.tower_adoption_lens` | `ecl_projection.tower_ai_portfolio` | `serving_built` |
| `source_vendor_portfolio` | Source | `serving.source_vendor_portfolio` | `ecl_projection.source_vendor_360` | `serving_built` |
| `source_vendor_360` | Source | `serving.source_vendor_360` | `ecl_projection.source_vendor_360` | `serving_built` |
| `source_contract_360` | Source | `serving.source_contract_360` | `ecl_projection.source_contract_360` | `serving_built` |
| `source_renewal` | Source | `serving.source_renewal` | `ecl_projection.source_contract_360` | `serving_built` |
| `source_events` | Source | `serving.source_events` | `ecl_projection.source_event_workspace` | `serving_built` |
| `source_compare` | Source | `serving.source_compare` | `ecl_projection.source_event_workspace` | `serving_built` |
| `source_value` | Source | `serving.source_value` | `ecl_projection.source_value_levers` | `serving_built` |
| `source_approvals` | Source | `serving.source_approvals` | `ecl_projection.source_event_workspace` | `serving_built` |
| `source_sourcing_opportunities` | Source | `serving.source_sourcing_opportunities` | `ecl_projection.source_value_levers` | `serving_built` |
| `intelligence_advisory` | Intelligence | `serving.intelligence_advisory` | `ecl_projection.intelligence_context_pack` | `serving_built` |
| `intelligence_enterprise_landscape` | Intelligence | `serving.intelligence_enterprise_landscape` | `ecl_projection.intelligence_context_pack` | `serving_built` |
| `intelligence_ask_query` | Intelligence | `serving.intelligence_ask_query` | `ecl_projection.intelligence_question_context` | `serving_built` |
| `intelligence_insights_evaluate` | Intelligence | `serving.intelligence_insights_evaluate` | `ecl_projection.intelligence_pattern_evidence` | `serving_built` |
| `intelligence_pattern_detail` | Intelligence | `serving.intelligence_pattern_detail` | `ecl_projection.intelligence_pattern_evidence` | `serving_built` |
| `intelligence_context_summary` | Intelligence | `serving.intelligence_context_summary` | `ecl_projection.intelligence_context_pack` | `serving_built` |

### Planned `serving.serving_contract` Not-Built Declarations

W3 creates the physical `serving.serving_contract` table. This table remains the named owner/date
contract for any specified projection backing that is intentionally not built in a future slice. W3
has no remaining not-built projection backings.

| ecl backing | build_state | owner_person | due_date |
|---|---|---|---|

Every serving view must include these provenance columns:

1. `tenant_key`
2. `assessment_id`
3. `snapshot_id`
4. `projection_manifest_id`
5. `projection_version`
6. `source_hash`
7. `basis`
8. `value_state`
9. `review_state`
10. `origin`
11. `gap_flags_json`
12. `admission_status`

### Layer 6 - Product Pages

| Product | Clean-break source | Required proof |
|---|---|---|
| Home | `serving.home_*` | Architecture/data-flow admission, dense estate counts, visual QA across tabs |
| Source | `serving.source_*` | Contract 360, Vendor 360, Value Levers, Event Workspace, evidence/citation proof |
| Tower | `serving.tower_*` | Claimable vs gated counts, gate reasons, money/evidence chain |
| Intelligence | `serving.intelligence_*` | Context pack, pattern evidence, question context citation proof |

No default route is repointed until its difference report shows zero regressions.

---

## 3. Population Pipeline

### Local validation path

Run in this order:

```bash
npm run ecl:source-room-dense:generate
npm run ecl:source-room-dense:validate
npm run ecl:source-room-producers:report
npm run ecl:source-room-source-layer:load
npm run ecl:source-room-context-layer:load
npm run ecl:source-room-commercial-layer:load
npm run ecl:source-room-review-layer:load
npm run ecl:source-room-source-projection:load
npm run ecl:source-room-cube-layer:load
npm run ecl:dense-azure-gate:package -- --skip-dry-run
npm run ecl:dense-azure-gate:validate
```

### Governed Azure path

Azure mutation is only through the ACA data-build job contract:

1. Build and deploy a digest-pinned image through the repo-owned ACA main deploy workflow.
2. Prove runtime invariant for web and worker/job images.
3. Run `npm run ops:aca-job` with `--script ecl:dense-all-layer:execute`.
4. Run a separate `npm run ops:aca-job` execution with `--script ecl:dense-all-layer:readback`.
5. Compare readback export against the current local readback contract.
6. Restore idle and verify.

The readback execution is separate from the load. A load log is not readback proof.

---

## 4. Comprehensive Testing Gates

### Schema and FK gates

- Tenant-composite FK enforcement across all ECL schemas.
- Same-assessment containment.
- Object type FK to `object_type_catalog`.
- Typed view regression: deployments cannot enter application counts.
- Projection entry references must resolve through typed FK tables.
- Cube metrics and measures must resolve through FK-backed child tables.

### Source and realism gates

- Dense source-room row targets met.
- Criticality band: tier-1 applications in realistic range.
- Cost distribution: top decile in realistic range, no tier-constant cost pattern.
- Environment count distribution is not near-constant.
- Vendor concentration is realistic.
- Contract value top decile is realistic.
- No unrelated source families share suspicious identical row counts without a declared reason.
- Graph stride/plausibility gate catches arithmetic rotation dependencies.

### Evidence gates

- Document page/span values are distinct and computable from the document.
- Confidence is not a constant stamp.
- Monetary claimability requires verified or record-backed evidence.
- Unverified extraction can be displayed as evidence candidate, not as a claimable dollar fact.
- Every gated Tower claim carries a gate reason.

### Product route gates

- CI fails if a product page reads pre-ECL data-plane tables directly.
- CI fails if a product page reads raw ECL tables after serving cutover, except approved internal
  diagnostics.
- Provider overrides are removed or locked behind explicit internal diagnostics only.
- Refusal path is rendered and visually checked.
- Difference reports classify every material difference as `expected`, `correction`, or
  `regression`; any regression blocks cutover.

### Browser QA gates

Minimum visual proof:

| Product | Required routes |
|---|---|
| Home | `/home/preview` all left-nav tabs, especially Architecture and Data Browser |
| Source | Contract 360, Vendor 360, Value Levers, Event Workspace |
| Tower | Command Center, Value Chain, Evidence Queue, AI Portfolio |
| Intelligence | Context Pack, Pattern Evidence, Question Context |

Checks:

- Signed-in page load where auth is required.
- Desktop and mobile screenshots.
- No empty ECL projection unless refusal/gap state is designed.
- No builder vocabulary or snake_case in client-visible copy.
- No obviously synthetic repetition, flatness, or impossible volumes.
- CXO read: the page says what matters, why it matters, what changed, and what is missing.

### AI Initiative Spine Gates

The AI initiative spine is W8. It is queued, not part of the active live-eval slice. It becomes
complete only when all six steps below are green:

| Step | Required outcome | Success proof |
|---|---|---|
| S1 typed initiative grain | Existing `object_type_catalog` governs `ai_program`, `ai_use_case`, and `ai_tool`; `ai_initiative_v` exists | Typed-view regression proves `application_v` excludes AI use cases. |
| S2 profile table | `ecl_context.ai_initiative_profile` stores the 23 capture-template fields with a tenant-composite FK to `ecl_context.object` | Disposable Postgres load plus planted FK failure rejected. |
| S3 fit gates | Stage and evidence constraints are enforced for the five fit patterns | One planted failure per constraint is rejected. |
| S4 relationship vocabulary | Only `BASELINE_OF` and `TARGET_OF` are added; existing verbs are reused for all other links | Relationship dictionary diff shows exactly two new verbs and no `GATED_BY`. |
| S5 intake adapter | Capture Template workbook rows become `ai_use_case` objects and profile rows with `origin='client_intake'`; unclassifiable rows enter review | Adapter test covers partial intake, unknowns, and review-queue routing. |
| S6 serving and proof | `serving.tower_ai_portfolio` gains initiative grain and a new AI portfolio serving surface reads the spine | Surface enumeration and reconciliation include both views; browser proof is captured before default cutover. |

Tracked W8 outcome counters:

| Counter | Current | Target |
|---|---:|---:|
| AI spine build steps complete | 0 | 6 |
| AI spine planted failures rejected | 0 | 4+ |
| AI initiative serving surfaces proven | 0 | 2 |
| AI initiative workbook adapter tests passing | 0 | 1 adapter suite |

---

## 5. Cutover Plan

### Phase C0 - Publish and align

- Publish this plan.
- Link it from the Enterprise Information Architecture.
- Use it as the execution checklist for all agents.

### Phase C1 - Finish W1

- Regenerate current local ECL proof summaries.
- Regenerate readback contract.
- Compare the independent Azure readback against that contract.
- Close W1 only when accepted true and zero row/hash drift.

### Phase C2 - Build remaining projections

- Build the five W2 projection surfaces.
- Wire each through `projection_entry` and typed FK refs.
- Add planted failure tests.
- Absorb the ten demo findings before projection build. `tower_evidence_queue` must carry
  `claim_gate_status`, `claim_gate_reason_code`, `claim_gate_reason_detail`,
  `evidence_needed_json`, and `next_gate` on every row. `tower_value_chain` must trace claim to
  observation to measure to evidence so a gated claim can name its next evidence. Tower risk-lens
  rows must resolve GRC `object_ref` to application objects by FK so exceptions can group by vendor.
- Data generator prerequisites must land before the W2 projection builders: contract
  `termination_for_convenience`, contract `auto_renew`, infrastructure `support_end_date`, and a
  pinned `DEMO_AS_OF_DATE`. Date-sensitive findings use the pinned date, never the runtime date.
- Plant each finding after weighted distributions are drawn. Planted rows carry normal provenance;
  the only distinction is that the generator intentionally chose those rows. Do not tune a
  distribution and hope a finding emerges.
- Add one data assertion per finding against `ecl_context` / `ecl_commercial`, and one surface
  assertion per finding once W3 serving views land.
- Merge the W2 projection build. Azure reload/readback is a separate W1 governed data-build run.

### Phase C3 - Build serving schema

- Add `serving` schema.
- Add 40 product views and `serving.serving_contract`.
- Add owner/due-date/proof-state rows.
- Add CI view-contract validator.

### Phase C4 - Repoint products

- Repoint Home, Source, Tower, and Intelligence to serving views.
- Remove default provider overrides and fallback-to-legacy paths.
- Keep diagnostics explicit and non-default.
- Revoke app role access to pre-ECL and raw ECL tables once serving proves complete.

### Phase C5 - Product difference and browser QA

- Dual-run old and ECL providers before default cutover.
- Classify every material difference.
- Fix regressions.
- Capture browser proof for every required route.

### Phase C6 - Default cutover

- Repoint default providers one product at a time.
- Deploy through the repo-owned ACA main deploy workflow.
- Prove runtime invariant.
- Capture signed-in/browser proof.

### Phase C7 - Legacy retirement

- Generate schema-only rollback dump.
- Stage 851 pre-ECL data-plane tables for retirement.
- Dry-run retirement and readback inventory.
- Apply only after explicit retirement checkpoint.

### Phase C8 - Real Layer 2 adapter hardening

- Build real adapters from client workbook/source extracts.
- Start with CMDB applications.
- Run partial-data and catch-up tests.
- Preserve synthetic generator as fixture/test data, not source of truth.

### Phase C9 - AI initiative spine extension

- Build W8 after the current Intelligence live-eval proof is complete or in a separate branch that
  does not alter active clean-break routes.
- Use the existing ECL object catalog and relationship dictionary as the spine; do not introduce a
  parallel initiative model.
- Implement S1-S6 from the AI Initiative Spine Gates section.
- Publish status using the W8 counters beside the existing ECL clean-break denominators.

---

## 6. Rollback Plan

Rollback must match the phase:

| Phase | Rollback |
|---|---|
| C1 load/readback | Restore from prior ECL snapshot or rerun previous idempotent load package; no route impact. |
| C2 projections | Drop/rebuild projection rows for the affected manifest only; canonical rows remain. |
| C3 serving | Revert serving view DDL; no canonical data change. |
| C4 route repoint | Revert product route/provider commit and redeploy prior digest. |
| C6 default cutover | Reassign traffic to previous healthy ACA revision after runtime invariant check. |
| C7 retirement | Restore from schema-only/data dump created immediately before retirement. |

No rollback may silently return a product to legacy data while the page labels itself as ECL-backed.

---

## 7. Progress Reporting Format

All status updates should use this shape:

| Field | Required content |
|---|---|
| Overall percent | Weighted percent with stage denominators |
| Current stage | W1 to W7 and phase C0 to C8 |
| What passed | Counts, commands, proofs, PRs, deploys |
| What failed | Exact gate and exact issue |
| What is running now | Command or PR/slice |
| What is gated | Azure mutation, default cutover, retirement, live proof |
| Next action | One concrete command or PR target |

Do not report "done" when a gate is only planned. Do not report "live" when a route has not been
rendered and captured.

---

## 8. Non-Negotiables

- Dense and realistic data is required. Row count alone is not quality.
- Partial intake is normal. Gaps must be explicit.
- Synthetic data can support fixture and QA work, but it must not become client truth.
- Products read projections/serving, never intake or adapter output.
- No product owns data.
- No silent fallback.
- Every money/value claim must have deterministic basis and evidence state.
- Every page must be good enough for a CXO to understand the current state, the implication, and
  the next action.
