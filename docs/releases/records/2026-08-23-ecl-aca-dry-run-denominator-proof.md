# 2026-08-23-ecl-aca-dry-run-denominator-proof - ECL ACA Dry-Run Denominator Proof

## Release ID

`2026-08-23-ecl-aca-dry-run-denominator-proof`

## Status

`candidate`

## Plain-English Summary

Carries the denominator-backed ECL operator status into the dense ACA data-build job dry-run package. The ACA gate package now exposes the local proof denominators in the job spec, run manifest, progress, validation, quality gate, status report, proof-bundle manifest, markdown report, and summary.

## Layer Impact

- `client-data-lane`: local dry-run/gate package only.
- Local proof package: embeds workbook/source-room/layer/cube denominator evidence.
- Product/runtime/data planes: no Azure load, database migration execution, active tenant replacement, product route repointing, deployment, browser-live claim, or legacy retirement.

## Client Applicability

- All clients: no direct client-facing change.
- Specific clients: none.
- Internal only: ECL gate package and operator proof quality.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `scripts/ecl/run_ecl_dense_aca_job_dry_run.py` to embed `local_quality_denominators` across dry-run artifacts and proof-bundle manifest.
- Updates `scripts/ecl/validate_ecl_dense_aca_job_dry_run.py` to reject dry-run packages that omit or weaken the required denominator proof.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/run_ecl_dense_aca_job_dry_run.py scripts/ecl/validate_ecl_dense_aca_job_dry_run.py`
- PASS: `npm run ecl:dense-aca-job:dry-run`
- PASS: `npm run ecl:dense-aca-job:validate`
- PASS: dry-run proof bundle SHA-256 `be68fb3617575feb7259b8b857b24b04d55129fd9e7929a7d346e7fd2f218571`
- PASS: dry-run run id `ecl-dense-20260823-d2907165986e`
- PASS: dry-run status reports `actual_azure_execution=false`
- PASS: denominator proof carried:
  - raw workbook coverage: `14 / 14`
  - dense source-room family coverage: `14 / 14`
  - application realism gates: `5 / 5`
  - ECL table producer coverage: `28 / 28`
  - local layer readback chain: `6 / 6`
  - runtime/browser/legacy hard gates: `0 / 3`, status `hard_gated`

## Rollout Plan

Merge by PR. The next Azure gate package will include the denominator-backed local proof before any data-plane execution is considered.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared ACA deployment lane.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product/runtime route changes are included.

## Rollback Plan

Revert this PR to restore the previous dry-run package format.

## Audit Evidence

- Job spec: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_job_spec.json`
- Run manifest: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_run_manifest.json`
- Quality gate: `reports/ecl-dense-aca-job-dry-run-2026-08-23/ecl_dense_aca_quality_gate.json`
- Proof bundle manifest: `reports/ecl-dense-aca-job-dry-run-2026-08-23/dense_proof_bundle_manifest.json`

## Known Gaps

- This does not perform Azure load/readback.
- This does not provide execution secrets, a digest-pinned image, or a target data-plane binding.
- This does not replace active tenant inputs or product routes.
- Product browser QA and legacy sunset remain hard-gated.
