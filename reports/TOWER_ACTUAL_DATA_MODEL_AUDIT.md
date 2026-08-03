# Tower Actual Data Model Audit

Date: 2026-08-03
Database: `abarva_skyharbor_current_state_dev`
Branch: `codex/tower-page-data-model-audit`

## Scope

This audit checks the current Tower implementation and the local PostgreSQL model named in the execution prompt. It does not mutate Azure, ACA, production PostgreSQL, authentication, or deployed tenant environments.

Evidence packages present locally:

| Package | SHA-256 |
| --- | --- |
| `/Users/anand/Downloads/SkyHarbor_Tower_Value_Proof_Requirements_20260802_113239.zip` | `7e57ce911bd58954a4b1bf5061c84101c87d44b7a0438720f14ca1f8e308d853` |
| `/Users/anand/Downloads/SkyHarbor_Source_Tower_Local_Load_Audit_20260802_120024.zip` | `4e65c6dc32d84d6b299aa7573670fd76056dd6bbec9b5e43b560723a6a7e9df8` |
| `/Users/anand/Downloads/SkyHarbor_Postgres_Layers_Cube_Audit_20260802T182921.zip` | `18ba2aae8e7af716acd0d676f1963cd2499eedb405e9901d6641bab14e05de4e` |
| `/Users/anand/Downloads/SkyHarbor_Enterprise_Landscape_20260802_130019.zip` | `bc441d43aa5374c0b67a9d8bb7140b74ded1de5dd6d7fff852b6aeaac1ba15dc` |

## What Exists

The intended universal Tower tables exist and are populated:

| Object | Rows |
| --- | ---: |
| `tower.metric_definition` | 138 |
| `tower.tracked_subject` | 407 |
| `tower.metric_observation` | 7,174 |
| `tower.metric_provenance` | 5 |
| `tower.value_claim` | 162 |

Result hash for the table-count payload: `c4be15c63b5fdf58eac4666d187b678a`.

The supporting schemas named in the prompt also exist locally: `doc`, `governance`, `meta`, `raw_cloud_hybrid`, `raw_data_analytics`, `raw_enterprise_it`, `raw_load_control`, `sem`, `source`, and `tower`.

The old `cio_tower` schema and `cio_tower.mart_*` tables are not present in this local database.

## Current Runtime Wiring

Current route:

- `/tower`: `src/app/(maestro)/tower/page.tsx`
- `/tower/command`: redirects to `/tower`
- `/tower/legacy`: redirects to `/tower`

Current component root:

- `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`
- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/TowerCommandCenter.module.css`

Current read adapter:

- `src/lib/tower/readTowerCommandCenter.ts`

The adapter now reads the new physical model directly:

- `tower.value_claim`
- `tower.metric_observation`
- `tower.metric_provenance`
- `tower.tracked_subject`
- `raw_enterprise_it.it_budget_allocations`

At audit start, the presentation contract still contained stale language saying the design shape was populated from `cio_tower.mart_*`. This branch removes that active command-center wording and changes the aVa surface context source to `tower_schema_command_center`.

## Populated Shape

Tracked subjects for `skyharbor_global`:

| Subject kind | Rows |
| --- | ---: |
| `initiative` | 151 |
| `workflow` | 120 |
| `contract` | 119 |
| `developer_ai_tool` | 7 |
| `cloud_estate` | 5 |
| `service_agent` | 5 |

Key metric observations for `skyharbor_global`:

| Metric | Scenario | Rows | Numeric values | Sum |
| --- | --- | ---: | ---: | ---: |
| `finance.total_it_budget` | `target` | 1 | 1 | 2,350,000,000 |
| `finance.total_it_budget` | `actual` | 1 | 1 | 2,180,000,000 |
| `finance.actual_spend` | `actual` | 2 | 2 | 3,770,437,521 |
| `ai.estimated_use_cost` | `actual` | 480 | 480 | 170,249,334 |
| `ai.active_users` | `actual` | 480 | 480 | 705,878 |
| `ai.seats_purchased` | `actual` | 480 | 480 | 2,381,843 |

Provenance exists but is not attested:

| Source system | Source table | Attestation |
| --- | --- | --- |
| AI tool admin exports | `raw_enterprise_it.ai_adoption_usage` | `not_attested` |
| Cloud cost and operations export | `raw_cloud_hybrid.cloud_operations_economics` | `not_attested` |
| ERP / FP&A budget extract | `raw_enterprise_it.it_budget_allocations` | `not_attested` |
| KPI source files | `raw_enterprise_it.kpis_outcomes` | `not_attested` |
| PMO project portfolio | `raw_enterprise_it.projects_investments` | `not_attested` |

## What Is Empty Or Missing

The value-claim layer is structurally populated but decision-proof incomplete:

| Claim state | Claims | Known calculated values | Unknown values | Baseline IDs | Target IDs | Actual IDs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `funded_no_baseline` | 150 | 0 | 150 | 0 | 0 | 0 |
| `usage_supported` | 12 | 0 | 12 | 0 | 0 | 0 |

Result hash for the claim-state payload: `8da33ffb0ac0c96238aa9829436456d2`.

No local `tower.value_claim` row has:

- `calculated_value`
- `baseline_observation_id`
- `target_observation_id`
- `actual_observation_id`
- Finance attestation state
- Business attestation state

## Unsafe Or Confusing

1. The UI is honest to withhold unknown financial value, but the current design spreads that sparse state across every tab as repetitive “Unknown” rows. That looks broken even though the claim gate is doing the right thing.
2. `readTowerCommandCenter.ts` returns `requiredFieldGaps: []`, so the Evidence tab cannot render an actual field-level evidence ledger. It derives business gaps from incomplete program claims instead.
3. Some compatibility type names still use `TowerMart*`; active command-center comments and runtime context no longer point to `cio_tower.mart_*`.
4. The page shell lacked horizontal-fit contracts; authenticated screenshots showed Tower content clipped on the left while global nav remained anchored.

## Reusable

- The five universal Tower tables are the right substrate to keep.
- The active read adapter already reads `tower.*`; do not resurrect `cio_tower.mart_*`.
- The deterministic claim gate correctly avoids turning unknown value into zero.
- The six-tab command-center component has usable interaction coverage and a CSS contract test surface.

## Correct Before UI Wiring

1. Add a real Tower field/evidence gap projection, or map claim incompleteness into a compact page-level “not loaded enough to decide” state.
2. Reframe all six pages for the incomplete-value state rather than repeating row-level “Unknown” everywhere.
3. Continue retiring `mart` compatibility naming in a later cleanup once downstream type imports are renamed.
4. Preserve the new horizontal-fit CSS contract and add signed-in browser proof at production width.
