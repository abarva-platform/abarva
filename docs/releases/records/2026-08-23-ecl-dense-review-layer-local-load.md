# 2026-08-23-ecl-dense-review-layer-local-load — ECL Dense Review Layer Local Load

## Release ID

`2026-08-23-ecl-dense-review-layer-local-load`

## Status

`candidate`

## Plain-English Summary

Adds a local disposable-Postgres proof runner that loads the dense source-room package through `ecl_source`, core `ecl_context`, `ecl_commercial`, and `ecl_review`. It proves review/workflow events attach to governed ECL subjects through database-enforced references instead of product inference or display-name joins.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: regenerates and validates the dense synthetic source-room package as input.

Layer 2 source adapters: exercises source-room-to-review mapping for contract, finance/AP, and KPI review events.

Layer 3 canonical model: loads `ecl_source`, `ecl_context`, `ecl_commercial`, and `ecl_review` in disposable local Postgres.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as local review-layer proof tooling.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_review_layer.py`
- package script for local review-layer disposable-Postgres proof

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/load_dense_source_room_review_layer.py`
- `npm run ecl:source-room-review-layer:load -- --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-dense-review-layer-local-load-verify`
- `npm run release:check`

Local readback: 658 review events, including 277 contract-subject events, 120 invoice-line-subject events, 260 SLA-observation-subject events, and 1 context-pack-subject event. Source-record drift, contract-subject drift, invoice-subject drift, and SLA-subject drift all read back as 0. Planted failures for missing review subjects and invented contract subjects were rejected by the database.

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

This is review-layer proof only. It does not build product projections, cubes, Azure loads, retrieval indexes, or product browser surfaces.
