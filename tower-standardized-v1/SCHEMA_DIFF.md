# Tower Standardized v1 Schema Diff

Original columns are mapped to canonical columns per tenant/file. Full machine-readable diff is in SCHEMA_DIFF.csv.

## apex-retail / ai-control-tower/T01_initiative-registry.csv
- Transform: canonical_t01_value_register
- Original: initiative_id | initiative_name | business_area | owner_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | primary_blocker | evidence_id
- Output: tenant_key | initiative_id | initiative_name | business_area | portfolio_segment | owner_role | business_sponsor_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | evidence_status | scale_decision | primary_blocker | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## apex-retail / ai-control-tower/T07_benefit-realization.csv
- Transform: canonical_t07_benefit_realization
- Original: initiative_id | metric_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status
- Output: tenant_key | initiative_id | metric_basis | value_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status | measurement_method | finance_attested | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## apex-retail / ai-control-tower/T08_spend-contracts.csv
- Transform: canonical_t08_preserve_spend_grain
- Original: initiative_id | vendor_or_tool | ytd_spend_usd | annual_budget_usd | contract_value_usd | renewal_date | unit_economic_note
- Output: tenant_key | line_id | initiative_id | vendor_or_tool | spend_category | budget_fy26_usd | actual_ytd_usd | contract_value_usd | renewal_date | unit_economic_note | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## apex-retail / family-4-financial-commercial/F12_it-budget-financials.csv
- Transform: canonical_f12_with_reconciled_synthetic_capex_opex_and_run_change
- Original: budget_line_id | function_or_platform | run_budget_usd | change_budget_usd | ai_budget_usd | owner_role | notes
- Output: tenant_key | line_id | budget_area | function_or_platform | owner_role | owner_team_id | spend_type | budget_fy26_usd | run_budget_fy26_usd | change_budget_fy26_usd | ai_data_budget_fy26_usd | capex_budget_fy26_usd | opex_budget_fy26_usd | labor_pct | vendor_pct | cloud_infra_pct | budget_pressure | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## apex-retail / family-5-execution-operations/F14_operations-service-management.csv
- Transform: canonical_f14_operations_service_management
- Original: signal_id | service_or_process | metric_name | period | value | threshold | status | owner_role | evidence_id
- Output: tenant_key | signal_id | record_id | service_or_process | service_area | ticket_or_event_type | metric_name | period | monthly_volume | value | threshold | status | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme | incidents_p1_p2 | incidents_total | change_failure_rate_pct | availability_pct | owner_role | evidence_id | source_file | source_row | value_source | notes

## apex-retail / family-6-governance-ai-evidence/F17_ai-automation-footprint.csv
- Transform: canonical_f17_ai_automation_footprint
- Original: ai_asset_id | asset_name | business_area | owner_role | tool_or_model | risk_tier | approval_status | monthly_users | evidence_id
- Output: tenant_key | ai_asset_id | ai_asset_name | asset_type | business_area | business_function | owner_role | tool_or_model | parent_system_id | stage | status | monthly_users_or_cases | monthly_users | risk_tier | regulated_workflow | approved_data_scope | approval_status | model_risk_status | measured_value_usd | evidence_id | evidence_status | next_gate | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## first-capital-financial / ai-control-tower/T01_initiative-registry.csv
- Transform: canonical_t01_value_register
- Original: initiative_id | initiative_name | business_area | owner_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | primary_blocker | evidence_id
- Output: tenant_key | initiative_id | initiative_name | business_area | portfolio_segment | owner_role | business_sponsor_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | evidence_status | scale_decision | primary_blocker | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## first-capital-financial / ai-control-tower/T07_benefit-realization.csv
- Transform: canonical_t07_benefit_realization
- Original: initiative_id | metric_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status
- Output: tenant_key | initiative_id | metric_basis | value_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status | measurement_method | finance_attested | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## first-capital-financial / ai-control-tower/T08_spend-contracts.csv
- Transform: canonical_t08_preserve_spend_grain
- Original: initiative_id | vendor_or_tool | ytd_spend_usd | annual_budget_usd | contract_value_usd | renewal_date | unit_economic_note
- Output: tenant_key | line_id | initiative_id | vendor_or_tool | spend_category | budget_fy26_usd | actual_ytd_usd | contract_value_usd | renewal_date | unit_economic_note | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## first-capital-financial / family-4-financial-commercial/F12_it-budget-financials.csv
- Transform: canonical_f12_with_reconciled_synthetic_capex_opex_and_run_change
- Original: budget_id | budget_area | owner_role | run_budget_usd | change_budget_usd | ai_or_data_budget_usd | labor_pct | vendor_pct | cloud_or_infra_pct | budget_pressure
- Output: tenant_key | line_id | budget_area | function_or_platform | owner_role | owner_team_id | spend_type | budget_fy26_usd | run_budget_fy26_usd | change_budget_fy26_usd | ai_data_budget_fy26_usd | capex_budget_fy26_usd | opex_budget_fy26_usd | labor_pct | vendor_pct | cloud_infra_pct | budget_pressure | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## first-capital-financial / family-5-execution-operations/F14_operations-service-management.csv
- Transform: canonical_f14_operations_service_management
- Original: signal_id | service_or_process | ticket_or_event_type | monthly_volume | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme
- Output: tenant_key | signal_id | record_id | service_or_process | service_area | ticket_or_event_type | metric_name | period | monthly_volume | value | threshold | status | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme | incidents_p1_p2 | incidents_total | change_failure_rate_pct | availability_pct | owner_role | evidence_id | source_file | source_row | value_source | notes

## first-capital-financial / family-6-governance-ai-evidence/F17_ai-automation-footprint.csv
- Transform: canonical_f17_ai_automation_footprint
- Original: ai_asset_id | ai_asset_name | business_area | tool_or_model | stage | monthly_users_or_cases | measured_value_usd | risk_tier | evidence_status | next_gate
- Output: tenant_key | ai_asset_id | ai_asset_name | asset_type | business_area | business_function | owner_role | tool_or_model | parent_system_id | stage | status | monthly_users_or_cases | monthly_users | risk_tier | regulated_workflow | approved_data_scope | approval_status | model_risk_status | measured_value_usd | evidence_id | evidence_status | next_gate | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## lakeshore-industries / ai-control-tower/T01_initiative-registry.csv
- Transform: canonical_t01_value_register
- Original: initiative_id | initiative_name | business_area | owner_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | primary_blocker | evidence_id
- Output: tenant_key | initiative_id | initiative_name | business_area | portfolio_segment | owner_role | business_sponsor_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | evidence_status | scale_decision | primary_blocker | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## lakeshore-industries / ai-control-tower/T07_benefit-realization.csv
- Transform: canonical_t07_benefit_realization
- Original: initiative_id | metric_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status
- Output: tenant_key | initiative_id | metric_basis | value_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status | measurement_method | finance_attested | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## lakeshore-industries / ai-control-tower/T08_spend-contracts.csv
- Transform: canonical_t08_preserve_spend_grain
- Original: initiative_id | vendor_or_tool | ytd_spend_usd | annual_budget_usd | contract_value_usd | renewal_date | unit_economic_note
- Output: tenant_key | line_id | initiative_id | vendor_or_tool | spend_category | budget_fy26_usd | actual_ytd_usd | contract_value_usd | renewal_date | unit_economic_note | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## lakeshore-industries / family-4-financial-commercial/F12_it-budget-financials.csv
- Transform: canonical_f12_with_reconciled_synthetic_capex_opex_and_run_change
- Original: budget_id | budget_area | owner_role | run_budget_usd | change_budget_usd | ai_or_data_budget_usd | labor_pct | vendor_pct | cloud_or_infra_pct | budget_pressure
- Output: tenant_key | line_id | budget_area | function_or_platform | owner_role | owner_team_id | spend_type | budget_fy26_usd | run_budget_fy26_usd | change_budget_fy26_usd | ai_data_budget_fy26_usd | capex_budget_fy26_usd | opex_budget_fy26_usd | labor_pct | vendor_pct | cloud_infra_pct | budget_pressure | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## lakeshore-industries / family-5-execution-operations/F14_operations-service-management.csv
- Transform: canonical_f14_operations_service_management
- Original: signal_id | service_or_process | ticket_or_event_type | monthly_volume | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme
- Output: tenant_key | signal_id | record_id | service_or_process | service_area | ticket_or_event_type | metric_name | period | monthly_volume | value | threshold | status | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme | incidents_p1_p2 | incidents_total | change_failure_rate_pct | availability_pct | owner_role | evidence_id | source_file | source_row | value_source | notes

## lakeshore-industries / family-6-governance-ai-evidence/F17_ai-automation-footprint.csv
- Transform: canonical_f17_ai_automation_footprint
- Original: ai_asset_id | ai_asset_name | business_area | tool_or_model | stage | monthly_users_or_cases | measured_value_usd | risk_tier | evidence_status | next_gate
- Output: tenant_key | ai_asset_id | ai_asset_name | asset_type | business_area | business_function | owner_role | tool_or_model | parent_system_id | stage | status | monthly_users_or_cases | monthly_users | risk_tier | regulated_workflow | approved_data_scope | approval_status | model_risk_status | measured_value_usd | evidence_id | evidence_status | next_gate | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## meridian-health / ai-control-tower/T01_initiative-registry.csv
- Transform: canonical_t01_value_register
- Original: initiative_id | initiative_name | business_area | owner_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | primary_blocker | evidence_id
- Output: tenant_key | initiative_id | initiative_name | business_area | portfolio_segment | owner_role | business_sponsor_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | evidence_status | scale_decision | primary_blocker | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## meridian-health / ai-control-tower/T07_benefit-realization.csv
- Transform: canonical_t07_benefit_realization
- Original: initiative_id | metric_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status
- Output: tenant_key | initiative_id | metric_basis | value_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status | measurement_method | finance_attested | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## meridian-health / ai-control-tower/T08_spend-contracts.csv
- Transform: canonical_t08_preserve_spend_grain
- Original: initiative_id | vendor_or_tool | ytd_spend_usd | annual_budget_usd | contract_value_usd | renewal_date | unit_economic_note
- Output: tenant_key | line_id | initiative_id | vendor_or_tool | spend_category | budget_fy26_usd | actual_ytd_usd | contract_value_usd | renewal_date | unit_economic_note | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## meridian-health / family-4-financial-commercial/F12_it-budget-financials.csv
- Transform: canonical_f12_with_reconciled_synthetic_capex_opex_and_run_change
- Original: budget_id | budget_area | owner_role | run_budget_usd | change_budget_usd | ai_or_data_budget_usd | labor_pct | vendor_pct | cloud_or_infra_pct | budget_pressure
- Output: tenant_key | line_id | budget_area | function_or_platform | owner_role | owner_team_id | spend_type | budget_fy26_usd | run_budget_fy26_usd | change_budget_fy26_usd | ai_data_budget_fy26_usd | capex_budget_fy26_usd | opex_budget_fy26_usd | labor_pct | vendor_pct | cloud_infra_pct | budget_pressure | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## meridian-health / family-5-execution-operations/F14_operations-service-management.csv
- Transform: canonical_f14_operations_service_management
- Original: signal_id | service_or_process | ticket_or_event_type | monthly_volume | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme
- Output: tenant_key | signal_id | record_id | service_or_process | service_area | ticket_or_event_type | metric_name | period | monthly_volume | value | threshold | status | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme | incidents_p1_p2 | incidents_total | change_failure_rate_pct | availability_pct | owner_role | evidence_id | source_file | source_row | value_source | notes

## meridian-health / family-6-governance-ai-evidence/F17_ai-automation-footprint.csv
- Transform: canonical_f17_ai_automation_footprint
- Original: ai_asset_id | ai_asset_name | business_area | tool_or_model | stage | monthly_users_or_cases | measured_value_usd | risk_tier | evidence_status | next_gate
- Output: tenant_key | ai_asset_id | ai_asset_name | asset_type | business_area | business_function | owner_role | tool_or_model | parent_system_id | stage | status | monthly_users_or_cases | monthly_users | risk_tier | regulated_workflow | approved_data_scope | approval_status | model_risk_status | measured_value_usd | evidence_id | evidence_status | next_gate | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## skyharbor-air / ai-control-tower/T01_initiative-registry.csv
- Transform: canonical_t01_value_register
- Original: initiative_id | initiative_name | portfolio_segment | owner_role | business_sponsor_role | stage | promised_value_usd | measured_value_ytd_usd | confidence | evidence_status | scale_decision | primary_blocker
- Output: tenant_key | initiative_id | initiative_name | business_area | portfolio_segment | owner_role | business_sponsor_role | stage | promised_benefit_usd | measured_value_usd | value_confidence | status | evidence_status | scale_decision | primary_blocker | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## skyharbor-air / ai-control-tower/T07_benefit-realization.csv
- Transform: canonical_t07_benefit_realization
- Original: initiative_id | value_basis | committed_value_usd | realized_value_ytd_usd | confidence | measurement_method | finance_attested | evidence_id
- Output: tenant_key | initiative_id | metric_basis | value_basis | promised_benefit_usd | measured_value_usd | unrealized_or_blocked_value_usd | confidence | evidence_status | measurement_method | finance_attested | evidence_id | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## skyharbor-air / ai-control-tower/T08_spend-contracts.csv
- Transform: canonical_t08_preserve_spend_grain
- Original: spend_id | initiative_id | vendor_or_internal | spend_category | fy26_budget_usd | actual_ytd_usd | renewal_or_gate_date | unit_economics | notes
- Output: tenant_key | line_id | initiative_id | vendor_or_tool | spend_category | budget_fy26_usd | actual_ytd_usd | contract_value_usd | renewal_date | unit_economic_note | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## skyharbor-air / family-4-financial-commercial/F12_it-budget-financials.csv
- Transform: canonical_f12_with_reconciled_synthetic_capex_opex_and_run_change
- Original: budget_line_id | budget_area | spend_type | fy26_budget_usd | owner_team_id
- Output: tenant_key | line_id | budget_area | function_or_platform | owner_role | owner_team_id | spend_type | budget_fy26_usd | run_budget_fy26_usd | change_budget_fy26_usd | ai_data_budget_fy26_usd | capex_budget_fy26_usd | opex_budget_fy26_usd | labor_pct | vendor_pct | cloud_infra_pct | budget_pressure | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes

## skyharbor-air / family-5-execution-operations/F14_operations-service-management.csv
- Transform: canonical_f14_operations_service_management
- Original: record_id | service_area | period | incidents_p1_p2 | incidents_total | mttr_hours | change_failure_rate_pct | availability_pct | notes
- Output: tenant_key | signal_id | record_id | service_or_process | service_area | ticket_or_event_type | metric_name | period | monthly_volume | value | threshold | status | severity_mix | mttr_hours | backlog_count | automation_candidate | root_cause_theme | incidents_p1_p2 | incidents_total | change_failure_rate_pct | availability_pct | owner_role | evidence_id | source_file | source_row | value_source | notes

## skyharbor-air / family-6-governance-ai-evidence/F17_ai-automation-footprint.csv
- Transform: canonical_f17_ai_automation_footprint
- Original: ai_asset_id | asset_name | asset_type | business_function | parent_system_id | status | regulated_workflow | approved_data_scope | model_risk_status | notes
- Output: tenant_key | ai_asset_id | ai_asset_name | asset_type | business_area | business_function | owner_role | tool_or_model | parent_system_id | stage | status | monthly_users_or_cases | monthly_users | risk_tier | regulated_workflow | approved_data_scope | approval_status | model_risk_status | measured_value_usd | evidence_id | evidence_status | next_gate | amount_type | view | is_rollup_of | basis | period | formula | formula_version | source_file | source_row | value_source | notes
