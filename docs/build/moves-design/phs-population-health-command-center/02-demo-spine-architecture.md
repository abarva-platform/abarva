# PHS Population Health Command Center — Demo Spine Architecture

Date: 2026-06-05
Status: Execution contract

## Scope

This package defines the Meridian / PHS-inspired demo spine for an AI-enabled
Population Health and Clinical Performance Command Center. The story is an
integrated payer-provider operating model: plan economics, care delivery,
quality, access, and clinical performance must be reasoned together.

The first credible visible stage is **Moves Phase 3 — Architecture and Business
Case Review**. Source remains optional and may start only when the approved
Mobilization Plan selects a partner-led delivery model.

## Stage Gate Rule

No surface may show an opportunity, phase advancement, value claim, or Source
event unless all prior-stage artifacts are:

- persisted in the artifact registry or storage path
- parseable by the product
- linked to evidence keys
- approved or explicitly waived by a named synthetic human
- visible in the evidence chain for the generated artifact

If one of those conditions is missing, the surface must show an evidence
request, not a polished opportunity.

## Seven-Phase Spine

| Phase | Product surface | What the user sees | Completion gate |
|---|---|---|---|
| 0 Setup | Admin / Context Layer | Public evidence, synthetic workload inventory, quality baseline, rate card, gate criteria, approval personas | Loader records exist and evidence keys resolve |
| 1 Discovery | Moves | Current-state operating model and highest-leverage gaps | Discovery artifacts cite inventory and public evidence |
| 2 Strategy | Moves | AI strategy memo, use-case portfolio, decision principles | CDAO, plan quality, and clinical quality approvals recorded |
| 3 Architecture | Moves | Azure Databricks target architecture and data product map | Architecture review board approval recorded |
| 4 Business Case | Moves | Value case, P50/P80/P95 cost and benefit ranges, mobilization plan | CFO and sponsor approvals recorded |
| 5 Mobilization | Moves | 30/60/90 plan, RACI, owners, gate evidence | Workstream owner acceptance recorded |
| 6 Source optional | Source | Partner sourcing event for Databricks SI / managed services only if approved | Source event cites Phase 2-5 artifact IDs |

## Current Versus Target

| Dimension | Current-state demo input | Target-state demo output |
|---|---|---|
| Evidence | Public PHS evidence plus synthetic Meridian internal artifacts | Evidence register with citation keys, sensitivity, owner, confidence, and use permissions |
| Data | Separate plan, provider, Epic, ERP, claims, quality, and community context | Governed Databricks lakehouse with bronze/silver/gold products and Unity Catalog controls |
| Analytics | Duplicate reports, unclear trust levels, fragmented payer/provider views | Data products for total cost of care, care gaps, Stars, access, utilization, and service-line performance |
| AI | Isolated recommendations without a durable approval trail | Human-approved agent operating model with evidence trace, confidence, and no autonomous clinical action |
| Value | Baseline and forecast only | Approved value case with assumptions, ranges, and no realized-savings claim |

## Live Generation Moments

The demo may generate these live only after Setup evidence is loaded:

- AI Strategy Memo
- Population Health Opportunity Map
- Azure Databricks Target Architecture
- Data Product Map
- Value Case
- Mobilization Plan
- Executive Decision Brief

The demo must not generate or show:

- realized savings
- confidential PHS facts
- late-stage BAFO / Selection / Transition
- autonomous clinical action
- Source event without partner-led delivery evidence

## QA Walk

The crawl must verify:

- `/admin/context-layer/uploads` exposes loader paths for structured data and corpus JSONL
- uploaded/loaded artifacts appear in the evidence map
- Moves artifacts open without blank states
- every generated artifact displays evidence keys
- download controls either work or are visibly disabled
- stage advancement is blocked when required artifacts or approvals are missing
- Source is absent unless Phase 5 selects partner-led delivery
