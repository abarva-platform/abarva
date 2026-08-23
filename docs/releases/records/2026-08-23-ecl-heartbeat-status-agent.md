# 2026-08-23-ecl-heartbeat-status-agent — ECL Heartbeat Auto-Advance Agent

## Release ID

`2026-08-23-ecl-heartbeat-status-agent`

## Status

`candidate`

## Plain-English Summary

Adds a local heartbeat runner that can advance the next eligible ECL proof slice, refresh operator status, and stop at declared hard gates. The runner turns the recurring status lane into an active local-control loop without granting permission to mutate Azure data, repoint product routes, promote snapshots, shift traffic, or retire legacy assets.

## Layer Impact

- Client intake: no client intake files are changed.
- Source adapters and local proof: adds a local runner for existing ECL proof and gate-readiness scripts.
- Canonical/model layers: no schema or data-plane changes.
- Products: no route repointing or browser-live claims are introduced.

## Client Applicability

- All clients: no direct client runtime effect.
- Specific clients: none.
- Internal only: ECL operator proof automation and status reporting.
- Public/demo only: none.
- Feature flag: not applicable.

## Changes Included

- `scripts/ecl/run_ecl_heartbeat_status_agent.py`
- `package.json` npm entries:
  - `ecl:heartbeat-agent:advance`
  - `ecl:heartbeat-agent:plan`

## QA / Validation

- PASS — `npm run ecl:heartbeat-agent:plan`
- PASS — `npm run ecl:heartbeat-agent:advance`
- PASS — re-ran `npm run ecl:heartbeat-agent:advance` after completion to prove idempotent hard-gate stop behavior.

Validation showed the local executable queue at `12 / 12`, post-queue gate local proof accepted with `actual_azure_execution=false`, and operator status validation accepted with the next blocker at `azure_data_plane_write`.

## Rollout Plan

Merge to main. The heartbeat automation can then call `npm run ecl:heartbeat-agent:advance` on each interval. This does not require an Azure deploy because it is a local proof/operator script only.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not affected.
- Worker image invariant: not affected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no, because no product route or runtime is changed.

## Rollback Plan

Revert the PR or stop using the heartbeat npm command. No data-plane rollback is required because the runner is local-only and does not mutate shared runtime or data.

## Audit Evidence

- `outputs/ecl-heartbeat-status-agent/heartbeat-agent-summary.json`
- `outputs/ecl-heartbeat-status-agent/HEARTBEAT_AGENT_STATUS.md`
- `outputs/ecl-no-stop-execution-run/operator-status.json`
- `outputs/ecl-no-stop-execution-run/operator-status-validation-summary.json`

## Known Gaps

The runner intentionally stops at `azure_data_plane_write`. Executing the Azure lab/preprod load, independent live readback, product route/browser QA, and legacy retirement still require explicit hard-gate approval and captured proof.
