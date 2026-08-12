# Universal Template Pack — Workbook Quality Bar

Template set: `universal-tenant-input-standard-2026-07-v3`
Quality bar: `docs/governance/CLIENT_REVIEW_WORKBOOK_QUALITY_BAR.md`
Mode: `apply`

## What changed

- `AbarVa_Template_Pack_Index_v3.xlsx` rebuilt as the client front door with seven sheets.
- 25 pack workbooks received a governed `Start Here` first sheet.
- Existing tabs and every CSV column contract were left unchanged.

## Counts

| Item | Count |
| --- | --- |
| workbooks | 26 |
| canonicalDimensionTemplates | 19 |
| sourceExtractTemplates | 6 |
| workstreams | 10 |
| canonicalCsvContracts | 19 |
| workbooksWithoutWorkstreamMapping | 0 |

## Workbooks

| Workbook | Role | Workstream(s) | Start Here named a workstream before | Sheets after |
| --- | --- | --- | --- | --- |
| `00_enterprise_profile.xlsx` | canonical-dimension template | WS01 Enterprise Strategy and Operating Model | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `01_business_functions.xlsx` | canonical-dimension template | WS01 Enterprise Strategy and Operating Model | WS02 Organization, Workforce, and Decision Rights | WS09 Operations, KPIs, and Process Evidence | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `02_org_ownership.xlsx` | canonical-dimension template | WS02 Organization, Workforce, and Decision Rights | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `03_workforce_roles.xlsx` | canonical-dimension template | WS02 Organization, Workforce, and Decision Rights | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `04_applications_systems.xlsx` | canonical-dimension template | WS03 Applications, Infrastructure, and Architecture | WS08 Risk, Security, Controls, and Compliance | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations | Data Platform Segments | Use Case Boundary |
| `05_data_assets_integrations.xlsx` | canonical-dimension template | WS04 Data, Integration, and Analytics | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `06_infrastructure_platforms.xlsx` | canonical-dimension template | WS03 Applications, Infrastructure, and Architecture | WS04 Data, Integration, and Analytics | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations | CMDB Mapping |
| `07_vendors_contracts.xlsx` | canonical-dimension template | WS05 Vendors, Contracts, and Procurement | WS06 Finance, Spend, and Value | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `08_it_budget_spend_value.xlsx` | canonical-dimension template | WS05 Vendors, Contracts, and Procurement | WS06 Finance, Spend, and Value | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations | Tower Views |
| `09_programs_initiatives.xlsx` | canonical-dimension template | WS01 Enterprise Strategy and Operating Model | WS06 Finance, Spend, and Value | WS07 Programs, Portfolio, and Change | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `10_ai_automation_use_cases.xlsx` | canonical-dimension template | WS04 Data, Integration, and Analytics | WS07 Programs, Portfolio, and Change | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `11_risks_controls.xlsx` | canonical-dimension template | WS05 Vendors, Contracts, and Procurement | WS07 Programs, Portfolio, and Change | WS08 Risk, Security, Controls, and Compliance | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `12_relationships.xlsx` | canonical-dimension template | WS02 Organization, Workforce, and Decision Rights | WS03 Applications, Infrastructure, and Architecture | WS04 Data, Integration, and Analytics | WS05 Vendors, Contracts, and Procurement | WS07 Programs, Portfolio, and Change | WS09 Operations, KPIs, and Process Evidence | WS10 Interviews, Questionnaires, and Executive Signals | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations | Allowed Relationships |
| `13_evidence_sources.xlsx` | canonical-dimension template | WS03 Applications, Infrastructure, and Architecture | WS04 Data, Integration, and Analytics | WS05 Vendors, Contracts, and Procurement | WS06 Finance, Spend, and Value | WS08 Risk, Security, Controls, and Compliance | WS10 Interviews, Questionnaires, and Executive Signals | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `14_metrics_outcomes.xlsx` | canonical-dimension template | WS06 Finance, Spend, and Value | WS07 Programs, Portfolio, and Change | WS08 Risk, Security, Controls, and Compliance | WS09 Operations, KPIs, and Process Evidence | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `15_industry_context_patterns.xlsx` | canonical-dimension template | WS01 Enterprise Strategy and Operating Model | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `16_expert_lenses.xlsx` | canonical-dimension template | WS10 Interviews, Questionnaires, and Executive Signals | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `17_managed_services_scope.xlsx` | canonical-dimension template | WS05 Vendors, Contracts, and Procurement | WS09 Operations, KPIs, and Process Evidence | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `18_operational_process_evidence.xlsx` | canonical-dimension template | WS08 Risk, Security, Controls, and Compliance | WS09 Operations, KPIs, and Process Evidence | yes | Start Here | Sheet Guide | Client Intake | Questionnaire | Examples | Reference Values | Relationship Expectations |
| `AbarVa_Template_Pack_Index_v3.xlsx` | index | not mapped | yes | Start Here | Intake Workstreams | Review Queue | Source Extract Map | Canonical Mapping | SME Review Matrix | Evidence and Gates |
| `SA01_ServiceNow_CMDB_Extract_Template.xlsx` | source-extract template | WS03 Applications, Infrastructure, and Architecture | yes | Start Here | Sheet Guide | Source Extract Intake | Target Dimensions | Validation Questions | Synthetic Examples | Field Mapping Detail |
| `SA02_IT_Finance_Budget_Spend_Extract_Template.xlsx` | source-extract template | WS06 Finance, Spend, and Value | yes | Start Here | Sheet Guide | Source Extract Intake | Target Dimensions | Validation Questions | Synthetic Examples | Field Mapping Detail |
| `SA03_Vendor_Contracts_Extract_Template.xlsx` | source-extract template | WS05 Vendors, Contracts, and Procurement | yes | Start Here | Sheet Guide | Source Extract Intake | Target Dimensions | Validation Questions | Synthetic Examples |
| `SA04_Program_Portfolio_Extract_Template.xlsx` | source-extract template | WS07 Programs, Portfolio, and Change | yes | Start Here | Sheet Guide | Source Extract Intake | Target Dimensions | Validation Questions | Synthetic Examples |
| `SA05_Cloud_Inventory_Extract_Template.xlsx` | source-extract template | WS03 Applications, Infrastructure, and Architecture | yes | Start Here | Sheet Guide | Source Extract Intake | Target Dimensions | Validation Questions | Synthetic Examples |
| `SA06_Incident_Problem_Change_Extract_Template.xlsx` | source-extract template | WS08 Risk, Security, Controls, and Compliance | yes | Start Here | Sheet Guide | Source Extract Intake | Target Dimensions | Validation Questions | Synthetic Examples |

## Notes

- Naming drift: canonical contract 08_spend_value.csv is carried by workbook 08_it_budget_spend_value.xlsx; the CSV contract is authoritative and was not renamed.
- Naming drift: canonical contract 17_service_scope_managed_services.csv is carried by workbook 17_managed_services_scope.xlsx; the CSV contract is authoritative and was not renamed.

## Governance boundary

This workbook is a template and review artifact. Completing it does not load data into any database, index retrieval, enable aVa or any product surface, or make its content client truth. SME validation and the promotion gates come first.

Workbook hashes before and after are recorded in `template-workbook-inventory.csv`.
