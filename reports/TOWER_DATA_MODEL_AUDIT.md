# Tower Data Model Audit

Date: 2026-08-02

Scope: local Postgres only, database `abarva_skyharbor_current_state_dev`. No Azure, ACA, production, canonical promotion, or shared database mutation was performed.

## Executive Finding

Tower should read from the new `tower.*` schema, not the retired `cio_tower.mart_*` mart layer. The local database has populated `tower` canonical/read-model tables and no local `cio_tower` schema. The `/tower` page was therefore sparse because the runtime path still expected the old mart contract.

## Schema Inventory

Observed local schemas:

- `doc`
- `governance`
- `mart`
- `meta`
- `narrative`
- `raw_cloud_hybrid`
- `raw_data_analytics`
- `raw_enterprise_it`
- `raw_load_control`
- `sem`
- `source`
- `tower`

Not observed locally:

- `cio_tower`
- `home`
- `architecture`

## Tower Tables And Views

Observed `tower` relations:

- `tower.metric_definition`
- `tower.tracked_subject`
- `tower.metric_observation`
- `tower.metric_provenance`
- `tower.value_claim`
- `tower.metric_provenance_current`
- `tower.value_claim_current`
- `tower.value_funnel`
- `tower.stale_metric`
- `tower.disputed_metric`

Local row counts:

| Relation | Rows |
| --- | ---: |
| `tower.metric_definition` | 138 |
| `tower.tracked_subject` | 407 |
| `tower.metric_observation` | 7,174 |
| `tower.metric_provenance` | 5 |
| `tower.value_claim` | 162 |

## Claim And Evidence State

| Measure | Local Count |
| --- | ---: |
| Total value claims | 162 |
| Known dollar-value claims | 0 |
| Unknown dollar-value claims | 162 |
| Claims with baseline | 0 |
| Claims with target | 0 |
| Claims with actual | 0 |
| Finance-attested claims | 0 |
| Business-attested claims | 0 |
| Stale claims | 0 |
| Disputed claims | 0 |
| Quality guardrail failures | 0 |
| Risk guardrail failures | 0 |
| Provenanced observations | 7,174 / 7,174 |

Claim-state distribution:

| Claim State | Count |
| --- | ---: |
| `funded_no_baseline` | 150 |
| `usage_supported` | 12 |

## Controls

The local model exposes budget and control signals, but they are not value-realization proof:

| Control | Value |
| --- | ---: |
| FY2027 technology budget | 2,350,000,000 |
| FY2026 technology actual | 2,180,000,000 |
| Contract annual value | 1,480,500,000 |
| AI seat violations | 3,000 |

Audit result hash: `f9cab2359aed07c0b2b9ff31899a6b165da650ae0724c26731e2067533fe2ce3`.

## `cio_tower.mart_*` Sunset

All old `cio_tower.mart_*` product mart tables should be archived, sunset, and purged through the database change lane. This branch removes the `/tower` runtime dependency on `cio_tower.mart_*`; it does not perform destructive database changes against shared or production environments.

Required database retirement sequence:

1. Confirm no runtime SQL, jobs, reports, dashboards, or API routes still reference `cio_tower.mart_*`.
2. Export/archive the old mart tables to the approved retention location with table names, row counts, checksums, and timestamp.
3. Revoke application read access to `cio_tower.mart_*`.
4. Drop or rename the old mart tables only after the archive manifest and rollback path are approved.
5. Remove compatibility code after the purge is verified in local/lab and no product surface reads the old mart.

## Data Model Defect

The existing local `tower.value_funnel` view uses zero-fill semantics for value fields, so unknown financial value can look like evidenced zero. This branch adds `db/tower/20260802_tower_value_funnel_unknown_safe.sql` as reviewable DDL to preserve unknown values as unknown.

