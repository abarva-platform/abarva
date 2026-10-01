# Tower fact lineage

Mode: `quote`.

Default mode. Use before quoting a metric in product copy, QA, or a client-facing narrative.

Included source trees: `active`.

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
| meridian-health | `ONE_SOURCE` | `active` 08_spend_value.csv · `annual_spend_usd` | $960.8M |
| skyharbor-air | `ONE_SOURCE` | `active` 08_spend_value.csv · `annual_spend_usd` | $3417.4M |

## AI-tagged budget `ai_tagged_budget_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ABSENT` | — | — |

## AI initiative funding `ai_initiative_funding_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ABSENT` | — | — |

## Promised benefit `promised_value_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ONE_SOURCE` | `active` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` | $63.8M |
| skyharbor-air | `ONE_SOURCE` | `active` SA08_AI_Benefits_Realization_Usage_Ledger.csv · `promised_value_usd` | $80.2M |

## AI tool cost `ai_tool_cost_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ABSENT` | — | — |

## Vendor run rate `vendor_run_rate_usd`

| Tenant | Status | Asserted by | Value |
| --- | --- | --- | ---: |
| meridian-health | `ABSENT` | — | — |
| skyharbor-air | `ABSENT` | — | — |

