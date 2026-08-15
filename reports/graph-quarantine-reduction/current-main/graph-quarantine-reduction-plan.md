# Graph Quarantine Reduction Plan

Source SHA: `fef909cd4bae7c7fde7e21f5c6a90e9000d07bf2`

This is a sanitized, report-only reduction plan. It does not write tenant data, activate registries, materialize graph tables, refresh product projections, or make runtime truth claims.

## Current Graph Dry-Run

- Relationship rows: 9633
- Candidate edges: 4454
- Quarantined edges: 5179
- Quarantine rate: 53.76%
- Unique identity aliases indexed: 246
- Ambiguous identity aliases skipped: 61
- Graph tables written: false

## Reduction Paths

| Path                                              | Rows | Disposition                                                                            |
| ------------------------------------------------- | ---: | -------------------------------------------------------------------------------------- |
| `source_data_dimension_or_edge_retirement_gate`   | 4660 | `catalogue-object-from-real-evidence-or-retire-edge-never-create-node-to-satisfy-edge` |
| `upstream_source_absence_or_no_graph_disposition` |  519 | `permanent-quarantine-or-declare-no-graph-until-required-endpoint-fields-exist`        |

## Reason Counts

| Reason                      | Count |
| --------------------------- | ----: |
| `unresolved-to-node`        |  3440 |
| `unresolved-from-node`      |  2713 |
| `missing-from-object-name`  |   519 |
| `missing-to-object-name`    |   519 |
| `missing-from-object-type`  |   510 |
| `missing-relationship-type` |   510 |
| `missing-to-object-type`    |   510 |

## Tenant Aliases

| Tenant    | Rows | Candidates | Quarantined |   Rate | Top reduction path                                |
| --------- | ---: | ---------: | ----------: | -----: | ------------------------------------------------- |
| tenant-01 | 1713 |         10 |        1703 | 99.42% | `source_data_dimension_or_edge_retirement_gate`   |
| tenant-02 |  380 |          0 |         380 |   100% | `source_data_dimension_or_edge_retirement_gate`   |
| tenant-03 | 2302 |       1462 |         840 | 36.49% | `source_data_dimension_or_edge_retirement_gate`   |
| tenant-04 |  364 |          0 |         364 |   100% | `source_data_dimension_or_edge_retirement_gate`   |
| tenant-05 |  519 |          0 |         519 |   100% | `upstream_source_absence_or_no_graph_disposition` |
| tenant-06 | 1037 |          0 |        1037 |   100% | `source_data_dimension_or_edge_retirement_gate`   |
| tenant-07 | 3318 |       2982 |         336 | 10.13% | `source_data_dimension_or_edge_retirement_gate`   |

## Gates Left Closed

- No tenant data mutation, move, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.
