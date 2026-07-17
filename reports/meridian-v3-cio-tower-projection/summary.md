# Meridian V3 to CIO Tower Projection

Generated: 2026-07-17T13:35:22.993Z

This projection turns the refreshed Meridian V3 source packet into the row families Tower actually needs: budget, funded programs, AI spend by platform/vendor, usage/adoption/benefit evidence, candidate AI opportunities, and watch/pressure signals.

It is a dry-run artifact unless executed by the governed ACA data-build job with `--write`.

## Headline

| Item | Value | Source |
| --- | ---: | --- |
| FY26 total technology budget | $650.0M | 08_it_budget_spend_value.csv |
| FY26 run budget | $487.5M | 08_it_budget_spend_value.csv |
| FY26 change budget | $162.5M | 08_it_budget_spend_value.csv |
| Approved program budget | $291.9M | SA04 + 09 |
| AI-tagged spend lens | $53.7M | SA02 + 08 |
| Promised AI value | $35.5M | SA08 |
| Partial finance-validated value | $3.8M | SA08 |
| Realized/proven value allowed | $0.0M | Blocked by claim gate |

## Counts

- Sources: 9
- Entities: 130
- Facts: 444
- Relationships: 49
- Measures: 12
- Measure results: 11

## Decision Lenses

- Program portfolio rows: 12
- AI spend categories: 10
- AI spend vendors/tools: 13
- Usage/benefit rows: 8
- Candidate AI opportunities: 242
- Watch/pressure themes: identity_and_governance, baseline_and_actuals, data_lineage, contact_center_readiness, platform_readiness

## Truth Split

- No Azure/Postgres write is claimed by this dry-run artifact.
- No Active Tenant Access update is claimed.
- No realized/proven/delivered value language is allowed.
- Partial finance-validated value may be shown only with the SA08 caveats.
