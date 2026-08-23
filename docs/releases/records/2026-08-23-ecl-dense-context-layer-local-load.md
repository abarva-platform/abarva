# 2026-08-23-ecl-dense-context-layer-local-load — ECL Dense Context Layer Local Load

## Release ID

`2026-08-23-ecl-dense-context-layer-local-load`

## Status

`candidate`

## Plain-English Summary

Adds a local disposable-Postgres proof runner that loads the dense source-room package into `ecl_source` and then maps it into core `ecl_context` tables. This proves the dense source package can become canonical objects, relationships, metrics, measures, snapshots, and context packs without Azure or product-route changes.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: regenerates and validates the dense synthetic source-room package as input.

Layer 2 source adapters: exercises source-room-to-context mapping for generated extracts.

Layer 3 canonical model: loads `ecl_source` plus `ecl_context.object`, `relationship`, `metric_definition`, `measure`, `snapshot`, and `context_pack` in disposable local Postgres.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as local context-layer proof tooling.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_context_layer.py`
- package script for local context-layer disposable-Postgres proof

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/load_dense_source_room_context_layer.py`
- `npm run ecl:source-room-context-layer:load -- --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-dense-context-layer-local-load-verify`
- `npm run release:check`

Local readback: 14 source files, 7,080 source records, 720 documents, 250 document extractions, 3,602 canonical objects, 750 applications, 1,650 application deployments, 215 vendors, 104 data platforms, 220 infrastructure objects, 8,297 relationships, 127 metric definitions, 13,190 measures, 1 snapshot, and 1 context pack. Relationship endpoint drift and measure metric drift both read back as 0. Planted failures for missing relationship endpoints and invented metric keys were rejected by the database.

## Rollout Plan

Merge as local proof tooling only. No runtime or data-plane change occurs until later operator-job work consumes the generated source-room output with an explicit gate.

## Deployment Authority

- Repo-owned deploy workflow: normal main deploy if merged.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable for local proof tooling.
- ACA runtime invariant: not applicable unless deployed by the normal main workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product route changes.

## Rollback Plan

Revert the proof script and package-script entry. No database rollback is required because this change mutates only disposable local Postgres during validation.

## Audit Evidence

- Local load SQL, readback JSON, command logs, and summary under the supplied output directory.
- Validation command output.
- PR and CI checks after review.

## Known Gaps

This is context-layer proof only. It does not load `ecl_commercial`, review workflow rows, product projections, cubes, Azure, retrieval indexes, or product browser surfaces.
