# Scenario 04 - Clinical AI Governance And Model Risk

## Uploads

- `17-upload-templates/clinical-ai-model-inventory.csv`
- `17-upload-templates/governance-committee-decisions.csv`
- `17-upload-templates/data-platform-lineage.csv`

## Walkthrough

The AI governance council uploads its model inventory, committee decisions, and
lineage for PHI-bearing data products. The context layer produces an auditable
map of model risk, data quality, approval constraints, and review dates.

## Agent Value

Sentinel can answer which clinical AI use cases are safe to scale, which need
shadow validation, and which need better data lineage before patient-facing
deployment.

## Evidence Checks

- Every high-risk model has clinical owner and validation status.
- Every decision includes conditions and review date.
- Data products expose PHI class and refresh SLA.
