# 2026-08-23-ecl-operator-status-denominators - ECL Operator Status Denominators

## Release ID

`2026-08-23-ecl-operator-status-denominators`

## Status

`candidate`

## Plain-English Summary

Adds concrete denominator reporting to the ECL no-stop operator status artifact. The status report now exposes workbook coverage, dense source-family coverage, application realism gates, ECL producer coverage, local layer readback coverage, and runtime/browser hard gates as explicit pass/total rows instead of relying on a single completion percentage.

## Layer Impact

- `client-data-lane`: local proof/status automation only.
- Layer 1 synthetic source-room summary now records application realism measurements.
- Local no-stop proof operator status now reads generated proof artifacts and reports denominators.
- Product/runtime/data planes: no Azure load, database migration execution, active tenant replacement, product route repointing, deployment, browser-live claim, or legacy retirement.

## Client Applicability

- All clients: no direct client-facing change.
- Specific clients: none.
- Internal only: local ECL execution governance and status reporting.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `scripts/ecl/generate_dense_source_room_extracts.py` to write application realism metrics into the dense source-room summary.
- Updates `scripts/ecl/run_no_stop_execution_queue.py` to include `quality_denominators` in `operator-status.json` and `operator-status.md`.
- Updates `scripts/ecl/validate_ecl_operator_status_report.py` to require the six quality denominator areas and fail when application realism gates or local layer readback status regress.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py scripts/ecl/generate_dense_source_room_extracts.py`
- PASS: `npm run ecl:source-room-dense:generate -- --out-dir /tmp/ecl-status-tracker-source-room`
- PASS: `npm run ecl:source-room-dense:validate -- --out-dir /tmp/ecl-status-tracker-source-room`
- PASS: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- PASS: `python3 scripts/ecl/validate_ecl_operator_status_report.py`
- PASS: operator status reports `12 / 12` executable local slices, `4` hard-gated slices, and these quality denominators:
  - raw workbook coverage: `14 / 14`
  - dense source-room family coverage: `14 / 14`
  - application realism gates: `5 / 5`
  - ECL table producer coverage: `28 / 28`
  - local layer readback chain: `6 / 6`
  - runtime/browser/legacy hard gates: `0 / 3`, status `hard_gated`

## Rollout Plan

Merge by PR. Future no-stop local proof runs will emit the denominator-backed operator status used by heartbeat/reporting lanes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared ACA deployment lane.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product/runtime route changes are included.

## Rollback Plan

Revert this PR to restore the prior operator status format.

## Audit Evidence

- Operator status: `outputs/ecl-no-stop-execution-run/operator-status.json`
- Operator markdown: `outputs/ecl-no-stop-execution-run/operator-status.md`
- Operator validation: `outputs/ecl-no-stop-execution-run/operator-status-validation-summary.json`

## Known Gaps

- This does not perform Azure load/readback.
- This does not replace active tenant inputs or product routes.
- Product browser QA and legacy sunset remain hard-gated.
