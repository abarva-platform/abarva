# 2026-08-24-ecl-object-type-catalog — ECL Object Type Counting Contract

## Release ID

`2026-08-24-ecl-object-type-catalog`

## Status

`candidate`

## Plain-English Summary

This release adds an explicit object-type catalog to the ECL draft schema so business counts are driven by declared grain and counting class, not by ad hoc filters over raw objects. Application deployments remain first-class objects, but they are counted through their own typed view and cannot inflate application totals.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 Canonical Enterprise Model: adds the object-type vocabulary table, an FK from canonical objects to that vocabulary, and typed views for applications, application deployments, business objects, and technical components.
- Layer 4 Products: adds local proof/readback guards that require Home application rows to reconcile to the typed application view and reject deployment rows on the application page. No product route is repointed in this release.

## Client Applicability

- All clients: applies to the ECL draft physical contract and future drop-and-reload builds.
- Specific clients: none.
- Internal only: local ECL proof, gate package, and readback tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql`
- `scripts/ecl/load_dense_source_room_context_layer.py`
- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `scripts/ecl/execute_dense_all_layer_load.py`
- `scripts/ecl/export_dense_all_layer_readback.py`
- `scripts/ecl/write_dense_source_room_ecl_producer_coverage.py`
- `scripts/ecl/validate_ecl_dense_azure_load_gate_package.py`
- `scripts/ecl/write_ecl_product_browser_qa_gate_package.py`
- `scripts/ecl/__tests__/run-ecl-object-type-catalog-tests.mjs`
- `package.json`

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/load_dense_source_room_context_layer.py scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/execute_dense_all_layer_load.py scripts/ecl/export_dense_all_layer_readback.py scripts/ecl/validate_ecl_dense_azure_load_gate_package.py scripts/ecl/write_ecl_product_browser_qa_gate_package.py`
- PASS: `npm run test:ecl-object-type-catalog`
- PASS: `npm run test:ecl-dense-readback-query`
- PASS: `npm run ecl:source-room-source-projection:load -- --out-dir /tmp/ecl-object-type-source-projection-local`
- PASS: `npm run ecl:source-room-cube-layer:load -- --out-dir /tmp/ecl-object-type-cube-local`
- PASS: `npm run ecl:dense-aca-job:dry-run`
- PASS: `npm run ecl:dense-aca-job:validate`
- PASS: `npm run ecl:dense-azure-gate:package`
- PASS: `npm run ecl:dense-azure-gate:validate`
- BLOCKED by design: `npm run ecl:product-browser-qa-gate:validate`, because product QA must wait for a v2-aware Azure readback and remains out of scope for this release.

## Rollout Plan

Merge to main as a draft-schema and local-proof tooling update. The next ECL target build remains drop-and-reload from workbooks/source rooms; do not run `ALTER TABLE` against the loaded ECL v1 slice.

## Deployment Authority

- Repo-owned deploy workflow: not required for this schema/proof-only change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product route is repointed.

## Rollback Plan

Revert this PR before any v2 ECL drop-and-reload. No Azure data-plane rollback is required because this release does not mutate a target database.

## Audit Evidence

- Disposable Postgres catalog test proves the catalog FK exists, an unknown object type is refused, and a deployment does not enter `application_v`.
- Local dense projection proof reports `home_application_count_basis_drift = 0` and `home_application_page_deployment_rows = 0`.
- Local dense queue proof completes 12 of 12 local executable slices and preserves Azure/product hard gates.

## Known Gaps

- Product browser QA remains intentionally blocked until a v2-aware Azure readback exists.
- Projection reference-spine normalization is not included; it is the next planned ECL v2 slice.
