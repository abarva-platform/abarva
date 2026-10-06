# Legacy Dataset Sunset PR2

Status: FAIL

Generated: 2026-09-18T18:18:40.558Z

Scope: local source/runtime proof only. No Azure/Postgres mutation, no tenant promotion, no legacy dataset deletion, and no deploy performed by this audit.

## Gates

- Canonical standard v3 tenant inputs present.
- Neutral approved artifact store present and checksum-recorded.
- Default local runtime/proof files do not read legacy dataset folders.
- Package-level legacy dataset generation commands are blocked.
- Legacy datasets remain frozen references pending archive/delete approval.

## Results

- Checks: 100
- Failures: 19

- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/00_enterprise_profile.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/01_business_functions.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/02_org_ownership.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/03_workforce_roles.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/04_applications_systems.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/05_data_assets_integrations.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/06_infrastructure_platforms.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/07_vendors_contracts.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/08_it_budget_spend_value.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/09_programs_initiatives.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/10_ai_automation_use_cases.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/11_risks_controls.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/12_relationships.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/13_evidence_sources.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/14_metrics_outcomes.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/15_industry_context_patterns.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/16_expert_lenses.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/17_managed_services_scope.csv 
- FAIL: datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/18_operational_process_evidence.csv 
