# Tower fact lineage

Mode: `migration-audit`.

Optional mode. Use to find drift between active intake and legacy standardized packs.

Included source trees: `active`, `std`.

For each headline metric and tenant: every in-scope file that asserts a value, and whether the in-scope assertions agree. Run quote mode before quoting any number from this pack.

| Status | Meaning |
| --- | --- |
| `AGREE` | Several sources, all within 2% |
| `CONFLICT` | Sources materially disagree — someone must pick and say why |
| `ONE_SOURCE` | Only one file asserts it; nothing corroborates it |
| `ABSENT` | No file asserts it — the only safe case for "we don't have this" |

## IT budget (FY26) `it_budget_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ONE_SOURCE` | `std` F12_it-budget-financials.csv · `budget_fy26_usd` | $2578.0M |

## AI-tagged budget `ai_tagged_budget_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ABSENT` | — | — |

## AI initiative funding `ai_initiative_funding_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ONE_SOURCE` | `std` T08_spend-contracts.csv · `budget_fy26_usd` | $1031.3M |

## Promised benefit `promised_value_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `CONFLICT` | `std` T07_benefit-realization.csv · `promised_benefit_usd` | $742.0M |
|  |  | `std` T00_ai-investment-super-template.csv · `promised_benefit_usd` | $742.0M |
|  |  | `active` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` | $63.8M |
| skyharbor-air | `CONFLICT` | `std` T07_benefit-realization.csv · `promised_benefit_usd` | $3374.0M |
|  |  | `std` T00_ai-investment-super-template.csv · `promised_benefit_usd` | $2874.0M |
|  |  | `active` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` | $80.2M |

## AI tool cost `ai_tool_cost_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ONE_SOURCE` | `std` T03_tool-usage-monthly.csv · `cost_usd` | $10.2M |

## Vendor run rate `vendor_run_rate_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ONE_SOURCE` | `std` F11_vendors-contracts-licenses.csv · `annual_contract_value_usd` | $1697.5M |
| skyharbor-air | `ONE_SOURCE` | `std` F11_vendors-contracts-licenses.csv · `annual_contract_value_usd` | $21938.5M |

