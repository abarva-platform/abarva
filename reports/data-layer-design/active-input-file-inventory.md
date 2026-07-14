# Active Tenant Input File Inventory

Generated: `2026-07-14T11:31:46.204Z`

## Standard

- Universal template standard: `universal-tenant-input-standard-2026-07`
- Universal template location: `datasets/tenant-inputs/templates/universal/standard-2026-07`
- Active tenant input location: `datasets/tenant-inputs/active`
- Process: `build:canonical-tenant-data` -> `build:candidate-version` -> `audit:active-module-context-promotion` -> module context serving
- Legacy labels in current filenames are compatibility identifiers, not architecture names.

## Azure Landing Convention

- Container: `tenant-inputs`
- Raw: `tenant-inputs/{tenant_key}/{intake_id}/raw/`
- Validated: `tenant-inputs/{tenant_key}/{intake_id}/validated/`
- Archive: `tenant-inputs/archive/{tenant_key}/{intake_id}/`
- Filename: `{tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv`

## Universal Template Files

| Template | Required | Columns |
| --- | --- | ---: |
| `00_enterprise_profile.csv` | yes | 20 |
| `01_business_functions.csv` | yes | 15 |
| `02_org_ownership.csv` | yes | 14 |
| `03_workforce_roles.csv` | yes | 14 |
| `04_applications_systems.csv` | yes | 20 |
| `05_data_assets_integrations.csv` | yes | 18 |
| `06_infrastructure_platforms.csv` | yes | 16 |
| `07_vendors_contracts.csv` | yes | 18 |
| `08_spend_value.csv` | yes | 13 |
| `09_programs_initiatives.csv` | yes | 17 |
| `10_ai_automation_use_cases.csv` | yes | 15 |
| `11_risks_controls.csv` | yes | 15 |
| `12_relationships.csv` | yes | 13 |
| `13_evidence_sources.csv` | yes | 12 |
| `14_metrics_outcomes.csv` | yes | 15 |
| `15_industry_context_patterns.csv` | yes | 11 |
| `16_expert_lenses.csv` | yes | 11 |
| `17_service_scope_managed_services.csv` | yes | 15 |
| `18_operational_process_evidence.csv` | yes | 14 |

## Tenant Summary

| Tenant | Packets | Active input files | Source rows | Domains |
| --- | ---: | ---: | ---: | ---: |
| Apex Retail (`apex-retail`) | 1 | 17 | 4,112 | 17 |
| First Capital Financial (`first-capital-financial`) | 1 | 17 | 6,132 | 17 |
| Lakeshore Holdings (`lakeshore-holdings`) | 1 | 19 | 996 | 17 |
| Lakeshore Industries (`lakeshore-industries`) | 1 | 52 | 3,809 | 20 |
| Meridian Health (`meridian-health`) | 2 | 60 | 4,697 | 20 |
| SkyHarbor Air (`skyharbor-air`) | 2 | 57 | 3,842 | 20 |

## Actual Files Used By The Canonical Build

### Apex Retail (`apex-retail`)

| Packet | Domain | Rows | Classification | File | Fingerprint |
| --- | --- | ---: | --- | --- | --- |
| `enterprise-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_01_enterprise_profile.csv` | `8a33ae434be9...` |
| `enterprise-pack` | `business_functions` | 26 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_02_business_functions.csv` | `f8c89364b6f3...` |
| `enterprise-pack` | `org_ownership` | 50 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_03_org_ownership.csv` | `562ca7ebc899...` |
| `enterprise-pack` | `workforce_roles` | 12 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_04_workforce_personas.csv` | `682bfa857139...` |
| `enterprise-pack` | `applications_systems` | 182 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_05_applications_systems.csv` | `1edeeb15cfd4...` |
| `enterprise-pack` | `data_assets_integrations` | 385 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_06_data_assets_integrations.csv` | `ca8d622d7262...` |
| `enterprise-pack` | `vendors_contracts` | 100 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_07_vendors_contracts.csv` | `51fad19798ac...` |
| `enterprise-pack` | `spend_value` | 188 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_08_spend_value.csv` | `8af849e9a2c3...` |
| `enterprise-pack` | `programs_initiatives` | 159 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_09_programs_initiatives.csv` | `9220c43f1c6e...` |
| `enterprise-pack` | `ai_automation_use_cases` | 155 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_10_ai_initiatives.csv` | `99791230f092...` |
| `enterprise-pack` | `risks_controls` | 375 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_11_operations_risk_controls.csv` | `5d7d3dd9bd86...` |
| `enterprise-pack` | `relationships` | 1605 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_12_relationships.csv` | `52b62fc35c73...` |
| `enterprise-pack` | `evidence_sources` | 14 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_13_evidence_sources.csv` | `33032040abf3...` |
| `enterprise-pack` | `metrics_outcomes` | 126 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_14_metric_definitions.csv` | `3e7d4f1fd8ed...` |
| `enterprise-pack` | `industry_context_patterns` | 206 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` | `be8b4901ed69...` |
| `enterprise-pack` | `expert_lenses` | 5 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/templates/V6_16_expert_lenses.csv` | `dd75614abf67...` |
| `enterprise-pack` | `unmapped_or_supporting_file` | 523 | `synthetic-demo` | `datasets/tenant-inputs/active/apex-retail/current/enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv` | `a588c40a9411...` |

### First Capital Financial (`first-capital-financial`)

| Packet | Domain | Rows | Classification | File | Fingerprint |
| --- | --- | ---: | --- | --- | --- |
| `enterprise-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_01_enterprise_profile.csv` | `1942267d3eba...` |
| `enterprise-pack` | `business_functions` | 27 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_02_business_functions.csv` | `d782b7ccbec2...` |
| `enterprise-pack` | `org_ownership` | 65 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_03_org_ownership.csv` | `f4ac1cc4df52...` |
| `enterprise-pack` | `workforce_roles` | 16 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_04_workforce_personas.csv` | `70bddc83e1c7...` |
| `enterprise-pack` | `applications_systems` | 272 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_05_applications_systems.csv` | `7d3c5828621b...` |
| `enterprise-pack` | `data_assets_integrations` | 460 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_06_data_assets_integrations.csv` | `060084472d4a...` |
| `enterprise-pack` | `vendors_contracts` | 120 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_07_vendors_contracts.csv` | `34b88022bff9...` |
| `enterprise-pack` | `spend_value` | 397 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_08_spend_value.csv` | `0985550808d4...` |
| `enterprise-pack` | `programs_initiatives` | 299 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_09_programs_initiatives.csv` | `bd95655b7458...` |
| `enterprise-pack` | `ai_automation_use_cases` | 282 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_10_ai_initiatives.csv` | `8eed86f91e29...` |
| `enterprise-pack` | `risks_controls` | 547 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_11_operations_risk_controls.csv` | `d93c241f3c46...` |
| `enterprise-pack` | `relationships` | 2614 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_12_relationships.csv` | `92bf114acba1...` |
| `enterprise-pack` | `evidence_sources` | 42 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_13_evidence_sources.csv` | `40910908d73f...` |
| `enterprise-pack` | `metrics_outcomes` | 168 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_14_metric_definitions.csv` | `db5adc9cae9e...` |
| `enterprise-pack` | `industry_context_patterns` | 294 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` | `e6d35ea8562f...` |
| `enterprise-pack` | `expert_lenses` | 5 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/templates/V6_16_expert_lenses.csv` | `e811ff02d486...` |
| `enterprise-pack` | `unmapped_or_supporting_file` | 523 | `synthetic-demo` | `datasets/tenant-inputs/active/first-capital-financial/current/enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv` | `4a1373b51bea...` |

### Lakeshore Holdings (`lakeshore-holdings`)

| Packet | Domain | Rows | Classification | File | Fingerprint |
| --- | --- | ---: | --- | --- | --- |
| `enterprise-pack` | `unmapped_or_supporting_file` | 8 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/holdco_tower/H01_entity_hierarchy.csv` | `21724fdc2ac2...` |
| `enterprise-pack` | `unmapped_or_supporting_file` | 8 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/holdco_tower/H02_dashboard_metric_map.csv` | `0dd773441c4e...` |
| `enterprise-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_01_enterprise_profile.csv` | `c6491c7d8c89...` |
| `enterprise-pack` | `business_functions` | 14 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_02_business_functions.csv` | `4438bf763100...` |
| `enterprise-pack` | `org_ownership` | 8 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_03_org_ownership.csv` | `e1e20aa3d378...` |
| `enterprise-pack` | `workforce_roles` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_04_workforce_personas.csv` | `0b07eae3d085...` |
| `enterprise-pack` | `applications_systems` | 24 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_05_applications_systems.csv` | `003fc9febecc...` |
| `enterprise-pack` | `data_assets_integrations` | 34 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_06_data_assets_integrations.csv` | `6c56c71604be...` |
| `enterprise-pack` | `vendors_contracts` | 19 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_07_vendors_contracts.csv` | `4275f23f49db...` |
| `enterprise-pack` | `spend_value` | 85 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_08_spend_value.csv` | `2d3d5620688d...` |
| `enterprise-pack` | `programs_initiatives` | 15 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_09_programs_initiatives.csv` | `dd48bbdf588f...` |
| `enterprise-pack` | `ai_automation_use_cases` | 8 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_10_ai_initiatives.csv` | `44920be4459b...` |
| `enterprise-pack` | `risks_controls` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_11_operations_risk_controls.csv` | `5cd443d3cf56...` |
| `enterprise-pack` | `relationships` | 199 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_12_relationships.csv` | `3da908a0a608...` |
| `enterprise-pack` | `evidence_sources` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_13_evidence_sources.csv` | `d4de6b28d55b...` |
| `enterprise-pack` | `metrics_outcomes` | 12 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_14_metric_definitions.csv` | `3a54d2241639...` |
| `enterprise-pack` | `industry_context_patterns` | 4 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` | `010ff868d61e...` |
| `enterprise-pack` | `expert_lenses` | 4 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/templates/V6_16_expert_lenses.csv` | `0920350d6d12...` |
| `enterprise-pack` | `unmapped_or_supporting_file` | 523 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-holdings/current/enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv` | `9cf2aad301eb...` |

### Lakeshore Industries (`lakeshore-industries`)

| Packet | Domain | Rows | Classification | File | Fingerprint |
| --- | --- | ---: | --- | --- | --- |
| `holdco-pack` | `unmapped_or_supporting_file` | 25 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/00_master/V7_DIMENSION_REGISTRY.csv` | `65314dc45aaa...` |
| `holdco-pack` | `enterprise_profile` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_00_portfolio_entity_registry.csv` | `21e172415eac...` |
| `holdco-pack` | `enterprise_profile` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_01_enterprise_profile.csv` | `96455e2320de...` |
| `holdco-pack` | `business_functions` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_02_business_functions.csv` | `83cfe1587c2f...` |
| `holdco-pack` | `org_ownership` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_03_org_ownership.csv` | `8b2cf99bf18d...` |
| `holdco-pack` | `workforce_roles` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_04_workforce_personas.csv` | `8b47df813795...` |
| `holdco-pack` | `applications_systems` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_05_applications_systems.csv` | `64690b48c613...` |
| `holdco-pack` | `data_assets_integrations` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_06_data_assets_integrations.csv` | `2fb9702eeafa...` |
| `holdco-pack` | `vendors_contracts` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_07_vendors_contracts.csv` | `c8a4cc9d87a8...` |
| `holdco-pack` | `spend_value` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_08_spend_value.csv` | `a18a2a26999e...` |
| `holdco-pack` | `programs_initiatives` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_09_programs_initiatives_business_priorities.csv` | `59f9df91a812...` |
| `holdco-pack` | `ai_automation_use_cases` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_10_ai_initiatives.csv` | `46550578361c...` |
| `holdco-pack` | `risks_controls` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_11_operations_risk_controls.csv` | `d6346eead0ec...` |
| `holdco-pack` | `relationships` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_12_relationships_graph_edges.csv` | `1bf6602dd9ba...` |
| `holdco-pack` | `evidence_sources` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_13_source_evidence_registry.csv` | `768f3aeb06e1...` |
| `holdco-pack` | `metrics_outcomes` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_14_metric_definitions.csv` | `5510401c6406...` |
| `holdco-pack` | `unmapped_or_supporting_file` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_15_industry_market_knowledge_patterns.csv` | `79f8628ccf54...` |
| `holdco-pack` | `expert_lenses` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_16_expert_lenses.csv` | `c0921d96eaf3...` |
| `holdco-pack` | `spend_value` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_17_client_rate_card_cost_basis.csv` | `bc57e51d5278...` |
| `holdco-pack` | `relationships` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_18_function_system_data_vendor_bridge.csv` | `13eae29bbaff...` |
| `holdco-pack` | `service_scope_managed_services` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_19_service_tower_managed_services_scope.csv` | `1e23a3a2e879...` |
| `holdco-pack` | `evidence_sources` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_20_chunk_retrieval_registry.csv` | `ef961a148ce1...` |
| `holdco-pack` | `relationships` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_21_graph_registry_relationship_dictionary.csv` | `6dba6fc1d5e0...` |
| `holdco-pack` | `operational_process_evidence` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_22_operational_evidence_process_intelligence.csv` | `2e34167621fb...` |
| `holdco-pack` | `industry_context_patterns` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_23_external_benchmark_market_corpus.csv` | `30f5edc4580a...` |
| `holdco-pack` | `infrastructure_platforms` | 0 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/client_templates/V7_24_infrastructure_cloud_estate.csv` | `f0e7e592f029...` |
| `holdco-pack` | `unmapped_or_supporting_file` | 690 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/field_catalog/V7_FIELD_CATALOG.csv` | `e4eab2134a72...` |
| `holdco-pack` | `enterprise_profile` | 8 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_00_portfolio_entity_registry.csv` | `d1ad36e665f7...` |
| `holdco-pack` | `enterprise_profile` | 8 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_01_enterprise_profile.csv` | `c1da875f5368...` |
| `holdco-pack` | `business_functions` | 96 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_02_business_functions.csv` | `34258dc97330...` |
| `holdco-pack` | `org_ownership` | 116 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_03_org_ownership.csv` | `be159f935a2c...` |
| `holdco-pack` | `workforce_roles` | 82 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_04_workforce_personas.csv` | `f6e6013524c0...` |
| `holdco-pack` | `applications_systems` | 152 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_05_applications_systems.csv` | `96e1339cfd25...` |
| `holdco-pack` | `data_assets_integrations` | 82 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_06_data_assets_integrations.csv` | `ab9711619af8...` |
| `holdco-pack` | `vendors_contracts` | 96 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_07_vendors_contracts.csv` | `29d19726a411...` |
| `holdco-pack` | `spend_value` | 57 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_08_spend_value.csv` | `c7a677ea2bea...` |
| `holdco-pack` | `programs_initiatives` | 36 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_09_programs_initiatives_business_priorities.csv` | `48420c7a4569...` |
| `holdco-pack` | `ai_automation_use_cases` | 36 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_10_ai_initiatives.csv` | `298426a31378...` |
| `holdco-pack` | `risks_controls` | 48 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_11_operations_risk_controls.csv` | `137a5070d61a...` |
| `holdco-pack` | `relationships` | 529 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_12_relationships_graph_edges.csv` | `c138b460d42b...` |
| `holdco-pack` | `evidence_sources` | 48 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_13_source_evidence_registry.csv` | `b0e1a1eca303...` |
| `holdco-pack` | `metrics_outcomes` | 384 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_14_metric_definitions.csv` | `ce22adb1a6b7...` |
| `holdco-pack` | `unmapped_or_supporting_file` | 24 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_15_industry_market_knowledge_patterns.csv` | `41c46ccda88a...` |
| `holdco-pack` | `expert_lenses` | 18 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_16_expert_lenses.csv` | `bcb6bf1e235e...` |
| `holdco-pack` | `spend_value` | 54 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_17_client_rate_card_cost_basis.csv` | `6224a850b83b...` |
| `holdco-pack` | `relationships` | 510 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_18_function_system_data_vendor_bridge.csv` | `e4fead3a271c...` |
| `holdco-pack` | `service_scope_managed_services` | 64 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_19_service_tower_managed_services_scope.csv` | `e4c37da23b2d...` |
| `holdco-pack` | `evidence_sources` | 376 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_20_chunk_retrieval_registry.csv` | `9282e06e76cb...` |
| `holdco-pack` | `relationships` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_21_graph_registry_relationship_dictionary.csv` | `4ec1f67975c7...` |
| `holdco-pack` | `operational_process_evidence` | 112 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_22_operational_evidence_process_intelligence.csv` | `f2f9f38e92f5...` |
| `holdco-pack` | `industry_context_patterns` | 24 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_23_external_benchmark_market_corpus.csv` | `41c88fa582f8...` |
| `holdco-pack` | `infrastructure_platforms` | 128 | `synthetic-demo` | `datasets/tenant-inputs/active/lakeshore-industries/current/holdco-pack/V7_24_infrastructure_cloud_estate.csv` | `dcc24c0f78aa...` |

### Meridian Health (`meridian-health`)

| Packet | Domain | Rows | Classification | File | Fingerprint |
| --- | --- | ---: | --- | --- | --- |
| `current-state-pack` | `unmapped_or_supporting_file` | 28 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/derived/meridian_moves_current_state_findings.csv` | `265bff70ed7c...` |
| `current-state-pack` | `unmapped_or_supporting_file` | 42 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/derived/meridian_moves_golden_questions_scorecard.csv` | `f6c2dfe408ae...` |
| `current-state-pack` | `enterprise_profile` | 1 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_01_enterprise_profile.csv` | `19f06f015cdb...` |
| `current-state-pack` | `business_functions` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_02_business_functions.csv` | `a5c85bd866fd...` |
| `current-state-pack` | `org_ownership` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_03_org_ownership.csv` | `4c29c6fcd8d3...` |
| `current-state-pack` | `workforce_roles` | 6 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_04_workforce_personas.csv` | `6420b716ff42...` |
| `current-state-pack` | `applications_systems` | 15 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_05_applications_systems.csv` | `719b24e95a59...` |
| `current-state-pack` | `data_assets_integrations` | 36 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_06_data_assets_integrations.csv` | `ba6a3529bc55...` |
| `current-state-pack` | `vendors_contracts` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_07_vendors_contracts.csv` | `ee1febc65468...` |
| `current-state-pack` | `spend_value` | 10 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_08_spend_value.csv` | `cc0145701226...` |
| `current-state-pack` | `programs_initiatives` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_09_programs_initiatives.csv` | `b495ae85fe04...` |
| `current-state-pack` | `ai_automation_use_cases` | 3 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_10_ai_initiatives.csv` | `353663ee1aae...` |
| `current-state-pack` | `risks_controls` | 28 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_11_operations_risk_controls.csv` | `2501444ae288...` |
| `current-state-pack` | `relationships` | 69 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_12_relationships.csv` | `b1f6bd06dbd9...` |
| `current-state-pack` | `evidence_sources` | 4 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_13_evidence_sources.csv` | `01276f14ef67...` |
| `current-state-pack` | `metrics_outcomes` | 11 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_14_metric_definitions.csv` | `1134c1c518f3...` |
| `current-state-pack` | `industry_context_patterns` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_15_industry_corpus_patterns.csv` | `f52603fdc84c...` |
| `current-state-pack` | `expert_lenses` | 5 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/templates/V6_16_expert_lenses.csv` | `68825bba2c74...` |
| `current-state-pack` | `enterprise_profile` | 1 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_00_portfolio_entity_registry.csv` | `b6aa9f83946d...` |
| `current-state-pack` | `enterprise_profile` | 1 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_01_enterprise_profile.csv` | `0fb6c540de4f...` |
| `current-state-pack` | `business_functions` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_02_business_functions.csv` | `51a5dc143f1f...` |
| `current-state-pack` | `org_ownership` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_03_org_ownership.csv` | `965acccf4b27...` |
| `current-state-pack` | `workforce_roles` | 6 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_04_workforce_personas.csv` | `b4ca55a78664...` |
| `current-state-pack` | `applications_systems` | 15 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_05_applications_systems.csv` | `22f655e6dec8...` |
| `current-state-pack` | `data_assets_integrations` | 36 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_06_data_assets_integrations.csv` | `9cd3f7acfca9...` |
| `current-state-pack` | `vendors_contracts` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_07_vendors_contracts.csv` | `e640fce6ba55...` |
| `current-state-pack` | `spend_value` | 10 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_08_spend_value.csv` | `c34dff9f4969...` |
| `current-state-pack` | `programs_initiatives` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_09_programs_initiatives_business_priorities.csv` | `24a48efc6ed2...` |
| `current-state-pack` | `ai_automation_use_cases` | 3 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_10_ai_initiatives.csv` | `6cc77899dfe8...` |
| `current-state-pack` | `risks_controls` | 28 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_11_operations_risk_controls.csv` | `5109f796afbf...` |
| `current-state-pack` | `relationships` | 69 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_12_relationships_graph_edges.csv` | `5c7987b2ff23...` |
| `current-state-pack` | `evidence_sources` | 4 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_13_source_evidence_registry.csv` | `4b3e4adbe86a...` |
| `current-state-pack` | `metrics_outcomes` | 11 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_14_metric_definitions.csv` | `688967812f74...` |
| `current-state-pack` | `unmapped_or_supporting_file` | 7 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_15_industry_market_knowledge_patterns.csv` | `6852af099bcc...` |
| `current-state-pack` | `expert_lenses` | 5 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_16_expert_lenses.csv` | `65ab60052434...` |
| `current-state-pack` | `spend_value` | 4 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_17_client_rate_card_cost_basis.csv` | `5d8b0d464f7f...` |
| `current-state-pack` | `relationships` | 60 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_18_function_system_data_vendor_bridge.csv` | `e5ed57b42510...` |
| `current-state-pack` | `service_scope_managed_services` | 3 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_19_service_tower_managed_services_scope.csv` | `e2a0f96146c4...` |
| `current-state-pack` | `evidence_sources` | 118 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_20_chunk_retrieval_registry.csv` | `03aea312d89d...` |
| `current-state-pack` | `relationships` | 17 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_21_graph_registry_relationship_dictionary.csv` | `aeaba8c9f916...` |
| `current-state-pack` | `operational_process_evidence` | 10 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_22_operational_evidence_process_intelligence.csv` | `1728f1b2ba3e...` |
| `current-state-pack` | `industry_context_patterns` | 2 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_23_external_benchmark_market_corpus.csv` | `cad53d99a62d...` |
| `current-state-pack` | `infrastructure_platforms` | 4 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_24_infrastructure_cloud_estate.csv` | `e9e8aaed1244...` |
| `rich-enterprise-pack` | `enterprise_profile` | 1 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_01_enterprise_profile.csv` | `94f5b5bccc72...` |
| `rich-enterprise-pack` | `business_functions` | 25 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_02_business_functions.csv` | `7c333934be9f...` |
| `rich-enterprise-pack` | `org_ownership` | 73 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_03_org_ownership.csv` | `f9ec6fc159ac...` |
| `rich-enterprise-pack` | `workforce_roles` | 14 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_04_workforce_personas.csv` | `b67b14192630...` |
| `rich-enterprise-pack` | `applications_systems` | 162 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_05_applications_systems.csv` | `82a793628dcd...` |
| `rich-enterprise-pack` | `data_assets_integrations` | 360 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_06_data_assets_integrations.csv` | `1f72671f839f...` |
| `rich-enterprise-pack` | `vendors_contracts` | 95 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_07_vendors_contracts.csv` | `43613ca9eba8...` |
| `rich-enterprise-pack` | `spend_value` | 178 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_08_spend_value.csv` | `af719b744e89...` |
| `rich-enterprise-pack` | `programs_initiatives` | 156 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_09_programs_initiatives.csv` | `36f645eccdae...` |
| `rich-enterprise-pack` | `ai_automation_use_cases` | 150 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_10_ai_initiatives.csv` | `6edb304ea49f...` |
| `rich-enterprise-pack` | `risks_controls` | 349 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_11_operations_risk_controls.csv` | `2250326a11d1...` |
| `rich-enterprise-pack` | `relationships` | 1551 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_12_relationships.csv` | `5a5d92b70f22...` |
| `rich-enterprise-pack` | `evidence_sources` | 14 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_13_evidence_sources.csv` | `7d1af5b78f68...` |
| `rich-enterprise-pack` | `metrics_outcomes` | 116 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_14_metric_definitions.csv` | `f99c62c429d9...` |
| `rich-enterprise-pack` | `industry_context_patterns` | 190 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_15_industry_corpus_patterns.csv` | `5d6bb1145f4a...` |
| `rich-enterprise-pack` | `expert_lenses` | 5 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/templates/V6_16_expert_lenses.csv` | `dfc98aee1f71...` |
| `rich-enterprise-pack` | `unmapped_or_supporting_file` | 523 | `synthetic-planning-grade` | `datasets/tenant-inputs/active/meridian-health/current/rich-enterprise-pack/V6_BUSINESS_METADATA_DICTIONARY.csv` | `4d1de4d5ffc6...` |

### SkyHarbor Air (`skyharbor-air`)

| Packet | Domain | Rows | Classification | File | Fingerprint |
| --- | --- | ---: | --- | --- | --- |
| `rich-substrate-pack` | `ai_automation_use_cases` | 40 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/ai-tooling.csv` | `6d2efaafd1be...` |
| `rich-substrate-pack` | `applications_systems` | 600 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/application-portfolio.csv` | `3b64e9c5ebea...` |
| `rich-substrate-pack` | `business_functions` | 80 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/business-capabilities.csv` | `de0f6328aa78...` |
| `rich-substrate-pack` | `metrics_outcomes` | 40 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/dora-baseline.csv` | `1b7f8e6adf91...` |
| `rich-substrate-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/enterprise-profile.csv` | `c9cb44b3454b...` |
| `rich-substrate-pack` | `unmapped_or_supporting_file` | 60 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/erp-landscape.csv` | `c59587fd5359...` |
| `rich-substrate-pack` | `operational_process_evidence` | 400 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/incidents.csv` | `3e71d2265681...` |
| `rich-substrate-pack` | `infrastructure_platforms` | 686 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/infrastructure-estate.csv` | `b6321df5d2a1...` |
| `rich-substrate-pack` | `programs_initiatives` | 60 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/initiatives.csv` | `54fe12613c8e...` |
| `rich-substrate-pack` | `data_assets_integrations` | 500 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/integration-topology.csv` | `c2f46aad7511...` |
| `rich-substrate-pack` | `spend_value` | 168 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/it-financials.csv` | `e146ab1c990e...` |
| `rich-substrate-pack` | `org_ownership` | 272 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/org-roles.csv` | `2c2886590615...` |
| `rich-substrate-pack` | `metrics_outcomes` | 72 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/sla-register.csv` | `ca3fdbdc30c4...` |
| `rich-substrate-pack` | `vendors_contracts` | 120 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/rich-substrate-pack/csv/vendor-contracts.csv` | `b383a585ba70...` |
| `upgrade-candidate-pack` | `unmapped_or_supporting_file` | 28 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/derived/skyharbor_air_moves_current_state_findings.csv` | `68ccfd108c5a...` |
| `upgrade-candidate-pack` | `unmapped_or_supporting_file` | 42 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/derived/skyharbor_air_moves_golden_questions_scorecard.csv` | `3435618bd4e7...` |
| `upgrade-candidate-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_01_enterprise_profile.csv` | `c2b3202dd9a5...` |
| `upgrade-candidate-pack` | `business_functions` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_02_business_functions.csv` | `8e6096bcfb97...` |
| `upgrade-candidate-pack` | `org_ownership` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_03_org_ownership.csv` | `75d3bf2859ad...` |
| `upgrade-candidate-pack` | `workforce_roles` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_04_workforce_personas.csv` | `65fbc184fdc3...` |
| `upgrade-candidate-pack` | `applications_systems` | 13 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_05_applications_systems.csv` | `fd4b82035383...` |
| `upgrade-candidate-pack` | `data_assets_integrations` | 35 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_06_data_assets_integrations.csv` | `483da9448c37...` |
| `upgrade-candidate-pack` | `vendors_contracts` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_07_vendors_contracts.csv` | `b92704da35f9...` |
| `upgrade-candidate-pack` | `spend_value` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_08_spend_value.csv` | `0184eeedaedd...` |
| `upgrade-candidate-pack` | `programs_initiatives` | 7 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_09_programs_initiatives.csv` | `aadbb34e2846...` |
| `upgrade-candidate-pack` | `ai_automation_use_cases` | 3 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_10_ai_initiatives.csv` | `6095e9e8ec60...` |
| `upgrade-candidate-pack` | `risks_controls` | 28 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_11_operations_risk_controls.csv` | `f086ed570f1f...` |
| `upgrade-candidate-pack` | `relationships` | 74 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_12_relationships.csv` | `75084d6b657c...` |
| `upgrade-candidate-pack` | `evidence_sources` | 4 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_13_evidence_sources.csv` | `a393bcb7cfc3...` |
| `upgrade-candidate-pack` | `metrics_outcomes` | 12 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_14_metric_definitions.csv` | `defce75068d3...` |
| `upgrade-candidate-pack` | `industry_context_patterns` | 7 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_15_industry_corpus_patterns.csv` | `bb2c81cbf691...` |
| `upgrade-candidate-pack` | `expert_lenses` | 5 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/templates/V6_16_expert_lenses.csv` | `90595afdda44...` |
| `upgrade-candidate-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_00_portfolio_entity_registry.csv` | `06457834b5d8...` |
| `upgrade-candidate-pack` | `enterprise_profile` | 1 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_01_enterprise_profile.csv` | `7611762ef538...` |
| `upgrade-candidate-pack` | `business_functions` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_02_business_functions.csv` | `d044c9c4ebde...` |
| `upgrade-candidate-pack` | `org_ownership` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_03_org_ownership.csv` | `4079e0b62189...` |
| `upgrade-candidate-pack` | `workforce_roles` | 6 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_04_workforce_personas.csv` | `d0d525d49bea...` |
| `upgrade-candidate-pack` | `applications_systems` | 13 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_05_applications_systems.csv` | `17b62f2a5324...` |
| `upgrade-candidate-pack` | `data_assets_integrations` | 35 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_06_data_assets_integrations.csv` | `046c875440d7...` |
| `upgrade-candidate-pack` | `vendors_contracts` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_07_vendors_contracts.csv` | `a196c1a5cf75...` |
| `upgrade-candidate-pack` | `spend_value` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_08_spend_value.csv` | `212944abae9c...` |
| `upgrade-candidate-pack` | `programs_initiatives` | 7 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_09_programs_initiatives_business_priorities.csv` | `6732f4a37dbf...` |
| `upgrade-candidate-pack` | `ai_automation_use_cases` | 3 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_10_ai_initiatives.csv` | `ecb4e14157cc...` |
| `upgrade-candidate-pack` | `risks_controls` | 28 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_11_operations_risk_controls.csv` | `db741495dcfd...` |
| `upgrade-candidate-pack` | `relationships` | 74 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_12_relationships_graph_edges.csv` | `4cd817902d48...` |
| `upgrade-candidate-pack` | `evidence_sources` | 4 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_13_source_evidence_registry.csv` | `3ea71851bf09...` |
| `upgrade-candidate-pack` | `metrics_outcomes` | 12 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_14_metric_definitions.csv` | `615dddb09f24...` |
| `upgrade-candidate-pack` | `unmapped_or_supporting_file` | 7 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_15_industry_market_knowledge_patterns.csv` | `43ef4ca60691...` |
| `upgrade-candidate-pack` | `expert_lenses` | 5 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_16_expert_lenses.csv` | `4d9b01446e64...` |
| `upgrade-candidate-pack` | `spend_value` | 4 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_17_client_rate_card_cost_basis.csv` | `99be2f0c7fa2...` |
| `upgrade-candidate-pack` | `relationships` | 60 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_18_function_system_data_vendor_bridge.csv` | `7e1fd0233af2...` |
| `upgrade-candidate-pack` | `service_scope_managed_services` | 3 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_19_service_tower_managed_services_scope.csv` | `4b4dbd7da1f8...` |
| `upgrade-candidate-pack` | `evidence_sources` | 117 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_20_chunk_retrieval_registry.csv` | `4cb5ec5f939d...` |
| `upgrade-candidate-pack` | `relationships` | 17 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_21_graph_registry_relationship_dictionary.csv` | `3131a8ed0593...` |
| `upgrade-candidate-pack` | `operational_process_evidence` | 10 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_22_operational_evidence_process_intelligence.csv` | `89e5c6729994...` |
| `upgrade-candidate-pack` | `industry_context_patterns` | 2 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_23_external_benchmark_market_corpus.csv` | `95dbb23974d5...` |
| `upgrade-candidate-pack` | `infrastructure_platforms` | 5 | `synthetic-demo` | `datasets/tenant-inputs/active/skyharbor-air/current/upgrade-candidate-pack/v7/V7_24_infrastructure_cloud_estate.csv` | `be1ed82a65ad...` |
