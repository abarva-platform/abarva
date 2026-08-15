# Graph Quarantine Reduction Plan

Source SHA: `c6fde1b7380db40f0527d326142dd1fd2d1368a5`

This is a sanitized, report-only reduction plan. It does not write tenant data, activate registries, materialize graph tables, refresh product projections, or make runtime truth claims.

## Current Graph Dry-Run

- Relationship rows: 9633
- Candidate edges: 5810
- Quarantined edges: 3823
- Quarantine rate: 39.69%
- Unique identity aliases indexed: 717
- Ambiguous identity aliases skipped: 100
- Graph tables written: false

## Reduction Paths

| Path                                                 | Rows | Disposition                                                                                  |
| ---------------------------------------------------- | ---: | -------------------------------------------------------------------------------------------- |
| `source_data_dimension_or_edge_type_correction_gate` | 3304 | `catalogue-object-from-real-evidence-or-correct-edge-type-never-create-node-to-satisfy-edge` |
| `upstream_source_absence_or_no_graph_disposition`    |  519 | `permanent-quarantine-or-declare-no-graph-until-required-endpoint-fields-exist`              |

## Reason Counts

| Reason                      | Count |
| --------------------------- | ----: |
| `unresolved-to-node`        |  2255 |
| `unresolved-from-node`      |  1429 |
| `missing-from-object-name`  |   519 |
| `missing-to-object-name`    |   519 |
| `missing-from-object-type`  |   510 |
| `missing-relationship-type` |   510 |
| `missing-to-object-type`    |   510 |

## Tenant Aliases

| Tenant    | Rows | Candidates | Quarantined |   Rate | Top reduction path                                   |
| --------- | ---: | ---------: | ----------: | -----: | ---------------------------------------------------- |
| tenant-01 | 1713 |         10 |        1703 | 99.42% | `source_data_dimension_or_edge_type_correction_gate` |
| tenant-02 |  380 |          0 |         380 |   100% | `source_data_dimension_or_edge_type_correction_gate` |
| tenant-03 | 2302 |       1462 |         840 | 36.49% | `source_data_dimension_or_edge_type_correction_gate` |
| tenant-04 |  364 |          0 |         364 |   100% | `source_data_dimension_or_edge_type_correction_gate` |
| tenant-05 |  519 |          0 |         519 |   100% | `upstream_source_absence_or_no_graph_disposition`    |
| tenant-06 | 1037 |       1034 |           3 |  0.29% | `source_data_dimension_or_edge_type_correction_gate` |
| tenant-07 | 3318 |       3304 |          14 |  0.42% | `source_data_dimension_or_edge_type_correction_gate` |

## Gates Left Closed

- No tenant data mutation, move, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.
