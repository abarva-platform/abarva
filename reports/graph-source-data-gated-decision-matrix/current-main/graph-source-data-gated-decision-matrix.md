# Graph Source-Data-Gated Decision Matrix

Source SHA: `c6fde1b7380db40f0527d326142dd1fd2d1368a5`

This is a report-only decision matrix for graph reconciliation endpoints that still cannot be resolved by code-only alias handling. Tenant identifiers are anonymized. Endpoint labels are omitted unless the script is run with an explicit local labels flag.

## Direct Answer

There are 3684 source-data-gated unresolved endpoint occurrence(s), grouped into 656 decision row(s). No graph tables, canonical data-plane state, tenant data, or Layer 4 projections were written.

## Required Decision

Every row requires one of two source-owner decisions: catalogue the object from real evidence, or correct the relationship endpoint type. Creating placeholder nodes just to satisfy edges remains blocked, and edge retirement remains a separate explicit gate.

## Totals

- Relationship rows: 9633
- Quarantined relationships: 3823
- Decision rows: 656
- Source-data-gated endpoint occurrences: 3684
- Endpoint labels included: false
- Graph tables written: false

## Object-Type Breakdown

| Object type               | Endpoint occurrences | Decision rows |
| ------------------------- | -------------------: | ------------: |
| `vendor_contract`         |                  383 |           257 |
| `workforce_role`          |                 1403 |           116 |
| `data_asset`              |                  402 |            86 |
| `business_function`       |                  145 |            56 |
| `program_initiative`      |                  252 |            53 |
| `application_system`      |                  419 |            44 |
| `risk_control`            |                  221 |            35 |
| `metric_outcome`          |                  126 |             5 |
| `ai_use_case`             |                   64 |             2 |
| `infrastructure_platform` |                  269 |             2 |

## Tenant Breakdown

| Tenant    | Endpoint occurrences | Decision rows |
| --------- | -------------------: | ------------: |
| tenant-01 |                 1703 |           320 |
| tenant-04 |                  364 |           197 |
| tenant-03 |                  840 |           105 |
| tenant-02 |                  760 |            30 |
| tenant-06 |                    3 |             3 |
| tenant-07 |                   14 |             1 |

## Closed Gates

- No graph dictionary or object-registry activation.
- No semantic identity alias activation beyond the already approved three-record ledger.
- No graph materialization.
- No canonical/data-plane write.
- No Layer 4 projection or product read-model refresh.
- No tenant data mutation.
- No live-client truth claim.
