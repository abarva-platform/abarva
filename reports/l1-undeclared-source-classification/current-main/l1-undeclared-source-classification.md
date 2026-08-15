# Layer 1 Undeclared Source Classification

Source SHA: `8ef1e70ef69fd85e5e9e095831167fba1306de04`

This is a sanitized, report-only Layer 1 classification. Tenant identifiers are anonymized. It does not amend `template-manifest.json`, move or delete tenant data, load the data plane, refresh projections, or make runtime truth claims.

## Totals

- Active-input CSV files scanned: 167
- Declared template CSV files present: 131
- Undeclared active-input CSV files: 36
- Template contract amended: false

## Classification

| Classification                              | Files |
| ------------------------------------------- | ----: |
| `source_adapter_extract_contract_candidate` |    30 |
| `genuine_new_source_contract_candidate`     |     4 |
| `variant_of_declared_template`              |     2 |

## File Families

| File                                            | Count | Classification                              | Proposed disposition                                                         |
| ----------------------------------------------- | ----: | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `SA08_AI_Benefits_Realization_Usage_Ledger.csv` |     7 | `source_adapter_extract_contract_candidate` | `add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root` |
| `SA09_AI_Tool_Usage_Feed.csv`                   |     7 | `source_adapter_extract_contract_candidate` | `add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root` |
| `SA10_AI_Value_Interview_Evidence.csv`          |     7 | `source_adapter_extract_contract_candidate` | `add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root` |
| `SA11_AI_KPI_Operational_Outcome_Feed.csv`      |     7 | `source_adapter_extract_contract_candidate` | `add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root` |
| `19_data_analytics_platform_maturity.csv`       |     2 | `genuine_new_source_contract_candidate`     | `decide-owning-contract-before-any-template-manifest-amendment`              |
| `08_it_budget_spend_value.csv`                  |     1 | `variant_of_declared_template`              | `rename-or-map-to-existing-declared-template-after-review`                   |
| `12b_interview_initiative_metric_crosswalk.csv` |     1 | `genuine_new_source_contract_candidate`     | `decide-owning-contract-before-any-template-manifest-amendment`              |
| `17_managed_services_scope.csv`                 |     1 | `variant_of_declared_template`              | `rename-or-map-to-existing-declared-template-after-review`                   |
| `20_itsm_ticket_sla_performance.csv`            |     1 | `genuine_new_source_contract_candidate`     | `decide-owning-contract-before-any-template-manifest-amendment`              |
| `SA02_IT_Finance_Budget_Spend_Extract.csv`      |     1 | `source_adapter_extract_contract_candidate` | `add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root` |
| `SA04_Program_Portfolio_Extract.csv`            |     1 | `source_adapter_extract_contract_candidate` | `add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root` |

## Tenant Aliases

| Tenant    | Active-input CSVs | Declared | Undeclared |
| --------- | ----------------: | -------: | ---------: |
| tenant-01 |                23 |       19 |          4 |
| tenant-02 |                23 |       19 |          4 |
| tenant-03 |                24 |       19 |          5 |
| tenant-04 |                23 |       19 |          4 |
| tenant-05 |                23 |       19 |          4 |
| tenant-06 |                25 |       17 |          8 |
| tenant-07 |                26 |       19 |          7 |

## Gates Left Closed

- No template-manifest.json amendment.
- No tenant data mutation, move, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.
