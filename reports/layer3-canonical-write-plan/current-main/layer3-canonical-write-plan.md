# Layer 3 Canonical Write Plan

Source SHA: `dc8f3b7169eca5ca3109c4b9ef1af41f1635a315`

This is a sanitized, report-only canonical write plan. Tenant identifiers are anonymized. No canonical store, registry, graph table, data plane, product projection, or runtime surface is written or activated.

## Totals

- Tenants planned: 7
- Layer 2 profile dry-run rows: 133
- Profile dry-run rows that would run: 133
- Estimated canonical object records that would be written: 20173
- Estimated fact values that would be evaluated: 4173
- Canonical objects written: 0
- Canonical store write ready without hard gates: false

## Object Plan

| Object type                | Family           | Source rows | Would write | Identity                      |
| -------------------------- | ---------------- | ----------: | ----------: | ----------------------------- |
| `ai_use_case`              | `ai`             |         530 |         530 | `useCaseName`                 |
| `application_system`       | `application`    |        1550 |        1550 | `systemName`                  |
| `business_function`        | `organization`   |         400 |         400 | `functionName`                |
| `data_asset`               | `data`           |        1726 |        1726 | `dataAssetName`               |
| `enterprise_profile`       | `enterprise`     |          15 |          15 | `entityName`                  |
| `evidence_source`          | `evidence`       |         593 |         593 | `sourceFile`                  |
| `expert_lens`              | `expert`         |          55 |          55 | `lensName`                    |
| `industry_context_pattern` | `industry`       |         315 |         315 | `patternName`                 |
| `infrastructure_platform`  | `infrastructure` |         236 |         236 | `platformName`                |
| `managed_service_scope`    | `vendor`         |         262 |         262 | `serviceName`                 |
| `metric_outcome`           | `finance`        |         846 |         846 | `metricName`                  |
| `operational_process`      | `process`        |         400 |         400 | `processName`                 |
| `organization_unit`        | `organization`   |         841 |         841 | `orgUnit`                     |
| `program_initiative`       | `program`        |         531 |         531 | `programName`                 |
| `relationship_edge`        | `relationship`   |        9633 |        9633 | `relationshipType`            |
| `risk_control`             | `risk`           |         736 |         736 | `riskOrControlName`           |
| `spend_value_signal`       | `finance`        |         515 |         515 | `spendCategory`               |
| `vendor_contract`          | `vendor`         |         625 |         625 | `vendorName`                  |
| `workforce_role`           | `workforce`      |         364 |         364 | `personaOrRole; functionName` |

## Fact Plan

| Fact key                                   | Object type             | Value type | Would evaluate | Use policy                   |
| ------------------------------------------ | ----------------------- | ---------- | -------------: | ---------------------------- |
| `business_function.annualBudgetUsd`        | `business_function`     | `currency` |            400 | `must_not_be_model_invented` |
| `business_function.fteCount`               | `business_function`     | `number`   |            400 | `must_not_be_model_invented` |
| `enterprise_profile.employeeCount`         | `enterprise_profile`    | `number`   |             15 | `must_not_be_model_invented` |
| `enterprise_profile.revenueUsd`            | `enterprise_profile`    | `currency` |             15 | `must_not_be_model_invented` |
| `managed_service_scope.runCostUsd`         | `managed_service_scope` | `currency` |            262 | `must_not_be_model_invented` |
| `program_initiative.budgetUsd`             | `program_initiative`    | `currency` |            531 | `must_not_be_model_invented` |
| `program_initiative.expectedValueUsd`      | `program_initiative`    | `currency` |            531 | `must_not_be_model_invented` |
| `spend_value_signal.annualSpendUsd`        | `spend_value_signal`    | `currency` |            515 | `must_not_be_model_invented` |
| `spend_value_signal.savingsOpportunityUsd` | `spend_value_signal`    | `currency` |            515 | `must_not_be_model_invented` |
| `vendor_contract.annualSpendUsd`           | `vendor_contract`       | `currency` |            625 | `must_not_be_model_invented` |
| `workforce_role.roleCount`                 | `workforce_role`        | `number`   |            364 | `must_not_be_model_invented` |

## Tenant Aliases

| Tenant    | Profiles | Would run | Source rows | Would write objects | Would evaluate facts |
| --------- | -------: | --------: | ----------: | ------------------: | -------------------: |
| tenant-01 |       19 |        19 |        2769 |                2769 |                  342 |
| tenant-02 |       19 |        19 |        1717 |                1717 |                  400 |
| tenant-03 |       19 |        19 |        3790 |                3790 |                  285 |
| tenant-04 |       19 |        19 |         622 |                 622 |                  261 |
| tenant-05 |       19 |        19 |        1704 |                1704 |                  397 |
| tenant-06 |       19 |        19 |        4734 |                4734 |                 2248 |
| tenant-07 |       19 |        19 |        4837 |                4837 |                  240 |

## Gates Left Closed

- No tenant data mutation, move, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No semantic identity alias activation.
- No graph dictionary/object-registry activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.
