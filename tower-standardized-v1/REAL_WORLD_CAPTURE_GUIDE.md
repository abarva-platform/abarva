# Tower Real-World Capture Guide

This guide explains how the synthetic Tower demo files should translate into a real client upload. The point of the standardized template is not that every demo value is already client-attested. The point is to make the required data contract explicit, label what is synthetic, and show the client exactly what to provide to make each Tower metric board-grade.

## Principle

Tower should answer CIO/CFO questions from governed financial, vendor, program, value, operational, and evidence rows. If a client does not provide a field, AbarVa can sometimes derive a reconciled demo value, but the value must stay labeled as synthetic or not_loaded. It must never be silently promoted to an attested client fact.

## Client Capture Pattern

1. Capture the source system or workbook.
2. Preserve source row, sheet, period, and owner.
3. Normalize field names into the Tower canonical schema.
4. Classify every dollar by view, amount_type, basis, period, and formula.
5. Reconcile decompositions back to the real envelope.
6. Only then render Tower dashboard metrics or allow chat to answer deterministic questions.

## Real-World Field Guidance

| Area | What to Capture | Real Sources | If Missing |
|---|---|---|---|
| IT budget envelope | Approved FY budget by portfolio/function/platform | ERP GL, FP&A, Apptio/TBM, Anaplan/Adaptive | Do not claim total budget |
| Run/change | Budget line classification or split percent | TBM taxonomy, FP&A planning | Derive only from approved spend_type; otherwise not_loaded |
| CapEx/OpEx | Accounting treatment by line | ERP GL, fixed asset ledger, capitalization policy | Demo may synthesize; real client should provide |
| Actual YTD | Actual spend by same grain as budget | ERP actuals, AP, procurement, cloud billing | Show committed budget only; burn-rate is partial |
| Forecast EOY | Latest forecast by line | FP&A forecast/EPM | Do not claim overrun/underrun |
| Portfolio company | Legal entity/company allocation | ERP company code, cost center hierarchy | No portfolio-company slice |
| Vendor exposure | Vendor, contract, renewal, ACV, supported system | CLM, procurement, SAM | Renewal and concentration views partial |
| Initiative budget | Initiative id/name/owner/budget/stage | PPM, Jira Align, ServiceNow SPM | Cannot rank programs safely |
| Measured value | Realized value, method, baseline, finance attestation | Benefits ledger, KPI systems | ROI is unproven |
| Operational KPIs | Baseline/current/target by domain | ServiceNow, Jira, operational systems | Tower cannot prove operational outcomes |
| AI adoption | Active and eligible users/cases | M365, GitHub, ServiceNow, app telemetry | Adoption score partial |
| Risk/pressure | Risk/blocker/severity/owner/due date | RAID, GRC, PMO | Pressure score partial |
| Evidence lineage | Source file/row/run/freshness | AbarVa source registry | Block board-grade claim |
| Formula governance | Formula name/version/basis/period | AbarVa metric registry | Display raw only |

## Synthetic Demo Rules

- Synthetic values are allowed for demo completeness only when they reconcile to a real source envelope.
- Synthetic values must appear in SYNTHETIC_MANIFEST.csv.
- Synthetic values must carry value_source = synthetic.
- If a value cannot reconcile, write not_loaded.
- Never use value-at-stake as spend.
- Never sum IT budget, app run cost, vendor contract value, and initiative spend as if they are one additive measure.

## Recommended Real Client File Additions

For the next template version, add or require:

- portfolio_company_id
- legal_entity_id
- cost_center_id
- budget_owner_role
- budget_owner_person_name when available
- budget_fy26_usd
- committed_fy26_usd
- actual_ytd_usd
- forecast_eoy_usd
- run_budget_fy26_usd
- change_budget_fy26_usd
- capex_budget_fy26_usd
- opex_budget_fy26_usd
- amount_type
- view
- basis
- period
- formula_version
- source_system
- source_file
- source_row
- loaded_at
- freshness_date
- value_source

## What This Means For Tower

The dashboard can be beautiful and deterministic only if it reads from this governed metric layer. The chat should answer deterministic questions from the same layer, cite the rows, and say exactly which fields are missing when the template is incomplete.
