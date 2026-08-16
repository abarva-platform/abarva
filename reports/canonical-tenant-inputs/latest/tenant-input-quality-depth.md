# Tenant Input Quality And Depth

Generated: 2026-08-16T11:40:08.863Z

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
| Meridian Health | large | 24 | 3,887 | 3,815 | 0 | 4 |
| Airline Demo | large | 26 | 5,792 | 5,027 | 0 | 8 |

## Column Contract Conformance

Depth says a dimension has enough rows. Conformance says those rows carry the columns the
contract declares. A package can pass depth and still be unreadable to every adapter, so both
are checked.

| Tenant | Declared | Conformant | Naming drift | Column gaps | Absent | Contract fields carrying data | Waived until |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Meridian Health | 19 | 19 | 0 | 0 | 0 | 285/286 (100%) | — |
| Airline Demo | 19 | 19 | 0 | 0 | 0 | 285/286 (100%) | — |

## Domain Depth By Tenant

### Meridian Health

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal-integrated-healthcare/00_enterprise_profile.csv` |
| business_functions | 24 | 15 | pass | `current-universal-integrated-healthcare/01_business_functions.csv` |
| org_ownership | 225 | 10 | pass | `current-universal-integrated-healthcare/02_org_ownership.csv` |
| workforce_roles | 45 | 25 | pass | `current-universal-integrated-healthcare/03_workforce_roles.csv` |
| applications_systems | 301 | 75 | pass | `current-universal-integrated-healthcare/04_applications_systems.csv` |
| data_assets_integrations | 520 | 100 | pass | `current-universal-integrated-healthcare/05_data_assets_integrations.csv` |
| infrastructure_platforms | 77 | 20 | pass | `current-universal-integrated-healthcare/06_infrastructure_platforms.csv`<br>`current-universal-integrated-healthcare/19_data_analytics_platform_maturity.csv` |
| vendors_contracts | 72 | 25 | pass | `current-universal-integrated-healthcare/07_vendors_contracts.csv` |
| spend_value | 24 | 10 | pass | `current-universal-integrated-healthcare/08_spend_value.csv` |
| programs_initiatives | 28 | 20 | pass | `current-universal-integrated-healthcare/09_programs_initiatives.csv` |
| ai_automation_use_cases | 18 | 10 | pass | `current-universal-integrated-healthcare/10_ai_automation_use_cases.csv` |
| risks_controls | 40 | 40 | pass | `current-universal-integrated-healthcare/11_risks_controls.csv` |
| relationships | 2,302 | 100 | pass | `current-universal-integrated-healthcare/12_relationships.csv` |
| metrics_outcomes | 50 | 25 | pass | `current-universal-integrated-healthcare/14_metrics_outcomes.csv` |
| evidence_sources | 27 | 20 | pass | `current-universal-integrated-healthcare/13_evidence_sources.csv` |
| industry_context_patterns | 12 | 10 | pass | `current-universal-integrated-healthcare/15_industry_context_patterns.csv` |
| expert_lenses | 9 | 5 | pass | `current-universal-integrated-healthcare/16_expert_lenses.csv` |
| service_scope_managed_services | 15 | 10 | pass | `current-universal-integrated-healthcare/17_service_scope_managed_services.csv` |
| operational_process_evidence | 25 | 10 | pass | `current-universal-integrated-healthcare/18_operational_process_evidence.csv` |

Warnings:

- Unmapped source file: current-universal-integrated-healthcare/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal-integrated-healthcare/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal-integrated-healthcare/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal-integrated-healthcare/SA11_AI_KPI_Operational_Outcome_Feed.csv

### Airline Demo

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 22 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 154 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 39 | 25 | pass | `current-universal/03_workforce_roles.csv` |
| applications_systems | 503 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 499 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 48 | 20 | pass | `current-universal/06_infrastructure_platforms.csv`<br>`current-universal/19_data_analytics_platform_maturity.csv` |
| vendors_contracts | 65 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 20 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 29 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 13 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 44 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 3,318 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 26 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 183 | 20 | pass | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 10 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 7 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 11 | 10 | pass | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 35 | 10 | pass | `current-universal/18_operational_process_evidence.csv` |

Warnings:

- Unmapped source file: current-universal/12b_interview_initiative_metric_crosswalk.csv
- Unmapped source file: current-universal/20_itsm_ticket_sla_performance.csv
- Unmapped source file: current-universal/SA08_AI_Benefits_Realization_Usage_Ledger.csv
- Unmapped source file: current-universal/SA09_AI_Tool_Usage_Feed.csv
- Unmapped source file: current-universal/SA10_AI_Value_Interview_Evidence.csv
- Unmapped source file: current-universal/SA11_AI_KPI_Operational_Outcome_Feed.csv
- Potential current/target blend: current-universal/04_applications_systems.csv
- Potential current/target blend: current-universal/06_infrastructure_platforms.csv

## Retired / Excluded

- northstar-clinical: retired-excluded
- healthcare-demo-new: retired-excluded
- apex-retail: retired-excluded
- first-capital-financial: retired-excluded
- lakeshore-holdings: retired-excluded
- lakeshore-industries: retired-excluded
