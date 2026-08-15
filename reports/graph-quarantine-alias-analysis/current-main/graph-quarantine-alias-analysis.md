# Graph Quarantine Alias Analysis

Source SHA: `6ac668f96e79debb431bb1b46f798f7f72a41005`

This is a sanitized, report-only alias-opportunity analysis. It does not activate semantic identity aliases, write tenant data, materialize graph tables, refresh product projections, or make runtime truth claims.

## Direct Answer

Code-only alias candidates exist for 50 unresolved endpoint(s), but semantic identity alias activation remains gated. The remaining 6103 unresolved endpoint(s) require source evidence, dimension catalogue work, or edge retirement.

## Totals

- Relationship rows: 9633
- Quarantined relationships: 5179
- Unresolved endpoints analyzed: 6153
- Code-only alias candidate endpoints: 50
- Fully code-only candidate rows: 50
- Source-data gated endpoints: 6103
- Semantic identity aliases activated: false
- Graph tables written: false

## Endpoint Opportunity Classes

| Class                                           | Endpoints | Disposition                                                                            |
| ----------------------------------------------- | --------: | -------------------------------------------------------------------------------------- |
| `source_data_dimension_or_edge_retirement_gate` |      6103 | `catalogue-object-from-real-evidence-or-retire-edge-never-create-node-to-satisfy-edge` |
| `code_only_acronym_alias_candidate`             |        50 | `semantic-identity-alias-activation-gated`                                             |

## Row Opportunity Classes

| Class                                           | Rows |
| ----------------------------------------------- | ---: |
| `source_data_dimension_or_edge_retirement_gate` | 4610 |
| `all_unresolved_endpoints_code_only_candidate`  |   50 |

## Tenant Aliases

| Tenant    | Unresolved endpoints | Code-only candidate endpoints | Source-data gated endpoints | Fully code-only candidate rows |
| --------- | -------------------: | ----------------------------: | --------------------------: | -----------------------------: |
| tenant-01 |                 1703 |                             0 |                        1703 |                              0 |
| tenant-02 |                  760 |                             0 |                         760 |                              0 |
| tenant-03 |                  840 |                             0 |                         840 |                              0 |
| tenant-04 |                  364 |                             0 |                         364 |                              0 |
| tenant-05 |                    0 |                             0 |                           0 |                              0 |
| tenant-06 |                 2074 |                             0 |                        2074 |                              0 |
| tenant-07 |                  412 |                            50 |                         362 |                             50 |

## Next Safe Slice

- Evaluate acronym alias candidates behind an explicit semantic-identity gate: Add fault-injected tests for unique acronym alias matching without changing graph materialization, registry activation, tenant data, or product read models.

## Gates Left Closed

- No semantic identity alias activation.
- No tenant data mutation, move, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.
