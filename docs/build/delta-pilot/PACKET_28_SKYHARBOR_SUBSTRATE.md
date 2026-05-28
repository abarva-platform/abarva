# Packet 28 — SkyHarbor Air (Delta-Shaped Synthetic Tenant) — Modernization Decision Intelligence Substrate Pack

**Mission:** Generate a complete synthetic airline-tenant substrate that simulates a $52B global network carrier 5 years into an IBM mainframe → AWS modernization journey, with sufficient depth and current-state fidelity to demo AbarVa's Intelligence + Moves + Source modules to Delta Air Lines' CTO with substrate quality that withstands the scrutiny: *"What templates did you use? Can I see the synthetic datasets? How did you process and parse the information? Can my team leverage the same process for our real production data?"*

**Tenant codename:** **SkyHarbor Air** (Delta-shaped without using Delta's name, logos, registered marks, or non-public information).

**Deployment target:** Azure private data lane (matches AbarVa's PHS pilot deployment pattern).

**Quality standard:** CTO-defensible. Every artifact (templates, raw briefs, generated records, processing scripts, loader, verification reports) must be present in the deliverable, organized, and reusable by the customer's data engineering team to apply the same process to their real estate.

---

## 1. Why this substrate, why now

Delta has been modernizing its IBM mainframe estate for 5 years under the CTO's sponsorship. The new CIO (Amala) is challenging the pace and asking for evidence-led acceleration. Apex Retail substrate (currently being used to demo) shows AbarVa's mechanics but **does not land emotionally with an airline CTO** because the operating model is completely different (IROPs, crew, fleet, airport ops, loyalty, revenue management, vendor ecosystems).

The wedge for Delta:

> *"AbarVa gives the CTO and CIO a shared decision layer for modernization — what to extract next, what to leave alone, where IBM is creating leverage vs. dependency, where AI-powered SDLC can compress delivery, and how to ramp the offshore/GCC operating model without breaking what's working."*

The substrate must be **current-state heavy** — a 5-year modernization ledger, not a blank-slate transformation plan. Sentinel must be able to answer:

1. "After 5 years, what modernization progress is defensible?"
2. "Which capabilities should we peel into AWS next, and which should stay on Z for now?"
3. "Where is the IBM engagement creating dependency risk?"
4. "Where can AI-powered SDLC accelerate delivery without operational risk?"
5. "How do we ramp GCC from 1,000 to peer-level (3–5K) without quality collapse?"
6. "What should the next 12-month modernization roadmap look like?"
7. "What should we stop doing?"

**Volume target:** 15 data segments / ~440 records / ~310 graph nodes / ~360 edges / ~480 context chunks / Voyage-3-large embeddings.

---

## 2. SkyHarbor Air — tenant identity facts

The substrate must consistently reflect these baseline facts across all segments:

| Dimension | Value |
|---|---|
| Codename | SkyHarbor Air |
| Client key (DB) | `skyharbor-air` |
| Revenue (FY-2025) | $52.1B |
| Employees (total) | ~95,000 |
| Tech employees | ~6,800 (TechOps + Digital + Data + AI + Security + Eng) |
| Aircraft | 950 (mainline 760 + regional 190) |
| Hubs | 8 US hubs (anonymized: Hub-Atlanta-Equivalent, Hub-Detroit-Equivalent, Hub-Minneapolis-Equivalent, Hub-NewYork-JFK-Equivalent, Hub-NewYork-LGA-Equivalent, Hub-LosAngeles-Equivalent, Hub-Seattle-Equivalent, Hub-SaltLake-Equivalent) |
| International gateways | 12 |
| Loyalty members | 110M (Tier A=8M, Tier B=22M, Tier C=80M) |
| Annual IT spend | $3.2B (run $1.8B / grow $0.7B / transform $0.7B) |
| Cumulative modernization spend (5yr) | $2.4B |
| Current modernization run rate | $640M/yr |
| IBM modernization engagement | Started FY-2021; current scope $280M/yr; 5-year contract with optional extension |
| AWS Enterprise Discount Program | Signed FY-2022; $180M/yr commit; ramp to $260M by FY-2027 |
| Offshore GCC | Bangalore (650) + Hyderabad (350) = 1,000 total; peer carriers average 3.5K |
| Mainframe footprint (Day 0, FY-2021) | 47 critical workloads on IBM Z, ~280 MIPS peak |
| Mainframe footprint (today, FY-2026) | 28 critical workloads remain; ~165 MIPS peak; **40% MIPS reduction over 5 years** |
| Capabilities extracted to AWS | 19 of 47 (40%) — but representing only ~22% of revenue-critical transaction volume |
| In-flight extractions | 6 (mixed states: 2 stalled, 3 on track, 1 over-running) |

**Critical narrative constraint:** This is a **mature, working modernization program**, not a failed one. Some waves succeeded brilliantly. Some over-ran. Some created duplicate complexity. Some are stuck. The substrate should reflect honest mid-program reality — wins, losses, contested calls, deferred decisions.

---

## 3. The 15 data segments

For each segment: codename, purpose, target record count, key fields, and content guidance.

### Segment 01 — Enterprise Profile
**Codename:** `S01_ENTERPRISE_PROFILE`
**Records:** 1 client master + 12 supporting facts
**Fields:** revenue, fleet, hubs, employees, loyalty, IT spend breakdown, board priorities, CEO stated strategy, recent financial trends, ESG/sustainability commitments
**Content:** Foundational anchor referenced by every other segment.

### Segment 02 — Modernization Ledger (5-year history)
**Codename:** `S02_MODERNIZATION_LEDGER`
**Records:** 60 historical events (waves, milestones, decisions, reversals)
**Fields:** event_id, wave_id, date, capability_name, action (extract/wrap/retire/leave/reverse), outcome (delivered/delayed/over-ran/abandoned), value_promised, value_realized, value_disputed, lessons_learned, owner_at_time
**Content:** A timeline with realistic shape: 8 waves over 5 years, including 2 successful (loyalty wallet to AWS, customer profile to AWS), 1 stalled (revenue management — too tightly coupled), 1 reversed (a partial extraction that had to be rolled back), and 4 mixed-outcome. Three reversals and one mid-flight pivot.

### Segment 03 — Mainframe Application Inventory (current state)
**Codename:** `S03_MAINFRAME_INVENTORY`
**Records:** 28 mainframe workloads remaining
**Fields:** workload_id, name, business_capability, MIPS_peak, MIPS_avg, transaction_volume_daily, criticality (1-5), batch_window_constraint, regulatory_flag, modernization_status (untouched/in-analysis/in-flight/blocked), reason_still_on_Z, last_modified_date, owner_team
**Content:** Real airline mainframe patterns — PSS (passenger service system), DCS (departure control), crew scheduling, revenue accounting, settlement, IROPs recovery, cargo, MRO interfaces. Each should explain *why* it's still on Z.

### Segment 04 — AWS Native Estate
**Codename:** `S04_AWS_NATIVE_ESTATE`
**Records:** 64 AWS-native services / extracted capabilities
**Fields:** service_id, name, capability_extracted_from_Z (or "greenfield"), AWS_account, region, extraction_wave_id, runtime (Lambda/ECS/EKS/EC2/Sagemaker), data_store (Aurora/DynamoDB/S3/Redshift), event_streams (Kinesis/MSK), criticality, ops_maturity (new/stabilizing/mature), duplicate_complexity_flag
**Content:** Mix of cleanly extracted services and ones that introduced duplicate complexity (e.g., customer profile exists in both Z and Aurora during a multi-year dual-run).

### Segment 05 — Integration Topology
**Codename:** `S05_INTEGRATION_TOPOLOGY`
**Records:** 95 integration edges + 18 integration patterns
**Fields:** edge_id, source_system_id, target_system_id, integration_type (sync_API/async_event/batch_file/CDC/dual_write), latency_class, business_capability, fragility (1-5), modernization_blocker_flag
**Content:** Real airline integration spaghetti — mainframe batches feeding loyalty AWS service, dual-write patterns during extractions, async events emerging from event-driven extractions.

### Segment 06 — IBM Engagement Profile
**Codename:** `S06_IBM_ENGAGEMENT`
**Records:** 1 master engagement + 25 sub-records (work streams, milestones, change orders, exit clauses)
**Fields:** engagement_master fields (start_date, original_scope, current_scope, original_value, current_value, key_executive_relationships, productivity_guarantees, IP_ownership, exit_rights, transition_obligations), milestone records, change_orders, KPI_actuals_vs_targets
**Content:** Multi-year IBM engagement. ~$280M/yr current. Productivity guarantees that were met in years 1-2, slipped in years 3-4, contested in year 5. Several change orders, two material disputes resolved out of court. Knowledge transfer obligations partially met. Exit/transition rights need clarification.

### Segment 07 — Active Initiatives Portfolio
**Codename:** `S07_INITIATIVES`
**Records:** 38 active initiatives
**Fields:** initiative_id, name, sponsor, owner_team, category (modernization/AI/operational/customer/data/security/GCC), budget_committed, budget_consumed, started_date, target_completion, status (green/yellow/red), benefits_thesis, dependency_list, executive_visibility (board/C-suite/divisional)
**Content:** Realistic mix — 8 modernization waves, 6 AI initiatives (including AI-powered SDLC, ops recovery AI, customer concierge), 4 operational improvements, 5 data platform builds, 4 security/compliance, 3 GCC ramp programs, 2 ERP modernization, 6 customer-facing.

### Segment 08 — Vendor Portfolio
**Codename:** `S08_VENDOR_PORTFOLIO`
**Records:** 52 vendor contracts
**Fields:** contract_id, vendor, category (cloud/SI/observability/security/PSS/MRO/loyalty/data_platform/AI_tooling/contact_center/payment/GDS), annual_spend, contract_start, contract_end, auto_renewal_flag, exit_clause_summary, renegotiation_window_open_date, strategic_criticality
**Content:** IBM, AWS, Salesforce/Microsoft (loyalty CRM), Sabre/Amadeus (GDS), Lufthansa Systems or Amadeus PSS, AMOS (MRO), GE Digital, Honeywell, Boeing (aircraft tech), Datadog, Splunk, Wiz, CrowdStrike, Genesys (contact center), Adyen (payment), Snowflake/Databricks, Anthropic/OpenAI API, etc.

### Segment 09 — Engineering Productivity Baseline
**Codename:** `S09_ENGINEERING_PRODUCTIVITY`
**Records:** 18 domain DORA scorecards + 24 productivity drill-downs
**Fields:** domain, lead_time_for_change, deploy_frequency, MTTR, change_failure_rate, automated_test_coverage, environment_provisioning_time, AI_tooling_adoption_pct, factory_throughput
**Content:** Realistic gradients — customer-facing domains (mobile, web) score high (elite/high DORA); mainframe-adjacent domains score lower (medium/low); modernization factory domains have improving trends.

### Segment 10 — Offshore / GCC Capability
**Codename:** `S10_GCC_CAPABILITY`
**Records:** 1 GCC master + 14 capability drill-downs + 8 peer benchmarks
**Fields:** location, headcount, function_mix (engineering/QA/ops/data/AI/cyber), tenure_distribution, skill_gaps, peer_carrier_benchmark, target_24mo_model, ramp_constraints (real estate, hiring market, attrition, time zone), unit_cost_vs_onshore
**Content:** 1,000 employees split Bangalore 650 / Hyderabad 350. Heavy QA + L1/L2 ops bias. Light on AI/data/cloud-native eng. Peer benchmark: United 3.2K, American 4.1K, Lufthansa 5.8K, Air France 2.9K. Real estate constraints in Bangalore Whitefield. Attrition 22% (industry 18%).

### Segment 11 — AI-Powered SDLC Opportunity Map
**Codename:** `S11_AI_SDLC_OPPORTUNITY`
**Records:** 22 opportunity tiles
**Fields:** opportunity_id, category (COBOL_analysis/dependency_mining/test_generation/doc_extraction/refactor_assistance/API_contract_gen/code_review/security_scan), domain, current_baseline_metric, target_metric, AI_tooling_candidate (GitHub Copilot Enterprise / Cursor / Amazon Q Developer / Tabnine / etc), risk_class (low/medium/high), readiness_score (1-5)
**Content:** Specific opportunities like "COBOL-to-Java conversion factory for reservations module (high value, medium risk, AWS-Q + IBM watsonx Code Assistant candidates)" and "Automated test generation for revenue accounting batches (medium value, low risk)."

### Segment 12 — Executive Decision Map
**Codename:** `S12_EXECUTIVE_DECISION_MAP`
**Records:** 12 executive personas + 28 stated tensions
**Fields:** persona (CEO/CFO/CTO/CIO/COO/CISO/CDO/CHRO/Chief_Customer/Chief_TechOps/General_Counsel/SVP_Procurement), modernization_thesis (verbatim style), top_3_concerns, what_would_change_their_mind, recent_public_statements_pattern, alignment_with_CTO (1-5)
**Content:** CTO five-year sponsor; CIO Amala challenging status quo; CFO scrutinizing benefits realization; COO worried about IROPs resilience during extractions; CISO worried about cloud control plane sprawl; CDO frustrated by data still trapped in Z batches.

### Segment 13 — Value Ledger
**Codename:** `S13_VALUE_LEDGER`
**Records:** 56 value records
**Fields:** value_id, source_initiative_id, value_type (cost_savings/revenue_uplift/risk_reduction/cycle_time/customer_NPS/employee_productivity), promised_amount, realized_amount, disputed_amount, evidence_status (validated/partial/projected/stuck), validation_owner
**Content:** Real pattern — ~$890M promised over 5 years, ~$520M validated, ~$140M disputed, ~$230M stuck in "projected." Helps Sentinel reason about what's actually working.

### Segment 14 — Operational + Financial KPIs
**Codename:** `S14_OPERATIONAL_KPIS`
**Records:** 36 KPI time-series records (24 months of monthly observations)
**Fields:** kpi_id, name, category (operational/financial/customer/safety), monthly_value, target, peer_benchmark, trend_24mo, modernization_correlation_score
**Content:** Completion factor, OTP D0, mishandled bags per 1K, crew legality recovery time, IROPs cost per disruption, IT run-rate, modernization spend velocity, customer NPS by tier, mobile app session conversion. Realistic monthly time-series.

### Segment 15 — Sourcing & Renewal Pipeline
**Codename:** `S15_SOURCING_PIPELINE`
**Records:** 32 upcoming sourcing events
**Fields:** event_id, vendor_contract_id, event_type (renewal/restructure/RFP/consolidation/exit), trigger_date, lead_time_required, decision_owner, current_state, target_outcome, leverage_factors
**Content:** IBM modernization restructure window (FY-2027 renewal); AWS EDP true-up FY-2026; Snowflake vs Databricks consolidation; contact center AI RFP; AI tooling consolidation (multiple Copilot/Cursor/Tabnine licenses to rationalize); cyber stack consolidation.

---

## 4. Templates folder (must be delivered as `datasets/skyharbor/templates/`)

These are the artifacts the CTO will inspect when they ask "what templates did you use?" Every template must be a real, used-in-generation file — not a fictional reference.

### 4.1 Schema templates (one per segment)
```
templates/schemas/
  S01_enterprise_profile.schema.json
  S02_modernization_ledger.schema.json
  ...
  S15_sourcing_pipeline.schema.json
```
Each is a JSON Schema (draft-2020-12) defining required fields, types, enums, and validation rules.

### 4.2 Ontology templates
```
templates/ontology/
  entity_types.yaml          # 28 entity types (mainframe_workload, aws_service, integration_edge, vendor_contract, initiative, kpi_observation, executive_persona, value_record, etc.)
  edge_types.yaml            # 24 edge types (extracted_from, depends_on, replaced_by, dual_run_with, owned_by, sponsors, contradicts, sources_value_from, blocks_modernization, etc.)
  domain_tags.yaml           # 18 domain tags (passenger_service, departure_control, crew, MRO, revenue_management, loyalty, cargo, finance, customer_app, AI, GCC, etc.)
  controlled_vocabularies.yaml  # status enums, criticality scales, modernization_action types
```

### 4.3 Content patterns (synthesis templates)
```
templates/content_patterns/
  mainframe_workload_narrative.template.md      # how to describe a mainframe workload in chunks
  modernization_event_narrative.template.md     # how to describe a wave / decision
  vendor_contract_narrative.template.md
  ai_sdlc_opportunity_narrative.template.md
  executive_tension_narrative.template.md
  kpi_observation_narrative.template.md
  value_record_narrative.template.md
```
Each template includes: tone, length target, factual anchors, citation style, what to include, what to avoid.

### 4.4 ID and naming conventions
```
templates/conventions/
  id_schemes.md                # stable graph IDs: sha256(client_key + entity_type + canonical_name)[:16]
  naming_conventions.md        # workload names, AWS service names, vendor names
  slug_rules.md
  versioning_rules.md
```

### 4.5 Chunk-emission templates
```
templates/chunks/
  chunk_types.md               # definition / lineage / runbook / decision / value / risk / opportunity / executive_view
  chunk_size_guidance.md       # 200-600 tokens target; never split mid-fact
  chunk_metadata_schema.json   # content_type, source_system, source_artifact_path, domain, persona_relevance
```

### 4.6 Ground-truth Q&A templates
```
templates/ground_truth/
  ctos_top_25_questions.md     # the questions Sentinel must answer
  cios_top_15_questions.md     # Amala's questions
  cfos_top_10_questions.md
  expected_answer_patterns.md  # citation style, evidence chain, fingerprint
```

---

## 5. Raw briefs (the human input layer — `datasets/skyharbor/briefs/`)

Before generation, write 15 raw briefs (one per segment) that capture the **narrative shape** in human English. These are the inputs to the generation pipeline. The CTO will ask: "where did the source information come from?" — these briefs are the answer.

```
briefs/
  S01_enterprise_profile.brief.md            # 800-1200 words
  S02_modernization_ledger.brief.md          # 1500-2000 words (5-year storyline)
  S03_mainframe_inventory.brief.md           # 1200-1800 words
  ...
  S15_sourcing_pipeline.brief.md             # 800-1200 words
```

Each brief must include:
- Sources / inspiration (Delta IR, press, industry reports, airline modernization literature, IBM/AWS case studies)
- Realistic patterns observed from public-airline data and from comparable carriers (United, American, Lufthansa, AF-KLM)
- Explicit "what we do NOT know about Delta" callouts
- The narrative skeleton that record generation will instantiate

**Critical rule:** No PII, no logos, no Delta-confidential data, no scraped non-public content. Use public-press + industry-pattern + synthesized-from-comparables.

---

## 6. Processing pipeline (the "how did you parse / can my team leverage this?" answer)

This must be implemented as runnable scripts in `scripts/skyharbor/` that the customer can read, fork, and adapt to their real data.

### 6.1 Pipeline stages

```
stages/
  01_brief_to_outline/
    parse_brief.mjs            # Reads brief.md, extracts entity-list + relationship-list using a structured-extraction LLM call
    outline_schema.json        # The intermediate structured form
  02_outline_to_records/
    generate_records.mjs       # Takes outline + schema template, emits CSV/JSON records with stable IDs
    enforce_schema.mjs         # JSON-schema validation pass; rejects malformed
  03_records_to_graph/
    build_entities.mjs         # Records → entity nodes
    build_edges.mjs            # Cross-segment edge inference (e.g., initiative → vendor_contract → modernization_event chains)
    edge_validation.mjs        # Cycle detection, orphan detection, dangling-reference detection
  04_graph_to_chunks/
    narrate_entities.mjs       # For each entity, emit 1-N chunks per content_pattern template
    chunk_quality_gate.mjs     # Length, fact-density, citation, no-PII gates
  05_chunks_to_embeddings/
    embed_chunks.mjs           # Voyage-3-large via Anthropic-partner API; batches of 128
    embedding_audit.mjs        # Dimension check, NaN check, dedupe near-identical vectors
  06_load_to_azure/
    azure_postgres_loader.mjs  # Loads into Azure Database for PostgreSQL Flexible Server (pgvector enabled)
    rls_verification.mjs       # Confirms RLS policies enforce client_id = 'skyharbor-air'
    audit_log_baseline.mjs     # Writes baseline ai_egress_audit entries
  07_verify/
    ground_truth_runner.mjs    # Runs the 50 ground-truth questions against Sentinel; captures answers + citation chains
    fact_fingerprint_check.mjs # Confirms no hallucinated names/numbers via fingerprint match
    coverage_report.mjs        # Reports segment coverage, entity counts, chunk counts
```

### 6.2 Each script is documented

Every script includes:
- Header docstring: purpose, inputs, outputs, dependencies
- Usage example: `npm run skyharbor:01-parse-brief -- --brief S03 --out ./outline/S03.outline.json`
- README in each stage folder explaining the stage's role

### 6.3 Customer-adoption guide

```
docs/skyharbor/CUSTOMER_ADOPTION_GUIDE.md
```

A 4-page doc explaining how the customer's data engineering team applies the same pipeline to their real data:

1. Replace synthetic briefs with extracts from real systems (ServiceNow CMDB, application portfolio, contract repository, etc.)
2. Replace `parse_brief.mjs` with `parse_servicenow_cmdb.mjs`, `parse_workday_apptracker.mjs`, etc.
3. The schemas, ontology, chunk templates, embedding pipeline, loader, and verification stay identical
4. The customer ends up with their **own** AbarVa-shape substrate from their real estate, using AbarVa's same processing pipeline

This is the moat. The CTO sees: *the synthetic substrate isn't a fake demo — it's a working preview of what their own data will look like, processed through the exact same pipeline.*

---

## 7. Output deliverables (what the CTO opens)

```
datasets/skyharbor/
├── README.md                       # 2-page overview, what's in here, how to navigate
├── briefs/                         # 15 raw narrative briefs
├── templates/                      # All schemas, ontology, content patterns, conventions, chunks, ground truth
├── outlines/                       # Intermediate structured outlines (output of stage 01)
├── records/
│   ├── csv/                        # 15 CSVs, one per segment, ~440 rows total
│   └── json/                       # Same data as JSON for direct loader use
├── graph/
│   ├── entities.jsonl              # ~310 entity nodes
│   ├── edges.jsonl                 # ~360 edges
│   └── graph_summary.md            # Counts, top hubs, orphans
├── chunks/
│   ├── chunks.jsonl                # ~480 chunks
│   └── chunks_by_segment.md        # Breakdown
├── embeddings/
│   ├── embeddings.parquet          # Voyage-3-large vectors, 1024 dim
│   └── embeddings_manifest.md      # Model, batch info, costs
├── verification/
│   ├── ground_truth_results.md     # 50 questions × Sentinel answer × citation chain
│   ├── coverage_report.md
│   ├── integrity_report.md
│   └── fact_fingerprint_audit.md
└── azure_load_artifacts/
    ├── azure_load_log.txt
    ├── rls_verification.txt
    └── ai_egress_audit_baseline.csv

scripts/skyharbor/                  # All 7 pipeline stages
docs/skyharbor/                     # Adoption guide + architecture diagram + faq
```

**Total file count target:** ~150 files.
**Total deliverable size:** ~12-18 MB.
**Total processing time end-to-end:** ~45-90 minutes from briefs to loaded Azure tenant.

---

## 8. Generation rules (non-negotiable)

1. **Current-state heavy.** Every record must reflect 5 years of modernization having happened. No greenfield assumptions.
2. **No Delta confidential data.** Names of internal systems, executives, vendors-of-record are all synthesized. Patterns drawn from public + industry-comparable sources only.
3. **No fabricated specifics where falsifiable.** If a stat is checkable against public Delta filings, either use Delta's actual public number OR explicitly mark as "SkyHarbor synthetic." Never invent a stat that contradicts a public Delta number.
4. **Fact fingerprint enforced.** Every chunk that asserts a number or name must trace back to a source record. The fact-fingerprint check (from Packet 27) must pass.
5. **Cross-segment coherence.** A vendor referenced in S08 must appear consistently in S07 (initiative dependencies), S15 (sourcing pipeline), and S13 (value ledger).
6. **Realistic gradient.** Not everything is broken. Not everything is fixed. Realistic mid-program: some wins, some losses, some contested calls.
7. **CTO-respectful tone.** The substrate must let Sentinel honor 5 years of CTO leadership while giving the CIO real challenge material. Never write content that makes the CTO look incompetent.

---

## 9. Verification gates (the CTO's "prove it" checklist)

The substrate is not done until all 9 gates pass:

| # | Gate | Pass criteria |
|---|---|---|
| 1 | **Schema validation** | 100% of records pass JSON Schema validation |
| 2 | **Cross-segment integrity** | 0 orphan references; 0 dangling edges; 0 referential breaks |
| 3 | **Fact fingerprint** | 100% of chunks trace to a source record (Packet 27 fingerprint check) |
| 4 | **Embedding integrity** | 0 NaN vectors; 0 zero-vectors; <2% near-duplicates |
| 5 | **Ground truth — Tier 1** | Sentinel answers 25/25 CTO-tier questions correctly with citations |
| 6 | **Ground truth — Tier 2** | Sentinel answers 13/15 CIO-tier questions correctly |
| 7 | **No-hallucination** | 0 mentions of real Delta executive names, real Delta internal system names, or non-public Delta facts |
| 8 | **Azure RLS** | A test query as a different tenant returns 0 SkyHarbor rows |
| 9 | **Coverage** | All 15 segments present; record counts within ±10% of target |

A verification HTML report is generated at `verification/SUBSTRATE_QUALITY_REPORT.html` and is the artifact you hand to the CTO.

---

## 10. The 25 Tier-1 questions Sentinel must nail (CTO scrutiny set)

These are the ground-truth questions the CTO will ask in the demo. The substrate must support evidence-cited answers for all of them.

1. After 5 years of modernization, what's the defensible progress narrative?
2. Of the 47 mainframe workloads at Day-0, how many remain on Z, and why?
3. Which 5 workloads should we extract next, ranked by value-to-risk ratio?
4. Which workloads should we explicitly NOT touch in the next 18 months?
5. Where has extraction created duplicate complexity, and what's the unwinding plan?
6. Which extractions reversed, and what did we learn?
7. What's IBM still essential for, and where are we over-dependent?
8. What does the IBM contract restructure window look like in FY-2027?
9. What productivity guarantees has IBM met, missed, or contested?
10. Where can AI-powered SDLC compress delivery in the next 90 days?
11. Which AI SDLC tooling candidates are highest-leverage for our COBOL-heavy estate?
12. What's the risk profile of AI-generated code in our safety-critical domains?
13. How are we performing on DORA metrics by domain, and where's the modernization correlation?
14. Why are we lagging peers on GCC scale at 1,000 vs. peers at 3-5K?
15. What's the 24-month target operating model across IBM / AWS / GCC / internal eng?
16. What's the value ledger reality — promised vs. realized vs. disputed?
17. Where is value stuck in "projected" and what would validate it?
18. Where does the CIO's challenge map to real gaps vs. perception gaps?
19. What modernization moves should the CTO present to the board next quarter?
20. What's the AWS EDP true-up exposure in FY-2026?
21. Which Snowflake/Databricks consolidation move is defensible?
22. Where should the AI tooling stack consolidate?
23. What's the cyber stack rationalization opportunity?
24. What sourcing events in the next 12 months have the highest leverage?
25. What's the single best move the CTO can make in the next 90 days?

---

## 11. Demo walkthrough (the CTO experience)

When the CTO is shown the SkyHarbor substrate in a 30-minute demo, the flow is:

**Minute 0-5: Tenant overview**
- Land on SkyHarbor Air home
- Show enterprise profile sourced from S01
- Show "5-year modernization summary" widget — pulls from S02 + S13

**Minute 5-15: Intelligence module**
- Ask question #1: "After 5 years, what's our defensible progress narrative?"
- Sentinel cites S02 events, S03 inventory, S13 value records, S07 initiatives — generates a 4-paragraph evidence-grounded answer
- Ask question #3: "Which 5 workloads should we extract next?"
- Sentinel ranks with reasoning across S03, S05 integration topology, S09 productivity, S11 AI SDLC opportunity

**Minute 15-22: Moves module**
- CTO converts one recommendation into a Move
- AbarVa drafts a Move framework: thesis, scope, value, risks, sequencing, dependencies (uses S03 + S04 + S05 + S11 + S13)

**Minute 22-27: Source module**
- Open the IBM restructure sourcing event from S15
- AbarVa drafts negotiation strategy: leverage points (S06 productivity record, S13 value disputes), target outcomes, BATNA (alternate SIs from S08)

**Minute 27-30: The CTO question — "can I see the data and the process?"**
- Open `datasets/skyharbor/templates/` — show JSON schemas
- Open `datasets/skyharbor/briefs/` — show raw narrative briefs
- Open `scripts/skyharbor/` — show the 7-stage pipeline
- Open `docs/skyharbor/CUSTOMER_ADOPTION_GUIDE.md` — show how their team forks the same pipeline for their real data
- Open `verification/SUBSTRATE_QUALITY_REPORT.html` — show 9/9 gates passed

That last 3 minutes is the close. **The substrate is the demo AND the proof of methodology AND the path to production.**

---

## 12. Estimated effort to build this packet

| Phase | Effort | Owner |
|---|---|---|
| Brief authoring (15 briefs) | 2-3 days | Founder + research support |
| Template authoring (schemas, ontology, content patterns) | 2-3 days | Founder + 1 senior eng |
| Pipeline scripts (7 stages) | 4-6 days | 1 senior eng + Claude |
| Record generation + graph + chunks | 1-2 days (mostly automated) | Pipeline runs |
| Embedding + Azure load | 0.5 day | Pipeline runs |
| Verification + 9 gates | 1-2 days | 1 senior eng |
| Adoption guide + architecture diagram | 1 day | Founder |
| **Total** | **12-17 days end-to-end** | **1.5 FTE for ~2 weeks** |

Cost to AbarVa: ~$20-30K loaded (1 senior eng × 2 weeks + founder time + ~$50 in embedding API).

**Reusable cost amortization:** This packet becomes the template for every airline customer. United, American, Southwest, JetBlue all run on the same substrate shape with different facts. **One-time investment becomes a multi-customer asset.**

---

## 13. The procurement-defensible artifact list

When the Delta CTO procurement team asks "what did you build, where is it, how do we audit it?" — the answer is:

| Artifact | Path | Audit purpose |
|---|---|---|
| Raw briefs | `datasets/skyharbor/briefs/` | Source-of-truth narrative inputs |
| Schema templates | `datasets/skyharbor/templates/schemas/` | Data model documentation |
| Ontology | `datasets/skyharbor/templates/ontology/` | Knowledge graph design |
| Content patterns | `datasets/skyharbor/templates/content_patterns/` | Chunk generation rules |
| Pipeline scripts | `scripts/skyharbor/` | Processing methodology |
| Generated records | `datasets/skyharbor/records/` | The actual data |
| Graph | `datasets/skyharbor/graph/` | Entity + edge layer |
| Chunks | `datasets/skyharbor/chunks/` | RAG layer |
| Embeddings manifest | `datasets/skyharbor/embeddings/embeddings_manifest.md` | Model + batch provenance |
| Verification report | `verification/SUBSTRATE_QUALITY_REPORT.html` | 9-gate proof |
| Adoption guide | `docs/skyharbor/CUSTOMER_ADOPTION_GUIDE.md` | "How your team replicates this" |
| Azure load artifacts | `datasets/skyharbor/azure_load_artifacts/` | Deployment evidence |

Every artifact is reviewable, forkable, and reusable. The CTO sees that this isn't a magic demo — it's a documented engineering pipeline, and the methodology transfers cleanly to their production environment.

---

## 14. What success looks like

After the demo, the Delta CTO should be able to say one of two things:

> **(A)** *"This is exactly the kind of decision layer I've needed for 5 years. We need to talk about a pilot."*

or

> **(B)** *"This is impressive, but I need to see it run against [specific real system, e.g., our actual servicenow CMDB extract]. Can we do a Phase 0 ingest in two weeks?"*

Both are wins. (A) is conversion. (B) is the right kind of buyer pushing for proof — and we already have the pipeline to deliver Phase 0 in two weeks because that's exactly what `CUSTOMER_ADOPTION_GUIDE.md` walks them through.

---

## 15. Acceptance criteria (this packet is done when…)

- [ ] All 15 segment briefs authored (~22,000 words total)
- [ ] All 15 schemas authored
- [ ] Ontology, content patterns, conventions, chunks, ground truth templates all complete
- [ ] All 7 pipeline scripts implemented, documented, runnable
- [ ] ~440 records generated and schema-validated
- [ ] ~310 entities + ~360 edges built and integrity-checked
- [ ] ~480 chunks emitted and quality-gated
- [ ] Embeddings generated (Voyage-3-large, 1024 dim)
- [ ] Loaded into Azure dedicated SkyHarbor tenant
- [ ] All 9 verification gates pass
- [ ] HTML quality report generated
- [ ] Adoption guide authored
- [ ] Architecture diagram drawn
- [ ] Sentinel answers 25/25 Tier-1 questions correctly with full citation chains
- [ ] Demo walkthrough rehearsed end-to-end in under 30 minutes

---

## 16. Hand-off to execution

**This packet (Packet 28) is the prompt.**

Hand it to: Codex / Claude Code agent (or to 1 senior engineer pair-working with Claude).

**Estimated wall-clock to first demo-ready substrate:** 12-17 working days.

**Recommended cadence:**
- Days 1-3: Briefs + schemas + ontology (founder + senior eng)
- Days 4-8: Pipeline scripts implementation (senior eng + Claude)
- Days 9-10: Generation + chunks + embeddings (mostly automated runs)
- Days 11-12: Azure load + verification gates
- Days 13-14: Adoption guide + demo rehearsal
- Buffer: Days 15-17 for inevitable refinements

**First demo target:** Day 18 with the Delta CTO.

---

## 17. Document control

- **Version:** Packet 28 v1
- **Date:** 2026-05-27
- **Author:** AbarVa Founder
- **Status:** Ready for execution hand-off
- **Companion packets referenced:** Packet 18 (Apex Retail substrate), Packet 20 (First Capital substrate), Packet 24 (substrate loader), Packet 27 (agent intelligence + fact fingerprint)
- **Next packet:** Packet 29 — SkyHarbor demo capture + recording for asynchronous CTO review

---

*End of Packet 28 prompt.*
