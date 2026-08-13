# Tenant Input Quality And Depth

Generated: 2026-08-13T17:50:32.910Z

## Truth Split

- This report audits source-file standardization and depth only.
- It does not regenerate candidates, write production data, update Active Tenant Access, or change module runtime behavior.

## Universal Template Set

- Template set: `universal-tenant-input-standard-2026-07-v3`
- Template root: `datasets/tenant-inputs/templates/universal/standard-2026-07-v3`
- Azure container: `tenant-inputs`
- Raw prefix: `tenant-inputs/{tenant_key}/{intake_id}/raw/`
- Validated prefix: `tenant-inputs/{tenant_key}/{intake_id}/validated/`
- Archive prefix: `tenant-inputs/archive/{tenant_key}/{intake_id}/`
- File naming: `{tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv`

## All-Tenant Depth Matrix

| Tenant | Size band | CSV files | CSV rows | Mapped rows | Depth blockers | Warnings |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Apex Retail | large | 23 | 2,801 | 2,769 | 6 | 4 |
| FS Demo | large | 23 | 1,749 | 1,717 | 6 | 4 |
| Healthcare Demo | large | 24 | 3,879 | 3,782 | 1 | 5 |
| Lakeshore Holdings | mid_market | 23 | 654 | 622 | 8 | 4 |
| Lakeshore Industries | large | 23 | 1,736 | 1,592 | 6 | 5 |
| Meridian Health | large | 25 | 4,850 | 4,506 | 3 | 10 |
| Airline Demo | large | 26 | 5,617 | 4,817 | 1 | 9 |

## Column Contract Conformance

Depth says a dimension has enough rows. Conformance says those rows carry the columns the
contract declares. A package can pass depth and still be unreadable to every adapter, so both
are checked.

| Tenant | Declared | Conformant | Naming drift | Column gaps | Absent | Contract fields carrying data | Waived until |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Apex Retail | 19 | 19 | 0 | 0 | 0 | 167/286 (58%) | — |
| FS Demo | 19 | 19 | 0 | 0 | 0 | 167/286 (58%) | — |
| Healthcare Demo | 19 | 19 | 0 | 0 | 0 | 284/286 (99%) | — |
| Lakeshore Holdings | 19 | 19 | 0 | 0 | 0 | 167/286 (58%) | — |
| Lakeshore Industries | 19 | 19 | 0 | 0 | 0 | 168/286 (59%) | — |
| Meridian Health | 19 | 1 | 2 | 18 | 0 | 65/286 (23%) | 2026-09-30 |
| Airline Demo | 19 | 19 | 0 | 0 | 0 | 283/286 (99%) | — |

## Domain Depth By Tenant

### Apex Retail

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 26 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 50 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 12 | 25 | blocker | `current-universal/03_workforce_roles.csv` |
| applications_systems | 122 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 235 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 0 | 20 | blocker | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 100 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 8 | 10 | blocker | `current-universal/08_spend_value.csv` |
| programs_initiatives | 80 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 58 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 135 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 1,713 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 108 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 9 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 107 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 5 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv

### FS Demo

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 27 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 65 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 16 | 25 | blocker | `current-universal/03_workforce_roles.csv` |
| applications_systems | 212 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 114 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 0 | 20 | blocker | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 120 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 8 | 10 | blocker | `current-universal/08_spend_value.csv` |
| programs_initiatives | 96 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 146 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 210 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 380 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 157 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 9 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 151 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 5 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv

### Healthcare Demo

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 24 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 224 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 45 | 25 | pass | `current-universal/03_workforce_roles.csv` |
| applications_systems | 296 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 520 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 77 | 20 | pass | `current-universal/06_infrastructure_platforms.csv`<br>`current-universal/19_data_analytics_platform_maturity.csv` |
| vendors_contracts | 71 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 24 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 28 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 18 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 40 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 2,302 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 50 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 26 | 20 | pass | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 12 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 9 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 15 | 10 | pass | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/18_operational_process_evidence.csv
- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv

### Lakeshore Holdings

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 14 | 8 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 8 | 5 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 10 | 10 | pass | `current-universal/03_workforce_roles.csv` |
| applications_systems | 24 | 25 | blocker | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 34 | 40 | blocker | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 0 | 8 | blocker | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 19 | 12 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 86 | 5 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 15 | 10 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 8 | 5 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 10 | 20 | blocker | `current-universal/11_risks_controls.csv` |
| relationships | 364 | 40 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 12 | 12 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 9 | 10 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 4 | 5 | blocker | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 4 | 3 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 5 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 5 | blocker | none |

Warnings:

- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv

### Lakeshore Industries

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 8 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 59 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 116 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 22 | 25 | blocker | `current-universal/03_workforce_roles.csv` |
| applications_systems | 152 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 82 | 100 | blocker | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 128 | 20 | pass | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 19 | 25 | blocker | `current-universal/07_vendors_contracts.csv` |
| spend_value | 71 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 36 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 36 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 48 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 519 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 236 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 10 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 24 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 18 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 8 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/18_operational_process_evidence.csv
- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv

### Meridian Health

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 2 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 228 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 228 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 221 | 25 | pass | `current-universal/03_workforce_roles.csv` |
| applications_systems | 241 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 242 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 15 | 20 | blocker | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 231 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 298 | 10 | pass | `current-universal/08_it_budget_spend_value.csv` |
| programs_initiatives | 256 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 251 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 249 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 1,037 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 257 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 508 | 20 | pass | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 7 | 10 | blocker | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 7 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 228 | 10 | pass | `current-universal/17_managed_services_scope.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/18_operational_process_evidence.csv
- Unmapped source file: current-universal/SA02_IT_Finance_Budget_Spend_Extract.csv
- Unmapped source file: current-universal/SA04_Program_Portfolio_Extract.csv
- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv
- Potential current/target blend: current-universal/04_applications_systems.csv
- Potential current/target blend: current-universal/05_data_assets_integrations.csv
- Potential current/target blend: current-universal/06_infrastructure_platforms.csv

### Airline Demo

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 22 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 150 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 38 | 25 | pass | `current-universal/03_workforce_roles.csv` |
| applications_systems | 503 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 499 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 48 | 20 | pass | `current-universal/06_infrastructure_platforms.csv`<br>`current-universal/19_data_analytics_platform_maturity.csv` |
| vendors_contracts | 65 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 20 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 20 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 13 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 44 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 3,318 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 26 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 22 | 20 | pass | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 10 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 7 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 11 | 10 | pass | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/12b_interview_initiative_metric_crosswalk.csv
- Unmapped source file: current-universal/18_operational_process_evidence.csv
- Unmapped source file: current-universal/20_itsm_ticket_sla_performance.csv
- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv
- Potential current/target blend: current-universal/04_applications_systems.csv
- Potential current/target blend: current-universal/06_infrastructure_platforms.csv

## Retired / Excluded

- northstar-clinical: retired-excluded
