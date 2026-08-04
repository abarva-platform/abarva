# Tower Data Quality And Reconciliation

Date: 2026-08-03
Database: `abarva_skyharbor_current_state_dev`
Tenant resolved by current Tower read: `skyharbor_global`

## Summary

The local Tower substrate is present and populated, but value realization is not decision-ready. Tower can safely render spend, budget, usage, and provenance coverage. It cannot safely render claimable value, baseline/target/actual outcome movement, or Finance/business-attested benefit.

## Required Counts

| Measure                          | Result |
| -------------------------------- | -----: |
| Metric definitions               |    138 |
| Tracked subjects                 |    407 |
| Metric observations              |  7,174 |
| Metric provenance rows           |      5 |
| Value claims                     |    162 |
| Claims with known dollar value   |      0 |
| Claims with unknown dollar value |    162 |
| Claims with baseline observation |      0 |
| Claims with target observation   |      0 |
| Claims with actual observation   |      0 |
| Claims with Finance attestation  |      0 |
| Claims with business attestation |      0 |
| Stale claims                     |      0 |
| Disputed claims                  |      0 |

Table-count payload hash: `c4be15c63b5fdf58eac4666d187b678a`
Claim-state payload hash: `8da33ffb0ac0c96238aa9829436456d2`

## Claim-State Distribution

| Claim state          | Claims | Known values | Unknown values | Baseline | Target | Actual |
| -------------------- | -----: | -----------: | -------------: | -------: | -----: | -----: |
| `funded_no_baseline` |    150 |            0 |            150 |        0 |      0 |      0 |
| `usage_supported`    |     12 |            0 |             12 |        0 |      0 |      0 |

## Reconciled Control Figures

| Control                                     | Query basis                                                              |        Result |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------------: |
| FY2027 technology budget                    | `tower.metric_observation`, `finance.total_it_budget`, scenario `target` | 2,350,000,000 |
| FY2026 technology actual/budget observation | `tower.metric_observation`, `finance.total_it_budget`, scenario `actual` | 2,180,000,000 |
| Finance actual spend                        | `tower.metric_observation`, `finance.actual_spend`, scenario `actual`    | 3,770,437,521 |
| AI estimated use cost                       | `tower.metric_observation`, `ai.estimated_use_cost`, scenario `actual`   |   170,249,334 |
| Active AI users                             | `tower.metric_observation`, `ai.active_users`, scenario `actual`         |       705,878 |
| AI seats purchased                          | `tower.metric_observation`, `ai.seats_purchased`, scenario `actual`      |     2,381,843 |

Contract annual value is present in the Source projection path, but it is not directly consumed by the current `/tower` command center read adapter.

AI seat utilization has data coverage through `ai.active_users`, `ai.seats_purchased`, and `ai.active_user_rate`, but the current audit did not complete a separate violation rule because no approved threshold/rule table was found in the Tower read path.

## Provenance Coverage

`tower.metric_provenance` contains 5 rows. All are `not_attested`.

| Source system                    | Source table                                  | Attestation    |
| -------------------------------- | --------------------------------------------- | -------------- |
| AI tool admin exports            | `raw_enterprise_it.ai_adoption_usage`         | `not_attested` |
| Cloud cost and operations export | `raw_cloud_hybrid.cloud_operations_economics` | `not_attested` |
| ERP / FP&A budget extract        | `raw_enterprise_it.it_budget_allocations`     | `not_attested` |
| KPI source files                 | `raw_enterprise_it.kpis_outcomes`             | `not_attested` |
| PMO project portfolio            | `raw_enterprise_it.projects_investments`      | `not_attested` |

## Null And Unknown Behavior

The current unknown-value behavior is correct at the data-boundary level:

- Unknown value is not converted into zero.
- Claimable value remains zero because no claim gate is allowed.
- The waterfall is withheld when every claim has unknown financial amount.

The current page behavior is not good enough:

- It repeats row-level unknown states instead of explaining the portfolio-level missing layer.
- It shows empty blocker tables because blocked dollar impact cannot be computed from unknown value.
- It produces generic actions because missing proof is not represented as first-class data.

## Queries Used

```sql
select 'metric_definition' k, count(*)::text v from tower.metric_definition
union all select 'tracked_subject', count(*)::text from tower.tracked_subject
union all select 'metric_observation', count(*)::text from tower.metric_observation
union all select 'metric_provenance', count(*)::text from tower.metric_provenance
union all select 'value_claim', count(*)::text from tower.value_claim;
```

```sql
select
  claim_state,
  count(*) as claims,
  count(calculated_value) as known_values,
  count(*) filter (where calculated_value is null) as unknown_values,
  count(baseline_observation_id) as has_baseline,
  count(target_observation_id) as has_target,
  count(actual_observation_id) as has_actual
from tower.value_claim
group by claim_state
order by claim_state;
```

```sql
select metric_ref, scenario, count(*) as observations, count(value_num) as numeric_values, sum(value_num) as sum_value
from tower.metric_observation
where tenant_key='skyharbor_global'
  and metric_ref in (
    'finance.total_it_budget',
    'finance.actual_spend',
    'ai.estimated_use_cost',
    'ai.active_users',
    'ai.seats_purchased',
    'ai.active_user_rate'
  )
group by metric_ref, scenario
order by metric_ref, scenario;
```

## Quality Gate Recommendation

Do not treat this Tower dataset as value-realization ready. It is safe for spend, usage, and evidence-readiness inspection. It is not safe for claimable outcome, ROI, realized savings, or “scale this investment” decisions until the value-claim rows carry baseline, target, actual, calculated value, provenance, and Finance/business attestation.
