# Tower Standardized v1 Metadata Dictionary

## Required governance columns

- tenant_key: canonical tenant key.
- source_file: relative source file path from the original tenant pack.
- source_row: source row number in the original CSV, including header as row 1.
- value_source: tenant_file or synthetic. Synthetic means generated in this standardized copy and recorded in SYNTHETIC_MANIFEST.csv.
- amount_type: opex, capex, run, change, or none.
- view: authoritative lens for the amount: it_budget, vendor_contract, app_run_cost, org_budget, initiative_budget, or value.
- is_rollup_of: the view this row aggregates or decomposes. Prevents double-counting.
- basis: committed, actual, or forecast.
- period: fy26, ytd, or monthly.
- formula: source or derivation rule. not_loaded is used when no safe derivation exists.
- formula_version: currently tower_standardized_v1.

## Financial measures

- budget_fy26_usd: committed FY26 budget envelope for the row.
- run_budget_fy26_usd/change_budget_fy26_usd: budget split by operating posture. For SkyHarbor these are derived from spend_type and recorded in the synthetic manifest.
- capex_budget_fy26_usd/opex_budget_fy26_usd: synthetic split from the real budget envelope; reconciles line by line.
- actual_ytd_usd: YTD actual spend where provided by T08. Not invented for F12.
- measured_value_usd: measured or realized value where directly present. If absent and no safe initiative linkage exists, not_loaded.
