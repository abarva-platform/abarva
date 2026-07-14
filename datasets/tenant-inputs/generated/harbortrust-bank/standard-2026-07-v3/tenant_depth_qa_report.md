# HarborTrust Bank Depth QA Report

Generated: 2026-07-14

## Truth Split

- Active tenant input modified: false
- Home/runtime modified: false
- Module runtime behavior changed: false
- Candidate promoted: false

## Counts

- 00_enterprise_profile.xlsx: 1
- 01_business_functions.xlsx: 22
- 02_org_ownership.xlsx: 22
- 03_workforce_roles.xlsx: 44
- 04_applications_systems.xlsx: 69
- 05_data_assets_integrations.xlsx: 88
- 06_infrastructure_platforms.xlsx: 44
- 07_vendors_contracts.xlsx: 44
- 08_it_budget_spend_value.xlsx: 44
- 09_programs_initiatives.xlsx: 22
- 10_ai_automation_use_cases.xlsx: 22
- 11_risks_controls.xlsx: 44
- 12_relationships.xlsx: 396
- 13_evidence_sources.xlsx: 44
- 14_metrics_outcomes.xlsx: 44
- 15_industry_context_patterns.xlsx: 22
- 16_expert_lenses.xlsx: 22
- 17_managed_services_scope.xlsx: 22
- 18_operational_process_evidence.xlsx: 22
- SA01_ServiceNow_CMDB_Extract_Template.xlsx: 66
- SA02_IT_Finance_Budget_Spend_Extract_Template.xlsx: 44
- SA03_Vendor_Contracts_Extract_Template.xlsx: 44
- SA04_Program_Portfolio_Extract_Template.xlsx: 22
- SA05_Cloud_Inventory_Extract_Template.xlsx: 27
- SA06_Incident_Problem_Change_Extract_Template.xlsx: 44

## Checks

- PASS - All 19 core dimensions populated
- PASS - All 6 source adapters populated
- PASS - No thin critical systems: 0 thin systems
- PASS - Relationship density >= 5 per cluster: 396 relationships for 22 clusters
- PASS - Evidence per cluster >= 2: 44 evidence rows
- PASS - No active promotion: Generated path only; active tenant input untouched.
- PASS - No realized value claims: Rows use baseline/opportunity language only.

## Relationship Types Present

consumes, depends_on, feeds, funded_by, governed_by, has_risk, hosted_in, hosted_on, integrates_with, measured_by, owned_by, part_of, produces, provided_by, replaced_by, supports, target_platform_for, used_by

## Quality Opinion

Pass: deep enough for review and context-layer redesign proof, pending client validation.

## Semantic Depth Fix1

- Verdict: PASS
- Scope: Fraud Analyst Copilot
- Worst known-gaps duplicate rate: 0%
- Questionnaire answer duplicate rate: 3.9%
- Targeted cluster gates: Fraud Analyst Copilot=PASS

Honest status: this proves semantic depth for the targeted proof clusters, not full active-runtime readiness.
