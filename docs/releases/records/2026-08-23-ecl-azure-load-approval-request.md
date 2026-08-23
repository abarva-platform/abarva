# 2026-08-23-ecl-azure-load-approval-request — ECL Azure Load Approval Packet

## Release ID

`2026-08-23-ecl-azure-load-approval-request`

## Status

`candidate`

## Plain-English Summary

Adds a local-only approval request packet for the ECL dense Azure data-load gate and teaches the heartbeat agent to advance to that packet after local validation is complete. This does not run Azure jobs, mutate any database, deploy product code, repoint routes, or promote data.

## Layer Impact

Release lane: `internal-admin`.

Layer 1 through Layer 4 execution control only. The change records the inputs, local proof references, required operator acknowledgements, and missing runtime fields needed before an Azure lab/preprod data-build job can run.

## Client Applicability

- All clients: Not directly applicable.
- Specific clients: None.
- Internal only: ECL operator planning and heartbeat automation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/write_ecl_azure_load_approval_request.py`
- `scripts/ecl/validate_ecl_azure_load_approval_request.py`
- `scripts/ecl/run_ecl_heartbeat_status_agent.py`
- `package.json` ECL approval request scripts

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/write_ecl_azure_load_approval_request.py scripts/ecl/validate_ecl_azure_load_approval_request.py scripts/ecl/run_ecl_heartbeat_status_agent.py`
- PASS: `npm run ecl:heartbeat-agent:advance`
- PASS: `npm run ecl:heartbeat-agent:advance` repeated to prove idempotent hard-gate behavior

## Rollout Plan

Merge to `main`. Operators can then run `npm run ecl:heartbeat-agent:advance` from the dedicated clean heartbeat worktree to refresh the local approval packet. Azure execution remains a separate governed data-build job step.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No, because this is local operator packaging only.

## Rollback Plan

Revert this PR. Existing local proof reports and gate packages remain historical artifacts; no Azure or product runtime state is changed by this release.

## Audit Evidence

- Heartbeat summary under `outputs/ecl-heartbeat-status-agent/heartbeat-agent-summary.json`
- Local approval packet under `reports/ecl-azure-load-approval-request-2026-08-23/`
- Validation summary under `reports/ecl-azure-load-approval-request-2026-08-23/ecl_azure_load_approval_request_validation_summary.json`

## Known Gaps

This release does not create the Azure execute entrypoint, run the ACA data-build job, perform Azure readback, deploy product routes, or capture browser QA.
