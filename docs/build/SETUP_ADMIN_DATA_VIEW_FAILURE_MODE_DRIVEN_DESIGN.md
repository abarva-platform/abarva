# Setup/Admin Data View — Failure-Mode-Driven Design (v1)

> **Status.** Integrated design covering three layers as one artifact: (1) the Setup/Admin data surface, (2) the 14 dataset families with content specification, (3) knowledge-layer integration (graph + vector + evidence ledger persistence).
>
> **Audience.** Anand (founder, design lead) + future implementers. Same standard as `PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` and `INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md`. Decisions explicit. Alternatives written down. Gaps named honestly.
>
> **Companion deliverable.** A full Apex Retail synthetic dataset has been produced at `apex-data/` covering all 14 families. This design doc is the spine; the dataset is the substrate.

---

## Part A — Premise

### A.1 Why the three layers are designed as one

The Setup/Admin data view, the dataset content, and the knowledge-layer integration cannot be designed independently. The surface (Layer 1) renders the content (Layer 2) using the integration's persistence (Layer 3). The content's schema constrains what the integration can index. The integration's contracts validate what the surface can demonstrate. Three layers, one design.

If the layers are designed separately, the platform breaks at the seams:
- A surface designed without knowing what data flows through it becomes a generic file manager
- Dataset content designed without knowing the integration's persistence model produces records that can't be retrieved by agents
- Integration designed without knowing what the surface needs to demonstrate produces persistence that's invisible to the user

The mandate ties them: **the Setup/Admin data view + integrated dataset content + knowledge-layer integration is the surface and substrate that makes the platform's promise verifiable.**

### A.2 The promise

A senior practitioner — typically the tenant admin — using the Setup/Admin data view in 60 seconds:

- Sees what data the platform has about their enterprise, by segment, with counts and freshness
- Sees what's missing and why it matters (gaps mapped to active programs and reasoning capabilities)
- Sees provenance for any record (where it came from, who uploaded it, when, with what classification)
- Can ask Sentinel about data health and get grounded answers
- Knows what to upload next to strengthen the platform's reasoning

The promise is precise: the gaps drive the next upload, which strengthens the next reasoning, which improves the next program decision. The page is a *data flywheel*, not a file manager.

### A.3 The 12 failure modes

Twelve, not ten, because the three layers each have distinct failure modes that don't compress without losing precision.

**Surface failures** (what fails on Layer 1 — the Setup/Admin page itself):

| # | Failure mode | Primary prevention |
|---|---|---|
| 1 | **Inventory page that shows what's there but not what's missing** | Coverage column with expected-baseline comparison; gap-first surfacing |
| 2 | **Counts without context** (raw numbers without interpretation) | Sentinel-voice summary at top; expected-baseline parameterized per tenant archetype |
| 3 | **Gaps visible but not actionable** | Every gap has a click-through to "fill this gap" affordance |
| 4 | **Provenance buried** (uploaded-by / when / source hidden in detail pages) | Provenance shown inline in segment table and on every record |

**Dataset failures** (what fails on Layer 2 — the data itself):

| # | Failure mode | Primary prevention |
|---|---|---|
| 5 | **Synthetic data that smells synthetic** (uniformly clean, no contradictions, no history) | Imperfection (~12% missing fields), contradictions, history, specificity, asymmetric depth — explicitly designed in |
| 6 | **Coverage that doesn't match real enterprise shapes** (uniformly detailed everywhere) | Tenant personality is deliberate — Apex strong in customer/martech, weak in supply chain |
| 7 | **Dataset depth that doesn't support the four reasoning modes** | Every dataset family specifies which knowledge-layer artifacts it produces (graph nodes, edges, embeddings, evidence) |

**Integration failures** (what fails on Layer 3 — the persistence and retrieval):

| # | Failure mode | Primary prevention |
|---|---|---|
| 8 | **Data uploaded but not persisted in graph/vector** (the data-without-binding pattern) | Ingestion contract requires successful persistence + index before "uploaded" status is set |
| 9 | **Tenant isolation that doesn't survive a missing filter** | Every table has tenant_key column with RLS; deliberate negative tests required at pilot |
| 10 | **Provenance lost between upload and agent response** | Every persisted record carries source_doc, source_basis, uploaded_by, uploaded_at; these flow through to agent provenance trail artifacts |
| 11 | **Stale data not flagged for re-review** | Every record has last_reviewed; expiry thresholds parameterized per data type; segment table surfaces stale counts |
| 12 | **Cross-segment relationships invisible** (system inventory and vendor contract data should cross-reference) | Knowledge-layer mapping creates explicit cross-segment graph edges (e.g., `OWNED_BY`, `INTEGRATED_WITH`, `COVERED_BY_CONTRACT`) |

### A.4 Pilot-readiness baseline

- **Surface:** Coverage scoring works against expected-baseline parameters per tenant archetype. Sentinel-voice summary renders. Gap-actionability click-through works. Provenance shown inline.
- **Datasets:** Apex Retail full-depth dataset across all 14 families signed off by senior practitioner. Realism techniques applied. Three tenant personalities meaningfully different.
- **Integration:** Every upload path produces graph + vector + evidence-ledger entries. Tenant isolation negative-tested. Provenance trail traverses upload → persistence → retrieval → agent response.
- **Audit:** Every upload, edit, delete logged with actor + tenant + timestamp + classification.

---

## Part B — Architecture

### B.1 Data flow diagram (the spine)

```
┌──────────────────┐
│ Tenant Admin     │
│ uploads / edits  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Layer 1: Setup/Admin Data Surface            │
│  - Segment table (14 rows)                   │
│  - Segment detail pages                      │
│  - Sentinel chat (data-scoped)               │
│  - Upload affordances (form / file / connect)│
└────────┬─────────────────────────────────────┘
         │ ingest()
         ▼
┌──────────────────────────────────────────────┐
│ Layer 2: Dataset content + schema validation │
│  - 14 family schemas                         │
│  - Per-family ingestion contract             │
│  - Imperfection / contradiction / history    │
│    techniques applied to synthetic data      │
└────────┬─────────────────────────────────────┘
         │ persist()
         ▼
┌──────────────────────────────────────────────┐
│ Layer 3: Knowledge-layer integration         │
│  - Postgres tables (tenant_key + RLS)        │
│  - Graph nodes + edges (enterprise_graph_*)  │
│  - Vector embeddings (enterprise_context_*)  │
│  - Evidence ledger (evidence)                │
│  - Cross-segment references                  │
└────────┬─────────────────────────────────────┘
         │ retrieve()
         ▼
┌──────────────────────────────────────────────┐
│ Agent reasoning (Nexus / Sentinel / Atlas)  │
│  - Tenant-grounded mode                      │
│  - Cross-corpus mode                         │
│  - Provenance trail artifacts                │
└──────────────────────────────────────────────┘
```

The arrows represent contracts. Each contract is testable:
- `ingest()`: schema validation, classification check, RLS write
- `persist()`: graph + vector + evidence rows created; cross-segment edges resolved; embedding model recorded
- `retrieve()`: tenant-isolated query; provenance attached; freshness flagged

### B.2 Surface state model

The Setup/Admin data view has three orthogonal state dimensions:

**Authorization dimension:**
- `tenant_admin` — full access; can upload, edit, delete, configure
- `program_initiator` / `sme` / `viewer` — read-only access to data they have permission to see
- `cross_tenant_role` — none; multi-tenant isolation is absolute

**View dimension:**
- `landing` — segment table view (the 14 rows)
- `segment_detail` — drilled into one of the 14 segments
- `record_detail` — viewing or editing a specific record
- `upload_in_progress` — file being uploaded, parsed, validated
- `chat_active` — Sentinel chat open

**Health dimension** (rendered everywhere):
- `complete` / `partial` / `sparse` / `not_started` — coverage relative to expected baseline
- `healthy` / `attention` / `critical` — based on stale / conflict / gap thresholds

### B.3 Actor / capability model

| Role | Capability on Setup/Admin |
|---|---|
| **Tenant Admin** | Full read/write on all 14 segments. Configure expected baselines. Approve / reject corpus write-back from agents. View audit log. |
| **Program Initiator / SME** | Read access to segments their programs need. Upload to specific segments (evidence ledger, deliverables, KPI updates). Cannot configure baselines or change data classification policy. |
| **Sentinel** (agent on this surface) | Read-only across all segments. Composes data-health summaries. Surfaces gaps. Cites records by ID. |
| **Steward** (agent on this surface) | Handles upload mechanics, permission checks, classification enforcement. Different voice from Sentinel — operational, not interpretive. |
| **Atlas** (cross-program agent) | Reads cross-segment data to detect overcommitments, dependencies, contradictions. Writes to segment 14 (cross-program signals). |

### B.4 Cross-cutting concerns

- **Audit log.** New table `data_inventory_audit_log` (id, tenant_key, actor_id, role, action, segment_id, record_id, before_state, after_state, classification_at_action, created_at). Every upload, edit, delete writes.
- **RLS on every segment table.** Tenant isolation tested with negative cases. Cross-tenant query attempts logged.
- **Provenance contract.** Every persisted record has: `source_doc`, `source_basis`, `uploaded_by`, `uploaded_at`, `data_classification`, `confidence`, `last_reviewed`. These are not optional fields.
- **Expected-baseline configuration.** New table `tenant_expected_baselines` per (tenant_key, segment_id) with parameters for the coverage calculation. Defaults parameterized per tenant archetype (retail / healthcare / financial-services).
- **Freshness thresholds.** Per data type: enterprise profile (annual review), org structure (quarterly), system landscape (semi-annual), KPI dictionary (quarterly), evidence (varies — programs in flight have shorter expiry).
- **Telemetry.** Posthog events: `data.uploaded`, `data.edited`, `data.deleted`, `gap.surfaced`, `gap.actioned`, `sentinel.queried_data`, `provenance.viewed`, `cross_segment_edge.created`.

---

## Part C — The 14 Dataset Families (Specified)

For each family: purpose, schema highlights, expected baseline (Apex Retail), knowledge-layer mapping, ingestion shape, sample record reference (in `apex-data/`).

### C.01 — Enterprise profile

**Purpose:** Foundational tenant identity. Anchors every other artifact.

**Schema:** Legal entity, industry codes, revenue/employee bands, FY structure, regulatory frameworks applicable, strategic priorities (3-5), risk appetite, ESG posture. Markdown narrative + structured fields.

**Apex baseline:** 1 profile document. Always complete.

**Knowledge-layer mapping:**
- Graph node: `enterprise:apex-retail` (single root node)
- Vector embedding: full profile narrative chunked + embedded
- Evidence: profile cites public filings (10-K), strategic commitments
- Cross-segment edges: `HAS_EXECUTIVE` to org structure, `OPERATES_IN` industry context

**Ingestion shape:** Form-based for structured fields + markdown editor for narrative. Annual review cadence enforced via `last_reviewed` threshold.

**File:** `apex-data/01_enterprise_profile/enterprise_profile.md`

### C.02 — Org structure

**Purpose:** People graph with reporting lines, tenure, priorities. Includes the political layer (champions, blockers, coalitions) and the change-failure record.

**Schema:**
- `executives[]` — exec bench with role, tenure, background, direct reports, stated priorities
- `it_leaders[]` — IT VPs/Directors with domain ownership
- `political_map` — narrative covering coalitions, disagreements, current dynamics
- `change_failure_record` — past failed initiatives with post-mortems, who was associated, current status

**Apex baseline:** ~50 named executives + IT leaders. 3-5 documented past failures. Political map narrative covering current programs.

**Knowledge-layer mapping:**
- Graph nodes: `person:apex:*` for each named individual
- Graph edges: `REPORTS_TO`, `OWNS_DOMAIN`, `SPONSORS_PROGRAM`, `REPLACED_PREDECESSOR`, `ASSOCIATED_WITH_FAILURE`
- Vector embedding: political map narrative + change-failure narratives
- Evidence: tenure facts, role transitions cited from internal records

**Ingestion shape:** Structured JSON for executives/IT leaders; markdown for political map and change-failure record.

**Files:** `apex-data/02_org_structure/{executive_bench.json, it_leadership.json, political_map.md, change_failure_record.md}`

### C.03 — IT system landscape

**Purpose:** System-of-record map. Vendor + owner + criticality + integration map. The technical reality.

**Schema:**
- `systems[]` — per system: id, name, vendor, version, deployment_model, owner_person_id, annual_cost, renewal_date, business_criticality, technical_debt_rating, data_sensitivity, integration_count
- `integrations[]` — source_system_id, target_system_id, direction, frequency, mechanism, health_status
- `shadow_it[]` — known shadow IT with users, cost, risk classification

**Apex baseline:** ~80 systems expected for retail of this size. Currently 65 systems loaded (the deliberate gap — some legacy POS modules and store-tech systems are not yet inventoried). Integration map covers ~16 of estimated ~124 integrations.

**Knowledge-layer mapping:**
- Graph nodes: `system:apex:*` for each system, `vendor:apex:*` for each vendor
- Graph edges: `OWNED_BY` to person, `PROVIDED_BY` to vendor, `INTEGRATED_WITH` to other systems, `COVERED_BY_CONTRACT` to vendor contracts
- Vector embedding: system descriptions + technical-debt notes
- Cross-segment edges: `USED_IN_PROGRAM` to active programs

**Ingestion shape:** CSV upload for systems (allows bulk update); JSON for integration map (graph structure); CSV for shadow IT.

**Files:** `apex-data/03_it_landscape/{systems_inventory.csv, integration_map.json, shadow_it.csv}`

### C.04 — IT financials

**Purpose:** How money moves. Run/change/transform allocation, vendor spend concentration, renewal exposure.

**Schema:**
- `it_spend_breakdown` — by category (run/change/transform), vendor concentration, OpEx/CapEx
- `renewal_calendar` — next 24 months of renewals with values, owners, current posture
- (Future) `business_case_baselines` — for active programs, stated case vs realized

**Apex baseline:** $87.4M IT budget broken down. 30 contract renewals tracked over next 24 months.

**Knowledge-layer mapping:**
- Graph edges: spend categories link to `vendor` and `system` nodes
- Vector embedding: budget narrative chunks (renewal posture, vendor concentration)
- Evidence: budget figures cite finance reports

**Ingestion shape:** CSV for spend breakdown and renewal calendar.

**Files:** `apex-data/04_it_financials/{it_spend_breakdown.csv, renewal_calendar.csv}`

### C.05 — KPI dictionary

**Purpose:** What the enterprise actually measures. Including KPIs that are claimed to exist but don't have working instrumentation.

**Schema:** Per KPI: id, name, definition, formula, source_system, data_owner, business_owner, refresh_cadence, current_value, trend, target, confidence, leading_or_lagging, tier, caveats, instrumentation_status.

**Apex baseline:** ~150 KPIs expected for retail of this size. Currently 50 KPIs loaded — the deliberate gap. Of those 50, several are flagged with `instrumentation_status="claimed but not measured"` — this is real and important.

**Knowledge-layer mapping:**
- Graph nodes: `kpi:apex:*` for each KPI
- Graph edges: `OWNED_BY` to data/business owner, `MEASURED_FROM` to system, `TRACKED_BY_PROGRAM` to programs
- Vector embedding: KPI definitions + caveats
- Evidence: current values cite source reports

**Ingestion shape:** CSV upload with row-level validation against schema.

**File:** `apex-data/05_kpi_dictionary/kpi_dictionary.csv`

### C.06 — Active program inventory

**Purpose:** What's in flight. Sponsor + lead + phase + budget + business case + risks. The gateway from data layer to Programs surface.

**Schema:** Per program: id, archetype, sponsor, program_lead, current_phase, time_in_phase, business_case, target_metric, budget_approved, budget_consumed, milestones, vendors_involved, risks, recent_decisions, stakeholder_map.

**Apex baseline:** 4 active programs across 4 archetypes — CDP (P3 Design), Contact Center AI (P1 Discovery), AMS Consolidation (P2 Synthesis, second attempt after 2023 failure), Demand Forecasting (P0 Originate, third attempt).

**Knowledge-layer mapping:**
- Graph nodes: `program:apex:*` for each program
- Graph edges: `SPONSORED_BY`, `LED_BY`, `INVOLVES_VENDOR`, `USES_SYSTEM`, `TARGETS_KPI`, `IN_PHASE`, `DERIVED_FROM_PRIOR_FAILURE`
- Vector embedding: business case + risks narrative
- Cross-segment edges to virtually every other segment

**Ingestion shape:** Structured JSON; programs are typically created via Programs surface (not Setup/Admin), but Setup/Admin is the inventory view.

**File:** `apex-data/06_program_inventory/active_programs.json`

### C.07 — Sourcing artifacts

**Purpose:** The full sourcing lifecycle for programs that involve vendor selection. RFPs, evaluations, BAFO, contracts.

**Schema:**
- RFI/RFP documents with evaluation criteria
- Vendor evaluation matrices
- BAFO trackers (positions, concessions, walk-aways)
- Award memos and signed contracts
- Template registry (sourcing templates by work type)

**Apex baseline:** Active sourcing on CDP (RFP issued, two vendors in BAFO) and AMS Consolidation (BAFO with three vendors). Template registry covers ~15 work types.

**Knowledge-layer mapping:**
- Graph edges: `EVALUATED_BY` to evaluator persons, `BAFO_POSITION_OF` to vendor, `CONTRACT_AWARDED_TO` (when complete)
- Vector embedding: RFP requirements, vendor strengths/weaknesses, BAFO positions
- Evidence: every quoted price, every vendor commitment, every concession

**Ingestion shape:** Markdown for narrative artifacts (RFP, BAFO tracker), CSV for evaluation matrices.

**Files:** `apex-data/07_sourcing_artifacts/{cdp_rfp_issued.md, cdp_vendor_evaluation.csv, ams_bafo_tracker.md, template_registry.csv}`

### C.08 — Program deliverables

**Purpose:** Phase outputs from active programs — the artifacts the platform produces and persists.

**Schema:** Per program × phase: charter, design spec, ARB attestation, discovery package, execution plan, outcome report, etc. Specified in deliverables-library contract.

**Apex baseline:** Each of 4 active programs has phase-appropriate deliverables — CDP signed charter (P2 close), CC AI P1 discovery package, AMS ARB attestation, Forecast P0 origination.

**Knowledge-layer mapping:**
- Graph edges: `DELIVERED_BY_PROGRAM` to program, `SIGNED_OFF_BY` to person, `CITES_EVIDENCE` to evidence ledger entries
- Vector embedding: every deliverable's full text
- Evidence: deliverables both cite evidence and become evidence for downstream claims

**Ingestion shape:** Markdown for narrative deliverables; structured fields for sign-off metadata.

**Files:** `apex-data/08_program_deliverables/{cdp_signed_charter.md, cc_ai_p1_discovery_package.md, ams_arb_attestation.md, forecast_p0_origination.md}`

### C.09 — Evidence ledger

**Purpose:** The grounding for every claim. Source documents, citations, confidence, classification.

**Schema:** Per evidence item: id, claim, source_type, source_doc, source_section, data_classification, confidence, last_updated, owner, supports_claims_in[], caveats.

**Apex baseline:** ~400 expected; currently 412 loaded (the dataset shows ~25 representative items demonstrating shape).

**Knowledge-layer mapping:**
- Graph nodes: `evidence:apex:*` for each item
- Graph edges: `SUPPORTS_CLAIM_IN` to deliverables/programs/KPIs; `CITES_DOCUMENT` to source docs
- Vector embedding: claim text + caveats
- This is the spine that the entire knowledge layer's provenance contract runs on

**Ingestion shape:** JSON for structure; agents write back here as programs progress.

**File:** `apex-data/09_evidence_ledger/evidence_ledger.json`

### C.10 — Operating telemetry

**Purpose:** Day-to-day enterprise data — meetings, decisions, status updates, risk logs.

**Schema:** Meeting notes (semi-structured), risk/action/decision log (structured).

**Apex baseline:** Recent meeting notes covering CDP P3, CC AI P1, AMS BAFO, exec committee. Risk/action/decision log with ~30 active items.

**Knowledge-layer mapping:**
- Graph edges: `DISCUSSED_AT_MEETING`, `OWNED_ACTION_BY`, `DECIDED_AT`
- Vector embedding: meeting notes + decision rationale
- Evidence: decisions become evidence for downstream program reasoning

**Ingestion shape:** Markdown for meeting notes; JSON for risk/action/decision log.

**Files:** `apex-data/10_operating_telemetry/{recent_meeting_notes.md, risk_action_decision_log.json}`

### C.11 — Vendor and contract data

**Purpose:** Beyond the system landscape — contract reality. Performance scorecards, clause inventory, escalation paths.

**Schema:**
- Vendor scorecards (performance, risk, financial health, strategic alignment)
- Contract clause inventory (MFN, escalators, exit terms, SLAs, audit rights, IP terms) for major vendors

**Apex baseline:** Top 28 vendors with scorecards. Clause inventory for top vendors.

**Knowledge-layer mapping:**
- Graph edges: `CONTRACT_TERMS_WITH` to vendor, `RENEWAL_DUE`
- Vector embedding: clause text (so the agent can reason about exit terms, MFN, etc.)

**Ingestion shape:** CSV for scorecards; JSON for clause inventory.

**Files:** `apex-data/11_vendor_contracts/{vendor_scorecards.csv, contract_clause_inventory.json}`

### C.12 — Compliance and regulatory

**Purpose:** The constraint layer. Applicable regulations, audit findings, posture by framework.

**Schema:**
- `compliance_posture` — by framework (SOX, PCI-DSS, CCPA/CPRA): status, owner, gap analysis
- `audit_findings` — recent audit findings with remediation status

**Apex baseline:** SOX, PCI-DSS, CCPA/CPRA postures documented. ~10 audit findings tracked.

**Knowledge-layer mapping:**
- Graph edges: `SUBJECT_TO_FRAMEWORK`, `HAS_FINDING`, `REMEDIATED_BY`
- Vector embedding: posture narrative + finding details
- Critical for failure mode #6 (Late attention to compliance) — programs query this segment in P2

**Ingestion shape:** Markdown for posture narrative; JSON for findings.

**Files:** `apex-data/12_compliance/{compliance_posture.md, audit_findings.json}`

### C.13 — Industry context

**Purpose:** What's happening around the enterprise. Peer benchmarks, regulatory shifts, vendor market changes.

**Schema:** Industry signals (events, M&A, regulatory shifts, vendor changes) + peer benchmarks (anonymized peer KPIs, IT spend ratios, AI maturity).

**Apex baseline:** ~30 active signals; benchmark data for retail peers.

**Knowledge-layer mapping:**
- Graph edges: `SIGNAL_AFFECTS_PROGRAM`, `BENCHMARK_FOR_KPI`
- Vector embedding: signal narratives
- This data refreshes from external sources; not all from upload

**Ingestion shape:** JSON; some sourced from connectors / signal pipelines.

**File:** `apex-data/13_industry_context/industry_signals_and_benchmarks.json`

### C.14 — Cross-program signals

**Purpose:** The connective tissue across the portfolio. Auto-derived rather than uploaded.

**Schema:** Per signal: type (shared_sme_overcommitment, shared_system_dependency, shared_vendor, cross_program_dependency, cross_program_contradiction), programs_involved, severity, raised_by_agent, status, recommendation.

**Apex baseline:** ~18 signals derived from cross-program data.

**Knowledge-layer mapping:**
- Graph edges: derived from existing nodes (no new ingestion); `SHARES_SME_WITH`, `DEPENDS_ON`, `CONTRADICTS`
- Atlas writes these; tenant admin reviews and dispositions

**Ingestion shape:** Auto-derived; tenant admin can dispose / acknowledge / act on signals.

**File:** `apex-data/14_cross_program_signals/cross_program_signals.json`

---

## Part D — Surface Design (Segment Table + Detail Pages)

### D.1 The segment table (landing view)

The Setup/Admin data view's primary surface is a 14-row table. Every row represents one of the 14 dataset families.

**Top section** — at-a-glance health:

```
┌──────────────────────────────────────────────────────────────────┐
│ Apex Retail — Tenant Data Health                                  │
│                                                                    │
│ Coverage: 73%   Records: 1,847   Last upload: 1 day ago           │
│                                                                    │
│ Sentinel: "Apex Retail has rich customer data and active program  │
│ inventory, sparse supply chain instrumentation, and 6 evidence    │
│ items flagged as stale. Three programs are running with           │
│ insufficient baseline data."                                       │
└──────────────────────────────────────────────────────────────────┘
```

**Middle section** — the table:

| Segment | Records | Coverage | Freshness | Health | Last reviewed | Actions |
|---|---|---|---|---|---|---|
| 01 Enterprise profile | 1 | Complete | 2d | ● Healthy | 12d | View / Update |
| 02 Org structure | 47 leaders + change record | Partial | 8d | ⚠ 2 vacancies | 12d | View / Update |
| 03 IT system landscape | 65 systems, 16 integrations | Partial | 14d | ⚠ 12 missing owners; gap vs ~80 expected | 28d | View / Update |
| 04 IT financials | $87.4M tracked, 30 renewals | Complete | 3d | ● Healthy | 3d | View / Update |
| 05 KPI dictionary | 50 KPIs | Sparse | 21d | ⚠ 8 unmeasured; ~150 expected | 60d | View / Update |
| 06 Program inventory | 4 programs | Complete | 1d | ● Healthy | 1d | View / Update |
| 07 Sourcing artifacts | 4 active artifacts | Partial | 6d | ● Healthy | 30d | View / Update |
| 08 Program deliverables | 4 phase deliverables | Aligned to program phases | 1d | ● Healthy | 1d | View / Update |
| 09 Evidence ledger | 412 items | Complete | 4d | ⚠ 47 stale, 12 low-confidence | 14d | View / Update |
| 10 Operating telemetry | Recent meetings + log | Active | <1d | ● Healthy | 7d | View / Update |
| 11 Vendor and contract | 28 scorecards, clause inventory | Partial | 11d | ⚠ 4 renewals due in 90d | 30d | View / Update |
| 12 Compliance | 3 frameworks documented | Sparse | 45d | ✕ 6 control gaps; review overdue | 90d | View / Update |
| 13 Industry context | 30+ signals | Active | 1d | ● Healthy | 1d | View / Update |
| 14 Cross-program signals | 18 detected | Auto-derived | <1d | ⚠ 3 contradictions open | 1d | View / Review |

**Right rail / bottom** — Sentinel chat affordance for data-scoped questions.

### D.2 Segment detail page (template)

Every segment, when clicked, opens a detail page following the same structure:

**Header:** segment name, brief description, expected baseline parameter for this tenant, current coverage score, last reviewed date and reviewer.

**Health panel:** specific issues — gaps, stale items, conflicts, low-confidence — clickable to filter the table.

**Records table:** the actual records in this segment, with columns appropriate to the data type. Sortable, filterable, paginated. Provenance column always present.

**Add/update affordance:** segment-appropriate — file upload, structured form, connector trigger.

**Sentinel chat (segment-scoped):** "Ask about your [segment name]."

### D.3 Failure mode prevention by surface element

| Surface element | Prevents failure mode |
|---|---|
| Coverage column with expected-baseline | #1 (inventory shows what's missing) |
| Sentinel-voice top summary | #2 (counts have context) |
| "View / Update" actions per row + gap-click-through | #3 (gaps are actionable) |
| Provenance column inline | #4 (provenance not buried) |
| Health flags (stale, low-confidence, conflicting) | #11 (stale data flagged) |
| Cross-segment links rendered (e.g., "this system used in 2 programs") | #12 (cross-segment relationships visible) |

### D.4 Worked scenarios

#### Scenario A — Apex Tenant Admin during initial onboarding (sparse state)

**Context:** Apex has loaded enterprise profile, executive bench, and 12 systems. Most segments empty.

**Surface state:** Coverage score: 18%. Most segments showing "Sparse" or "Not started." Top section shows: *"Sentinel: Apex Retail has minimal data loaded. The platform's reasoning capabilities are limited to enterprise-level statements until additional segments are populated. Highest-priority gaps: IT system landscape (12 of ~80 expected), KPI dictionary (not started), active program inventory (not started)."*

Tenant admin clicks the IT system landscape row.

**Detail page:** Shows 12 loaded systems. Header shows: *"Expected baseline for retail tenant your size: ~80 systems. You have 12 loaded. Significant gap in customer-facing systems and supply chain."* Sentinel-voice gap interpretation: *"Programs targeting customer experience or supply chain optimization will have very limited grounding. CDP-style programs need ~6-8 source systems; AMS Consolidation needs the full portfolio."*

Admin uploads CSV with 50 more systems. Validation runs. Persistence path executes — graph nodes created, embeddings generated, cross-segment edges resolved (systems link to vendors loaded earlier, owners link to people in org structure). Status updates from "Not started" to "Partial." Coverage score recalculated.

**Failure modes prevented:** #1, #2, #3 (gap actionable via upload), #8 (persistence verified), #12 (cross-segment edges resolved during ingestion).

#### Scenario B — Apex Tenant Admin in steady state (current Apex state)

**Context:** Apex is the current loaded tenant. 73% coverage. 4 active programs. 412 evidence items.

**Surface state:** Top section: *"Sentinel: Apex Retail has rich customer data and active program inventory, sparse supply chain instrumentation, and 6 evidence items flagged as stale. Three programs are running with insufficient baseline data."*

Admin clicks the Sentinel chat: *"Which programs are running with insufficient baseline data?"*

Sentinel responds: *"Three:*

*1. apex-cdp-2026 (P3 Design) — identity match-rate baseline is 71%, but 12 of 12 source systems were expected and only 11 are loaded. The legacy in-store CRM is excluded. Programs that don't have full source-system inventory at P1 typically discover the gap in P4 build.*

*2. apex-cc-ai-2026 (P1 Discovery) — current containment baseline is captured (38%), but the underlying call-volume data lineage is unverified. PAT-AI-009 (Inability to Measure Outcomes) is the failure mode at risk.*

*3. apex-forecast-2026 (P0 Originate) — granularity decision pending; no baseline yet. This is expected for P0 but needs to lock by P1 entry."*

Admin clicks into evidence ledger. Filters to "stale" and "low-confidence." Actions: review and update.

**Failure modes prevented:** #2, #5 (Sentinel synthesizes, doesn't list), #11 (stale flagged), #10 (provenance preserved through to chat answer).

#### Scenario C — Tenant Admin during a regulatory exam (high-stakes use)

**Context:** Examination notice received. Auditor will ask: *"Show me your AI governance posture."*

Admin opens Setup/Admin data view. Goes to segment 12 (Compliance).

**Detail page:** Compliance posture documented for SOX, PCI-DSS, CCPA/CPRA. AI governance posture tracked under CCPA/CPRA section. 6 control gaps flagged. Last reviewed 90 days ago — *"review overdue"* warning.

Admin clicks Sentinel: *"Pull together everything I'd need for an AI governance audit."*

Sentinel composes: *"For AI governance audit, the relevant artifacts span:*

*- Enterprise profile: AI Governance Council referenced (formed Q4 2024)*

*- Executive bench: AI Council members named (CDO, CISO, CIO, GC, Privacy Officer)*

*- Compliance posture: AI section under CCPA/CPRA framework*

*- Operating telemetry: AI Council meeting notes (last meeting 2026-04-08)*

*- Cross-program signals: 4 active programs use AI; each has individual governance posture*

*- Evidence ledger: 23 items grounding AI governance claims*

*Six control gaps in current posture: [enumerated]. Three of these affect active programs. Recommend: review compliance posture record (overdue) before responding to auditor."*

Admin sees the breadth of grounding the platform can provide. Recognizes specific gaps to remediate before the exam.

**Failure modes prevented:** #4 (provenance traceable), #9 (cross-segment reasoning), #10 (provenance preserved), #12 (cross-segment edges enable the synthesis).

### D.5 Brainstorm — design alternatives considered

**Alternative 1: Tab-based segment navigation instead of single table.**

- Pro: more space per segment; richer per-segment header.
- Con: hides the at-a-glance portfolio health; admin has to click 14 tabs to know overall state. Defeats the dashboard purpose.
- **Rejected.** Single table for landing; detail pages for depth.

**Alternative 2: Auto-derive expected baselines from connected systems / industry benchmark data.**

- Pro: removes manual configuration.
- Con: derivation requires a baseline model that doesn't exist yet at pilot; manual configuration with documented defaults per archetype is more honest at pilot stage.
- **Resolution:** parameterized defaults per archetype at pilot; auto-derivation post-pilot.

**Alternative 3: Show data freshness as colored heatmap rather than per-segment column.**

- Pro: more visual.
- Con: heatmaps work for many cells in a grid; here we have 14 segments. Per-row freshness with color flags is sufficient.
- **Rejected.** Per-row indicator with color.

**Alternative 4: Sentinel chat as a separate page from segment table.**

- Pro: more chat real estate.
- Con: admin needs Sentinel grounded *in the page they're looking at*. Splitting them loses the context.
- **Rejected.** Sentinel chat affordance on this surface; opens in side rail or modal.

**Alternative 5: Allow agents (not just admin) to upload data via this surface.**

- Pro: agents could augment data automatically.
- Con: write-back from agents is a separate governed flow (per knowledge_writeback contract). This surface is the admin's view; write-back goes through approval before showing here.
- **Resolution:** agents propose write-back; admin reviews and accepts via separate workflow; accepted write-backs appear in this surface with `source_basis="agent_writeback_approved"`.

### D.6 Open questions for the surface

1. **Coverage score weighting.** Equal weight per segment, or weighted by impact on active programs? Lean: weighted by program impact at pilot — segments that block active program advancement count more.
2. **Per-segment configuration UI.** Where does the tenant admin configure expected baselines? Lean: settings page within Setup; not on the segment detail page itself.
3. **Bulk operations.** Should admin be able to mark multiple records "reviewed" at once, or trigger bulk re-classification? Lean: yes, with audit log capturing bulk action.
4. **Mobile.** 14-row table on mobile? Lean: collapse to 5 most-attention-needed segments by default, "show more" for full list.

---

## Part E — Knowledge-Layer Integration (Layer 3 Detail)

### E.1 The integration contract

Every upload goes through a five-step pipeline, each step testable:

```
Step 1: SCHEMA VALIDATION
  - Per-family schema check
  - Required fields present
  - Data classification declared
  - Tenant_key matches authenticated user's tenant

Step 2: PERSISTENCE
  - Insert into segment table with tenant_key + RLS
  - last_reviewed = uploaded_at
  - source_basis = "tenant_admin_upload" | "connector" | "agent_writeback"
  - Audit log entry written

Step 3: GRAPH INDEXING
  - Create nodes per family schema (e.g., system → system node)
  - Resolve cross-segment edges (e.g., system OWNED_BY person, COVERED_BY contract)
  - Validate referential integrity (no edges to non-existent nodes)

Step 4: VECTOR EMBEDDING
  - Chunk text content per family rules
  - Generate embedding (text-embedding-3-small, 1536 dim — pending reconciliation)
  - Insert into enterprise_context_chunks with provenance metadata

Step 5: STATUS UPDATE
  - Coverage score recalculated for the segment
  - Surface refreshes
  - Sentinel summary regenerated
  - Affected program inventories notified (e.g., new system added → CDP P1 evidence available)
```

If any step fails, the upload status is "ingestion_failed" with the failed step recorded. The record exists in the segment table (Step 2 succeeded) but is flagged as not-yet-indexed. Admin can see ingestion status per record.

### E.2 Per-family knowledge-layer mapping (summary)

The C.01-C.14 sections specified the per-family graph nodes, edges, and embeddings. Summary table:

| Family | Graph nodes | Key edges (outgoing) | Embedding scope |
|---|---|---|---|
| 01 Enterprise profile | enterprise:* (1 node) | HAS_EXECUTIVE, OPERATES_IN | Full profile narrative |
| 02 Org structure | person:* | REPORTS_TO, OWNS_DOMAIN, SPONSORS_PROGRAM | Political map + change-failure narratives |
| 03 IT landscape | system:*, vendor:* | OWNED_BY, INTEGRATED_WITH, COVERED_BY_CONTRACT | System descriptions, technical-debt notes |
| 04 IT financials | (no new nodes) | Spend categories link to vendor, system | Renewal posture, vendor concentration narrative |
| 05 KPI dictionary | kpi:* | OWNED_BY, MEASURED_FROM, TRACKED_BY_PROGRAM | Definitions + caveats |
| 06 Program inventory | program:* | SPONSORED_BY, USES_SYSTEM, TARGETS_KPI, IN_PHASE | Business case + risks |
| 07 Sourcing artifacts | (cross-references existing) | EVALUATED_BY, BAFO_POSITION_OF | RFP requirements, vendor evaluation, BAFO positions |
| 08 Program deliverables | deliverable:* | DELIVERED_BY_PROGRAM, SIGNED_OFF_BY, CITES_EVIDENCE | Full deliverable text |
| 09 Evidence ledger | evidence:* | SUPPORTS_CLAIM_IN, CITES_DOCUMENT | Claim text + caveats |
| 10 Operating telemetry | (lightweight nodes for meetings/decisions) | DISCUSSED_AT_MEETING, OWNED_ACTION_BY | Meeting notes, decision rationale |
| 11 Vendor and contract | (vendor nodes from 03) | CONTRACT_TERMS_WITH, RENEWAL_DUE | Clause text |
| 12 Compliance | framework:*, finding:* | SUBJECT_TO_FRAMEWORK, HAS_FINDING | Posture narrative + finding details |
| 13 Industry context | signal:* | SIGNAL_AFFECTS_PROGRAM, BENCHMARK_FOR_KPI | Signal narratives |
| 14 Cross-program signals | (auto-derived edges) | SHARES_SME_WITH, DEPENDS_ON, CONTRADICTS | Auto-derived from existing |

### E.3 Tenant isolation contract

Every persistence step asserts tenant isolation:

- Postgres tables: tenant_key column with RLS policies that match `auth.uid() → user_tenant_key`
- Graph nodes: tenant_key in node properties; all traversal queries filter by tenant_key
- Vector embeddings: tenant_key in chunk metadata; all retrieval queries filter by tenant_key
- Cross-tenant queries: throw `TenantIsolationViolation` immediately

**Negative tests required at pilot:**

1. Authenticated user from Tenant A attempts to retrieve graph nodes with Tenant B's tenant_key in query → blocked, logged
2. Vector retrieval without tenant_key filter → blocked at API layer
3. Direct SQL with elevated privileges that omits tenant_key filter → caught by RLS
4. Agent retrieval that constructs a query without tenant_key → broker layer rejects

### E.4 Provenance trail (upload → agent response)

The provenance chain that connects an upload to an agent's answer:

```
Upload event: { actor_id, tenant_key, segment_id, source_doc, uploaded_at }
                  ↓
Persistence: { record_id, source_basis = "tenant_admin_upload", uploaded_by, uploaded_at }
                  ↓
Graph indexing: { node_id with provenance metadata; edge with source = record_id }
                  ↓
Vector embedding: { chunk_id with source_record_id, embedding_model, embedded_at }
                  ↓
Agent retrieval: { retrieved_chunk → source_record_id → source_doc → uploaded_by }
                  ↓
Provenance trail artifact in agent response: full chain rendered
```

The user clicking on a citation in Sentinel's response sees: *"This claim came from `evidence:apex:001`, sourced from `data-quality-baseline-2026-q1.xlsx`, uploaded by Lynne Stratham (CDO) on 2026-04-15, classification: Confidential, confidence 0.84."*

That's the unfakeable chain.

### E.5 Stale data detection

Per data type, freshness thresholds:

| Family | Fresh | Attention | Stale |
|---|---|---|---|
| 01 Enterprise profile | <90d | 90-180d | >180d |
| 02 Org structure | <60d | 60-120d | >120d |
| 03 IT landscape | <90d | 90-180d | >180d |
| 04 IT financials | <30d | 30-60d | >60d |
| 05 KPI dictionary | <60d | 60-120d | >120d |
| 06-08 Program-related | <14d (active) | 14-30d | >30d |
| 09 Evidence ledger | varies (per-claim caveats) | varies | varies |
| 10 Operating telemetry | <7d | 7-30d | >30d |
| 11 Vendor and contract | <60d | 60-120d | >120d |
| 12 Compliance | <90d | 90-180d | >180d (regulatory implications) |
| 13 Industry context | <30d | 30-60d | >60d |
| 14 Cross-program signals | auto-refreshed | n/a | n/a |

When records cross thresholds, the segment health flag updates and Sentinel can surface the stale records on demand.

---

## Part F — Pilot-Readiness Checklist

**Surface (Layer 1):**
- [ ] Segment table renders with coverage / freshness / health columns
- [ ] Sentinel-voice top summary renders, regenerates on data changes
- [ ] Segment detail pages render with provenance column
- [ ] Gap-click-through actions work
- [ ] Sentinel chat (data-scoped) returns grounded answers
- [ ] Mobile rendering: graceful collapse

**Datasets (Layer 2):**
- [ ] Apex Retail full-depth dataset loaded across all 14 families ✓ (complete in `apex-data/`)
- [ ] Realism techniques applied (imperfection, contradiction, history, specificity, asymmetric depth) ✓
- [ ] Senior practitioner review and sign-off on dataset
- [ ] Three tenant personalities meaningfully different (Apex full; Meridian/First Capital moderate)

**Integration (Layer 3):**
- [ ] Postgres schema migrated for all 14 segments + audit log + expected_baselines
- [ ] RLS policies on every segment table
- [ ] Graph indexing for all 14 families' node and edge types
- [ ] Vector embedding pipeline runs end-to-end (chunk → embed → persist → retrieve)
- [ ] Cross-segment edge resolution works (system → owner; system → vendor; etc.)
- [ ] Tenant isolation negative tests pass (4 cases per E.3)
- [ ] Provenance trail traverses upload → persistence → retrieval → agent response
- [ ] Stale data detection runs on schedule; updates segment health
- [ ] Audit log captures every upload / edit / delete

---

## Part G — Slicing

| Slice | Scope | Failure modes addressed | Pilot-readiness floor |
|---|---|---|---|
| **SET-1** | Schema migration: 14 segment tables + audit log + expected_baselines | governance | RLS on every table |
| **SET-2** | Ingestion pipeline (steps 1-2): schema validation + persistence + audit | #4, #9 | Per-family schemas tested; tenant isolation |
| **SET-3** | Graph indexing pipeline (step 3): nodes + edges per family | #8, #12 | Cross-segment edges resolve; referential integrity |
| **SET-4** | Vector embedding pipeline (step 4): chunk → embed → persist → retrieve | #8, #10 | Embedding model recorded; retrieval cited back |
| **SET-5** | Surface landing: segment table with coverage / freshness / health | #1, #2 | Coverage score parameterized per archetype |
| **SET-6** | Segment detail pages (per family) | #3, #4 | Provenance column inline; gap-click-through |
| **SET-7** | Sentinel chat (data-scoped) | #2, #11 | Grounded answers with provenance |
| **SET-8** | Stale data detection + segment health flags | #11 | Thresholds parameterized; health flags surface |
| **SET-9** | Cross-segment edge rendering ("this system used in 2 programs") | #12 | Edges queryable; rendered in detail pages |
| **SET-10** | Apex Retail dataset load (complete; in `apex-data/`) ✓ | #5, #6, #7 | Senior practitioner sign-off |
| **SET-11** | Meridian + First Capital datasets at moderate depth | #6 | Cross-tenant differentiation demonstrated |
| **SET-12** | Tenant isolation negative tests + provenance trail end-to-end | #9, #10 | All negative tests pass |

---

## Part H — Open Questions

1. **Embedding dimension reconciliation.** Vision doc says 3072 (text-embedding-3-large); readiness doc says 1536 (text-embedding-3-small). This must be resolved before SET-4 ships. Pilot recommendation: 1536 for cost; revisit post-pilot if retrieval quality demands.

2. **Connector vs upload primary path.** For families that have natural connector sources (HRIS for org structure; CMDB for system landscape; ITSM for risk log), should connectors be the primary path with manual upload as fallback? Lean: yes for pilot — connectors where available, upload as fallback. Reduces tenant admin manual work.

3. **Agent write-back approval flow.** When agents propose evidence ledger entries, KPI updates, or cross-program signals, what's the approval flow? Lean: tenant admin reviews and accepts in a queue surface; accepted writes flow into segment detail pages with `source_basis="agent_writeback_approved"`. Out of scope for v1; included in roadmap.

4. **Data classification enforcement at retrieval.** When an agent retrieves evidence with `data_classification="Confidential"`, how does that affect what the agent can render? Lean: classification flows through to provenance trail; surface respects classification in rendering (e.g., redacts specific values in screen-shareable demos). Pilot stage: surface classification, no redaction yet.

5. **Cross-tenant benchmark sharing.** The industry context segment includes peer benchmarks. Where do those come from — anonymized cross-tenant aggregation? External research subscription? Lean: external research subscription at pilot; cross-tenant aggregation post-pilot with explicit consent and threshold (n≥10 tenants).

6. **Bulk update mechanics.** When a tenant admin wants to update KPI definitions for 30 KPIs at once, does the surface support bulk edit? Lean: yes via CSV re-upload that diffs against existing records and shows changes for confirmation.

7. **Audit log retention.** How long is audit log retained? Lean: 7 years for compliance reasons; configurable per tenant.

8. **Tenant deletion / right-to-be-forgotten.** When tenant data must be deleted, what's the cascade? Lean: tenant deletion cascades through segment tables, graph nodes (with tenant_key), vector chunks (with tenant_key), evidence ledger, audit log marker (audit log entries retained but tenant_key marked deleted).

---

## Part I — Reviewer Instructions

Read in this order:

1. Part A (premise + 12 failure modes + pilot-readiness baseline). The mandate is the spine; if the three-layer integration framing is wrong, the rest needs rework.

2. Part B (architecture — the data-flow diagram). The 5-step pipeline is the core integration contract; flag any contract that's wrong.

3. Part C (the 14 dataset families, specified). For each family: schema highlights, expected baseline, knowledge-layer mapping. The Apex Retail dataset already produced in `apex-data/` follows these specs; flag any divergence.

4. Part D (surface design — segment table + detail pages + worked scenarios). The senior-practitioner test: would the tenant admin in Scenario A/B/C feel the surface earns the moat?

5. Part E (knowledge-layer integration detail). The provenance trail is the unfakeable mechanism; flag any break in the chain.

6. Parts F-H (checklists, slicing, open questions).

**The three questions that decide whether the doc is right:**

- **Q1 — Are the 12 failure modes the right partition across surface / dataset / integration?** If a failure mode is missing or one of the 12 should split or merge, that changes the prevention design.

- **Q2 — Is the 14-family taxonomy right?** If you want to merge two families or split one, the surface table changes and the integration contract changes.

- **Q3 — Does the 5-step ingestion pipeline (Part E.1) hold up as the core integration contract?** If the steps should be different, slicing changes.

If yes to all three, the doc is the spine for implementation. SET-1 through SET-12 slice cleanly off it. The Apex Retail dataset is the demonstration of Layer 2 already complete; Layers 1 and 3 remain to build.

---

**End of Setup/Admin Data View Failure-Mode-Driven Design v1.**

**Companion deliverable:** `apex-data/` — the full Apex Retail synthetic dataset across all 14 families, ~30 files, ready to ingest.
