# 2026-08-23-ecl-dense-source-realism-gates - Dense Source Realism Gates

## Release ID

`2026-08-23-ecl-dense-source-realism-gates`

## Status

`candidate`

## Plain-English Summary

Tightens dense ECL source-room generation and validation so the application estate is not merely large, but economically plausible. The generator now anchors application cost to the governed Meridian baseline, creates a long-tail cost distribution, and spreads environment counts across realistic deployment patterns. The validator now rejects flat cost distributions and near-constant environment counts.

## Layer Impact

- `client-data-lane`: updates synthetic Layer 1 source-room generation and validation only.
- Source/context/commercial/review/projection/cube proof chain: regenerated locally and still passes.
- Product/runtime/data planes: no Azure load, database migration execution, active tenant replacement, product route repointing, deployment, browser-live claim, or legacy retirement.

## Client Applicability

- All clients: no direct client-facing change.
- Specific clients: none.
- Internal only: dense synthetic ECL proof quality.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `scripts/ecl/generate_dense_source_room_extracts.py`.
- Updates `scripts/ecl/validate_dense_source_room_extracts.py`.
- Adds validation for governed application cost total, top-decile cost share, and environment-count diversity.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/generate_dense_source_room_extracts.py scripts/ecl/validate_dense_source_room_extracts.py`
- PASS: `npm run ecl:source-room-dense:generate -- --out-dir /tmp/ecl-realism-gate-check-2`
- PASS: `npm run ecl:source-room-dense:validate -- --out-dir /tmp/ecl-realism-gate-check-2`
- PASS: application cost total is `$436,499,999.98`, within tolerance of the governed `$436.5M` baseline.
- PASS: application top-decile cost share is `34.52%`, inside the `30%-75%` realism gate.
- PASS: application annual costs have `750 / 750` distinct values.
- PASS: application `environment_count` spans `1, 2, 3, 4, 5`.
- PASS: `python3 scripts/ecl/run_no_stop_execution_queue.py` completed `12 / 12` executable local slices and stopped at `4` hard-gated slices.
- PASS: `npm run ecl:dense-aca-job:dry-run -- --skip-proof-run`
- PASS: `npm run ecl:dense-aca-job:validate`

## Rollout Plan

Merge by PR. Future dense source-room generation will use the tightened realism gates before local layer proof and before any later Azure load gate package.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared ACA deployment lane.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product/runtime route changes are included.

## Rollback Plan

Revert this PR to restore the prior dense source-room generator and validator behavior.

## Audit Evidence

- Temporary validation output: `/tmp/ecl-realism-gate-check-2`
- Queue proof output: `outputs/ecl-no-stop-execution-run/`
- Dense ACA dry-run output: `reports/ecl-dense-aca-job-dry-run-2026-08-23/`

## Known Gaps

- This does not perform Azure load/readback.
- This does not replace active tenant inputs or product routes.
- Product browser QA and legacy sunset remain hard-gated.
