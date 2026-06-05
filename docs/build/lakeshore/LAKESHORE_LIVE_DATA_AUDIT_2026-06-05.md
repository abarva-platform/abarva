# Lakeshore Live Data And Artifact Audit

Date: 2026-06-05
Client row: `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61` / `Lakeshore Holdings` / `lakeshore-holdings`
Source client key: `lakeshore`
Purpose: confirm what is truly loaded, which loader path was used, where depth is real versus scaffolded, and which Source/Moves opportunities are safe to demo.

## Executive Status

Lakeshore has a real tenant row, a loaded synthetic context bundle, an active corpus in Azure AI Search, two Source events, six Moves, and Tower/Intelligence rows. The strongest live demo spine is still the Kyriba treasury rollout because it has both:

- Source stage documents through BAFO, with executive-decision artifacts in review.
- Moves board-grade deliverables and Azure-backed attachments for the linked Kyriba Move.

The AMS modernization Source event is now document-real through its current Evaluation stage. It can be used as a second Source-only demo story, but not as a Pricing/BAFO/Decision story. The Shared Data Platform and Evidence Spine Move is now document-real as a second Moves story with six Azure-backed deliverables. The remaining four Moves are still row-only.

## Loader Truth

The loaded context data is loader-backed, but it is not proven through the full setup/admin approval ledger.

Observed live ledger:

| Ledger | Live count | Meaning |
|---|---:|---|
| `data_ingestion_runs` | 18 completed CSV runs | Real CSV/context loader evidence exists. |
| `data_inventory_records` | 1,329 | Tenant records are committed. |
| `data_inventory_segments` | 9 complete segments | Segment health is populated. |
| `enterprise_context_chunks` | 1,329 | Context chunks are available. |
| `pilot_ingestion_upload_runs` | 0 | No full setup/admin upload-session ledger proof. |
| `pilot_ingestion_load_commits` | 0 | No full setup/admin approval/commit ledger proof. |

Conclusion: Lakeshore context was loaded through the CSV/context loader spine (`source_root=admin/context-layer/csv-upload`, loader `c5-csv-upload-connector`, segment provenance `lakeshore-product-substrate-v1`). It should be called loader-backed synthetic context, not fully setup/admin approval-ledger proven.

## Context Coverage

| Segment | Records | Source files | Health |
|---|---:|---:|---|
| `it_landscape` | 445 | 4 | complete |
| `it_financials` | 288 | 3 | complete |
| `operating_telemetry` | 180 | 2 | complete |
| `compliance` | 104 | 2 | complete |
| `industry_context` | 88 | 2 | complete |
| `vendor_contracts` | 82 | 1 | complete |
| `program_inventory` | 70 | 2 | complete |
| `org_structure` | 67 | 1 | complete |
| `enterprise_profile` | 5 | 1 | complete |

Enterprise context chunks by source segment:

| Segment | Chunks |
|---|---:|
| `it_landscape` | 583 |
| `it_financials` | 362 |
| `program_inventory` | 274 |
| `org_structure` | 67 |
| `enterprise_profile` | 43 |

Embedding caveat: all 18 source files have embedded `enterprise_context_chunks`, but chunk `source_segment_id` values are normalized into five broader retrieval buckets rather than mirroring all nine inventory segment IDs. For example, `vendor-contracts.csv` is embedded under `it_financials`, `qms-events.csv` under `program_inventory`, and `incidents-change-history.csv` under `it_landscape`. Retrieval depth exists for every source file; segment-level reporting should use source-document provenance when exact dimension attribution matters.

Source files loaded by the CSV/context spine:

| Segment | Source file | Records |
|---|---|---:|
| `compliance` | `data/qms-events.csv` | 62 |
| `compliance` | `data/ai-tool-footprint.csv` | 42 |
| `enterprise_profile` | `data/enterprise-profile.csv` | 5 |
| `industry_context` | `data/product-portfolio.csv` | 48 |
| `industry_context` | `data/market-signals.csv` | 40 |
| `it_financials` | `data/financial-kpi-workbook.csv` | 240 |
| `it_financials` | `data/segment-pnl.csv` | 40 |
| `it_financials` | `data/annual-quarterly-reports.csv` | 8 |
| `it_landscape` | `data/application-portfolio.csv` | 228 |
| `it_landscape` | `data/integration-topology.csv` | 96 |
| `it_landscape` | `data/erp-landscape-workbook.csv` | 65 |
| `it_landscape` | `data/site-and-plant-inventory.csv` | 56 |
| `operating_telemetry` | `data/incidents-change-history.csv` | 96 |
| `operating_telemetry` | `data/dora-baseline.csv` | 84 |
| `org_structure` | `data/org-roles.csv` | 67 |
| `program_inventory` | `data/initiative-portfolio.csv` | 40 |
| `program_inventory` | `data/strategy-memo.csv` | 30 |
| `vendor_contracts` | `data/vendor-contracts.csv` | 82 |

All source files carry synthetic/illustrative labeling in provenance.

Embedded chunk provenance by source file:

| Retrieval bucket | Source file | Embedded chunks |
|---|---|---:|
| `enterprise_profile` | `annual-quarterly-reports.csv` | 8 |
| `enterprise_profile` | `enterprise-profile.csv` | 5 |
| `enterprise_profile` | `strategy-memo.csv` | 30 |
| `it_financials` | `financial-kpi-workbook.csv` | 240 |
| `it_financials` | `segment-pnl.csv` | 40 |
| `it_financials` | `vendor-contracts.csv` | 82 |
| `it_landscape` | `ai-tool-footprint.csv` | 42 |
| `it_landscape` | `application-portfolio.csv` | 228 |
| `it_landscape` | `erp-landscape-workbook.csv` | 65 |
| `it_landscape` | `incidents-change-history.csv` | 96 |
| `it_landscape` | `integration-topology.csv` | 96 |
| `it_landscape` | `site-and-plant-inventory.csv` | 56 |
| `org_structure` | `org-roles.csv` | 67 |
| `program_inventory` | `dora-baseline.csv` | 84 |
| `program_inventory` | `initiative-portfolio.csv` | 40 |
| `program_inventory` | `market-signals.csv` | 40 |
| `program_inventory` | `product-portfolio.csv` | 48 |
| `program_inventory` | `qms-events.csv` | 62 |

## Product Data By Context Dimension

| Context dimension | Live table proof | Count | Demo meaning |
|---|---|---:|---|
| Intelligence goals | `ai_business_goals` | 3 | Board-level priorities exist for Lakeshore reasoning. |
| Intelligence initiatives | `ai_initiatives` | 40 | Initiative portfolio exists and ties to loaded context. |
| Moves / programs | `engagements` | 6 | Six Lakeshore Moves exist; artifact depth varies by Move. |
| Tower vendor spend | `tower_vendor_spend` | 82 | Vendor spend context is available for Tower and finance questions. |
| Tower program financials | `tower_program_financials` | 40 | Program financial rows are available. |
| Tower cloud cost | `tower_cloud_cost` | 24 | Cloud-cost context is loaded. |
| Demo personas | `person_client_memberships` | 2 | CIO and CFO personas are mapped to Lakeshore. |

Demo persona proof:

| Persona | Role | Capabilities observed |
|---|---|---|
| `cio@lakeshore-holdings.example.com` / Meera Rao | Global CIO / maestro | financial visibility; can create Source events; can upload/generate Source artifacts |
| `cfo@lakeshore-holdings.example.com` / Daniel Whitaker | CFO and treasury sponsor / maestro | financial visibility; can create Source events; can upload/generate Source artifacts |

## Corpus And Vector

Vector store: native Azure AI Search, not Pinecone.

Current Lakeshore corpus status from the active build run:

| Store | Count |
|---|---:|
| Azure AI Search `lakeshore-patterns-v1` | 8,987 |
| Target | 10,000 |
| Completion | about 90% |

The corpus is deep enough for a grounded demo around treasury, governance, IT/data, and holdings-company operating doctrine, but the remaining approximately 1,013 patterns should still be generated and QA'd.

Important lane distinction:

- Lakeshore corpus doctrine is vectorized in Azure AI Search `lakeshore-patterns-v1`.
- Source artifacts are Blob/Postgres artifacts with parsed bodies, chunks, facts, graph edges, evidence states, and approval states.
- The current Source artifact lane does not write embeddings to a Source-specific vector index; Lakeshore Source artifact and chunk `embedding_status` values were normalized to `not_applicable` after confirming the working path is parsed/cited evidence rather than an unfinished vector job.

## Source Coverage

### `LSH-KYRIBA-TREASURY-2026`

Event id: `bd8d173f-6600-48a3-b155-9fa74d024ce8`
Linked Move id: `1196dac0-715c-45ce-8eeb-5e70792d9aa4`
Current Source stage: `executive_decision`
Value-at-stake: 31.5M to 48.3M planning range
Decision owner: Daniel Whitaker / Meera Rao

Live Source artifact proof:

| Area | Count / state |
|---|---:|
| Azure Blob files in `source-artifacts/lakeshore/LSH-KYRIBA-TREASURY-2026/` | 26 |
| `source_artifacts` rows | 26 |
| `source_event_artifact_states` bodies linked | 26 |
| `source_artifact_chunks` | 26 |
| `source_artifact_facts` | 26 |
| `source_graph_edges` | 26 |
| Source artifact/chunk embedding state | `not_applicable` |
| Evidence states through executive decision | usable evidence |
| Gates through BAFO | met |
| Executive decision artifacts | in review / needs review |
| Selection / transition / value stage artifacts | not started |

Stage artifact coverage:

| Stage | State |
|---|---|
| Strategy | 3 approved artifacts |
| Scope | 5 approved artifacts |
| RFP | 4 approved artifacts |
| Responses | 3 approved artifacts |
| Evaluation | 3 approved artifacts |
| Pricing | 3 approved artifacts |
| BAFO | 2 approved artifacts |
| Executive decision | 3 artifacts in review |
| Selection | scaffold only |
| Transition | scaffold only |
| Value | scaffold only |

Gate and evidence truth:

| Area | State |
|---|---|
| Strategy through BAFO gates | all required criteria met |
| Executive Decision to Selection gate | pending |
| Selection / Transition / Value gates | pending |
| Evidence through Executive Decision | usable evidence |
| Selection / Transition / Value evidence | not requested |

Demo guidance: safe to demo Strategy through BAFO and show Executive Decision as in review. Do not imply Selection, Transition, or Value is complete.

### `LSH-AMS-MODERNIZATION-2026`

Event id: `5602d576-2031-4ef9-a028-bb313286cc8d`
Linked Move id: `5366bbea-572f-4171-ac28-10bbc4d6dc96`
Current Source stage: `evaluation`
Value-at-stake: 12.0M to 26.0M planning range
Decision owner: Meera Rao

Live Source artifact proof:

| Area | Count / state |
|---|---:|
| Azure Blob files in `source-artifacts/lakeshore/LSH-AMS-MODERNIZATION-2026/` | 18 |
| `source_artifacts` rows | 18 |
| `source_event_artifact_states` bodies linked | 18 |
| `source_artifact_chunks` | 18 |
| `source_artifact_facts` | 18 |
| `source_graph_edges` | 18 |
| Source artifact/chunk embedding state | `not_applicable` |
| Evidence states through Evaluation | usable evidence |
| Gates through Responses | met |
| Evaluation artifacts | in review / needs review |
| Pricing / BAFO / executive decision / selection / transition / value artifacts | not started |

Stage artifact coverage:

| Stage | State |
|---|---|
| Strategy | 3 approved artifacts |
| Scope | 5 approved artifacts |
| RFP | 4 approved artifacts |
| Responses | 3 approved artifacts |
| Evaluation | 3 artifacts in review |
| Pricing | scaffold only |
| BAFO | scaffold only |
| Executive decision | scaffold only |
| Selection | scaffold only |
| Transition | scaffold only |
| Value | scaffold only |

Gate and evidence truth:

| Area | State |
|---|---|
| Strategy through Responses gates | all required criteria met |
| Evaluation to Pricing gate | pending |
| Pricing / BAFO / Executive Decision / Selection / Transition / Value gates | pending |
| Evidence through Evaluation | usable evidence |
| Pricing onward evidence | not requested |

Demo guidance: safe to demo as a real Evaluation-stage Source event. Do not imply Pricing, BAFO, Executive Decision, Selection, Transition, or Value is complete.

## Moves Coverage

Lakeshore has six active/draft Move rows:

| Move | Phase | Status | Projected value range | Artifact state |
|---|---:|---|---:|---|
| Kyriba global treasury rollout | 2 | active | 31.5M to 42.0M | 6 deliverables + 6 Azure attachments + 6 evidence rows |
| Shared data platform and evidence spine | 2 | active | 23.25M to 31.0M | 6 deliverables + 6 Azure attachments + 6 evidence rows |
| Northline WMS modernization | 1 | draft | 18.375M to 24.5M | no deliverables |
| Freight visibility and exception AI | 1 | active | 13.5M to 18.0M | no deliverables |
| Brightmark loyalty platform consolidation | 1 | active | 12.225M to 16.3M | no deliverables |
| Promotion sourcing control tower | 1 | draft | 8.775M to 11.7M | no deliverables |

Kyriba Move proof loaded on 2026-06-05:

| Deliverable type | Title | Status |
|---|---|---|
| `charter` | Kyriba Global Treasury Rollout Charter | in_review |
| `baseline` | Kyriba Baseline And Value Measurement Record | in_review |
| `vendor_evaluation_scorecard` | Kyriba Vendor Evaluation Scorecard | in_review |
| `business_case` | Kyriba Costed Business Case | in_review |
| `approval_packet` | Kyriba Executive Approval Packet | in_review |
| `tower_handoff_plan` | Kyriba Tower Handoff Plan | in_review |

Shared Data Platform Move proof loaded on 2026-06-05:

| Deliverable type | Title | Status |
|---|---|---|
| `charter` | Shared Data Platform And Evidence Spine Charter | in_review |
| `baseline` | Data Spine Baseline And Coverage Record | in_review |
| `target_state_architecture` | Evidence Spine Target-State Architecture | in_review |
| `business_case` | Data Platform Evidence Spine Business Case | in_review |
| `operating_model` | Data Spine Governance And Operating Model | in_review |
| `tower_handoff_plan` | Evidence Spine Tower Handoff Plan | in_review |

Azure proof:

| Container | Prefix | Count |
|---|---|---:|
| `program-attachments` | `lakeshore-holdings/1196dac0-715c-45ce-8eeb-5e70792d9aa4/` | 6 |
| `program-attachments` | `lakeshore-holdings/6a4c7fc4-0a2d-4479-b807-7350fb727527/` | 6 |
| `source-artifacts` | `lakeshore/LSH-KYRIBA-TREASURY-2026/` | 26 |
| `source-artifacts` | `lakeshore/LSH-AMS-MODERNIZATION-2026/` | 18 |

Live product route proof captured with a fresh Clerk ticket for `cfo@lakeshore-holdings.example.com` and `abarva_active_client=lakeshore`:

| Route | Status | Proof |
|---|---:|---|
| `/strategic-moves` | 200 | Lakeshore shell, Kyriba, and Data Spine markers present. |
| `/strategic-moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4` | 200 | Modern Kyriba Move detail renders. |
| `/moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4` | 200 | Alias redirects to the modern Kyriba Move detail. |
| `/strategic-moves/6a4c7fc4-0a2d-4479-b807-7350fb727527` | 200 | Modern Data Spine Move detail renders. |

Route caveat: `/engagements/:id` is the legacy engagement console and is not the canonical Moves demo path. The demo should use `/strategic-moves/:id` or the `/moves/:id` alias.

## Kyriba Move 0 Design Implication

Kyriba should be presented as `Move 0: Platform Rollout De-Risk`, not merely as an AI-on-treasury use case. The six rollout gates below should become first-class Move/Source artifacts before claiming downstream AI value:

| Rollout gate | Artifact expected for demo fidelity |
|---|---|
| Bank connectivity | Bank inventory and H2H/SWIFT readiness matrix by bank/entity. |
| ERP feed quality | GL/AP/AR feed audit and reconciliation defect register. |
| Entity hierarchy | Canonical HoldCo/entity registry with intercompany and FX treatment notes. |
| Historical cash data | 24-month position reconstruction plan and normalized entity-currency-day sample. |
| Adoption / Excel elimination | Role-based dashboard activation plan and 30-day adoption KPI tracker. |
| Intercompany reconciliation | Promissory-note discipline, AFR/arms-length control, and monthly true-up workflow. |

This framing aligns the Source event with real Kyriba implementation failure modes: AbarVa de-risks the rollout first, then activates forecasting, anomaly, covenant, and intercompany AI once the substrate is clean enough to trust.

## Recommended Demo Spine

Use one complete flagship story rather than many shallow cards:

1. Intelligence: ask what Lakeshore decision matters first; answer should land on Kyriba treasury rollout using finance/vendor/program evidence.
2. Source: open `LSH-KYRIBA-TREASURY-2026`; show approved Strategy, Scope, RFP, Responses, Evaluation, Pricing, and BAFO artifacts; show Executive Decision as in review.
3. Moves: open `Kyriba global treasury rollout`; show charter, baseline, scorecard, business case, approval packet, and Tower handoff as in-review deliverables.
4. Moves: open `Shared data platform and evidence spine`; show the charter, baseline, target-state architecture, business case, operating model, and Tower handoff as the evidence-spine operating layer.
5. Optional second Source story: open `LSH-AMS-MODERNIZATION-2026`; show Strategy, Scope, RFP, and Responses approved, with Evaluation in review.
6. Tower: show vendor/program/cloud/financial rows as context and explain Tower is ready to monitor the Kyriba and evidence-spine promises after approval.
7. Data Trust/Admin: show 1,329 context records and 9 complete inventory segments, while being clear that the full setup/admin approval ledger is not yet populated.

## Next Build Targets

Highest value next:

1. Finish Source executive-decision gate for Kyriba by approving or explicitly holding the three executive-decision artifacts.
2. Add Selection, Transition, and Value artifacts for Kyriba if the demo needs a fully closed Source lifecycle.
3. Decide whether AMS should remain an Evaluation-stage story or progress into Pricing/BAFO; only create those artifacts if the demo needs the later stages.
4. Backfill the setup/admin approval ledger or clearly label the current context load as CSV-loader backed.
5. Continue corpus generation from 8,987 toward 10,000, with QA before activation.
6. Incorporate the Kyriba "Move 0 rollout de-risk" design package when available: bank connectivity, ERP feed quality, entity hierarchy, historical cash data, adoption, and intercompany reconciliation should become explicit gates/artifacts before any AI-on-Kyriba claims.

## Truth Labels For Demo

Safe wording:

- "Lakeshore is a synthetic demo tenant with committed loader-backed context records."
- "Kyriba is the flagship document-real Source and Moves story."
- "AMS modernization is document-real through Evaluation only."
- "Source artifacts are synthetic but real files in Azure Blob, linked to Source tables."
- "Kyriba and Data Spine Move deliverables are synthetic but real deliverable versions and Azure-backed program attachments."
- "Value ranges are planning values, not realized savings."
- "Context data is CSV/context-loader backed; full setup/admin approval-ledger rows are not present yet."

Unsafe wording:

- "All Lakeshore Source events are fully loaded."
- "All Moves have board-grade artifacts."
- "The setup/admin approval workflow was proven end to end."
- "Kyriba savings are realized."
- "The corpus is complete at 10,000 patterns."
