# ECL Semantic Pilot Positive Smoke V1 Proof

Status: local disposable Postgres proof only. Not Azure proof, not migration authorization, and not product route proof.

Run date: 2026-08-22.

Runtime:

```text
Postgres 18.4
Disposable local database
Core DDL + projection DDL + metric seed + semantic pilot positive smoke
```

Artifacts executed:

```text
docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql
docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql
docs/architecture/sql-drafts/ecl_metric_dictionary_seed_v1_draft.sql
docs/architecture/sql-drafts/ecl_semantic_pilot_positive_smoke_v1.sql
```

Result:

```text
POSITIVE_SMOKE_OK
TABLE_COUNT=22
```

Core readback:

| Area                 | Count |
| -------------------- | ----: |
| Objects              |     8 |
| Relationships        |     7 |
| Measures             |     7 |
| Commercial contracts |     1 |
| Context packs        |     2 |

Projection readback:

| Projection                | Count |
| ------------------------- | ----: |
| Home                      |     2 |
| Source contract 360       |     1 |
| Source vendor 360         |     1 |
| Tower command center      |     1 |
| Intelligence context pack |     1 |

Home refusal readback:

| Field                | Value                                        |
| -------------------- | -------------------------------------------- |
| `page_key`           | `current_state_data_flow`                    |
| `row_key`            | `data-flow-refusal-low-convergence`          |
| `admission_status`   | `refused`                                    |
| `admission_gate_key` | `end_to_end_data_flow`                       |
| Failed rule          | `FLOW-CONVERGENCE`                           |
| Measurement          | `98% singleton destinations; max inbound 1.` |

Tower gate readback:

| Field                    | Value                         |
| ------------------------ | ----------------------------- |
| `row_key`                | `claim-prior-auth-ai-blocked` |
| `claim_gate_status`      | `gated`                       |
| `claim_gate_reason_code` | `MISSING_USAGE_BASELINE`      |
| `blocked_value_usd`      | `3500000`                     |

Conclusion:

The schema now has a positive local proof that a tiny ECL slice can carry raw evidence, objects, relationships, measures, commercial contract depth, context packs, and the first product projection rows while preserving Home admission/refusal and Tower claim-gate semantics.
