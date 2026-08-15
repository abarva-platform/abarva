# Scoped Layer Refresh Status

Generated from current checkout `origin/main@d2c840a09c9420d2783c549653b00166049aedc7`
plus the S0 relationship-resolution branch dry-run.

Scope: two approved synthetic tenant packages only. Validators still run across all active tenants.

## Headline

The S0 graph-resolution fix is ready for PR: the scoped local dry-run plans `4,355` graph
relationship candidates from `4,355` relationship rows, with `0` quarantined rows. This is still a
dry-run: no canonical rows, graph tables, product read models, cubes, retrieval indexes, or runtime
state were written locally.

## Layer Volumetrics

| Layer                             | Source / Input                                                   |                                                                                                                                       Current Volumetric | Refreshed In This Branch?                                                                                                           | Hierarchy / Metric / Drill Path Signal                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layer 1 intake                    | Active current folders for the two scoped packages               |                                                                                          `56` files total: `51` CSV + `5` XLSX; `11,197` parsed CSV rows | Partially: `3` relationship endpoint cells corrected in one active CSV. No new source files.                                        | Hierarchy inputs include business functions and organization ownership. Metric inputs include spend/value, metrics/outcomes, and supplemental value feeds. Drill inputs include relationships and evidence sources.                |
| Layer 2 adapters / reconciliation | Contract-domain CSV inputs consumed by the runtime layer dry-run |                     `36` domain source files; `9,786` accepted canonical candidate records; `247` skipped source rows; `0` quarantined canonical records | Yes, dry-run only. Reconciliation normalization resolves mistyped technology-ownership targets through existing same-system owners. | Hierarchy path is source row -> adapter object -> canonical candidate. Metric path is metric/spend source row -> canonical candidate. Drill path is relationship row -> validated edge candidate.                                  |
| Layer 3 canonical / graph         | Runtime layer dry-run and graph reconciliation outputs           |                                  `9,786` canonical objects planned; `1,723` graph nodes planned; `4,355` graph edges planned; `0` graph rows quarantined | Planned only: `canonicalObjectsWritten=0`, `graphTablesWritten=false`                                                               | Hierarchy is materializable as organization/function/system ownership graph. Metric edges are materializable where relationship rows target metrics/functions. Drill paths are materializable as graph edges, but not written yet. |
| Layer 4 projections / cubes       | Existing Source layer-cube package plus runtime dry-run flags    | Existing cube package: `362` cube fact rows, `10` cube dimension rows, `10` cube measure rows, `2` cube gate flags; existing read models total `78` rows | No: `productReadModelsUpdated=false`; cubes/read models were not rebuilt from this S0 branch                                        | Hierarchy/metric/drill paths remain existing projection artifacts until the approved L4 refresh runs from written Layer 3.                                                                                                         |

## Existing Source Cube / Read-Model Volumetrics

These are existing package counts, not proof that S0 refreshed Layer 4.

| Artifact                                                       |  Rows |
| -------------------------------------------------------------- | ----: |
| `cube/source_contract_cube.csv`                                | `362` |
| `cube/cube_dimensions.csv`                                     |  `10` |
| `cube/cube_measures.csv`                                       |  `10` |
| `cube/cube_gate_flags.csv`                                     |   `2` |
| `layer_4_read_models/source_contract_360_read_model.csv`       |   `2` |
| `layer_4_read_models/source_contract_portfolio.csv`            |   `2` |
| `layer_4_read_models/source_evidence_gate_read_model.csv`      |  `48` |
| `layer_4_read_models/source_new_event_learning_read_model.csv` |  `16` |
| `layer_4_read_models/source_opportunity_read_model.csv`        |   `8` |
| `layer_4_read_models/tower_value_read_model.csv`               |   `2` |

## Proof Commands

- `npm run data-build:runtime-layer-refresh -- --tenant meridian-health --tenant skyharbor-air --out-dir /tmp/nexus-layer-table-s0-code-final-d2c840a0 --build-version layer-table-s0-code-final-d2c840a0 --input-source-version d2c840a09c9420d2783c549653b00166049aedc7 --idempotency-key layer-table-s0-code-final-d2c840a0`
  - Result: `status=pass`, `canonicalObjectsPlanned=9786`, `graphNodesPlanned=1723`,
    `graphEdgesPlanned=4355`, `quarantinedRelationships=0`,
    `graphTablesWritten=false`, `productReadModelsUpdated=false`.
- `jq '.totals | {relationshipRows, relationshipCandidates, quarantinedRelationships, graphTablesWritten, productReadModelsUpdated}' /tmp/nexus-layer-table-s0-code-final-d2c840a0/graph-reconciliation/summary.json`
  - Result: `relationshipRows=4355`, `relationshipCandidates=4355`,
    `quarantinedRelationships=0`, `graphTablesWritten=false`, `productReadModelsUpdated=false`.
- `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-s0-code-tenant-quality-d2c840a0`
  - Result: passed, `7` active tenants audited.
- `npm run validate:context-corpus`
  - Result: passed.
- `npm run release:check`
  - Result: passed after restoring known legacy-purge report churn.
- `git diff --check`
  - Result: passed.

## Not Yet Refreshed

- Layer 3 canonical writes have not run in the data plane.
- Graph tables have not been materialized.
- Layer 4 Home/Tower/Source projections and cube read models have not been rebuilt from written
  Layer 3.
- Retrieval has not been loaded, indexed, retrievable-tested, or citation-proven.
- Signed-in runtime proof has not run from the refreshed layers.
