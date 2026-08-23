# 2026-08-23-ecl-dense-aca-job-dry-run-scaffold - Dense ECL ACA Job Dry Run

## Release ID

`2026-08-23-ecl-dense-aca-job-dry-run-scaffold`

## Status

`candidate`

## Plain-English Summary

Adds a dry-run-only ACA data-build job scaffold for the dense ECL all-layer proof. The script reruns the local no-stop proof chain, packages its evidence, and writes the ACA Job contract artifacts required before a future governed Azure execution.

## Layer Impact

- `global-control-lane`: adds operator job-contract generation and validation.
- `client-data-lane`: prepares the data-build execution contract for dense ECL source/context/commercial/review/projection/cube loading.
- Product/runtime/data planes: no Azure load, database write, migration execution, route repointing, deployment, browser-live claim, or legacy retirement.

## Client Applicability

- All clients: no direct product/runtime change.
- Specific clients: none.
- Internal only: ECL operator execution preparation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/ecl/run_ecl_dense_aca_job_dry_run.py`.
- Adds `scripts/ecl/validate_ecl_dense_aca_job_dry_run.py`.
- Adds package scripts `ecl:dense-aca-job:dry-run` and `ecl:dense-aca-job:validate`.
- Generates dry-run artifacts under `reports/ecl-dense-aca-job-dry-run-2026-08-23/`.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/run_ecl_dense_aca_job_dry_run.py scripts/ecl/validate_ecl_dense_aca_job_dry_run.py`
- PASS: `npm run ecl:dense-aca-job:dry-run`
- PASS: `npm run ecl:dense-aca-job:validate`
- PASS: dry-run generated job `aca-job-ecl-dense-all-layer-load-lab-preprod`, packaged a local proof bundle, and preserved Azure/product/legacy hard gates.
- PASS: dry-run recorded missing execution bindings: digest-pinned image, target data plane, database URL, and Blob connection string.

## Rollout Plan

Merge by PR. This only adds a local/operator dry-run path. A future Azure execution must provide digest-pinned image, target data plane, database and Blob bindings, run id, idempotency key, proof bundle, validation output, quality gate output, and explicit human authorization.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared ACA deployment lane.
- Shared runtime mutators: none.
- Approved image digest: not applicable for dry-run.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no runtime or route changes are included.

## Rollback Plan

Revert this PR to remove the dense ACA dry-run scaffold and package scripts.

## Audit Evidence

- Dry-run output: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_dry_run_summary.json`
- Job spec: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_job_spec.json`
- Run manifest: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_run_manifest.json`
- Quality gate: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_quality_gate.json`

## Known Gaps

- Actual ACA submission is not performed.
- Azure lab/preprod load, independent readback, product route/browser QA, and legacy sunset remain hard-gated.
