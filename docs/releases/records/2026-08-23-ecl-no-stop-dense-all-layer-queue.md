# 2026-08-23-ecl-no-stop-dense-all-layer-queue - ECL Dense All-Layer Queue

## Release ID

`2026-08-23-ecl-no-stop-dense-all-layer-queue`

## Status

`candidate`

## Plain-English Summary

Updates the ECL no-stop proof lane so it runs the dense 14-workbook / 9-source-family local proof chain instead of the earlier commercial-only queue. The lane now executes raw workbook landing, dense source-room generation, producer coverage, disposable source/context/commercial/review loads, Source 360 projections, cube read models, and operator status output before stopping at runtime and data-plane gates.

## Layer Impact

- `global-control-lane`: updates CI proof orchestration and queue status reporting.
- `client-data-lane`: validates dense local source-room and ECL load proof artifacts without mutating shared data stores.
- Product/runtime/data planes: no Azure load, database migration execution, route repointing, deployment, traffic shift, browser-live claim, active tenant replacement, or legacy retirement.

## Client Applicability

- All clients: no direct client-facing change.
- Specific clients: none.
- Internal only: ECL proof automation and operator status.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `docs/architecture/ecl-no-stop-execution-queue.json` to the dense all-layer local proof chain.
- Updates `.github/workflows/ecl-no-stop-data-pipeline.yml` to compile and assert dense source/context/commercial/review/projection/cube proof outputs.
- Adds the synthetic v2.2.2b workbook ZIP under `fixtures/ecl/source-workbooks/` so raw Layer 1 landing is reproducible outside one operator machine.
- Packages dense proof artifacts instead of the older commercial-only bundle.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py scripts/ecl/land_source_excel_workbooks.py scripts/ecl/validate_source_excel_raw_landing.py scripts/ecl/generate_dense_source_room_extracts.py scripts/ecl/validate_dense_source_room_extracts.py scripts/ecl/write_dense_source_room_ecl_producer_coverage.py scripts/ecl/load_dense_source_room_source_layer.py scripts/ecl/load_dense_source_room_context_layer.py scripts/ecl/load_dense_source_room_commercial_layer.py scripts/ecl/load_dense_source_room_review_layer.py scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/load_dense_source_room_cube_layer.py`
- PASS: `python3 scripts/ecl/run_no_stop_execution_queue.py` completed 12/12 executable local slices and stopped at 4 hard-gated slices.
- PASS: `python3 scripts/ecl/validate_ecl_operator_status_report.py`
- PASS: workflow YAML parse with Ruby `YAML.load_file`.
- PASS: dense proof chain read back 7,080 source records, 3,602 context objects, 8,297 relationships, 230 contracts, 230 Source 360 contract rows, 9 cube manifests, and 4,320 cube measure FK rows.
- PASS: planted FK failures rejected in context, commercial, review, Source projection, and cube layers.

## Rollout Plan

Merge by PR. The workflow remains proof-only unless manually dispatched through its existing explicit merge path. This change does not deploy or load data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared ACA deployment lane.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no runtime or product route changes are included.

## Rollback Plan

Revert this PR to restore the prior no-stop queue and workflow assertions.

## Audit Evidence

- Queue output: `outputs/ecl-no-stop-execution-run/`
- Queue validation: `outputs/ecl-no-stop-queue-validation/validation-summary.json`
- Dense source-room proof: `outputs/source-room-depth-catchup-2026-08-23/`
- Local layer proof reports: `reports/ecl-dense-*-local-load-2026-08-23/`

## Known Gaps

- The queue still stops before ACA data-build wiring, Azure load/readback, product route adoption, browser QA, and legacy sunset.
- The proof uses disposable local Postgres and repo-local artifacts only.
