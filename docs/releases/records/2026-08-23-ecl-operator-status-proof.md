# 2026-08-23-ecl-operator-status-proof — ECL Operator Status Proof

## Release ID

`2026-08-23-ecl-operator-status-proof`

## Status

`candidate`

## Plain-English Summary

Adds a machine-readable and readable operator status report to the ECL no-stop local proof runner. Long proof batches now publish percent complete, emitted checkpoints, next local action, blocked gate, and evidence paths so operators can see exactly where execution stands.

## Layer Impact

Layer 1-4 control lane only. This changes local proof orchestration and reporting for ECL build artifacts; it does not change client intake data, canonical data, product projections, routes, runtime data, or live tenant state.

## Client Applicability

- All clients: No direct product or data impact.
- Specific clients: None.
- Internal only: ECL local proof runner, CI proof workflow, and architecture queue documentation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/run_no_stop_execution_queue.py` now writes `operator-status.json` and `operator-status.md` during and after execution.
- `scripts/ecl/validate_ecl_operator_status_report.py` validates operator status structure, checkpoint coverage, final 100 percent progress, evidence references, and the remaining hard gate.
- `.github/workflows/ecl-no-stop-data-pipeline.yml` compiles and validates the operator status report after the no-stop queue run.
- `docs/architecture/ecl-no-stop-execution-queue.json` adds the operator-status validation slice before strict queue validation.
- `docs/architecture/ECL_NO_STOP_EXECUTION_QUEUE_2026_08_22.md` documents the new status artifacts and slice order.

## QA / Validation

- `python3 -m py_compile scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py scripts/ecl/validate_no_stop_execution_queue.py`
- `python3 scripts/ecl/run_no_stop_execution_queue.py`
- `python3 scripts/ecl/validate_ecl_operator_status_report.py`

Local proof result: 17 of 17 executable slices passed, checkpoints 0/15/30/45/60/75/90/100 emitted, final operator status accepted at 100 percent, and the remaining blocked gate is `product_route_repointing`.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow may run after merge because this repository uses the standard main deployment lane, but this change does not require a data-plane load, database migration, route repoint, feature flag, or tenant replacement.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only, if triggered by merge to `main`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Verified by the repo-owned deploy workflow if deployed.
- Worker image invariant: Verified by the repo-owned deploy workflow if deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is local proof-runner reporting, not a product surface change.

## Rollback Plan

Revert the PR. The previous runner still executes the local proof queue and emits execution summary/status files, but without the new operator status report.

## Audit Evidence

- Local run output: `outputs/ecl-no-stop-execution-run/execution-summary.json`
- Operator status: `outputs/ecl-no-stop-execution-run/operator-status.json`
- Operator-readable status: `outputs/ecl-no-stop-execution-run/operator-status.md`
- Operator validator: `outputs/ecl-no-stop-execution-run/operator-status-validation-summary.json`
- Queue validation: `outputs/ecl-no-stop-queue-validation/validation-summary.json`

## Known Gaps

This does not authorize or execute product route repointing, browser-live proof, active tenant replacement, Azure data-plane mutation, database migration execution, or legacy retirement.
