# Meridian Data-Plane Layout and Volumetrics

Generated: 2026-07-17T11:51:10.530Z

## Executive Read

Tower should not be served by raw CSV files. The active V3 source packet is intake/proof material. The production target is an Azure/Postgres governed data-plane path: source packet -> canonical facts/evidence/entities/relationships/gaps -> Active Tenant Access / module context -> Tower projection/read model -> dashboard and aVa.

Current proof state:

- Active Meridian V3 packet is now rich: 22 CSV files, 4,079 rows.
- Active Tenant Access promotion passed for Meridian: candidate:meridian-health:7af66450ac65.
- Module context access audit passed: home: 74 records / 74 evidence refs; intelligence: 74 records / 74 evidence refs; tower: 74 records / 74 evidence refs.
- Active module read proof passed: home: 58 records / 58 evidence refs; intelligence: 58 records / 58 evidence refs; moves: 58 records / 58 evidence refs; source: 58 records / 58 evidence refs; tower: 58 records / 58 evidence refs.
- Tower V3 context-pack proof passed: 555 metric records, 561 value records, 561 value claims, 80 blocked claims, realized-value language allowed = false.
- Physical Azure/Postgres table load and Azure AI Search retrieval/citation proof are still not claimed by this report.

## Source Packet Volumetrics

| File | Rows | Columns |
| --- | --- | --- |
| 00_enterprise_profile.csv | 2 | 30 |
| 01_business_functions.csv | 228 | 41 |
| 02_org_ownership.csv | 228 | 41 |
| 03_workforce_roles.csv | 221 | 47 |
| 04_applications_systems.csv | 241 | 44 |
| 05_data_assets_integrations.csv | 242 | 37 |
| 06_infrastructure_platforms.csv | 15 | 21 |
| 07_vendors_contracts.csv | 231 | 49 |
| 08_it_budget_spend_value.csv | 298 | 67 |
| 09_programs_initiatives.csv | 256 | 57 |
| 10_ai_automation_use_cases.csv | 251 | 54 |
| 11_risks_controls.csv | 249 | 37 |
| 12_relationships.csv | 298 | 43 |
| 13_evidence_sources.csv | 500 | 37 |
| 14_metrics_outcomes.csv | 257 | 50 |
| 15_industry_context_patterns.csv | 7 | 17 |
| 16_expert_lenses.csv | 7 | 17 |
| 17_managed_services_scope.csv | 228 | 56 |
| 18_operational_process_evidence.csv | 228 | 40 |
| SA02_IT_Finance_Budget_Spend_Extract.csv | 70 | 30 |
| SA04_Program_Portfolio_Extract.csv | 14 | 23 |
| SA08_AI_Benefits_Realization_Usage_Ledger.csv | 8 | 26 |

## Derived Layer Volumetrics

| Artifact | Shape | Count |
| --- | --- | --- |
| canonical-facts.json | array | 4,298 |
| evidence-registry.json | array | 4,298 |
| entity-profiles.json | array | 1,214 |
| context-gaps.json | array | 2,752 |
| interview-insights.json | array | 221 |
| ai-use-case-business-unit-map.json | array | 251 |
| relationship-graph.json | graph | 1,668 nodes / 2,670 edges |
| module-context/home-context-view.json | object | 19 |
| module-context/moves-context-view.json | object | 11 |
| module-context/tower-dashboard-view.json | object | 14 |
| module-context/sa08-benefits-posture.json | object | 5 |

## Tower Projection Proof

| Source file | Rows | Facts | Evidence refs | Projection status |
| --- | --- | --- | --- | --- |
| 08_it_budget_spend_value.csv | 298 | 298 | 298 | v3_context_pack_ready |
| 09_programs_initiatives.csv | 256 | 256 | 256 | v3_context_pack_ready |
| 11_risks_controls.csv | 249 | 249 | 249 | v3_context_pack_ready |
| 14_metrics_outcomes.csv | 257 | 257 | 257 | v3_context_pack_ready |
| 17_managed_services_scope.csv | 228 | 228 | 228 | v3_context_pack_ready |
| 18_operational_process_evidence.csv | 228 | 228 | 228 | v3_context_pack_ready |

Tower projection counts:

- Metric records: 555
- Value records: 561
- Value claims: 561
- Blocked value claims: 80
- Realized/proven value language allowed: false
- cio_tower status: {"projectionRole":"derived_read_model","sourceOfTruthStatus":"bridge_only","v3ReconciliationStatus":"not_v3_reconciled"}

## Module Serving Matrix

| Page | Current serving state | Target Azure data-plane serving state | Status |
| --- | --- | --- | --- |
| Knowledge / Home | Active Tenant Access metadata plus approved Home content bridge. | Azure/Postgres Active Tenant Access read model, evidence registry, canonical facts, relationships, gaps, approved content. | Reachability proven; browser proof still needed after deploy. |
| Intelligence | Active module-context proof exists; live aVa retrieval must still use governed context bundle/index path. | Azure/Postgres canonical facts + Azure AI Search indexed chunks through buildValidatedAgentContextBundle. | Context access proven; retrieval/citation proof pending data-plane load/index. |
| Moves | Active module-context proof exists; derived Moves context artifacts exist. | Azure/Postgres context packet, interview insights, graph edges, gate/readiness records. | Context access proven; runtime gate wiring proof still pending. |
| Source | Active module-context proof exists; no Meridian-specific Source runtime mutation claimed. | Azure/Postgres evidence, vendor, contract, application, spend, SLA/process records via Source read models. | Context access proven; Source runtime proof pending. |
| Tower | Default dashboard must use Azure/Postgres/read-model path. File-backed TowerContextPack builder is proof harness only and now flag-gated. | Azure/Postgres Tower projection/read model from V3 canonical facts -> TowerContextPack -> TowerMetricRecord/TowerValueRecord/TowerValueClaim. | Tower V3 context pack proof passes; physical Azure/Postgres table load and dashboard browser proof still pending. |

## Physical Schema Inventory in Repo

These are the Postgres-compatible schema artifacts currently present in the repo. They are not proof that the refreshed Meridian packet has been physically loaded to Azure Postgres.

| Migration | Tables detected |
| --- | --- |
| supabase/migrations/20260514100000_enterprise_context_layer.sql | enterprise_context_sources, enterprise_context_source_files, enterprise_context_records, enterprise_context_facts, enterprise_context_relationships, enterprise_context_evidence, enterprise_context_quality_issues, enterprise_context_stewardship_tasks, enterprise_context_snapshots, enterprise_context_template_runs, enterprise_context_chunk_queue |
| supabase/migrations/20260623180000_home_know_read_models.sql | public.home_expected_fields |
| supabase/migrations/20260626130000_tower_demo_readiness_materialized_plane.sql | public.tower_materialization_runs, public.tower_read_model_initiatives, public.tower_read_model_vendors, public.tower_gap_register, public.tower_spend_realism_audit, public.tower_forbidden_identifiers, public.tower_answer_trace, public.tower_l3_answer_dossiers |
| supabase/migrations/20260626203000_tower_budget_rollups.sql | public.tower_budget_rollups |
| supabase/migrations/20260628202000_cio_tower_schema_v1.sql | cio_tower.source_registry, cio_tower.entities, cio_tower.facts, cio_tower.relationships, cio_tower.measures, cio_tower.question_contracts, cio_tower.measure_results, cio_tower.prompt_packages, cio_tower.answer_traces, cio_tower.validation_runs, cio_tower.validation_results |
| supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql | intelligence_v7.active_tenant_contract_versions, intelligence_v7.tenant_contract_promotion_events, intelligence_v7.module_readiness_scores, intelligence_v7.derived_intelligence_quality_reports, intelligence_v7.existing_tenant_upgrade_snapshots |
| supabase/migrations/20260717063000_tower_foundation_tables_ledger_repair.sql | public.tower_cmdb_cis, public.tower_cmdb_dependencies, public.tower_workforce |

## Required Next Data-Plane Build

1. Run an ACA data-build job for Meridian candidate context using the rich active V3 packet and derived artifacts.
2. Persist source registry, evidence registry, canonical facts, entity profiles, relationships, context gaps, module context, and Tower projection rows to Azure/Postgres.
3. Backfill/search-index only agent-ready objects for Intelligence/aVa retrieval.
4. Promote through human review and Active Tenant Access pointer update.
5. Prove signed-in browser behavior for Knowledge, Intelligence, Moves, Source, and Tower.
6. Prove Tower default dashboard does not call file-backed builders and does not show unsupported realized ROI/savings.

## Truth Split

| Claim | Value |
| --- | --- |
| filesAreIntakeAndProofArtifacts | true |
| towerDashboardShouldNotDefaultToRawFileReads | true |
| activeModuleContextAccessProven | true |
| physicalAzurePostgresLoadProven | false |
| azureSearchRetrievalProven | false |
| signedInBrowserProofAfterThisRefresh | false |
