# Layer 3 canonical refresh — lakeshore-industries

Mode: draft preparation only. No production canonical store was written.
Active root at generation: `datasets/tenant-inputs/active/lakeshore-industries/current`

## Dimension coverage

| Metric | Value |
| --- | ---: |
| Contract dimensions declared | 19 |
| Resolved with data | 19 |
| Absent | 0 |
| Naming drift vs contract | 0 |
| Missing declared columns | 0 |
| Unregistered files in active root | 4 |

## Required checks

| Check | Result | Detail |
| --- | --- | --- |
| Every canonical object has declared identity | `FAIL` | 4 file(s) in the active root are not declared in the template contract: SA08_AI_Benefits_Realization_Usage_Ledger.csv; SA09_AI_Tool_Usage_Feed.csv; SA10_AI_Value_Interview_Evidence.csv; SA11_AI_KPI_Operational_Outcome_Feed.csv |
| Every fact carries source file / source row / evidence id where available | `PARTIAL` | 13_evidence_sources carries 10 row(s); per-row evidence linkage is not verified by this script. |
| Relationship rows use canonical relationship types | `NOT_VERIFIED` | 12_relationships carries 519 row(s); the canonical relationship dictionary lives in intelligence_v6.relationship_types and was not read (no data-plane access in this lane). |
| Planning-grade and interview-only facts remain marked | `PARTIAL` | Classification is carried in the package manifest as synthetic_demo_planning_grade; per-row attestation is not present. |
| Money, counts, and metrics are deterministic and not model-invented | `PASS` | No cross-source conflicts detected for this tenant. |
| Duplicate/conflicting claims are blocked pending reconciliation | `PASS` | 0 claim(s) recorded as blocked in the governed package blocked_claims.csv. |

## Per-dimension detail

| Contract file | Resolved as | Name matches | Data rows | Missing declared columns |
| --- | --- | --- | ---: | ---: |
| `00_enterprise_profile.csv` | `00_enterprise_profile.csv` | yes | 8 | 0 |
| `01_business_functions.csv` | `01_business_functions.csv` | yes | 59 | 0 |
| `02_org_ownership.csv` | `02_org_ownership.csv` | yes | 116 | 0 |
| `03_workforce_roles.csv` | `03_workforce_roles.csv` | yes | 22 | 0 |
| `04_applications_systems.csv` | `04_applications_systems.csv` | yes | 152 | 0 |
| `05_data_assets_integrations.csv` | `05_data_assets_integrations.csv` | yes | 82 | 0 |
| `06_infrastructure_platforms.csv` | `06_infrastructure_platforms.csv` | yes | 128 | 0 |
| `07_vendors_contracts.csv` | `07_vendors_contracts.csv` | yes | 19 | 0 |
| `08_spend_value.csv` | `08_spend_value.csv` | yes | 71 | 0 |
| `09_programs_initiatives.csv` | `09_programs_initiatives.csv` | yes | 36 | 0 |
| `10_ai_automation_use_cases.csv` | `10_ai_automation_use_cases.csv` | yes | 36 | 0 |
| `11_risks_controls.csv` | `11_risks_controls.csv` | yes | 48 | 0 |
| `12_relationships.csv` | `12_relationships.csv` | yes | 519 | 0 |
| `13_evidence_sources.csv` | `13_evidence_sources.csv` | yes | 10 | 0 |
| `14_metrics_outcomes.csv` | `14_metrics_outcomes.csv` | yes | 236 | 0 |
| `15_industry_context_patterns.csv` | `15_industry_context_patterns.csv` | yes | 24 | 0 |
| `16_expert_lenses.csv` | `16_expert_lenses.csv` | yes | 18 | 0 |
| `17_service_scope_managed_services.csv` | `17_service_scope_managed_services.csv` | yes | 8 | 0 |
| `18_operational_process_evidence.csv` | `18_operational_process_evidence.csv` | yes | 112 | 0 |

Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`
