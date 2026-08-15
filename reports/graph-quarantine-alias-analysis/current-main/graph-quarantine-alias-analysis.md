# Graph Quarantine Alias Analysis

Source SHA: `c6fde1b7380db40f0527d326142dd1fd2d1368a5`

This is a sanitized, report-only alias-opportunity analysis. It does not activate semantic identity aliases, write tenant data, materialize graph tables, refresh product projections, or make runtime truth claims.

## Direct Answer

Code-only alias candidates exist for 0 unresolved endpoint occurrence(s), representing 0 distinct proposed alias mapping(s). Approved semantic identity aliases were already applied in the input graph reconciliation; this analysis did not activate additional aliases. The remaining 3684 unresolved endpoint(s) require source evidence, dimension catalogue work, or endpoint type correction; edge retirement remains a separate explicit gate.

## Totals

- Relationship rows: 9633
- Quarantined relationships: 3823
- Unresolved endpoints analyzed: 3684
- Code-only alias candidate endpoint occurrences: 0
- Distinct code-only alias candidates: 0
- Fully code-only candidate rows: 0
- Source-data gated endpoints: 3684
- Semantic identity aliases activated: false
- Graph tables written: false

## Endpoint Opportunity Classes

| Class                                                | Endpoints | Disposition                                                                                  |
| ---------------------------------------------------- | --------: | -------------------------------------------------------------------------------------------- |
| `source_data_dimension_or_edge_type_correction_gate` |      3684 | `catalogue-object-from-real-evidence-or-correct-edge-type-never-create-node-to-satisfy-edge` |

## Row Opportunity Classes

| Class                                                | Rows |
| ---------------------------------------------------- | ---: |
| `source_data_dimension_or_edge_type_correction_gate` | 3304 |

## Alias Review Table

These rows are review evidence only. They are not activated aliases.

| Tenant | Endpoint | Proposed canonical | Evidence for mapping | Affected endpoint occurrences |
| ------ | -------- | ------------------ | -------------------- | ----------------------------: |

## Tenant Aliases

| Tenant    | Unresolved endpoints | Code-only candidate endpoints | Source-data gated endpoints | Fully code-only candidate rows |
| --------- | -------------------: | ----------------------------: | --------------------------: | -----------------------------: |
| tenant-01 |                 1703 |                             0 |                        1703 |                              0 |
| tenant-02 |                  760 |                             0 |                         760 |                              0 |
| tenant-03 |                  840 |                             0 |                         840 |                              0 |
| tenant-04 |                  364 |                             0 |                         364 |                              0 |
| tenant-05 |                    0 |                             0 |                           0 |                              0 |
| tenant-06 |                    3 |                             0 |                           3 |                              0 |
| tenant-07 |                   14 |                             0 |                          14 |                              0 |

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
