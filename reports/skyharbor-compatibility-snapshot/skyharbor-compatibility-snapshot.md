# SkyHarbor Compatibility Snapshot

Tenant: `skyharbor-air`
Dataset: `skyharbor-air-v6-v7-upgrade-candidate-20260710`
Generated: `2026-07-09T00:00:00Z`

This is a dry-run compatibility snapshot for an existing-tenant upgrade candidate.
It does not write production data, promote an active tenant version, or change module runtime behavior.

## Summary

- Source files evaluated: 46
- Declared rows: 743
- Observed CSV rows: 743
- Candidate signals captured: 20
- Guardrails captured: 5
- Known gaps captured: 5
- Writes physical tables: false
- Active tenant access layer updated: false
- Module consumption proven: false
- Promotion approved: false
- Quality gate: pass

## Non-Claim Guardrails

- Do not claim real flight, passenger, crew, customer, aircraft, or operational production records.
- Do not claim IROPS AI, autonomous recovery, crew recovery automation, or customer reaccommodation automation is production-ready.
- Do not claim audited savings, realized ROI, disruption cost reduction, OTP improvement, or NPS lift.
- Do not claim IBM, AWS, Sabre, Amadeus, Salesforce, SAP, Snowflake, or Databricks contract values unless explicitly loaded.
- Do not make cross-tenant claims or use non-SkyHarbor facts to answer SkyHarbor questions.

## Known Gaps

- Synthetic airline planning-grade substrate; not real SkyHarbor production data.
- Existing tenant upgrade candidate; do not treat as active until promotion proof passes.
- No client-approved system inventory, contract economics, or operational baseline is loaded.
- No production IROPS AI, autonomous recovery, or Tower value outcome is proven.
- No workshop signoff for owners, baseline metrics, control evidence, or data quality scores is loaded.

## Candidate Signals

| Source object | Label | Category | Readiness signal |
| --- | --- | --- | --- |
| SHA-SYS-OCC | OCC disruption management console | irops_command | high |
| SHA-SYS-FLIGHTOPS | Flight operations dispatch platform | flight_operations | high |
| SHA-SYS-CREW | Crew scheduling and legality platform | crew_operations | high |
| SHA-SYS-PSS | Passenger service system | customer_operations | high |
| SHA-SYS-MAINFRAME | IBM Z core operations mainframe | core_transaction_platform | high |
| SHA-SYS-MQ | IBM MQ / integration backbone | integration_middleware | high |
| SHA-SYS-SAP | SAP finance and procurement | finance_erp | medium |
| SHA-SYS-SERVICE | ServiceNow technology service management | itsm | medium |
| SHA-EVID-001 | SkyHarbor existing-tenant V6 substrate | existing_tenant_dataset | synthetic_demo_manifest_gated |
| SHA-EVID-002 | Generated SkyHarbor V7 upgrade candidate | generated_dataset | synthetic_demo_manifest_gated |
| SHA-EVID-003 | SkyHarbor upgrade proof prompt | operator_prompt | synthetic_demo_manifest_gated |
| SHA-EVID-004 | V7 derivation anti-boilerplate quality gate | validation_report | synthetic_demo_manifest_gated |
| SHA-MOVE-001-F1 | IROPS AI recovery cockpit | disruption events | OCC disruption management console and disruption events evidence show a blocker for IROPS AI recovery cockpit: No approved disruption recovery baseline. |
| SHA-MOVE-001-F2 | IROPS AI recovery cockpit | flight status | Flight operations dispatch platform and flight status evidence show a blocker for IROPS AI recovery cockpit: No certified operational event spine. |
| SHA-MOVE-001-F3 | IROPS AI recovery cockpit | crew legality | Crew scheduling and legality platform and crew legality evidence show a blocker for IROPS AI recovery cockpit: Crew legality control evidence not loaded. |
| SHA-MOVE-001-F4 | IROPS AI recovery cockpit | customer reaccommodation | Passenger service system and customer reaccommodation evidence show a blocker for IROPS AI recovery cockpit: Customer reaccommodation SLA not validated. |
| SHA-MOVE-002-F1 | Crew recovery decision support | crew pairings | Crew scheduling and legality platform and crew pairings evidence show a blocker for Crew recovery decision support: Legality rules owner not signed off. |
| SHA-MOVE-002-F2 | Crew recovery decision support | legality constraints | OCC disruption management console and legality constraints evidence show a blocker for Crew recovery decision support: Crew mobile feedback not loaded. |
| SHA-MOVE-002-F3 | Crew recovery decision support | reserve assignment | IBM MQ / integration backbone and reserve assignment evidence show a blocker for Crew recovery decision support: Human approval workflow not evidenced. |
| SHA-MOVE-002-F4 | Crew recovery decision support | hotel transport | Airline operations data lake candidate and hotel transport evidence show a blocker for Crew recovery decision support: Data freshness SLA not loaded. |

## Module Readiness

| Module | Ready | Reason | Required proof |
| --- | --- | --- | --- |
| home | false | Candidate profile exists, but the active tenant access layer has not been updated. | Promote a persisted candidate version and prove Home reads only the promoted slice. |
| intelligence | false | Candidate evidence exists, but retrieval and citation against the promoted slice are not proven. | Run signed-in answer proof with candidate evidence citations and stale-source suppression checks. |
| moves | false | Move findings and golden questions exist, but phase workspace consumption is not proven. | Run file-to-canonical-to-Moves readiness proof with phase and gate evidence checks. |
| source | false | Vendor and AMS signals exist, but sourcing workflow consumption is not proven. | Run Source compatibility proof for scope, evidence, vendor economics, and safe non-claims. |
| tower | false | Outcome and value signals are planning-grade; no realized outcome ledger proof exists. | Run Tower outcome-ledger proof before any value realization or ROI claim. |
| export | false | Executive artifacts have not been generated from the promoted candidate version. | Export a cited artifact from the promoted slice and verify source-event wording. |

## Source Inventory

| Source file | Layer | Source class | Observed rows | Compatibility role |
| --- | --- | --- | --- | --- |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/azure/v7-tenant-load-payload.json | loader_payload | loader_payload |  | Loader payload inventory only; this PR does not execute it. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/derived/skyharbor_air_moves_current_state_findings.csv | derived_candidate | unknown | 28 | Derived candidate evidence used for readiness and non-claim checks. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/derived/skyharbor_air_moves_golden_questions_scorecard.csv | derived_candidate | unknown | 42 | Derived candidate evidence used for readiness and non-claim checks. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/README.md | documentation | documentation |  | Documentation or supporting artifact. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_01_enterprise_profile.csv | source_template | enterprise_profile | 1 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_02_business_functions.csv | source_template | organization_functions | 6 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_03_org_ownership.csv | source_template | organization_functions | 6 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_04_workforce_personas.csv | source_template | organization_functions | 6 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_05_applications_systems.csv | source_template | applications_systems | 13 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_06_data_assets_integrations.csv | source_template | data_assets_integrations | 35 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_07_vendors_contracts.csv | source_template | vendors_contracts | 10 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_08_spend_value.csv | source_template | spend_value | 10 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_09_programs_initiatives.csv | source_template | programs_priorities | 7 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_10_ai_initiatives.csv | source_template | programs_priorities | 3 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_11_operations_risk_controls.csv | source_template | risks_controls | 28 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_12_relationships.csv | source_template | module_memory | 74 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_13_evidence_sources.csv | source_template | evidence_registry | 4 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_14_metric_definitions.csv | source_template | metric_definitions | 12 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_15_industry_corpus_patterns.csv | source_template | benchmark_context | 7 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_16_expert_lenses.csv | source_template | benchmark_context | 5 | Legacy source-template input retained for migration compatibility and row-count comparison. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/V6_V7_GENERATED_MANIFEST.json | manifest | manifest |  | Generated manifest used to preserve guardrails, row counts, and known gaps. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_00_portfolio_entity_registry.csv | target_candidate | enterprise_profile | 1 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_01_enterprise_profile.csv | target_candidate | enterprise_profile | 1 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_02_business_functions.csv | target_candidate | organization_functions | 6 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_03_org_ownership.csv | target_candidate | organization_functions | 6 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_04_workforce_personas.csv | target_candidate | organization_functions | 6 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_05_applications_systems.csv | target_candidate | applications_systems | 13 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_06_data_assets_integrations.csv | target_candidate | data_assets_integrations | 35 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_07_vendors_contracts.csv | target_candidate | vendors_contracts | 10 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_08_spend_value.csv | target_candidate | spend_value | 10 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_09_programs_initiatives_business_priorities.csv | target_candidate | programs_priorities | 7 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_10_ai_initiatives.csv | target_candidate | programs_priorities | 3 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_11_operations_risk_controls.csv | target_candidate | risks_controls | 28 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_12_relationships_graph_edges.csv | target_candidate | module_memory | 74 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_13_source_evidence_registry.csv | target_candidate | evidence_registry | 4 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_14_metric_definitions.csv | target_candidate | metric_definitions | 12 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_15_industry_market_knowledge_patterns.csv | target_candidate | benchmark_context | 7 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_16_expert_lenses.csv | target_candidate | benchmark_context | 5 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_17_client_rate_card_cost_basis.csv | target_candidate | vendors_contracts | 4 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_18_function_system_data_vendor_bridge.csv | target_candidate | unknown | 60 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_19_service_tower_managed_services_scope.csv | target_candidate | vendors_contracts | 3 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_20_chunk_retrieval_registry.csv | target_candidate | data_assets_integrations | 117 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_21_graph_registry_relationship_dictionary.csv | target_candidate | module_memory | 17 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_22_operational_evidence_process_intelligence.csv | target_candidate | risks_controls | 10 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_23_external_benchmark_market_corpus.csv | target_candidate | benchmark_context | 2 | Candidate target-layer table used for snapshot inspection only. |
| datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/v7/V7_24_infrastructure_cloud_estate.csv | target_candidate | applications_systems | 5 | Candidate target-layer table used for snapshot inspection only. |
