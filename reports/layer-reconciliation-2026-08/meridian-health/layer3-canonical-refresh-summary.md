# Layer 3 canonical refresh — meridian-health

Mode: draft preparation only. No production canonical store was written.
Active root at generation: `datasets/tenant-inputs/active/meridian-health/current`

## Dimension coverage

| Metric | Value |
| --- | ---: |
| Contract dimensions declared | 19 |
| Resolved with data | 19 |
| Absent | 0 |
| Naming drift vs contract | 2 |
| Missing declared columns | 18 |
| Unregistered files in active root | 6 |

## Required checks

| Check | Result | Detail |
| --- | --- | --- |
| Every canonical object has declared identity | `FAIL` | 6 file(s) in the active root are not declared in the template contract: SA02_IT_Finance_Budget_Spend_Extract.csv; SA04_Program_Portfolio_Extract.csv; SA08_AI_Benefits_Realization_Usage_Ledger.csv; SA09_AI_Tool_Usage_Feed.csv; SA10_AI_Value_Interview_Evidence.csv; SA11_AI_KPI_Operational_Outcome_Feed.csv |
| Every fact carries source file / source row / evidence id where available | `PARTIAL` | 13_evidence_sources carries 508 row(s); per-row evidence linkage is not verified by this script. |
| Relationship rows use canonical relationship types | `NOT_VERIFIED` | 12_relationships carries 1037 row(s); the canonical relationship dictionary lives in intelligence_v6.relationship_types and was not read (no data-plane access in this lane). |
| Planning-grade and interview-only facts remain marked | `PARTIAL` | Classification is carried in the package manifest as synthetic_demo_planning_grade; per-row attestation is not present. |
| Money, counts, and metrics are deterministic and not model-invented | `FAIL` | 18 conflicting or divergent claim(s); see claim-reconciliation-matrix.csv. |
| Duplicate/conflicting claims are blocked pending reconciliation | `PASS` | 18 claim(s) recorded as blocked in the governed package blocked_claims.csv. |

## Per-dimension detail

| Contract file | Resolved as | Name matches | Data rows | Missing declared columns |
| --- | --- | --- | ---: | ---: |
| `00_enterprise_profile.csv` | `00_enterprise_profile.csv` | yes | 2 | 8 |
| `01_business_functions.csv` | `01_business_functions.csv` | yes | 228 | 13 |
| `02_org_ownership.csv` | `02_org_ownership.csv` | yes | 228 | 12 |
| `03_workforce_roles.csv` | `03_workforce_roles.csv` | yes | 221 | 12 |
| `04_applications_systems.csv` | `04_applications_systems.csv` | yes | 241 | 17 |
| `05_data_assets_integrations.csv` | `05_data_assets_integrations.csv` | yes | 242 | 15 |
| `06_infrastructure_platforms.csv` | `06_infrastructure_platforms.csv` | yes | 15 | 13 |
| `07_vendors_contracts.csv` | `07_vendors_contracts.csv` | yes | 231 | 16 |
| `08_spend_value.csv` | `08_it_budget_spend_value.csv` | no | 298 | 11 |
| `09_programs_initiatives.csv` | `09_programs_initiatives.csv` | yes | 256 | 15 |
| `10_ai_automation_use_cases.csv` | `10_ai_automation_use_cases.csv` | yes | 251 | 12 |
| `11_risks_controls.csv` | `11_risks_controls.csv` | yes | 249 | 13 |
| `12_relationships.csv` | `12_relationships.csv` | yes | 1037 | 0 |
| `13_evidence_sources.csv` | `13_evidence_sources.csv` | yes | 508 | 10 |
| `14_metrics_outcomes.csv` | `14_metrics_outcomes.csv` | yes | 257 | 11 |
| `15_industry_context_patterns.csv` | `15_industry_context_patterns.csv` | yes | 7 | 9 |
| `16_expert_lenses.csv` | `16_expert_lenses.csv` | yes | 7 | 9 |
| `17_service_scope_managed_services.csv` | `17_managed_services_scope.csv` | no | 228 | 12 |
| `18_operational_process_evidence.csv` | `18_operational_process_evidence.csv` | yes | 228 | 12 |

Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`
