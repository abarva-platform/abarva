# Meridian Health Depth QA Report

Generated: 2026-07-14

## Truth Split

- Active tenant input modified: false
- Home/runtime modified: false
- Module runtime behavior changed: false
- Candidate promoted: false

## Counts

- 00_enterprise_profile.xlsx: 1
- 01_business_functions.xlsx: 20
- 02_org_ownership.xlsx: 20
- 03_workforce_roles.xlsx: 40
- 04_applications_systems.xlsx: 67
- 05_data_assets_integrations.xlsx: 80
- 06_infrastructure_platforms.xlsx: 40
- 07_vendors_contracts.xlsx: 40
- 08_it_budget_spend_value.xlsx: 40
- 09_programs_initiatives.xlsx: 20
- 10_ai_automation_use_cases.xlsx: 20
- 11_risks_controls.xlsx: 40
- 12_relationships.xlsx: 360
- 13_evidence_sources.xlsx: 40
- 14_metrics_outcomes.xlsx: 40
- 15_industry_context_patterns.xlsx: 20
- 16_expert_lenses.xlsx: 20
- 17_managed_services_scope.xlsx: 20
- 18_operational_process_evidence.xlsx: 20
- SA01_ServiceNow_CMDB_Extract_Template.xlsx: 60
- SA02_IT_Finance_Budget_Spend_Extract_Template.xlsx: 40
- SA03_Vendor_Contracts_Extract_Template.xlsx: 40
- SA04_Program_Portfolio_Extract_Template.xlsx: 20
- SA05_Cloud_Inventory_Extract_Template.xlsx: 25
- SA06_Incident_Problem_Change_Extract_Template.xlsx: 40

## Checks

- PASS - All 19 core dimensions populated
- PASS - All 6 source adapters populated
- PASS - No thin critical systems: 0 thin systems
- PASS - Relationship density >= 5 per cluster: 360 relationships for 20 clusters
- PASS - Evidence per cluster >= 2: 40 evidence rows
- PASS - No active promotion: Generated path only; active tenant input untouched.
- PASS - No realized value claims: Rows use baseline/opportunity language only.

## Relationship Types Present

consumes, depends_on, feeds, funded_by, governed_by, has_risk, hosted_in, hosted_on, integrates_with, measured_by, owned_by, part_of, produces, provided_by, replaced_by, supports, target_platform_for, used_by

## Quality Opinion

Pass: deep enough for review and context-layer redesign proof, pending client validation.
