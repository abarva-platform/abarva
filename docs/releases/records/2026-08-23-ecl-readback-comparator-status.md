# 2026-08-23-ecl-readback-comparator-status — ECL Readback Comparator Status

## Release ID

`2026-08-23-ecl-readback-comparator-status`

## Status

`candidate`

## Plain-English Summary

Adds the dense ECL Azure readback comparator to the post-queue local proof chain and exposes it as an operator status denominator. The status report now distinguishes local layer proof, Azure gate package readiness, and readback comparator readiness before any Azure load/readback hard gate is opened.

## Layer Impact

Release lane: `internal-admin`.

No data layer changes. This affects local proof orchestration and status reporting only.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL operator progress tracking and readback proof preparation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extends `scripts/ecl/run_ecl_dense_azure_gate_local_proof.py` to run positive and planted-negative readback comparator checks.
- Adds `azure_readback_comparator` to no-stop operator status denominators.
- Updates `scripts/ecl/validate_ecl_operator_status_report.py` to require the new denominator.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/run_ecl_dense_azure_gate_local_proof.py scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`
- Pass: `python3 scripts/ecl/validate_ecl_operator_status_report.py --allow-in-progress`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. Operators continue to use this as local proof preparation; actual Azure readback remains gated by the future data-build approval and independent read-only export.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the readback comparator denominator and post-queue proof extension. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.
- Generated local status and comparator reports under `outputs/ecl-no-stop-execution-run`, `reports/ecl-dense-azure-readback-compare-2026-08-23`, and `reports/ecl-dense-azure-readback-compare-negative-2026-08-23`.

## Known Gaps

- Actual Azure ACA Job execution is not authorized or performed.
- Actual Azure readback export is not produced by this release.
- Product route/browser QA remains hard-gated and is not claimed.
