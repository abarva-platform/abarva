# 2026-08-23-ecl-dense-source-layer-local-load — ECL Dense Source Layer Local Load

## Release ID

`2026-08-23-ecl-dense-source-layer-local-load`

## Status

`candidate`

## Plain-English Summary

Adds a local disposable-Postgres proof runner that loads the dense source-room package into `ecl_source` tables and independently reads row counts back. This turns source-room depth from a generated-file claim into a physical source-layer load proof.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: regenerates and validates the dense synthetic source-room package as input.

Layer 2 source adapters: exercises source-layer mapping for generated extracts, rows, evidence documents, and document extractions.

Layer 3 canonical model: loads only `ecl_source` tables in disposable local Postgres. It does not load `ecl_context`, `ecl_commercial`, review, projections, or cubes.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as local source-layer load proof tooling.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_source_layer.py`
- package script for local source-layer disposable-Postgres proof

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/load_dense_source_room_source_layer.py`
- `npm run ecl:source-room-source-layer:load -- --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-dense-source-layer-local-load-verify`
- `npm run release:check`

Local readback: 14 source files, 7,080 source records, 720 documents, 250 document extractions, 250 distinct extraction spans, 0 client-attested rows. Boundary flags remained false for Azure load, canonical context load, projections/cubes, and product route repointing.

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

This is source-layer proof only. It does not load canonical objects, relationships, measures, commercial tables, review events, projections, cubes, Azure, retrieval indexes, or product browser surfaces.
