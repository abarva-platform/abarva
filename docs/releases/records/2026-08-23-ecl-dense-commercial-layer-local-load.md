# 2026-08-23-ecl-dense-commercial-layer-local-load — ECL Dense Commercial Layer Local Load

## Release ID

`2026-08-23-ecl-dense-commercial-layer-local-load`

## Status

`candidate`

## Plain-English Summary

Adds a local disposable-Postgres proof runner that loads the dense source-room package through `ecl_source`, core `ecl_context`, and `ecl_commercial`. It proves contract, service-line, scope, invoice, and SLA-observation rows resolve through canonical vendor, application, and metric references instead of display-name joins.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: regenerates and validates the dense synthetic source-room package as input.

Layer 2 source adapters: exercises source-room-to-commercial mapping for generated contract, finance/AP, and KPI extracts.

Layer 3 canonical model: loads `ecl_source`, `ecl_context`, and `ecl_commercial` in disposable local Postgres.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as local commercial-layer proof tooling.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_commercial_layer.py`
- package script for local commercial-layer disposable-Postgres proof

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/load_dense_source_room_commercial_layer.py`
- `npm run ecl:source-room-commercial-layer:load -- --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-dense-commercial-layer-local-load-verify`
- `npm run release:check`

Local readback: 230 contracts, 230 contract service lines, 690 contract scope rows, 480 invoice lines, 160 invoice lines with resolved contracts, and 260 SLA observations. Contract vendor drift, contract scope object drift, and SLA metric drift all read back as 0. Planted failures for missing contract-scope objects and invented invoice vendors were rejected by the database.

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

This is commercial-layer proof only. It does not load review workflow rows, product projections, cubes, Azure, retrieval indexes, or product browser surfaces.
