# Standard 2026-07 V3 Reload Template Pack

Use this pack when preparing the next tenant's source files for Home, Intelligence, Moves, Source, and Tower.

## Purpose

This is the clean reload pattern proven on Meridian. It prevents the recurring failure where programs, budget rows, AI opportunities, and benefits claims drift apart.

The working rule is simple:

```text
finance rows -> budget facts -> programs/initiatives -> AI use cases -> benefits realization -> evidence
```

If any link is missing, the data should remain visible as a gap, not become a claim.

## Mandatory Rules

1. Do not delete old rows during a reload. Preserve them and mark them with `source_row_status=preserved_legacy_context` or a tenant-equivalent status.
2. Every approved or active program must tie to at least one 08 budget row or SA02 finance row.
3. Every approved AI-tagged program must have approved funding and source finance ties.
4. Candidate AI opportunities must not inherit funding from platform or foundation programs.
5. AI Assist style opportunities stay `not_approved` and `$0` unless an explicit finance row says otherwise.
6. AI spend is a non-additive lens over the technology budget unless the source file explicitly states otherwise.
7. Embedded platform AI spend must not be treated as realized value.
8. Tower may show budget, spend, readiness, and hypotheses only from source-backed fields.
9. Tower must not show realized value, proven savings, ROI, achieved benefit, or measured outcome unless the benefits ledger has usage, KPI movement, and finance validation.
10. Every generated row must resolve to an `evidence_id` in `13_evidence_sources.csv`.

## Files To Fill

Use the blank CSVs in `blank-csv/` as the starting template:

- `08_it_budget_spend_value_TEMPLATE.csv`
- `09_programs_initiatives_TEMPLATE.csv`
- `10_ai_automation_use_cases_TEMPLATE.csv`
- `14_metrics_outcomes_TEMPLATE.csv`
- `SA02_IT_Finance_Budget_Spend_Extract_TEMPLATE.csv`
- `SA04_Program_Portfolio_Extract_TEMPLATE.csv`
- `SA08_AI_Benefits_Realization_Usage_Ledger_TEMPLATE.csv`
- `SA07_Executive_Interview_Insights_TEMPLATE.csv`

## Minimum Reload QA

Before loading a tenant packet, confirm:

- run budget + change budget = total technology budget
- SA02 finance extract reconciles to 08 budget facts
- approved programs in 09 reconcile to SA04 and at least one budget row
- AI use cases in 10 either tie to funded programs or are marked candidate/not approved
- SA08 benefit rows are present for AI/platform spend that claims usage or value
- all evidence IDs resolve
- all preserved old rows are excluded from additive budget rollups unless reconciled

## Recommended Tenant Interview Flow

Run business and technical interviews before finalizing the packet:

- Business track: CEO, CFO, COO, line-of-business leaders, shared services, operations, HR, procurement, transformation office.
- Technical track: CIO, CTO, CDAO, CISO, enterprise architecture, application owners, data owners, service management, privacy/legal.

Interview rows can create context, priorities, risks, and gaps. They cannot create approved funding, program status, realized value, or ROI unless finance/source-system evidence supports it.

