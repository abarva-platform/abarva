# ECL Clean Break Integrated Execution Plan

**Status:** execution contract.  
**Date:** 2026-08-24  
**Owner lane:** global-control-lane for schema/routing contracts, client-data-lane for ECL data loads.

This document is the shared plan for agents working on the ECL clean break. It is not a conceptual
reopen. It is the execution map for finishing the new Enterprise Context Layer across source rooms,
canonical/context layers, commercial layers, projections, cubes, serving views, product routes,
browser QA, and staged legacy retirement.

The decision is simple:

> Product pages read ECL serving views only. No product reads pre-ECL data-plane tables. No silent
> fallback. A page either renders a valid ECL projection or renders an explicit refusal/gap state.

---

## 1. Current Percent Complete

Percentages are denominator-based, not sentiment-based. A stage is not complete until its proof gate
is green.

| Workstream | Current | Denominator | Evidence state |
|---|---:|---|---|
| W1 Azure dense all-layer load/readback | **85%** | ACA execute + separate readback + formal compare | Execute and separate readback succeeded on digest-pinned image; formal compare is pending current local contract regeneration. |
| W2 Missing product projections | **0%** | 5 missing projection surfaces | Not built: `tower_value_chain`, `tower_evidence_queue`, `tower_ai_portfolio`, `intelligence_pattern_evidence`, `intelligence_question_context`. |
| W3 Serving schema and views | **0%** | 40 views + serving contract | Not built. |
| W4 Product route repoint and permission fence | **0%** | Home, Source, Tower, Intelligence routes | Existing direct ECL consumers exist, but clean-break serving-only route contract is not complete. |
| W5 Refusal and browser proof | **0%** | 4 product modules + gated views | No complete clean-break browser proof yet. |
| W6 Legacy data-plane retirement | **0%** | 851 pre-ECL data-plane tables | Inventory known; no retirement run. |
| W7 Real Layer 2 adapter path | **30%** | first real intake adapter + gap report + clean-break policy | First application adapter exists; it is not yet the primary clean-break load path. |

**Overall clean-break completion:** **18%**.

That number is intentionally conservative. Azure has rows, but the clean-break is not complete until
serving views, product repointing, browser proof, and legacy retirement gates pass.

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
| `ecl_source.source_file` | One row per intake/source-room file with origin and hash | Dense source-room generator now; real workbook landing adapters next |
| `ecl_source.source_record` | One row per raw source row with basis, value state, and source hash | Source-room/source-file adapter |
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

Typed views are required for safe consumption:

- `application_v`
- `application_deployment_v`
- `business_object_v`
- `technical_component_v`

Counting rule:

- Application deployments cannot enter application counts.
- Report, ETL, script, user, and workload volumetrics are measures unless the underlying thing is a
  declared canonical object.

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

Missing projection surfaces to build next:

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

- Build the five missing projection surfaces.
- Wire each through `projection_entry` and typed FK refs.
- Add planted failure tests.
- Merge and deploy.

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
