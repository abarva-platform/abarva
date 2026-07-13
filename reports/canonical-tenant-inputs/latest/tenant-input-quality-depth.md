# Tenant Input Quality And Depth

Generated: 2026-07-13T23:58:15.798Z

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
| Apex Retail | large | 17 | 4,112 | 3,589 | 5 | 1 |
| First Capital Financial | large | 17 | 6,132 | 5,609 | 4 | 1 |
| Lakeshore Holdings | mid_market | 19 | 996 | 473 | 7 | 1 |
| Lakeshore Industries | large | 52 | 3,809 | 3,094 | 1 | 2 |
| Meridian Health | large | 60 | 4,697 | 4,104 | 2 | 8 |
| SkyHarbor Air | large | 57 | 3,842 | 3,712 | 2 | 3 |

## Domain Depth By Tenant

### Apex Retail

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `enterprise-pack/templates/V6_01_enterprise_profile.csv` |
| business_functions | 26 | 15 | pass | `enterprise-pack/templates/V6_02_business_functions.csv` |
| org_ownership | 50 | 10 | pass | `enterprise-pack/templates/V6_03_org_ownership.csv` |
| workforce_roles | 12 | 25 | blocker | `enterprise-pack/templates/V6_04_workforce_personas.csv` |
| applications_systems | 182 | 75 | pass | `enterprise-pack/templates/V6_05_applications_systems.csv` |
| data_assets_integrations | 385 | 100 | pass | `enterprise-pack/templates/V6_06_data_assets_integrations.csv` |
| infrastructure_platforms | 0 | 20 | blocker | none |
| vendors_contracts | 100 | 25 | pass | `enterprise-pack/templates/V6_07_vendors_contracts.csv` |
| spend_value | 188 | 10 | pass | `enterprise-pack/templates/V6_08_spend_value.csv` |
| programs_initiatives | 159 | 20 | pass | `enterprise-pack/templates/V6_09_programs_initiatives.csv` |
| ai_automation_use_cases | 155 | 10 | pass | `enterprise-pack/templates/V6_10_ai_initiatives.csv` |
| risks_controls | 375 | 40 | pass | `enterprise-pack/templates/V6_11_operations_risk_controls.csv` |
| relationships | 1,605 | 100 | pass | `enterprise-pack/templates/V6_12_relationships.csv` |
| metrics_outcomes | 126 | 25 | pass | `enterprise-pack/templates/V6_14_metric_definitions.csv` |
| evidence_sources | 14 | 20 | blocker | `enterprise-pack/templates/V6_13_evidence_sources.csv` |
| industry_context_patterns | 206 | 10 | pass | `enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` |
| expert_lenses | 5 | 5 | pass | `enterprise-pack/templates/V6_16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 10 | blocker | none |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv

### First Capital Financial

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 1 | 1 | pass | `enterprise-pack/templates/V6_01_enterprise_profile.csv` |
| business_functions | 27 | 15 | pass | `enterprise-pack/templates/V6_02_business_functions.csv` |
| org_ownership | 65 | 10 | pass | `enterprise-pack/templates/V6_03_org_ownership.csv` |
| workforce_roles | 16 | 25 | blocker | `enterprise-pack/templates/V6_04_workforce_personas.csv` |
| applications_systems | 272 | 75 | pass | `enterprise-pack/templates/V6_05_applications_systems.csv` |
| data_assets_integrations | 460 | 100 | pass | `enterprise-pack/templates/V6_06_data_assets_integrations.csv` |
| infrastructure_platforms | 0 | 20 | blocker | none |
| vendors_contracts | 120 | 25 | pass | `enterprise-pack/templates/V6_07_vendors_contracts.csv` |
| spend_value | 397 | 10 | pass | `enterprise-pack/templates/V6_08_spend_value.csv` |
| programs_initiatives | 299 | 20 | pass | `enterprise-pack/templates/V6_09_programs_initiatives.csv` |
| ai_automation_use_cases | 282 | 10 | pass | `enterprise-pack/templates/V6_10_ai_initiatives.csv` |
| risks_controls | 547 | 40 | pass | `enterprise-pack/templates/V6_11_operations_risk_controls.csv` |
| relationships | 2,614 | 100 | pass | `enterprise-pack/templates/V6_12_relationships.csv` |
| metrics_outcomes | 168 | 25 | pass | `enterprise-pack/templates/V6_14_metric_definitions.csv` |
| evidence_sources | 42 | 20 | pass | `enterprise-pack/templates/V6_13_evidence_sources.csv` |
| industry_context_patterns | 294 | 10 | pass | `enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` |
| expert_lenses | 5 | 5 | pass | `enterprise-pack/templates/V6_16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 10 | blocker | none |
| operational_process_evidence | 0 | 10 | blocker | none |

Warnings:

- Unmapped source file: enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv

### Lakeshore Holdings

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 9 | 1 | pass | `enterprise-pack/holdco_tower/H01_entity_hierarchy.csv`<br>`enterprise-pack/templates/V6_01_enterprise_profile.csv` |
| business_functions | 14 | 8 | pass | `enterprise-pack/templates/V6_02_business_functions.csv` |
| org_ownership | 8 | 5 | pass | `enterprise-pack/templates/V6_03_org_ownership.csv` |
| workforce_roles | 10 | 10 | pass | `enterprise-pack/templates/V6_04_workforce_personas.csv` |
| applications_systems | 24 | 25 | blocker | `enterprise-pack/templates/V6_05_applications_systems.csv` |
| data_assets_integrations | 34 | 40 | blocker | `enterprise-pack/templates/V6_06_data_assets_integrations.csv` |
| infrastructure_platforms | 0 | 8 | blocker | none |
| vendors_contracts | 19 | 12 | pass | `enterprise-pack/templates/V6_07_vendors_contracts.csv` |
| spend_value | 93 | 5 | pass | `enterprise-pack/holdco_tower/H02_dashboard_metric_map.csv`<br>`enterprise-pack/templates/V6_08_spend_value.csv` |
| programs_initiatives | 15 | 10 | pass | `enterprise-pack/templates/V6_09_programs_initiatives.csv` |
| ai_automation_use_cases | 8 | 5 | pass | `enterprise-pack/templates/V6_10_ai_initiatives.csv` |
| risks_controls | 10 | 20 | blocker | `enterprise-pack/templates/V6_11_operations_risk_controls.csv` |
| relationships | 199 | 40 | pass | `enterprise-pack/templates/V6_12_relationships.csv` |
| metrics_outcomes | 12 | 12 | pass | `enterprise-pack/templates/V6_14_metric_definitions.csv` |
| evidence_sources | 10 | 10 | pass | `enterprise-pack/templates/V6_13_evidence_sources.csv` |
| industry_context_patterns | 4 | 5 | blocker | `enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` |
| expert_lenses | 4 | 3 | pass | `enterprise-pack/templates/V6_16_expert_lenses.csv` |
| service_scope_managed_services | 0 | 5 | blocker | none |
| operational_process_evidence | 0 | 5 | blocker | none |

Warnings:

- Unmapped source file: enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv

### Lakeshore Industries

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 16 | 1 | pass | `holdco-pack/V7_00_portfolio_entity_registry.csv`<br>`holdco-pack/V7_01_enterprise_profile.csv`<br>`holdco-pack/client_templates/V7_00_portfolio_entity_registry.csv`<br>`holdco-pack/client_templates/V7_01_enterprise_profile.csv` |
| business_functions | 96 | 15 | pass | `holdco-pack/V7_02_business_functions.csv`<br>`holdco-pack/client_templates/V7_02_business_functions.csv` |
| org_ownership | 116 | 10 | pass | `holdco-pack/V7_03_org_ownership.csv`<br>`holdco-pack/client_templates/V7_03_org_ownership.csv` |
| workforce_roles | 82 | 25 | pass | `holdco-pack/V7_04_workforce_personas.csv`<br>`holdco-pack/client_templates/V7_04_workforce_personas.csv` |
| applications_systems | 152 | 75 | pass | `holdco-pack/V7_05_applications_systems.csv`<br>`holdco-pack/client_templates/V7_05_applications_systems.csv` |
| data_assets_integrations | 82 | 100 | blocker | `holdco-pack/V7_06_data_assets_integrations.csv`<br>`holdco-pack/client_templates/V7_06_data_assets_integrations.csv` |
| infrastructure_platforms | 128 | 20 | pass | `holdco-pack/V7_24_infrastructure_cloud_estate.csv`<br>`holdco-pack/client_templates/V7_24_infrastructure_cloud_estate.csv` |
| vendors_contracts | 96 | 25 | pass | `holdco-pack/V7_07_vendors_contracts.csv`<br>`holdco-pack/client_templates/V7_07_vendors_contracts.csv` |
| spend_value | 111 | 10 | pass | `holdco-pack/V7_08_spend_value.csv`<br>`holdco-pack/V7_17_client_rate_card_cost_basis.csv`<br>`holdco-pack/client_templates/V7_08_spend_value.csv`<br>`holdco-pack/client_templates/V7_17_client_rate_card_cost_basis.csv` |
| programs_initiatives | 36 | 20 | pass | `holdco-pack/V7_09_programs_initiatives_business_priorities.csv`<br>`holdco-pack/client_templates/V7_09_programs_initiatives_business_priorities.csv` |
| ai_automation_use_cases | 36 | 10 | pass | `holdco-pack/V7_10_ai_initiatives.csv`<br>`holdco-pack/client_templates/V7_10_ai_initiatives.csv` |
| risks_controls | 48 | 40 | pass | `holdco-pack/V7_11_operations_risk_controls.csv`<br>`holdco-pack/client_templates/V7_11_operations_risk_controls.csv` |
| relationships | 1,045 | 100 | pass | `holdco-pack/V7_12_relationships_graph_edges.csv`<br>`holdco-pack/V7_18_function_system_data_vendor_bridge.csv`<br>`holdco-pack/V7_21_graph_registry_relationship_dictionary.csv`<br>`holdco-pack/client_templates/V7_12_relationships_graph_edges.csv`<br>`holdco-pack/client_templates/V7_18_function_system_data_vendor_bridge.csv`<br>`holdco-pack/client_templates/V7_21_graph_registry_relationship_dictionary.csv` |
| metrics_outcomes | 384 | 25 | pass | `holdco-pack/V7_14_metric_definitions.csv`<br>`holdco-pack/client_templates/V7_14_metric_definitions.csv` |
| evidence_sources | 424 | 20 | pass | `holdco-pack/V7_13_source_evidence_registry.csv`<br>`holdco-pack/V7_20_chunk_retrieval_registry.csv`<br>`holdco-pack/client_templates/V7_13_source_evidence_registry.csv`<br>`holdco-pack/client_templates/V7_20_chunk_retrieval_registry.csv` |
| industry_context_patterns | 48 | 10 | pass | `holdco-pack/V7_15_industry_market_knowledge_patterns.csv`<br>`holdco-pack/V7_23_external_benchmark_market_corpus.csv`<br>`holdco-pack/client_templates/V7_15_industry_market_knowledge_patterns.csv`<br>`holdco-pack/client_templates/V7_23_external_benchmark_market_corpus.csv` |
| expert_lenses | 18 | 5 | pass | `holdco-pack/V7_16_expert_lenses.csv`<br>`holdco-pack/client_templates/V7_16_expert_lenses.csv` |
| service_scope_managed_services | 64 | 10 | pass | `holdco-pack/V7_19_service_tower_managed_services_scope.csv`<br>`holdco-pack/client_templates/V7_19_service_tower_managed_services_scope.csv` |
| operational_process_evidence | 112 | 10 | pass | `holdco-pack/V7_22_operational_evidence_process_intelligence.csv`<br>`holdco-pack/client_templates/V7_22_operational_evidence_process_intelligence.csv` |

Warnings:

- Unmapped source file: holdco-pack/00_master/V7_DIMENSION_REGISTRY.csv
- Unmapped source file: holdco-pack/field_catalog/V7_FIELD_CATALOG.csv

### Meridian Health

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 4 | 1 | pass | `current-state-pack/templates/V6_01_enterprise_profile.csv`<br>`current-state-pack/v7/V7_00_portfolio_entity_registry.csv`<br>`current-state-pack/v7/V7_01_enterprise_profile.csv`<br>`rich-enterprise-pack/templates/V6_01_enterprise_profile.csv` |
| business_functions | 39 | 15 | pass | `current-state-pack/templates/V6_02_business_functions.csv`<br>`current-state-pack/v7/V7_02_business_functions.csv`<br>`rich-enterprise-pack/templates/V6_02_business_functions.csv` |
| org_ownership | 87 | 10 | pass | `current-state-pack/templates/V6_03_org_ownership.csv`<br>`current-state-pack/v7/V7_03_org_ownership.csv`<br>`rich-enterprise-pack/templates/V6_03_org_ownership.csv` |
| workforce_roles | 26 | 25 | pass | `current-state-pack/templates/V6_04_workforce_personas.csv`<br>`current-state-pack/v7/V7_04_workforce_personas.csv`<br>`rich-enterprise-pack/templates/V6_04_workforce_personas.csv` |
| applications_systems | 192 | 75 | pass | `current-state-pack/templates/V6_05_applications_systems.csv`<br>`current-state-pack/v7/V7_05_applications_systems.csv`<br>`rich-enterprise-pack/templates/V6_05_applications_systems.csv` |
| data_assets_integrations | 432 | 100 | pass | `current-state-pack/templates/V6_06_data_assets_integrations.csv`<br>`current-state-pack/v7/V7_06_data_assets_integrations.csv`<br>`rich-enterprise-pack/templates/V6_06_data_assets_integrations.csv` |
| infrastructure_platforms | 4 | 20 | blocker | `current-state-pack/v7/V7_24_infrastructure_cloud_estate.csv` |
| vendors_contracts | 109 | 25 | pass | `current-state-pack/templates/V6_07_vendors_contracts.csv`<br>`current-state-pack/v7/V7_07_vendors_contracts.csv`<br>`rich-enterprise-pack/templates/V6_07_vendors_contracts.csv` |
| spend_value | 202 | 10 | pass | `current-state-pack/templates/V6_08_spend_value.csv`<br>`current-state-pack/v7/V7_08_spend_value.csv`<br>`current-state-pack/v7/V7_17_client_rate_card_cost_basis.csv`<br>`rich-enterprise-pack/templates/V6_08_spend_value.csv` |
| programs_initiatives | 170 | 20 | pass | `current-state-pack/templates/V6_09_programs_initiatives.csv`<br>`current-state-pack/v7/V7_09_programs_initiatives_business_priorities.csv`<br>`rich-enterprise-pack/templates/V6_09_programs_initiatives.csv` |
| ai_automation_use_cases | 156 | 10 | pass | `current-state-pack/templates/V6_10_ai_initiatives.csv`<br>`current-state-pack/v7/V7_10_ai_initiatives.csv`<br>`rich-enterprise-pack/templates/V6_10_ai_initiatives.csv` |
| risks_controls | 405 | 40 | pass | `current-state-pack/templates/V6_11_operations_risk_controls.csv`<br>`current-state-pack/v7/V7_11_operations_risk_controls.csv`<br>`rich-enterprise-pack/templates/V6_11_operations_risk_controls.csv` |
| relationships | 1,766 | 100 | pass | `current-state-pack/templates/V6_12_relationships.csv`<br>`current-state-pack/v7/V7_12_relationships_graph_edges.csv`<br>`current-state-pack/v7/V7_18_function_system_data_vendor_bridge.csv`<br>`current-state-pack/v7/V7_21_graph_registry_relationship_dictionary.csv`<br>`rich-enterprise-pack/templates/V6_12_relationships.csv` |
| metrics_outcomes | 138 | 25 | pass | `current-state-pack/templates/V6_14_metric_definitions.csv`<br>`current-state-pack/v7/V7_14_metric_definitions.csv`<br>`rich-enterprise-pack/templates/V6_14_metric_definitions.csv` |
| evidence_sources | 140 | 20 | pass | `current-state-pack/templates/V6_13_evidence_sources.csv`<br>`current-state-pack/v7/V7_13_source_evidence_registry.csv`<br>`current-state-pack/v7/V7_20_chunk_retrieval_registry.csv`<br>`rich-enterprise-pack/templates/V6_13_evidence_sources.csv` |
| industry_context_patterns | 206 | 10 | pass | `current-state-pack/templates/V6_15_industry_corpus_patterns.csv`<br>`current-state-pack/v7/V7_15_industry_market_knowledge_patterns.csv`<br>`current-state-pack/v7/V7_23_external_benchmark_market_corpus.csv`<br>`rich-enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` |
| expert_lenses | 15 | 5 | pass | `current-state-pack/templates/V6_16_expert_lenses.csv`<br>`current-state-pack/v7/V7_16_expert_lenses.csv`<br>`rich-enterprise-pack/templates/V6_16_expert_lenses.csv` |
| service_scope_managed_services | 3 | 10 | blocker | `current-state-pack/v7/V7_19_service_tower_managed_services_scope.csv` |
| operational_process_evidence | 10 | 10 | pass | `current-state-pack/v7/V7_22_operational_evidence_process_intelligence.csv` |

Warnings:

- Unmapped source file: current-state-pack/derived/meridian_moves_current_state_findings.csv
- Unmapped source file: current-state-pack/derived/meridian_moves_golden_questions_scorecard.csv
- Unmapped source file: rich-enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv
- Potential current/target blend: current-state-pack/templates/V6_05_applications_systems.csv
- Potential current/target blend: current-state-pack/templates/V6_06_data_assets_integrations.csv
- Potential current/target blend: current-state-pack/v7/V7_05_applications_systems.csv
- Potential current/target blend: current-state-pack/v7/V7_06_data_assets_integrations.csv
- Potential current/target blend: current-state-pack/v7/V7_24_infrastructure_cloud_estate.csv

### SkyHarbor Air

| Domain | Rows | Minimum | Status | Source files |
| --- | ---: | ---: | --- | --- |
| enterprise_profile | 4 | 1 | pass | `upgrade-candidate-pack/templates/V6_01_enterprise_profile.csv`<br>`upgrade-candidate-pack/v7/V7_00_portfolio_entity_registry.csv`<br>`upgrade-candidate-pack/v7/V7_01_enterprise_profile.csv`<br>`rich-substrate-pack/csv/enterprise-profile.csv` |
| business_functions | 92 | 15 | pass | `upgrade-candidate-pack/templates/V6_02_business_functions.csv`<br>`upgrade-candidate-pack/v7/V7_02_business_functions.csv`<br>`rich-substrate-pack/csv/business-capabilities.csv` |
| org_ownership | 284 | 10 | pass | `upgrade-candidate-pack/templates/V6_03_org_ownership.csv`<br>`upgrade-candidate-pack/v7/V7_03_org_ownership.csv`<br>`rich-substrate-pack/csv/org-roles.csv` |
| workforce_roles | 12 | 25 | blocker | `upgrade-candidate-pack/templates/V6_04_workforce_personas.csv`<br>`upgrade-candidate-pack/v7/V7_04_workforce_personas.csv` |
| applications_systems | 626 | 75 | pass | `upgrade-candidate-pack/templates/V6_05_applications_systems.csv`<br>`upgrade-candidate-pack/v7/V7_05_applications_systems.csv`<br>`rich-substrate-pack/csv/application-portfolio.csv` |
| data_assets_integrations | 570 | 100 | pass | `upgrade-candidate-pack/templates/V6_06_data_assets_integrations.csv`<br>`upgrade-candidate-pack/v7/V7_06_data_assets_integrations.csv`<br>`rich-substrate-pack/csv/integration-topology.csv` |
| infrastructure_platforms | 691 | 20 | pass | `upgrade-candidate-pack/v7/V7_24_infrastructure_cloud_estate.csv`<br>`rich-substrate-pack/csv/infrastructure-estate.csv` |
| vendors_contracts | 140 | 25 | pass | `upgrade-candidate-pack/templates/V6_07_vendors_contracts.csv`<br>`upgrade-candidate-pack/v7/V7_07_vendors_contracts.csv`<br>`rich-substrate-pack/csv/vendor-contracts.csv` |
| spend_value | 192 | 10 | pass | `upgrade-candidate-pack/templates/V6_08_spend_value.csv`<br>`upgrade-candidate-pack/v7/V7_08_spend_value.csv`<br>`upgrade-candidate-pack/v7/V7_17_client_rate_card_cost_basis.csv`<br>`rich-substrate-pack/csv/it-financials.csv` |
| programs_initiatives | 74 | 20 | pass | `upgrade-candidate-pack/templates/V6_09_programs_initiatives.csv`<br>`upgrade-candidate-pack/v7/V7_09_programs_initiatives_business_priorities.csv`<br>`rich-substrate-pack/csv/initiatives.csv` |
| ai_automation_use_cases | 46 | 10 | pass | `upgrade-candidate-pack/templates/V6_10_ai_initiatives.csv`<br>`upgrade-candidate-pack/v7/V7_10_ai_initiatives.csv`<br>`rich-substrate-pack/csv/ai-tooling.csv` |
| risks_controls | 56 | 40 | pass | `upgrade-candidate-pack/templates/V6_11_operations_risk_controls.csv`<br>`upgrade-candidate-pack/v7/V7_11_operations_risk_controls.csv` |
| relationships | 225 | 100 | pass | `upgrade-candidate-pack/templates/V6_12_relationships.csv`<br>`upgrade-candidate-pack/v7/V7_12_relationships_graph_edges.csv`<br>`upgrade-candidate-pack/v7/V7_18_function_system_data_vendor_bridge.csv`<br>`upgrade-candidate-pack/v7/V7_21_graph_registry_relationship_dictionary.csv` |
| metrics_outcomes | 136 | 25 | pass | `upgrade-candidate-pack/templates/V6_14_metric_definitions.csv`<br>`upgrade-candidate-pack/v7/V7_14_metric_definitions.csv`<br>`rich-substrate-pack/csv/dora-baseline.csv`<br>`rich-substrate-pack/csv/sla-register.csv` |
| evidence_sources | 125 | 20 | pass | `upgrade-candidate-pack/templates/V6_13_evidence_sources.csv`<br>`upgrade-candidate-pack/v7/V7_13_source_evidence_registry.csv`<br>`upgrade-candidate-pack/v7/V7_20_chunk_retrieval_registry.csv` |
| industry_context_patterns | 16 | 10 | pass | `upgrade-candidate-pack/templates/V6_15_industry_corpus_patterns.csv`<br>`upgrade-candidate-pack/v7/V7_15_industry_market_knowledge_patterns.csv`<br>`upgrade-candidate-pack/v7/V7_23_external_benchmark_market_corpus.csv` |
| expert_lenses | 10 | 5 | pass | `upgrade-candidate-pack/templates/V6_16_expert_lenses.csv`<br>`upgrade-candidate-pack/v7/V7_16_expert_lenses.csv` |
| service_scope_managed_services | 3 | 10 | blocker | `upgrade-candidate-pack/v7/V7_19_service_tower_managed_services_scope.csv` |
| operational_process_evidence | 410 | 10 | pass | `upgrade-candidate-pack/v7/V7_22_operational_evidence_process_intelligence.csv`<br>`rich-substrate-pack/csv/incidents.csv` |

Warnings:

- Unmapped source file: upgrade-candidate-pack/derived/skyharbor_air_moves_current_state_findings.csv
- Unmapped source file: upgrade-candidate-pack/derived/skyharbor_air_moves_golden_questions_scorecard.csv
- Unmapped source file: rich-substrate-pack/csv/erp-landscape.csv

## Retired / Excluded

- northstar-clinical: retired-excluded
