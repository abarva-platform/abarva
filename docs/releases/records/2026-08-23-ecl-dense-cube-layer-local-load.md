# 2026-08-23-ecl-dense-cube-layer-local-load — ECL Dense Cube Layer Local Load

## Release ID

`2026-08-23-ecl-dense-cube-layer-local-load`

## Status

`candidate`

## Plain-English Summary

Adds a local disposable-Postgres proof runner that loads the dense source-room package through the local ECL source, context, commercial, review, Source projection, and cube/read-model layers. It proves all nine declared cube keys can publish slices with FK-backed metric references and FK-backed measure lineage.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: regenerates and validates the dense synthetic source-room package as input.

Layer 2 source adapters: exercises source-room mappings used by cube consumers.

Layer 3 canonical model: loads source, context, commercial, and review rows in disposable local Postgres.

Layer 4 products: creates local projection and cube rows only. No product route, browser behavior, or runtime setting changes.

## Client Applicability

- All clients: applies as local cube/read-model proof tooling.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_cube_layer.py`
- package script for local cube-layer disposable-Postgres proof

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/load_dense_source_room_cube_layer.py`
- `npm run ecl:source-room-cube-layer:load -- --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-dense-cube-layer-local-load-verify`
- `npm run release:check`

Local readback: 9 cube manifests, 29 cube slices, 103 cube-slice metric FK rows, and 4,320 cube-slice measure FK rows across all 9 declared cube keys. Metric drift, measure drift, JSON-only metric drift, and blocked-without-gap drift all read back as 0. Planted invented-metric and invented-measure attacks were rejected by the database.

## Rollout Plan

Merge as local proof tooling only. No runtime or data-plane change occurs until later operator-job work and product route adoption pass explicit gates.

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

This is local cube proof only. It does not load Azure, repoint product routes, prove browser rendering, or finalize product-specific semantic cube definitions.
