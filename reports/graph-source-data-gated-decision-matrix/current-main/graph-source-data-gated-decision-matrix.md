# Graph Source-Data-Gated Decision Matrix

Source SHA: `ee14b409a9a93ca1286d8b7b38e6823ab35db6a7`

This is a report-only decision matrix for graph reconciliation endpoints that still cannot be resolved by code-only alias handling. Tenant identifiers are anonymized. Endpoint labels are omitted unless the script is run with an explicit local labels flag.

## Direct Answer

There are 6103 source-data-gated unresolved endpoint occurrence(s), grouped into 1632 decision row(s). No graph tables, canonical data-plane state, tenant data, or Layer 4 projections were written.

## Required Decision

Every row requires one of two source-owner decisions: catalogue the object from real evidence, or retire/correct the relationship edge. Creating placeholder nodes just to satisfy edges remains blocked.

## Totals

- Relationship rows: 9633
- Quarantined relationships: 5129
- Decision rows: 1632
- Source-data-gated endpoint occurrences: 6103
- Endpoint labels included: false
- Graph tables written: false

## Object-Type Breakdown

| Object type               | Endpoint occurrences | Decision rows |
| ------------------------- | -------------------: | ------------: |
| `vendor_contract`         |                  895 |           633 |
| `data_asset`              |                  655 |           184 |
| `program_initiative`      |                  683 |           183 |
| `evidence_source`         |                  247 |           161 |
| `application_system`      |                 1020 |           152 |
| `workforce_role`          |                 1423 |           133 |
| `business_function`       |                  175 |            80 |
| `risk_control`            |                  365 |            68 |
| `ai_use_case`             |                  211 |            23 |
| `metric_outcome`          |                  126 |             5 |
| `operational_process`     |                    9 |             5 |
| `organization_unit`       |                   25 |             3 |
| `infrastructure_platform` |                  269 |             2 |

## Tenant Breakdown

| Tenant    | Endpoint occurrences | Decision rows |
| --------- | -------------------: | ------------: |
| tenant-06 |                 2074 |           807 |
| tenant-01 |                 1703 |           320 |
| tenant-04 |                  364 |           197 |
| tenant-07 |                  362 |           173 |
| tenant-03 |                  840 |           105 |
| tenant-02 |                  760 |            30 |

## Closed Gates

- No graph dictionary or object-registry activation.
- No semantic identity alias activation beyond the already approved three-record ledger.
- No graph materialization.
- No canonical/data-plane write.
- No Layer 4 projection or product read-model refresh.
- No tenant data mutation.
- No live-client truth claim.
