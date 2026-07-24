# Tower fact lineage

For each headline metric and tenant: every file across BOTH source trees that asserts a value, and whether they agree. Run before quoting any number from this pack.

| Status       | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| `AGREE`      | Several sources, all within 2%                                   |
| `CONFLICT`   | Sources materially disagree — someone must pick and say why      |
| `ONE_SOURCE` | Only one file asserts it; nothing corroborates it                |
| `ABSENT`     | No file asserts it — the only safe case for "we don't have this" |

## IT budget (FY26) `it_budget_usd`

| Tenant             | Status       | Asserted by                                                         |    Value |
| ------------------ | ------------ | ------------------------------------------------------------------- | -------: |
| skyharbor-air      | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `budget_fy26_usd`              | $2578.0M |
| meridian-health    | `AGREE`      | `v3` 08_it_budget_spend_value.csv · `budget_amount_usd`             |  $650.0M |
|                    |              | `v3` 08_it_budget_spend_value.csv · `approved_budget_usd`           |  $650.0M |
|                    |              | `v3` SA02_IT_Finance_Budget_Spend_Extract.csv · `budget_amount_usd` |  $650.0M |
| first-capital      | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `budget_fy26_usd`              | $2132.0M |
| lakeshore-holdings | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `budget_fy26_usd`              |  $877.9M |
| apex-retail        | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `budget_fy26_usd`              | $1516.8M |

## AI-tagged budget `ai_tagged_budget_usd`

| Tenant             | Status       | Asserted by                                                    |   Value |
| ------------------ | ------------ | -------------------------------------------------------------- | ------: |
| skyharbor-air      | `ABSENT`     | —                                                              |       — |
| meridian-health    | `ONE_SOURCE` | `v3` 08_it_budget_spend_value.csv · `ai_tagged_budget_usd`     |  $53.7M |
| first-capital      | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `ai_data_budget_fy26_usd` | $324.0M |
| lakeshore-holdings | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `ai_data_budget_fy26_usd` | $105.7M |
| apex-retail        | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `ai_data_budget_fy26_usd` |  $25.4M |

## AI initiative funding `ai_initiative_funding_usd`

| Tenant             | Status       | Asserted by                                                      |    Value |
| ------------------ | ------------ | ---------------------------------------------------------------- | -------: |
| skyharbor-air      | `ONE_SOURCE` | `std` T08_spend-contracts.csv · `budget_fy26_usd`                | $1031.3M |
| meridian-health    | `CONFLICT`   | `std` T08_spend-contracts.csv · `budget_fy26_usd`                |   $44.8M |
|                    |              | `v3` SA04_Program_Portfolio_Extract.csv · `approved_funding_usd` |  $291.9M |
|                    |              | `v3` 09_programs_initiatives.csv · `approved_funding_usd`        |  $291.9M |
| first-capital      | `ONE_SOURCE` | `std` T08_spend-contracts.csv · `budget_fy26_usd`                |  $139.7M |
| lakeshore-holdings | `ONE_SOURCE` | `std` T08_spend-contracts.csv · `budget_fy26_usd`                |   $76.4M |
| apex-retail        | `ONE_SOURCE` | `std` T08_spend-contracts.csv · `budget_fy26_usd`                |  $111.2M |

## Promised benefit `promised_value_usd`

| Tenant             | Status     | Asserted by                                                               |    Value |
| ------------------ | ---------- | ------------------------------------------------------------------------- | -------: |
| skyharbor-air      | `CONFLICT` | `std` T07_benefit-realization.csv · `promised_benefit_usd`                | $3374.0M |
|                    |            | `v3` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` |   $80.2M |
| meridian-health    | `CONFLICT` | `std` T07_benefit-realization.csv · `promised_benefit_usd`                |  $742.0M |
|                    |            | `std` T00_ai-investment-super-template.csv · `promised_benefit_usd`       |  $742.0M |
|                    |            | `v3` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` |   $35.5M |
| first-capital      | `CONFLICT` | `std` T07_benefit-realization.csv · `promised_benefit_usd`                | $3786.0M |
|                    |            | `std` T00_ai-investment-super-template.csv · `promised_benefit_usd`       | $1262.0M |
|                    |            | `v3` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` |   $50.8M |
| lakeshore-holdings | `AGREE`    | `std` T07_benefit-realization.csv · `promised_benefit_usd`                |  $381.0M |
|                    |            | `std` T00_ai-investment-super-template.csv · `promised_benefit_usd`       |  $381.0M |
| apex-retail        | `AGREE`    | `std` T07_benefit-realization.csv · `promised_benefit_usd`                |  $641.0M |
|                    |            | `std` T00_ai-investment-super-template.csv · `promised_benefit_usd`       |  $641.0M |

## AI tool cost `ai_tool_cost_usd`

| Tenant             | Status       | Asserted by                                   |  Value |
| ------------------ | ------------ | --------------------------------------------- | -----: |
| skyharbor-air      | `ONE_SOURCE` | `std` T03_tool-usage-monthly.csv · `cost_usd` | $11.9M |
| meridian-health    | `ONE_SOURCE` | `std` T03_tool-usage-monthly.csv · `cost_usd` |  $1.6M |
| first-capital      | `ONE_SOURCE` | `std` T03_tool-usage-monthly.csv · `cost_usd` |  $8.1M |
| lakeshore-holdings | `ONE_SOURCE` | `std` T03_tool-usage-monthly.csv · `cost_usd` |  $1.4M |
| apex-retail        | `ONE_SOURCE` | `std` T03_tool-usage-monthly.csv · `cost_usd` |  $2.1M |

## Vendor run rate `vendor_run_rate_usd`

| Tenant             | Status       | Asserted by                                                            |     Value |
| ------------------ | ------------ | ---------------------------------------------------------------------- | --------: |
| skyharbor-air      | `ONE_SOURCE` | `std` F11_vendors-contracts-licenses.csv · `annual_run_rate_usd`       | $21938.5M |
| meridian-health    | `CONFLICT`   | `std` F11_vendors-contracts-licenses.csv · `annual_contract_value_usd` |  $1697.5M |
|                    |              | `v3` 07_vendors_contracts.csv · `annual_contract_value_usd`            |     $7.4M |
| first-capital      | `ONE_SOURCE` | `std` F11_vendors-contracts-licenses.csv · `annual_contract_value_usd` |  $1719.7M |
| lakeshore-holdings | `ONE_SOURCE` | `std` F11_vendors-contracts-licenses.csv · `annual_contract_value_usd` |   $918.5M |
| apex-retail        | `ABSENT`     | —                                                                      |         — |
