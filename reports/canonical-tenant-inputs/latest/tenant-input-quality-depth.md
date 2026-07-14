# Tenant Input Quality And Depth

Generated: 2026-07-14T16:11:44.118Z

## Truth Split

- This report audits source-file standardization and depth only.
- It does not regenerate candidates, write production data, update Active Tenant Access, or change module runtime behavior.

## Universal Template Set

- Template set: `universal-tenant-input-standard-2026-07`
- Template root: `datasets/tenant-inputs/templates/universal/standard-2026-07`
- Azure container: `tenant-inputs`
- Raw prefix: `tenant-inputs/{tenant_key}/{intake_id}/raw/`
- Validated prefix: `tenant-inputs/{tenant_key}/{intake_id}/validated/`
- Archive prefix: `tenant-inputs/archive/{tenant_key}/{intake_id}/`
- File naming: `{tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv`

## All-Tenant Depth Matrix

| Tenant | Size band | CSV files | CSV rows | Mapped rows | Depth blockers | Warnings |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Apex Retail | large | 19 | 1,059 | 1,059 | 7 | 0 |
| First Capital Financial | large | 19 | 1,338 | 1,338 | 7 | 0 |
| Lakeshore Holdings | mid_market | 19 | 259 | 259 | 9 | 0 |
| Lakeshore Industries | large | 19 | 1,694 | 1,582 | 6 | 1 |
| Meridian Health | large | 19 | 1,176 | 1,166 | 5 | 3 |
| SkyHarbor Air | large | 19 | 3,221 | 2,811 | 7 | 1 |

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
| spend_value | 6 | 10 | blocker | `current-universal/08_spend_value.csv` |
| programs_initiatives | 80 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 58 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 135 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 13 | 100 | blocker | `current-universal/12_relationships.csv` |
| metrics_outcomes | 108 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 1 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 107 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 5 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

### First Capital Financial

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
| spend_value | 6 | 10 | blocker | `current-universal/08_spend_value.csv` |
| programs_initiatives | 96 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 146 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 210 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 11 | 100 | blocker | `current-universal/12_relationships.csv` |
| metrics_outcomes | 157 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 1 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 151 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 5 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

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
| spend_value | 85 | 5 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 15 | 10 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 8 | 5 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 10 | 20 | blocker | `current-universal/11_risks_controls.csv` |
| relationships | 10 | 40 | blocker | `current-universal/12_relationships.csv` |
| metrics_outcomes | 12 | 12 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 1 | 10 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 4 | 5 | blocker | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 4 | 3 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 5 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 5 | blocker | none |

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
| spend_value | 69 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 36 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 36 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 48 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 519 | 100 | pass | `current-universal/12_relationships.csv` |
| metrics_outcomes | 236 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 2 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 24 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 18 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 8 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/18_operational_process_evidence.csv

### Meridian Health

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 2 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 30 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 57 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 26 | 25 | pass | `current-universal/03_workforce_roles.csv` |
| applications_systems | 116 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 147 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 4 | 20 | blocker | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 109 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 24 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 86 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 63 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 172 | 40 | pass | `current-universal/11_risks_controls.csv` |
| relationships | 85 | 100 | blocker | `current-universal/12_relationships.csv` |
| metrics_outcomes | 116 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 4 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 108 | 10 | pass | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 15 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 2 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/18_operational_process_evidence.csv
- Potential current/target blend: current-universal/04_applications_systems.csv
- Potential current/target blend: current-universal/05_data_assets_integrations.csv

### SkyHarbor Air

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 2 | 1 | pass | `current-universal/00_enterprise_profile.csv` |
| business_functions | 24 | 15 | pass | `current-universal/01_business_functions.csv` |
| org_ownership | 278 | 10 | pass | `current-universal/02_org_ownership.csv` |
| workforce_roles | 12 | 25 | blocker | `current-universal/03_workforce_roles.csv` |
| applications_systems | 613 | 75 | pass | `current-universal/04_applications_systems.csv` |
| data_assets_integrations | 570 | 100 | pass | `current-universal/05_data_assets_integrations.csv` |
| infrastructure_platforms | 691 | 20 | pass | `current-universal/06_infrastructure_platforms.csv` |
| vendors_contracts | 71 | 25 | pass | `current-universal/07_vendors_contracts.csv` |
| spend_value | 186 | 10 | pass | `current-universal/08_spend_value.csv` |
| programs_initiatives | 67 | 20 | pass | `current-universal/09_programs_initiatives.csv` |
| ai_automation_use_cases | 43 | 10 | pass | `current-universal/10_ai_automation_use_cases.csv` |
| risks_controls | 28 | 40 | blocker | `current-universal/11_risks_controls.csv` |
| relationships | 77 | 100 | blocker | `current-universal/12_relationships.csv` |
| metrics_outcomes | 124 | 25 | pass | `current-universal/14_metrics_outcomes.csv` |
| evidence_sources | 3 | 20 | blocker | `current-universal/13_evidence_sources.csv` |
| industry_context_patterns | 9 | 10 | blocker | `current-universal/15_industry_context_patterns.csv` |
| expert_lenses | 10 | 5 | pass | `current-universal/16_expert_lenses.csv` |
| service_scope_managed_services | 3 | 10 | blocker | `current-universal/17_service_scope_managed_services.csv` |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: current-universal/18_operational_process_evidence.csv

## Retired / Excluded

- northstar-clinical: retired-excluded
