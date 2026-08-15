# Graph Disposition Status

Source SHA: `25f1366bf68d8a053e7b6ae78dff4051cb34b82a`
Graph dry-run generated at: `2026-08-15T04:06:13.018Z`

This is a sanitized, report-only graph status artifact. Tenant identifiers are anonymized, and no graph tables, product projections, registry activations, or tenant data writes are performed.

## Totals

- Relationship rows: 9633
- Candidate edges: 4454
- Quarantined edges: 5179
- Quarantine rate: 53.76%
- Graph tables written: false
- Product read models updated: false
- Quarantined rows missing class/disposition: 0

## Quarantine Classes

| Class                                      | Count | Disposition                                                                            |
| ------------------------------------------ | ----: | -------------------------------------------------------------------------------------- |
| `dangling_reference`                       |  4660 | `catalogue-object-from-real-evidence-or-retire-edge-never-create-node-to-satisfy-edge` |
| `empty_endpoint_or_required_field_missing` |   519 | `permanent-quarantine-until-upstream-source-fields-exist-or-no-graph-is-declared`      |

## Tenant Aliases

| Tenant    | Rows | Candidates | Quarantined |   Rate | Top class                                  |
| --------- | ---: | ---------: | ----------: | -----: | ------------------------------------------ |
| tenant-01 | 1713 |         10 |        1703 | 99.42% | `dangling_reference`                       |
| tenant-02 |  380 |          0 |         380 |   100% | `dangling_reference`                       |
| tenant-03 | 2302 |       1462 |         840 | 36.49% | `dangling_reference`                       |
| tenant-04 |  364 |          0 |         364 |   100% | `dangling_reference`                       |
| tenant-05 |  519 |          0 |         519 |   100% | `empty_endpoint_or_required_field_missing` |
| tenant-06 | 1037 |          0 |        1037 |   100% | `dangling_reference`                       |
| tenant-07 | 3318 |       2982 |         336 | 10.13% | `dangling_reference`                       |

## Open Gates

- No tenant data mutation, move, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.

## Acceptance

- Every remaining quarantined edge has class and disposition: true
- Quarantine rate is reported per tenant with reason breakdown: true
- Graph materialization is still blocked: true
