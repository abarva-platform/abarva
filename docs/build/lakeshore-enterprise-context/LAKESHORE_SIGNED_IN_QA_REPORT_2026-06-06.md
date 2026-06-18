# Lakeshore Signed-In QA Report — 2026-06-06

This report separates two distinct QA modes and is explicit about which was executed.

| QA mode                                                                 | Status                        | Notes                                                                                                                                                 |
| ----------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant-scoped context QA** (the retrieval the signed-in product runs) | ✅ **EXECUTED LIVE**          | Run inside the Azure VNet as the Lakeshore tenant against the same `tenant-context-v1` index and `enterprise_context_chunks` table the product reads. |
| **Browser signed-in product QA** (Clerk-authenticated UI clickthrough)  | ⛔ **NOT EXECUTED — blocked** | No Clerk test credentials / no reachable authenticated app from Cursor Cloud. Ready-to-run procedure below.                                           |

---

## A. Tenant-scoped context QA (executed live)

Auth context: queries filtered `tenant_key eq 'lakeshore-holdings'` (`client_id 49fc8aee-…`),
i.e. the exact tenant isolation the signed-in product enforces. Executed via the VNet Container
App against Azure AI Search + Azure Postgres.

### Q&A (grounded in retrieved evidence)

**Q1. What is Lakeshore's treasury modernization approach and bank connectivity model?**
A. Kyriba TMS rollout in 4 waves (NA→EMEA→APAC→LATAM) with a centralized payments factory; bank
connectivity via SWIFT Alliance Lite2/SCORE + host-to-host SFTP/EBICS; ISO20022 pain.001 out /
pain.002 + camt.053 in across 10 banking partners.
Evidence (top hits, score): `05_treasury_kyriba/kyriba_rollout_plan.xlsx`,
`kyriba_connectivity_architecture.svg`, `bank_connectivity_inventory.xlsx` — search score ≈ 27.6
on "Kyriba treasury bank connectivity rollout" (1,022 matches).

**Q2. What are the top ServiceNow incident root causes and volumes?**
A. ~1,600 incidents across ERP/Treasury/Reporting/Network/Access; recurring root causes:
integration failure (22%), data quality (19%), config error (17%), capacity (11%).
Evidence: `09_servicenow_support_workload/servicenow_incidents.csv` (1,816 row-chunks),
`root_cause_analysis.pdf` — 3,033 matches on "ServiceNow incident root cause".

**Q3. What is the reporting-rationalization opportunity and value?**
A. 320 managed reports → target ~140; ~46% duplicate metrics, ~58% manual prep; target 55%
manual-effort reduction via the dbt semantic layer.
Evidence: `07_data_analytics_reporting/report_inventory.xlsx`,
`reporting_rationalization_brief.pdf`, `12_ai_use_cases_moves/reporting_rationalization_use_case.docx`.

**Q4. What are the key SOX / payment-fraud controls and gaps?**
A. SOX ITGC + cycle controls with key/non-key designation; payment controls: dual authorization,
sanctions screening, beneficiary validation, payment limits, anomaly detection; gaps tracked in
the evidence-gap register.
Evidence: `11_risk_controls_responsible_ai/sox_controls.xlsx`, `payment_fraud_controls.xlsx`,
`risk_control_register.xlsx` — score ≈ 34.8 (475 matches).

**Q5. What is the AMS / SI vendor optimization opportunity?**
A. AMS MSA at ~$18.4M/yr with above-market rate card and weak automation incentives; 140-row SI
rate card and BAFO model support a 12–15% run-rate reduction.
Evidence: `10_vendors_contracts_source/ams_contract.pdf`, `rate_cards.xlsx`, `bafo_model.xlsx`.

### What the context layer can now answer

Enterprise profile & operating model · org & decision rights (RACI) · strategy/portfolio/RAID ·
P&L / working capital / KPI / value pools · **treasury & Kyriba** (rollout, connectivity, payments,
controls, defects) · IT estate & architecture (with technical SVGs) · data/analytics/reporting
estate · O2C/P2P/R2R processes · **1,600 ServiceNow incidents + 1,200 events** · vendors/contracts/
rate-cards/sourcing · risk/controls/audit/Responsible AI · AI use-case portfolio & value model.

---

## B. Browser signed-in product QA (blocked — ready to run)

**Blocker:** the authenticated Next.js app requires valid Clerk keys
(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) and a Lakeshore demo login; these are not
available to Cursor Cloud and the authenticated app surfaces are not reachable from this environment.
Per the task's truthfulness rule, this state is reported as **not yet verified**, not claimed.

**Ready-to-run procedure (operator with Clerk + app access):**

1. Sign in as a Lakeshore tenant_member (email mapping `+lakeshore` / `demo-lakeshore+`).
2. Open `/admin/context-layer` → confirm Lakeshore context summary shows the new load
   (5,247 chunks, 133 sources).
3. Open `/admin/setup` (Data Load Center) → confirm the `LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1`
   ingestion run.
4. In Sentinel/Ask, ask Q1–Q5 above; confirm cited answers reference the Lakeshore blobs/chunks.
5. Open Strategic Moves → confirm the flagship Move can cite the loaded evidence.
6. Capture screenshots into `signed-in-qa/`.

The diagram renders in `screenshots/` provide a visual proxy of the loaded architecture artifacts
until browser QA is performed.

Raw QA evidence: `azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json`
(`load_run_steps.qa`), `signed-in-qa/tenant_qa_results.json`.
