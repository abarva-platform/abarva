# ECL Cube Smoke V1 Proof

Status: local disposable Postgres proof only. Not Azure proof, not migration authorization, and not product route proof.

Run date: 2026-08-22.

Runtime:

```text
Postgres 18.4
Disposable local database
Core DDL + projection DDL + cube DDL + metric seed + semantic pilot positive smoke + projection negative probe + cube positive smoke + cube negative probe
```

Artifacts executed:

```text
docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql
docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql
docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql
docs/architecture/sql-drafts/ecl_metric_dictionary_seed_v1_draft.sql
docs/architecture/sql-drafts/ecl_semantic_pilot_positive_smoke_v1.sql
docs/architecture/sql-drafts/ecl_product_projection_tables_v1_negative_probe.sql
docs/architecture/sql-drafts/ecl_cube_positive_smoke_v1.sql
docs/architecture/sql-drafts/ecl_cube_negative_probe_v1.sql
```

Result:

```text
CUBE_SMOKE_OK
CUBE_NEGATIVE_PROBE_OK
TABLE_COUNT=26
METRIC_DEFINITION_COUNT=37
CUBE_SLICE_COUNT=9
CUBE_SLICE_METRIC_COUNT=29
CUBE_SLICE_MEASURE_COUNT=10
ADMISSION_PAYLOAD_CHECK_COUNT=3
CUBE_METRIC_MEASURE_FK_CHECK_COUNT=4
```

Cube readback:

| Cube                         | Manifest slices | Actual slices |
| ---------------------------- | --------------: | ------------: |
| `ai_portfolio_cube`          |               1 |             1 |
| `architecture_cube`          |               1 |             1 |
| `data_analytics_cube`        |               1 |             1 |
| `home_coverage_cube`         |               1 |             1 |
| `intelligence_citation_cube` |               1 |             1 |
| `source_contract_cube`       |               1 |             1 |
| `source_vendor_cube`         |               1 |             1 |
| `tower_evidence_cube`        |               1 |             1 |
| `tower_spend_value_cube`     |               1 |             1 |

Data analytics cube readback:

| Field      | Value                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| `cube_key` | `data_analytics_cube`                                                              |
| Dimensions | `{"function": "Health Plan Operations", "platform": "Health Plan Analytics Mart"}` |
| Measures   | `{"report_count": 240, "etl_job_count": 180, "data_volume_tb": 52}`                |

Negative probe readback:

```text
Expected check rejection: admitted cube manifest cannot carry refusal payload
Expected FK rejection: cube slice requires manifest FK
Expected check rejection: blocked cube slice requires gap flags
Expected check rejection: cube slice requires measures
Expected FK rejection: cube slice primary metric requires metric_definition
Expected FK rejection: cube slice metric requires metric_definition
Expected FK rejection: cube slice measure requires ecl_context.measure
```

Conclusion:

The cube layer is now a compact physical projection contract: `cube_manifest` plus `cube_slice`, with `cube_slice_metric` and `cube_slice_measure` as the governed reference tables. It can carry all nine target cubes without creating one bespoke table per cube. It rejects missing manifests, invalid admission payloads, empty measures, blocked slices without gap flags, invented metric keys, and invented measure IDs.

`metric_keys_json` and `measures_json` are display/cache payloads only. Governed metric identity is enforced through `cube_slice.primary_metric_key` and `cube_slice_metric.metric_key` FKs to `ecl_context.metric_definition`; measure lineage is enforced through `cube_slice_measure.measure_id` FKs to `ecl_context.measure`.
