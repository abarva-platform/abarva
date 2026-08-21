# Intake File Disposition Audit

- Role-disposition status: pass
- Pilot-gate status: blocked_pending_mapping
- Active files: 59
- Source rows: 16409
- Unclassified files: 0
- Blocked rows: 4979
- Pilot-scope blocked rows: 4907

| Tenant | File | Role | Rows | Canonical disposition | Blocked-row disposition | Gate impact |
| --- | --- | ---: | ---: | --- | --- | --- |
| meridian-health | 00_GUIDE_how_to_use.csv | non_ingestible_guide | 10 | blocked_unmapped_source_file | intentionally_excluded_support | none |
| meridian-health | 00_GUIDE_sheet_index.csv | non_ingestible_guide | 26 | blocked_unmapped_source_file | intentionally_excluded_support | none |
| meridian-health | 00_enterprise_profile.csv | canonical_entity | 1 | integrated | not_blocked | none |
| meridian-health | 01_business_functions.csv | canonical_entity | 24 | integrated | not_blocked | none |
| meridian-health | 01b_business_segments.csv | canonical_entity | 4 | blocked_unmapped_source_file | pending_mapping | pilot_scope_gap |
| meridian-health | 02_org_ownership.csv | canonical_entity | 225 | integrated | not_blocked | none |
| meridian-health | 03_workforce_roles.csv | canonical_entity | 45 | integrated | not_blocked | none |
| meridian-health | 04_applications_systems.csv | canonical_entity | 306 | integrated | not_blocked | none |
| meridian-health | 05_data_assets_integrations.csv | canonical_relationship | 540 | integrated | not_blocked | none |
| meridian-health | 06_infrastructure_platforms.csv | canonical_entity | 61 | integrated | not_blocked | none |
| meridian-health | 07_vendors_contracts.csv | canonical_entity | 72 | integrated | not_blocked | none |
| meridian-health | 08_spend_value.csv | canonical_entity | 27 | integrated | not_blocked | none |
| meridian-health | 09_programs_initiatives.csv | canonical_entity | 38 | integrated | not_blocked | none |
| meridian-health | 10_ai_automation_use_cases.csv | canonical_entity | 18 | integrated | not_blocked | none |
| meridian-health | 11_risks_controls.csv | canonical_entity | 40 | integrated | not_blocked | none |
| meridian-health | 12_relationships.csv | canonical_relationship | 2302 | integrated | not_blocked | none |
| meridian-health | 13_evidence_sources.csv | evidence_only | 27 | integrated | not_blocked | none |
| meridian-health | 14_metrics_outcomes.csv | metric_observation | 50 | integrated | not_blocked | none |
| meridian-health | 15_industry_context_patterns.csv | reference_configuration | 12 | integrated | not_blocked | none |
| meridian-health | 16_expert_lenses.csv | reference_configuration | 9 | integrated | not_blocked | none |
| meridian-health | 17_service_scope_managed_services.csv | canonical_entity | 15 | integrated | not_blocked | none |
| meridian-health | 18_operational_process_evidence.csv | canonical_entity | 25 | integrated | not_blocked | none |
| meridian-health | 19_data_analytics_platform_maturity.csv | metric_observation | 17 | integrated | not_blocked | none |
| meridian-health | SA08_AI_Benefits_Realization_Usage_Ledger.csv | metric_observation | 18 | integrated | not_blocked | none |
| meridian-health | SA09_AI_Tool_Usage_Feed.csv | metric_observation | 18 | integrated | not_blocked | none |
| meridian-health | SA10_AI_Value_Interview_Evidence.csv | evidence_only | 996 | integrated | not_blocked | none |
| meridian-health | SA11_AI_KPI_Operational_Outcome_Feed.csv | metric_observation | 18 | integrated | not_blocked | none |
| meridian-health | extracts/ms365-copilot-usage-user-detail.csv | metric_observation | 997 | blocked_unmapped_source_file | pending_mapping | pilot_scope_gap |
| skyharbor-air | 00_GUIDE_how_to_use.csv | non_ingestible_guide | 10 | blocked_unmapped_source_file | intentionally_excluded_support | none |
| skyharbor-air | 00_GUIDE_sheet_index.csv | non_ingestible_guide | 26 | blocked_unmapped_source_file | intentionally_excluded_support | none |
| skyharbor-air | 00_enterprise_profile.csv | canonical_entity | 1 | integrated | not_blocked | none |
| skyharbor-air | 01_business_functions.csv | canonical_entity | 22 | integrated | not_blocked | none |
| skyharbor-air | 01b_business_segments.csv | canonical_entity | 4 | blocked_unmapped_source_file | pending_mapping | pilot_scope_gap |
| skyharbor-air | 02_org_ownership.csv | canonical_entity | 153 | integrated | not_blocked | none |
| skyharbor-air | 03_workforce_roles.csv | canonical_entity | 38 | integrated | not_blocked | none |
| skyharbor-air | 04_applications_systems.csv | canonical_entity | 503 | integrated | not_blocked | none |
| skyharbor-air | 05_data_assets_integrations.csv | canonical_relationship | 632 | integrated | not_blocked | none |
| skyharbor-air | 06_infrastructure_platforms.csv | canonical_entity | 46 | integrated | not_blocked | none |
| skyharbor-air | 07_vendors_contracts.csv | canonical_entity | 65 | integrated | not_blocked | none |
| skyharbor-air | 08_spend_value.csv | canonical_entity | 23 | integrated | not_blocked | none |
| skyharbor-air | 09_programs_initiatives.csv | canonical_entity | 38 | integrated | not_blocked | none |
| skyharbor-air | 10_ai_automation_use_cases.csv | canonical_entity | 13 | integrated | not_blocked | none |
| skyharbor-air | 11_risks_controls.csv | canonical_entity | 44 | integrated | not_blocked | none |
| skyharbor-air | 12_relationships.csv | canonical_relationship | 3318 | integrated | not_blocked | none |
| skyharbor-air | 12b_interview_initiative_metric_crosswalk.csv | canonical_relationship | 230 | integrated | not_blocked | none |
| skyharbor-air | 13_evidence_sources.csv | evidence_only | 183 | integrated | not_blocked | none |
| skyharbor-air | 14_metrics_outcomes.csv | metric_observation | 26 | integrated | not_blocked | none |
| skyharbor-air | 15_industry_context_patterns.csv | reference_configuration | 10 | integrated | not_blocked | none |
| skyharbor-air | 16_expert_lenses.csv | reference_configuration | 7 | integrated | not_blocked | none |
| skyharbor-air | 17_service_scope_managed_services.csv | canonical_entity | 11 | integrated | not_blocked | none |
| skyharbor-air | 18_operational_process_evidence.csv | canonical_entity | 35 | integrated | not_blocked | none |
| skyharbor-air | 19_data_analytics_platform_maturity.csv | metric_observation | 15 | integrated | not_blocked | none |
| skyharbor-air | 20_itsm_ticket_sla_performance.csv | metric_observation | 503 | integrated | not_blocked | none |
| skyharbor-air | SA08_AI_Benefits_Realization_Usage_Ledger.csv | metric_observation | 8 | integrated | not_blocked | none |
| skyharbor-air | SA09_AI_Tool_Usage_Feed.csv | metric_observation | 8 | integrated | not_blocked | none |
| skyharbor-air | SA10_AI_Value_Interview_Evidence.csv | evidence_only | 586 | integrated | not_blocked | none |
| skyharbor-air | SA11_AI_KPI_Operational_Outcome_Feed.csv | metric_observation | 8 | integrated | not_blocked | none |
| skyharbor-air | extracts/ms365-copilot-usage-user-detail.csv | metric_observation | 2702 | blocked_unmapped_source_file | pending_mapping | pilot_scope_gap |
| skyharbor-air | extracts/servicenow-gen-ai-usage-log.csv | metric_observation | 1200 | blocked_unmapped_source_file | pending_mapping | pilot_scope_gap |

