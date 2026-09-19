# Required v3 Tower Extensions

Generated: 2026-07-15T19:45:01.239Z

## Existing v3 dimensions that should feed Tower

| ID  | Dimension                    | File                                  | Tower need                                                              | Status  | Required use                       |
| --- | ---------------------------- | ------------------------------------- | ----------------------------------------------------------------------- | ------- | ---------------------------------- |
| 08  | IT Budget, Spend & Value     | 08_spend_value.csv                    | budget, spend, promised value, savings opportunity, calculation basis   | Present | Use as core Tower source dimension |
| 09  | Programs & Initiatives       | 09_programs_initiatives.csv           | initiative, sponsor, owner, budget, expected value, dependencies, risks | Present | Use as core Tower source dimension |
| 11  | Risks & Controls             | 11_risks_controls.csv                 | risk/control context for value claims and readiness gates               | Present | Use as core Tower source dimension |
| 14  | Metrics & Outcomes           | 14_metrics_outcomes.csv               | baseline, target, current metric value, frequency, source, owner        | Present | Use as core Tower source dimension |
| 17  | Managed Services Scope       | 17_service_scope_managed_services.csv | scope, SLA, service boundaries, buyer/provider responsibilities         | Present | Use as core Tower source dimension |
| 18  | Operational Process Evidence | 18_operational_process_evidence.csv   | process actuals, operational proof, service evidence                    | Present | Use as core Tower source dimension |

## Source adapters to add next

| Adapter | Name                                      | Status  | Purpose                                                                      | Required action                                                                                                               |
| ------- | ----------------------------------------- | ------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SA07    | Value Realization Actuals                 | Missing | Measured and realized value snapshots with finance attestation.              | Add under `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/source-adapters/` or the existing v3 template pack. |
| SA08    | Benefits Tracking / KPI Actuals           | Missing | KPI actuals, operational outcomes, and benefits tracking exports.            | Add under `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/source-adapters/` or the existing v3 template pack. |
| SA09    | Project Financials / Forecast / Actuals   | Missing | Portfolio financial forecast, actuals, capex/opex, and budget variance.      | Add under `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/source-adapters/` or the existing v3 template pack. |
| SA10    | SLA / Service Performance Actuals         | Missing | SLA, XLA, incident, request, backlog, and service performance actuals.       | Add under `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/source-adapters/` or the existing v3 template pack. |
| SA11    | Contract Savings / Commercial Commitments | Missing | Source awards, BAFO commitments, contract savings, credits, and obligations. | Add under `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/source-adapters/` or the existing v3 template pack. |

## Design rule

Do not add separate Tower source files. If Tower needs more actuals, forecasts, SLA outcomes, contract savings, or benefits tracking, add them as v3 source adapters and process them through Evidence Registry, Canonical Facts, Entity Profiles, Relationship Graph, Context Gaps/Confidence, and then TowerContextPack.
