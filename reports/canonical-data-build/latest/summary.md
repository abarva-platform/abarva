# Canonical Tenant Data Build

Generated: 2026-08-21T02:08:13.343Z

## Truth Split

- This is an inactive, deterministic file-based build from canonical tenant inputs.
- No production tenant data was written.
- The Active Tenant Access Layer was not updated.
- No candidate was promoted.
- No module runtime reads changed.

## Summary

- Source root: `datasets/tenant-inputs/active`
- Template set: `universal-tenant-input-standard-2026-07-v3`
- Tenants processed: 2
- Accepted canonical records: 7,891
- Quarantined canonical records: 0
- Evidence attachments: 11,825
- Relationship candidates: 18,771
- Source rows inspected: 16,409
- Source mentions represented: 11,825
- Distinct entities accepted: 7,891
- Duplicate mentions collapsed: 3,934
- References resolved: 17,117 / 18,771 (91%)
- Source rows blocked: 4,979
- Placeholder rejections/gaps: 2,228
- Archive/legacy read violations: 0
- Error findings: 9

## Tenants

| Tenant | Source files | Source rows | Source mentions | Distinct entities | References resolved | Profile | Home/aVa ready |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Meridian Health | 28 | 5,941 | 5,020 | 3,543 | 7,570 / 8,282 | ready | not ready |
| Airline Demo | 31 | 10,468 | 6,805 | 4,348 | 9,547 / 10,489 | ready | not ready |

## Source Mention Coverage

| Tenant | File | Rows | Domain | Source mentions | Distinct entities | Relationship candidates | Disposition |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/00_enterprise_profile.csv | 1 | enterprise_profile | 1 | 1 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/00_GUIDE_how_to_use.csv | 10 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/00_GUIDE_sheet_index.csv | 26 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/01_business_functions.csv | 24 | business_functions | 37 | 37 | 24 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/01b_business_segments.csv | 4 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/02_org_ownership.csv | 225 | org_ownership | 230 | 230 | 380 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/03_workforce_roles.csv | 45 | workforce_roles | 45 | 45 | 45 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv | 306 | applications_systems | 388 | 388 | 1,901 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/05_data_assets_integrations.csv | 540 | data_assets_integrations | 553 | 553 | 2,700 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/06_infrastructure_platforms.csv | 61 | infrastructure_platforms | 61 | 61 | 61 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/07_vendors_contracts.csv | 72 | vendors_contracts | 72 | 72 | 329 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/08_spend_value.csv | 27 | spend_value | 29 | 29 | 54 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/09_programs_initiatives.csv | 38 | programs_initiatives | 38 | 38 | 152 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/10_ai_automation_use_cases.csv | 18 | ai_automation_use_cases | 18 | 18 | 18 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/11_risks_controls.csv | 40 | risks_controls | 41 | 41 | 40 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/12_relationships.csv | 2,302 | relationships | 2,302 | 825 | 2,302 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/13_evidence_sources.csv | 27 | evidence_sources | 27 | 27 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/14_metrics_outcomes.csv | 50 | metrics_outcomes | 50 | 50 | 100 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/15_industry_context_patterns.csv | 12 | industry_context_patterns | 12 | 12 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/16_expert_lenses.csv | 9 | expert_lenses | 9 | 9 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/17_service_scope_managed_services.csv | 15 | service_scope_managed_services | 15 | 15 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/18_operational_process_evidence.csv | 25 | operational_process_evidence | 25 | 25 | 68 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/19_data_analytics_platform_maturity.csv | 17 | data_analytics_platform_maturity | 17 | 17 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/extracts/ms365-copilot-usage-user-detail.csv | 997 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/SA08_AI_Benefits_Realization_Usage_Ledger.csv | 18 | ai_benefits_realization_usage_ledger | 18 | 18 | 54 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/SA09_AI_Tool_Usage_Feed.csv | 18 | ai_tool_usage_feed | 18 | 18 | 36 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/SA10_AI_Value_Interview_Evidence.csv | 996 | ai_value_interview_evidence | 996 | 996 | 0 | integrated |
| meridian-health | datasets/tenant-inputs/active/meridian-health/current/SA11_AI_KPI_Operational_Outcome_Feed.csv | 18 | ai_kpi_operational_outcome_feed | 18 | 18 | 18 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/00_enterprise_profile.csv | 1 | enterprise_profile | 1 | 1 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/00_GUIDE_how_to_use.csv | 10 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/00_GUIDE_sheet_index.csv | 26 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/01_business_functions.csv | 22 | business_functions | 26 | 26 | 22 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/01b_business_segments.csv | 4 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/02_org_ownership.csv | 153 | org_ownership | 224 | 224 | 470 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/03_workforce_roles.csv | 38 | workforce_roles | 38 | 38 | 38 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/04_applications_systems.csv | 503 | applications_systems | 698 | 698 | 2,939 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/05_data_assets_integrations.csv | 632 | data_assets_integrations | 638 | 638 | 2,894 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/06_infrastructure_platforms.csv | 46 | infrastructure_platforms | 46 | 46 | 46 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/07_vendors_contracts.csv | 65 | vendors_contracts | 65 | 65 | 308 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/08_spend_value.csv | 23 | spend_value | 24 | 24 | 46 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/09_programs_initiatives.csv | 38 | programs_initiatives | 40 | 40 | 134 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/10_ai_automation_use_cases.csv | 13 | ai_automation_use_cases | 13 | 13 | 13 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/11_risks_controls.csv | 44 | risks_controls | 44 | 44 | 44 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/12_relationships.csv | 3,318 | relationships | 3,318 | 868 | 3,318 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/12b_interview_initiative_metric_crosswalk.csv | 230 | interview_initiative_metric_crosswalk | 230 | 227 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/13_evidence_sources.csv | 183 | evidence_sources | 183 | 183 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/14_metrics_outcomes.csv | 26 | metrics_outcomes | 26 | 26 | 52 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/15_industry_context_patterns.csv | 10 | industry_context_patterns | 10 | 10 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/16_expert_lenses.csv | 7 | expert_lenses | 7 | 7 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/17_service_scope_managed_services.csv | 11 | service_scope_managed_services | 11 | 11 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/18_operational_process_evidence.csv | 35 | operational_process_evidence | 35 | 35 | 117 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/19_data_analytics_platform_maturity.csv | 15 | data_analytics_platform_maturity | 15 | 11 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/20_itsm_ticket_sla_performance.csv | 503 | itsm_ticket_sla_performance | 503 | 503 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/extracts/ms365-copilot-usage-user-detail.csv | 2,702 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/extracts/servicenow-gen-ai-usage-log.csv | 1,200 | unmapped | 0 | 0 | 0 | blocked_unmapped_source_file |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/SA08_AI_Benefits_Realization_Usage_Ledger.csv | 8 | ai_benefits_realization_usage_ledger | 8 | 8 | 24 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/SA09_AI_Tool_Usage_Feed.csv | 8 | ai_tool_usage_feed | 8 | 8 | 16 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/SA10_AI_Value_Interview_Evidence.csv | 586 | ai_value_interview_evidence | 586 | 586 | 0 | integrated |
| skyharbor-air | datasets/tenant-inputs/active/skyharbor-air/current/SA11_AI_KPI_Operational_Outcome_Feed.csv | 8 | ai_kpi_operational_outcome_feed | 8 | 8 | 8 | integrated |

## Entity Resolution By Domain

| Tenant | Domain | Source rows | Distinct entities | Skipped rows | Duplicate mentions |
| --- | --- | ---: | ---: | ---: | ---: |
| Meridian Health | enterprise_profile | 1 | 1 | 0 | 0 |
| Meridian Health | business_functions | 24 | 24 | 0 | 0 |
| Meridian Health | org_ownership | 225 | 225 | 0 | 0 |
| Meridian Health | workforce_roles | 45 | 45 | 0 | 0 |
| Meridian Health | applications_systems | 306 | 306 | 0 | 0 |
| Meridian Health | data_assets_integrations | 540 | 540 | 0 | 0 |
| Meridian Health | infrastructure_platforms | 61 | 61 | 0 | 0 |
| Meridian Health | vendors_contracts | 72 | 72 | 0 | 0 |
| Meridian Health | spend_value | 27 | 27 | 0 | 0 |
| Meridian Health | programs_initiatives | 38 | 38 | 0 | 0 |
| Meridian Health | ai_automation_use_cases | 18 | 18 | 0 | 0 |
| Meridian Health | risks_controls | 40 | 40 | 0 | 0 |
| Meridian Health | relationships | 2,302 | 825 | 0 | 0 |
| Meridian Health | evidence_sources | 27 | 27 | 0 | 0 |
| Meridian Health | metrics_outcomes | 50 | 50 | 0 | 0 |
| Meridian Health | industry_context_patterns | 12 | 12 | 0 | 0 |
| Meridian Health | expert_lenses | 9 | 9 | 0 | 0 |
| Meridian Health | service_scope_managed_services | 15 | 15 | 0 | 0 |
| Meridian Health | operational_process_evidence | 25 | 25 | 0 | 0 |
| Meridian Health | interview_initiative_metric_crosswalk | 0 | 0 | 0 | 0 |
| Meridian Health | data_analytics_platform_maturity | 17 | 17 | 0 | 0 |
| Meridian Health | itsm_ticket_sla_performance | 0 | 0 | 0 | 0 |
| Meridian Health | ai_benefits_realization_usage_ledger | 18 | 18 | 0 | 0 |
| Meridian Health | ai_tool_usage_feed | 18 | 18 | 0 | 0 |
| Meridian Health | ai_value_interview_evidence | 996 | 996 | 0 | 0 |
| Meridian Health | ai_kpi_operational_outcome_feed | 18 | 18 | 0 | 0 |
| Airline Demo | enterprise_profile | 1 | 1 | 0 | 0 |
| Airline Demo | business_functions | 22 | 22 | 0 | 0 |
| Airline Demo | org_ownership | 153 | 153 | 0 | 0 |
| Airline Demo | workforce_roles | 38 | 38 | 0 | 0 |
| Airline Demo | applications_systems | 503 | 503 | 0 | 0 |
| Airline Demo | data_assets_integrations | 632 | 632 | 0 | 0 |
| Airline Demo | infrastructure_platforms | 46 | 46 | 0 | 0 |
| Airline Demo | vendors_contracts | 65 | 65 | 0 | 0 |
| Airline Demo | spend_value | 23 | 23 | 0 | 0 |
| Airline Demo | programs_initiatives | 38 | 38 | 0 | 0 |
| Airline Demo | ai_automation_use_cases | 13 | 13 | 0 | 0 |
| Airline Demo | risks_controls | 44 | 44 | 0 | 0 |
| Airline Demo | relationships | 3,318 | 868 | 0 | 0 |
| Airline Demo | evidence_sources | 183 | 183 | 0 | 0 |
| Airline Demo | metrics_outcomes | 26 | 26 | 0 | 0 |
| Airline Demo | industry_context_patterns | 10 | 10 | 0 | 0 |
| Airline Demo | expert_lenses | 7 | 7 | 0 | 0 |
| Airline Demo | service_scope_managed_services | 11 | 11 | 0 | 0 |
| Airline Demo | operational_process_evidence | 35 | 35 | 0 | 0 |
| Airline Demo | interview_initiative_metric_crosswalk | 230 | 227 | 0 | 0 |
| Airline Demo | data_analytics_platform_maturity | 15 | 11 | 0 | 0 |
| Airline Demo | itsm_ticket_sla_performance | 503 | 503 | 0 | 0 |
| Airline Demo | ai_benefits_realization_usage_ledger | 8 | 8 | 0 | 0 |
| Airline Demo | ai_tool_usage_feed | 8 | 8 | 0 | 0 |
| Airline Demo | ai_value_interview_evidence | 586 | 586 | 0 | 0 |
| Airline Demo | ai_kpi_operational_outcome_feed | 8 | 8 | 0 | 0 |

## Proof Files

- `tenant-build-index.json`
- `canonical-records-summary.json`
- `evidence-attachment-summary.json`
- `relationship-candidates-summary.json`
- `entity-resolution-summary.json`
- `source-integration-coverage.json`
- `enterprise-profile-build.json`
- `placeholder-rejection-report.json`
- `tenant-gaps.json`
- `tenant-quality-depth.json`
- `home-ava-readiness.json`
- `source-path-enforcement.json`
- `archive-read-violations.json`
- `all-tenant-build-control.html`
