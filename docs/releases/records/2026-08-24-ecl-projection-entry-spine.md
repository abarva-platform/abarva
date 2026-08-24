# 2026-08-24-ecl-projection-entry-spine — ECL Projection Entry Spine

## Release ID

`2026-08-24-ecl-projection-entry-spine`

## Status

`candidate`

## Plain-English Summary

This release gives every ECL product projection row a shared projection-entry identity and typed references. Product tables can still serve fast page-specific read models, but their supporting objects, metrics, source records, measures, relationships, and document extractions are now available through FK-backed child tables instead of JSON caches alone.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 Canonical Enterprise Model: unchanged as source of truth; projection refs point back to existing canonical objects, metrics, measures, relationships, source records, and document extractions.
- Layer 4 Products: adds the projection-entry spine and typed child refs for the seven committed product projection surfaces. Existing surface rows now carry `projection_entry_id`.

## Client Applicability

- All clients: applies to future ECL draft-schema and drop-and-reload builds.
- Specific clients: none.
- Internal only: dense ECL local proof, ACA gate package, and readback tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql`
- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `scripts/ecl/execute_dense_all_layer_load.py`
- `scripts/ecl/export_dense_all_layer_readback.py`
- `scripts/ecl/write_dense_source_room_ecl_producer_coverage.py`
- `scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`
- `package.json`

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/execute_dense_all_layer_load.py scripts/ecl/export_dense_all_layer_readback.py scripts/ecl/write_dense_source_room_ecl_producer_coverage.py`
- PASS: `npm run test:ecl-projection-schema-reconciliation`
- PASS: `npm run test:ecl-object-type-catalog`
- PASS: `npm run test:ecl-dense-readback-query`
- PASS: `npm run ecl:source-room-source-projection:load -- --out-dir /tmp/ecl-projection-entry-spine-local`
- PASS: `npm run ecl:source-room-cube-layer:load -- --out-dir /tmp/ecl-projection-entry-cube-local`
- PASS: `npm run ecl:source-room-producers:report -- --out-dir /tmp/ecl-projection-entry-producer-coverage`
- PASS: `npm run ecl:dense-aca-job:dry-run`
- PASS: `npm run ecl:dense-aca-job:validate`
- PASS: `npm run ecl:dense-azure-gate:package && npm run ecl:dense-azure-gate:validate`
- PASS: `npm run release:check`

## Rollout Plan

Merge to main as a draft-schema and local-proof tooling update. The next ECL target build remains a governed drop-and-reload from workbooks/source rooms. Do not apply this as an `ALTER TABLE` patch to the currently loaded ECL slice.

## Deployment Authority

- Repo-owned deploy workflow: not required for this schema/proof-only change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product default provider is repointed by this release.

## Rollback Plan

Revert this PR before any v2 ECL drop-and-reload. No Azure data-plane rollback is required because this release does not mutate a target database.

## Audit Evidence

- Named-ref reconciliation test reads `origin/main:<path>` and confirms seven product projection surfaces plus four cube tables from committed DDL/generator evidence.
- Disposable Postgres projection proof produced 4,619 `projection_entry` rows, 5,252 object refs, 9,019 metric refs, and 4,703 source-record refs.
- Drift checks for projection-entry count, surface-entry linkage, metric refs, object refs, and source-record refs all returned zero.
- Planted product surface row with a missing `projection_entry_id` was rejected by the database FK.
- Local dense queue proof completed 12 of 12 local executable slices and preserved Azure/product hard gates.

## Known Gaps

- Azure data-plane load/readback is not executed by this release.
- Product/browser QA is not claimed by this release.
- Measure, relationship, and document-extraction child ref tables are structurally present but only populate when a projection row cites those specific governed IDs.

