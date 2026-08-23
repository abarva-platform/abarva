# 2026-08-23-ecl-dense-source-projection-local-load — ECL Dense Source Projection Local Load

## Release ID

`2026-08-23-ecl-dense-source-projection-local-load`

## Status

`candidate`

## Plain-English Summary

Adds a local disposable-Postgres proof runner that loads the dense source-room package through `ecl_source`, `ecl_context`, `ecl_commercial`, `ecl_review`, and Source-facing `ecl_projection` tables. It proves Source 360 contract, vendor, value-lever, and event-workspace rows resolve to governed ECL subjects through database-enforced references.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: regenerates and validates the dense synthetic source-room package as input.

Layer 2 source adapters: exercises source-room-to-Source-projection mapping for commercial and review extracts.

Layer 3 canonical model: loads source, context, commercial, and review rows in disposable local Postgres.

Layer 4 products: creates local projection rows only. No product route, browser behavior, cube, or runtime setting changes.

## Client Applicability

- All clients: applies as local Source projection proof tooling.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- package script for local Source projection disposable-Postgres proof

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `npm run ecl:source-room-source-projection:load -- --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-dense-source-projection-local-load-verify`
- `npm run release:check`

Local readback: 4 projection manifests, 230 Contract 360 rows, 214 Vendor 360 rows, 230 value-lever rows, and 173 event-workspace rows. Contract, vendor, metric, and review-event drift all read back as 0. Claimable value rows read back as 0 before review approval, while all 230 value-lever rows remain gated or blocked. Planted failures for invented metric keys and gated event rows without evidence payloads were rejected by the database.

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

This is Source projection proof only. It does not load Azure, build cubes, repoint product routes, prove browser rendering, or cover Home/Tower/Intelligence projections.
