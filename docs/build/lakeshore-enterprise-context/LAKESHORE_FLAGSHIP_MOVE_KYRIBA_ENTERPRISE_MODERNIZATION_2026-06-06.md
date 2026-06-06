# Strategic Move — Lakeshore Enterprise Finance & Treasury Modernization

**Kyriba Rollout · Corporate Controls · Reporting Rationalization · Vendor Optimization · Value Realization**

> Board-grade Strategic Move artifact generated over the loaded Lakeshore enterprise context
> (`LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1` — 133 source documents, 5,247 indexed context chunks).
> All figures are **synthetic** (SYNTHETIC / LAKESHORE PILOT / NOT REAL DATA) and traceable to the
> evidence cited in §Evidence Citations.

- **Tenant:** Lakeshore Holdings (`lakeshore-holdings`) · **Phase:** P4 Roadmap & Business Case
- **Sponsors:** Group CFO (Raymond Okafor), Group CIO (Priya Natarajan), Group Treasurer (Elena Vasquez)
- **Move owner:** Chief Transformation Officer (Marcus Reilly)

---

## 1. Executive Brief

Lakeshore Holdings — a ~$8.4B diversified holding company (5 business units, 10 countries, ~28,400
employees) — runs a fragmented finance and treasury estate: two SAP ECC instances plus one
S/4HANA, an in-flight Kyriba treasury rollout, 320 managed reports with heavy manual prep, ~$18.4M/yr
of AMS spend on an above-market rate card, and a control posture that must harden ahead of SOX
re-attestation. This Move consolidates five interlocking workstreams into one governed program that
releases trapped cash, hardens controls, rationalizes reporting, and optimizes the vendor portfolio —
with a Control-Tower value-realization spine.

**Headline outcomes (FY26–FY27, synthetic):**

- Release **$140–180M** trapped/idle cash via Kyriba cash visibility and pooling.
- **55%** reduction in manual close-and-report effort (320 → ~140 managed reports).
- **Zero material weaknesses** at FY26 SOX attestation; payment-fraud controls fully effective.
- **$48–62M** run-rate cost reduction across IT/AMS/treasury operations (12–15% AMS run-rate).
- 12 governed AI use cases in production with measured value by FY27.

**Net value case:** ~**$96–128M** annualized benefit (one-time cash release $140–180M) against a
**~$34–42M** program investment — payback inside the program horizon.

---

## 2. Current State

**Treasury (evidence: `05_treasury_kyriba/*`).** Kyriba rollout underway (Wave 1 NA live/amber; EMEA
in test; APAC/LATAM planned). 10 banking partners across SWIFT/H2H/EBICS/API with mixed statement
formats (MT940/CAMT). ~412k payments/yr, **6.8% exception rate**. Idle cash concentrated in EMEA/APAC;
bank-fee baseline un-optimized; open Kyriba test defects (statement import, payment-file rejects, FX
mismatches).

**Finance & reporting (evidence: `04_finance_performance/*`, `07_data_analytics_reporting/*`).**
8.5-day close, spreadsheet-heavy FP&A, 3 conflicting "revenue" definitions, 320 reports (46% duplicate
metrics, 58% manual prep), no single semantic layer.

**IT & architecture (evidence: `06_it_systems_architecture/*`).** Federated SAP (ECC→S/4HANA wave 2),
240+ integration interfaces, 120-app portfolio with retire/migrate candidates and 20 legacy apps;
integration backbone = SAP PI/PO + APIM + Service Bus + MFT (see `current_state_architecture.svg`,
`integration_architecture_diagram.svg`).

**Support & workload (evidence: `09_servicenow_support_workload/*`).** ~1,600 incidents, recurring
root causes integration failure/data quality/config; enhancement & defect backlog; SLA gaps.

**Vendors & sourcing (evidence: `10_vendors_contracts_source/*`).** AMS MSA ~$18.4M/yr with
auto-renew + above-market rate card; SI/software/bank contracts with renewal-calendar risk.

**Risk & controls (evidence: `11_risk_controls_responsible_ai/*`).** 120-item risk/control register,
SOX deficiencies, SoD conflicts, open audit findings, cyber risks, nascent Responsible AI controls.

---

## 3. Solution Architecture

Five integrated workstreams on one governed data + AI backbone:

1. **Treasury (Kyriba) completion** — centralized payments factory, standardized ISO20022 bank
   connectivity, AI cash forecasting and payment anomaly detection. _Ref: `kyriba_connectivity_architecture.svg`, `kyriba_integration_design.docx`._
2. **Corporate controls uplift** — SOX remediation, SoD cleanup, payment-fraud control hardening,
   evidence-cited audit trail. _Ref: `security_zero_trust_architecture.svg`, `sox_controls.xlsx`._
3. **Reporting rationalization** — retire/consolidate to ~140 reports on a dbt semantic layer with
   certified metrics. _Ref: `data_platform_architecture.svg`, `semantic_layer_assumptions.docx`._
4. **Vendor/SI optimization** — AMS re-sourcing (RFP→BAFO), rate-card reset, automation gain-share.
   _Ref: `rate_cards.xlsx`, `bafo_model.xlsx`, `ams_contract.pdf`._
5. **Governed AI & value realization** — AI use-case portfolio over the enterprise context layer
   with Responsible AI guardrails. _Ref: `ai_agent_reference_architecture.svg`, `ai_opportunity_portfolio.xlsx`._

**Technical backbone:** SAP→Kyriba→bank (ISO20022) payments; SAP/Workday/Coupa→Snowflake medallion→
dbt semantic layer→Power BI + Azure AI Search; RAG over `enterprise_context_chunks` for cited
decision support. Diagrams: `current_state_architecture.svg`, `integration_architecture_diagram.svg`,
`data_platform_architecture.svg`, `kyriba_connectivity_architecture.svg`,
`security_zero_trust_architecture.svg`, `ai_agent_reference_architecture.svg` (rendered in `screenshots/`).

---

## 4. Data / Context Evidence (live, loaded)

This Move is grounded in a **verified, queryable** enterprise context layer:

- **133** source documents staged in Azure Blob (`context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/`).
- **5,247** context chunks committed to Azure Postgres `enterprise_context_chunks`
  (`abarva_control`), all embedded (1536-d).
- **5,247** documents indexed in Azure AI Search `tenant-context-v1` (BM25 + vector), tenant-scoped.
- Retrieval QA confirmed domain-aligned answers for treasury, ITSM, reporting, SOX, and vendor queries.

See `..._AZURE_BLOB_RECEIPT.md`, `..._AZURE_DB_RECEIPT.md`, `..._SEARCH_VECTOR_RECEIPT.md`.

---

## 5. Roadmap (FY26–FY27)

_Ref: `roadmap_2026_2027.svg`._

| Wave | Window     | Workstream focus                               | Key milestones                                               |
| ---- | ---------- | ---------------------------------------------- | ------------------------------------------------------------ |
| W1   | Q1–Q2 FY26 | Kyriba EMEA + controls baseline                | EMEA go-live; SOX gap closure plan; report inventory frozen  |
| W2   | Q3–Q4 FY26 | Kyriba APAC + reporting rationalization wave 1 | APAC go-live; 120 reports retired; semantic layer v1         |
| W3   | Q1–Q2 FY27 | AMS re-sourcing + S/4 wave 2 enablement        | BAFO award; rate-card reset; payments factory at scale       |
| W4   | Q3–Q4 FY27 | Kyriba LATAM + AI use-cases + value lock-in    | LATAM go-live; 12 AI use cases live; value realization audit |

Dependencies and RAID tracked in `03_strategy_initiatives/dependency_map.csv`, `raid_log.xlsx`.

---

## 6. Operating Model

Federated delivery: lean corporate center (policy, architecture, capital), BU P&L ownership, shared
services execution. **Human + agent model** (`human_agent_operating_model.docx`): agents draft,
humans decide; evidence-cited outputs only; tiered autonomy by risk. Decision rights per
`02_org_decision_rights/raci_decision_rights.xlsx`; forums per `steering_committees.pdf`
(Treasury Council, ARB, Risk & Audit, AI Governance Board).

---

## 7. Risk / Control Model

_Ref: `11_risk_controls_responsible_ai/_`, `security_zero_trust_architecture.svg`.\*

- **SOX/ITGC:** remediate key-control deficiencies; quarterly attestation; change-mgmt + access review.
- **Payments/fraud:** dual authorization, sanctions screening, beneficiary validation, anomaly
  detection (target exception rate <3%).
- **SoD:** resolve conflicts (create-vendor+pay, post+approve JE) via SailPoint.
- **Cyber/zero-trust:** identity-first perimeter, private data plane, Sentinel/Defender detect-respond.
- **Responsible AI:** use-case intake, human-in-loop by tier, evidence-required outputs, model
  monitoring (`responsible_ai_controls.xlsx`, `model_use_case_review_checklist.xlsx`).

---

## 8. Value Case

| Value pool                                       | Annualized benefit (synthetic) | Confidence | Evidence                                                        |
| ------------------------------------------------ | ------------------------------ | ---------- | --------------------------------------------------------------- |
| Idle-cash reduction (one-time release $140–180M) | $9–14M carry                   | High       | `cash_positioning.xlsx`, `working_capital_drivers.xlsx`         |
| Bank-fee optimization                            | $6–11M                         | Medium     | `bank_fee_baseline.xlsx`                                        |
| Reporting effort reduction (55%)                 | $12–18M                        | High       | `report_inventory.xlsx`, `reporting_rationalization_brief.pdf`  |
| AMS / SI run-rate (12–15%)                       | $14–22M                        | High       | `ams_contract.pdf`, `rate_cards.xlsx`, `bafo_model.xlsx`        |
| Close acceleration & FP&A productivity           | $8–13M                         | Medium     | `month_end_close.pdf`, `fpa_process.docx`                       |
| Procurement / spend optimization                 | $10–16M                        | Medium     | `sourcing_pipeline.xlsx`, `vendor_scorecards.xlsx`              |
| AI productivity (12 use cases)                   | $9–15M                         | Medium     | `ai_opportunity_portfolio.xlsx`, `value_realization_model.xlsx` |
| **Total annualized**                             | **~$96–128M**                  | —          | `04_finance_performance/value_pools.xlsx`                       |

---

## 9. Effort Estimate

| Workstream                  | Effort (FTE-months, synthetic) | Notes                                          |
| --------------------------- | ------------------------------ | ---------------------------------------------- |
| Kyriba completion (3 waves) | 280–340                        | connectivity, payments factory, AI forecasting |
| Controls uplift / SOX       | 120–160                        | remediation + SoD + fraud controls             |
| Reporting rationalization   | 180–220                        | semantic layer + retire/rebuild                |
| Vendor/SI optimization      | 60–90                          | RFP→BAFO, rate-card reset                      |
| Governed AI + value mgmt    | 110–150                        | 12 use cases + Control Tower                   |
| **Program total**           | **~750–960 FTE-months**        | blended onshore/nearshore/offshore             |

Program investment ~**$34–42M** (rate cards in `rate_cards.xlsx`; blended via offshore leverage).

---

## 10. Sourcing / SI Implications

Re-source AMS via RFP with capability/price/delivery/innovation weighting
(`rfp_requirements.docx`); drive BAFO competition (`bafo_model.xlsx`) targeting 12–15% rate-card
reset and automation gain-share; consolidate SI partners on outcome-based commercials; align renewal
calendar (`renewal_calendar.xlsx`) to avoid auto-renew traps (`contract_risks.xlsx`).

---

## 11. Control Tower Metrics (value realization)

Tracked post-P5 in Control Tower:

- Cash released ($) vs target; idle-cash %; forecast accuracy %.
- Payment exception rate %; SOX deficiencies open; SoD conflicts open.
- Reports retired / consolidated; manual prep hours; close-cycle days.
- AMS run-rate $ vs baseline; rate-card index; automation deflection %.
- AI use cases live; measured benefit $; Responsible AI control coverage %.
  Baselines: `04_finance_performance/kpi_catalog.xlsx`, `value_pools.xlsx`.

---

## 12. Evidence Citations (sample, from loaded context)

| Claim                                 | Source document (blob/chunk)                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Kyriba 4-wave rollout + connectivity  | `source/05_treasury_kyriba/kyriba_rollout_plan.xlsx`, `bank_connectivity_inventory.xlsx`          |
| Payment exception rate / factory flow | `source/05_treasury_kyriba/payment_process.docx`                                                  |
| 320→140 reports, 58% manual prep      | `source/07_data_analytics_reporting/report_inventory.xlsx`, `reporting_rationalization_brief.pdf` |
| AMS ~$18.4M, above-market rate card   | `source/10_vendors_contracts_source/ams_contract.pdf`, `rate_cards.xlsx`                          |
| SOX/payment-fraud controls            | `source/11_risk_controls_responsible_ai/sox_controls.xlsx`, `payment_fraud_controls.xlsx`         |
| ~1,600 incidents, root causes         | `source/09_servicenow_support_workload/servicenow_incidents.csv`, `root_cause_analysis.pdf`       |
| Value pools                           | `source/04_finance_performance/value_pools.xlsx`                                                  |

All citations resolve to Azure Blob evidence paths and Postgres chunks
(`chunk_id LIKE 'LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1::<path>::<idx>'`) — searchable in
`tenant-context-v1`.

---

## 13. Assumptions & Gaps

**Assumptions:** WACC 9.5%; benefit ramp 14 months to 80%; FX USD/EUR 1.08; offshore leverage on SI
mix; brownfield S/4 migration. (`03_strategy_initiatives/budget_assumptions.xlsx`.)

**Gaps to harden (truthful):**

- **Browser signed-in product QA** not yet executed (no Clerk creds in this environment) — see
  `LAKESHORE_SIGNED_IN_QA_REPORT_2026-06-06.md`.
- Vector/hybrid retrieval is wired (1536-d vectors indexed) but the production retriever currently
  issues BM25; enable `vectorQueries` for hybrid.
- Embeddings used OpenAI directly (KV `openai-api-key`); align to the platform embedding policy.
- Several quantitative claims are synthetic baselines; replace with client-validated actuals at P2.
- Evidence-gap register (`evidence_gap_register.csv`) lists items requiring source-document backing.

_Synthetic data room. No real customer, employee, bank, or financial data._
