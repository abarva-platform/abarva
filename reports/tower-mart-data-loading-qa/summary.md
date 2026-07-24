# Tower Mart Data Loading QA

Status: PASS

| Tenant | Check | Status | Evidence |
| --- | --- | --- | --- |
| meridian-health | tenant_key | PASS | meridian-health |
| meridian-health | command_center_present | PASS | present |
| meridian-health | budget_envelope_nonzero | PASS | 650000000 |
| meridian-health | run_change_reconciles_to_total | PASS | 487500000+162500000=650000000; total=650000000 |
| meridian-health | promised_value_nonzero | PASS | 35500000 |
| meridian-health | approved_program_budget_nonzero | PASS | 291900000 |
| meridian-health | ai_tagged_spend_nonzero_when_ai_programs_exist | PASS | 53700000 |
| meridian-health | realized_value_not_auto_claimed | PASS | 0 |
| meridian-health | mart_rows_present | PASS | {"command_center":1,"value_funnel":5,"program_decision_lanes":12,"ai_portfolio":255,"cxo_actions":3,"evidence_lineage":267,"required_field_gaps":15} |
| apex-retail | tenant_key | PASS | apex-retail |
| apex-retail | command_center_present | PASS | present |
| apex-retail | budget_envelope_nonzero | PASS | 1516800000 |
| apex-retail | run_change_reconciles_to_total | PASS | 979600000+537200000=1516800000; total=1516800000 |
| apex-retail | promised_value_nonzero | PASS | 33900000 |
| apex-retail | approved_program_budget_nonzero | PASS | 30800000 |
| apex-retail | ai_tagged_spend_nonzero_when_ai_programs_exist | PASS | 25400000 |
| apex-retail | realized_value_not_auto_claimed | PASS | 0 |
| apex-retail | mart_rows_present | PASS | {"command_center":1,"value_funnel":5,"program_decision_lanes":7,"ai_portfolio":7,"cxo_actions":3,"evidence_lineage":14,"required_field_gaps":6} |
| skyharbor-air | tenant_key | PASS | skyharbor-air |
| skyharbor-air | command_center_present | PASS | present |
| skyharbor-air | budget_envelope_nonzero | PASS | 2578000000 |
| skyharbor-air | run_change_reconciles_to_total | PASS | 1445400000+1132600000=2578000000; total=2578000000 |
| skyharbor-air | promised_value_nonzero | PASS | 80200000 |
| skyharbor-air | approved_program_budget_nonzero | PASS | 45100000 |
| skyharbor-air | ai_tagged_spend_nonzero_when_ai_programs_exist | PASS | 45100000 |
| skyharbor-air | realized_value_not_auto_claimed | PASS | 0 |
| skyharbor-air | mart_rows_present | PASS | {"command_center":1,"value_funnel":5,"program_decision_lanes":6,"ai_portfolio":6,"cxo_actions":2,"evidence_lineage":12,"required_field_gaps":2} |
| first-capital-financial | tenant_key | PASS | first-capital-financial |
| first-capital-financial | command_center_present | PASS | present |
| first-capital-financial | budget_envelope_nonzero | PASS | 2132000000 |
| first-capital-financial | run_change_reconciles_to_total | PASS | 1321840000+810160000=2132000000; total=2132000000 |
| first-capital-financial | promised_value_nonzero | PASS | 50800000 |
| first-capital-financial | approved_program_budget_nonzero | PASS | 37800000 |
| first-capital-financial | ai_tagged_spend_nonzero_when_ai_programs_exist | PASS | 323960000 |
| first-capital-financial | realized_value_not_auto_claimed | PASS | 0 |
| first-capital-financial | mart_rows_present | PASS | {"command_center":1,"value_funnel":5,"program_decision_lanes":7,"ai_portfolio":7,"cxo_actions":3,"evidence_lineage":14,"required_field_gaps":5} |
| lakeshore-holdings | tenant_key | PASS | lakeshore-holdings |
| lakeshore-holdings | command_center_present | PASS | present |
| lakeshore-holdings | budget_envelope_nonzero | PASS | 190600000 |
| lakeshore-holdings | run_change_reconciles_to_total | PASS | 133420000+57180000=190600000; total=190600000 |
| lakeshore-holdings | promised_value_nonzero | PASS | 34200000 |
| lakeshore-holdings | approved_program_budget_nonzero | PASS | 28800000 |
| lakeshore-holdings | ai_tagged_spend_nonzero_when_ai_programs_exist | PASS | 11800000 |
| lakeshore-holdings | realized_value_not_auto_claimed | PASS | 0 |
| lakeshore-holdings | mart_rows_present | PASS | {"command_center":1,"value_funnel":5,"program_decision_lanes":7,"ai_portfolio":7,"cxo_actions":3,"evidence_lineage":14,"required_field_gaps":5} |
| lakeshore-industries | tenant_key | PASS | lakeshore-industries |
| lakeshore-industries | command_center_present | PASS | present |
| lakeshore-industries | budget_envelope_nonzero | PASS | 877920000 |
| lakeshore-industries | run_change_reconciles_to_total | PASS | 604160000+273760000=877920000; total=877920000 |
| lakeshore-industries | promised_value_nonzero | PASS | 23000000 |
| lakeshore-industries | approved_program_budget_nonzero | PASS | 22100000 |
| lakeshore-industries | ai_tagged_spend_nonzero_when_ai_programs_exist | PASS | 105665000 |
| lakeshore-industries | realized_value_not_auto_claimed | PASS | 0 |
| lakeshore-industries | mart_rows_present | PASS | {"command_center":1,"value_funnel":5,"program_decision_lanes":7,"ai_portfolio":7,"cxo_actions":3,"evidence_lineage":14,"required_field_gaps":6} |
