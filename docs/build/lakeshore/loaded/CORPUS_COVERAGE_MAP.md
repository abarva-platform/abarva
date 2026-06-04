# Lakeshore Holdings Corpus Coverage Map

Generated from `docs/build/lakeshore/loaded/manifest.json` generated at `2026-06-04T00:00:00.000Z`.

## Executive Summary

Lakeshore's current package is a loader-ready corpus, not a single flat seed file.
It contains 1,329 structured rows across 18 registry templates, 21 generated documents, 5 operating companies / entities, a workbook bundle, how-to pages, and a one-time offline review ZIP.

The brief describes 50+ business dimensions. In the actual loader package, those dimensions are grouped into 18 templates so the Data Loads module can validate, approve, commit, and audit them through existing template contracts.

## Tenant Identity

| Field | Value |
| --- | --- |
| Display name | Lakeshore Holdings |
| Tenant key | `lakeshore` |
| Broker key | `lakeshore-holdings` |
| Synthetic notice | SYNTHETIC / ILLUSTRATIVE. Not a real company disclosure. |

## Operating Company Coverage

| Opco | CIO | CFO | Platform count |
| --- | --- | --- | --- |
| LSH-HOLDCO | Meera Rao | Daniel Whitaker | 6 |
| NLS | Alicia Moreno | Graham Keller | 6 |
| BMS | Nadia Bell | Priya Deshpande | 6 |
| FFF | Ethan Brooks | Marisol Chen | 6 |
| GLP | Monica Ellis | Rafael Stone | 6 |

## Template Coverage

| Template | Rows | Formats | Opco IDs Present | Business Dimensions Covered | Agent / Surface Use | Leading Columns | Notes |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| enterprise-profile | 5 | markdown, json, pdf | LSH-HOLDCO, NLS, BMS, FFF, GLP | Holdco profile<br>Opco profiles<br>Revenue and employee scale<br>Countries and sectors<br>Ownership model | Home, Tower, Sentinel | revenue_usd, employees, countries, business_units, debt_usd, it_budget_usd, priority, opco_id, ... | Identity spine used by every client-scoped surface. |
| financial-kpi-workbook | 240 | xlsx, csv | LSH-HOLDCO, NLS, BMS, FFF, GLP | IT financials<br>Finance KPIs<br>Treasury KPIs<br>Working-capital trends<br>Quarterly time series | Home, Moves, Tower, Sentinel | period, metric, value, currency_or_unit, segment, margin_bridge_driver, source_report, source_system, ... | Makes value, readiness, and CFO questions answerable with numbers. |
| annual-quarterly-reports | 8 | pdf, pptx, docx | - | Board reporting<br>Quarterly performance narrative<br>Segment context<br>Executive commentary | Home, Tower, Sentinel | period, reported_revenue, reported_margin, guidance, risk_factor, document_ref, source_system, source_record_id, ... | Document evidence for financial and strategic context. |
| market-signals | 40 | csv, markdown, pdf | - | Industry context<br>Competitive pressure<br>Macroeconomic signals<br>Demand and supply-chain signals | Moves, Source, Sentinel | signal_id, market, competitor, claim, source_url, confidence, source_system, source_record_id, ... | Provides outside-in context without pretending it is client-owned fact. |
| strategy-memo | 30 | docx, pdf, markdown | LSH-HOLDCO, NLS, BMS, FFF, GLP | Strategic priorities<br>M&A integration backlog<br>Operating-model tension<br>Transformation rationale | Home, Moves, Sentinel | priority, owner_role, time_horizon, dissent, board_question, source_system, source_record_id, source_owner, ... | Explains why the portfolio is changing, not just what exists. |
| segment-pnl | 40 | xlsx, csv | LSH-HOLDCO, NLS, BMS, FFF, GLP | Opco P&L<br>Segment margin<br>Revenue mix<br>EBITDA context | Home, Moves, Tower | segment, revenue_usd, gross_margin_pct, operating_margin_pct, r_and_d_usd, sg_and_a_usd, period, source_system, ... | Connects technology work to operating-company economics. |
| product-portfolio | 48 | csv, xlsx | NLS, BMS, FFF, GLP | Product lines<br>DTC mix<br>Supply-chain product families<br>Marketing service offers | Moves, Source, Sentinel | product_family_id, business_unit, revenue_usd, margin_pct, lifecycle_state, regulatory_burden, plant_dependency, product_name, ... | Keeps opco-specific recommendations from becoming generic. |
| site-and-plant-inventory | 56 | csv, xlsx | NLS, BMS, FFF, GLP | Sites<br>Plants<br>Warehouses<br>Geography<br>Operational footprint | Tower, Source, Sentinel | site_id, country, business_unit, primary_system, validated_system_flag, quality_cost_usd, capacity_utilization_pct, region, ... | Grounds logistics, network, and regional deployment questions. |
| erp-landscape-workbook | 65 | xlsx, csv | LSH-HOLDCO, NLS, BMS, FFF, GLP | ERP estate<br>Finance systems<br>Procurement systems<br>Supply-chain systems<br>Legacy modernization targets | Moves, Source, Tower | erp_object_id, platform, process_area, owner_role, business_unit, customization_count, tsa_dependency, source_system, ... | Primary systems-of-record view for modernization and sourcing. |
| application-portfolio | 228 | csv, xlsx | LSH-HOLDCO, NLS, BMS, FFF, GLP | CMDB/application portfolio<br>Owners<br>Lifecycle<br>Criticality<br>Hosting and stack | Moves, Source, Tower, Sentinel | app_id, name, criticality, owner_role, system_of_record, ams_vendor, time_classification, platform, ... | Main inventory for modernization, risk, and prioritization decisions. |
| integration-topology | 96 | json, jsonl, csv | LSH-HOLDCO, NLS, BMS, FFF, GLP | APIs<br>EDI<br>Middleware<br>Data flows<br>Source-to-target dependencies | Moves, Source, Tower | edge_id, source_app_id, target_app_id, integration_type, latency_sla, kill_blocker_flag, data_domain, criticality, ... | Prevents migration and sourcing advice from ignoring dependency risk. |
| vendor-contracts | 82 | csv, xlsx, pdf | LSH-HOLDCO, NLS, BMS, FFF, GLP | Vendor contracts<br>Kyriba contract<br>SI implementation partner<br>Renewals<br>Commercial terms | Source, Moves, Tower, Sentinel | vendor_id, vendor_name, annual_value_usd, renewal_date, exit_terms, ai_clauses, data_rights, contract_id, ... | Backbone for sourcing, renewal, and value-realization questions. |
| initiative-portfolio | 40 | xlsx, csv, json | LSH-HOLDCO, NLS, BMS, FFF, GLP | Kyriba rollout<br>AI initiatives<br>Modernization programs<br>Gates<br>Budget and value targets | Home, Moves, Tower | initiative_id, title, status, sponsor_role, committed_usd, projected_value_usd, linked_app_ids, opco_id, ... | Turns the corpus into governed work, not static inventory. |
| org-roles | 67 | csv, xlsx, json | LSH-HOLDCO, NLS, BMS, FFF, GLP | Org structure<br>Decision rights<br>Global CIO<br>Opco CIOs<br>CFO/Treasury<br>Surekha buyer persona | Home, Source, Sentinel | person_id, name, level, role, manager_id, cost_center, location, source_system, ... | Defines who owns, approves, and is accountable for decisions. |
| dora-baseline | 84 | csv, xlsx, json | LSH-HOLDCO, NLS, BMS, FFF, GLP | Delivery telemetry<br>DORA metrics<br>Change failure rate<br>Lead time<br>Deployment frequency | Moves, Tower, Sentinel | team_id, measured_at, deploy_freq_per_week, lead_time_hours, mttr_hours, change_failure_rate_pct, product_area, source_system, ... | Evidence for delivery maturity and modernization risk. |
| qms-events | 62 | csv, xlsx, pdf | LSH-HOLDCO, NLS, BMS, FFF, GLP | Quality events<br>Compliance events<br>Control issues<br>Remediation queue | Tower, Sentinel, Source | event_id, event_type, product_family_id, severity, opened_at, capa_id, audit_reference, opco, ... | Risk and control context for regulated and customer-impacting work. |
| ai-tool-footprint | 42 | csv, xlsx, json | LSH-HOLDCO, NLS, BMS, FFF, GLP | AI tool inventory<br>Shadow AI<br>Responsible AI policy fit<br>Skills and governance gaps | Sentinel, Moves, Tower | tool_id, tool_name, owner_role, workflow, risk_classification, model_name, regulated_workflow_flag, source_system, ... | Grounds AI-readiness and hallucination-control conversations. |
| incidents-change-history | 96 | csv, json, jsonl | LSH-HOLDCO, NLS, BMS, FFF, GLP | Incident history<br>Change history<br>ITSM evidence<br>SLA patterns<br>Operational risk | Tower, Moves, Sentinel | incident_id, system_id, severity, opened_at, closed_at, root_cause, business_service, source_system, ... | Makes operational-risk answers evidence-linked rather than anecdotal. |

## Document Coverage

- docx_policy: 4
- pdf_contract: 12
- pdf_report: 4
- pptx_board_update: 1

Document files are mapped to loader templates in the manifest. Contract PDFs primarily enrich `vendor-contracts`; policy, board, architecture, and performance documents enrich governance, strategy, financial, and integration questions.

## How Agents Use This Corpus

| Agent / Surface | What It Should Use | Hallucination Control |
| --- | --- | --- |
| Home | `enterprise-profile`, `initiative-portfolio`, `financial-kpi-workbook`, `segment-pnl` | Show only client-scoped facts; use honest empty states before live commit |
| Sentinel / Intelligence | All templates plus parsed documents | Cite file, row, or document evidence; say "not available" when missing |
| Moves | `application-portfolio`, `erp-landscape-workbook`, `initiative-portfolio`, `financial-kpi-workbook`, modernization/rate-card corpus | Separate Lakeshore facts from shared benchmark/pattern fallbacks |
| Source | `vendor-contracts`, `org-roles`, `integration-topology`, `site-and-plant-inventory`, parsed contracts | Use contract and owner evidence before making sourcing recommendations |
| Tower | `dora-baseline`, `incidents-change-history`, `qms-events`, `integration-topology`, `financial-kpi-workbook` | Keep operational risk and control status tied to tenant rows only |

## What Is Still Required Before Live Agent Grounding

1. PR #2997 must land so the governed load rehearsal/commit evidence is available.
2. PR #2998 must land so the CXO corpus activation plan and agent-grounding validation are on main.
3. Live secrets must be present for Clerk, data-plane commit, embeddings, and Azure AI Document Intelligence.
4. The package must be loaded through Data Loads, not inserted manually.
5. Embeddings must be generated for Lakeshore chunks.
6. Data Trust and tenant isolation must be verified in production with two Lakeshore CXO users.

## Offline Review Bundle

The one-time client-review bundle is:

`docs/build/lakeshore/loaded/review-bundle/lakeshore-offline-review-bundle.zip`

It includes the manifest, CSVs, workbook, how-to pages, documents, and research notes so a client can review the synthetic corpus outside the app before live activation.
