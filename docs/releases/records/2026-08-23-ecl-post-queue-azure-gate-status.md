# 2026-08-23-ecl-post-queue-azure-gate-status — ECL Post-Queue Azure Gate Status

## Release ID

`2026-08-23-ecl-post-queue-azure-gate-status`

## Status

`candidate`

## Plain-English Summary

Updates the ECL no-stop status path so Azure gate readiness is tracked as a local post-queue proof instead of being embedded inside the queue that it depends on. The queue still stops before Azure data-plane writes; a separate local proof packages the completed queue output and proves the future approval template cannot execute by accident.

## Layer Impact

Release lane: `internal-admin`.

No data layer changes. This affects local operator status reporting and proof orchestration only.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL operator progress tracking and gated data-build preparation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`.
- Adds an `azure_load_gate_package` denominator to the no-stop operator status report.
- Keeps the ACA data-build slice hard-gated inside the no-stop queue and documents the post-queue proof step.
- Updates the operator status validator to require the Azure gate denominator.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`
- Pass: `python3 scripts/ecl/validate_ecl_operator_status_report.py --allow-in-progress`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. Operators continue to run the no-stop local queue first, then run the post-queue Azure gate local proof. Actual Azure load/readback remains a separate hard gate.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not provided or used in this release.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the post-queue proof wrapper and restore the prior operator status denominator set. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.
- Generated local status and gate proof artifacts under `outputs/ecl-no-stop-execution-run` and `reports/ecl-dense-azure-load-gate-package-2026-08-23`.

## Known Gaps

- Actual Azure ACA Job execution is not authorized or performed.
- Azure lab/preprod load and independent readback remain hard-gated.
- Product route/browser QA remains hard-gated and is not claimed.
