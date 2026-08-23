# 2026-08-23-ecl-actual-readback-status-gate — ECL Actual Readback Status Gate

## Release ID

`2026-08-23-ecl-actual-readback-status-gate`

## Status

`candidate`

## Plain-English Summary

Updates the ECL status automation so it can recognize actual governed lab/preprod readback proof after an ACA data-build run. The heartbeat lane no longer remains stuck on the earlier local approval-request packet when accepted readback proof is available.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 2 / Source adapters: no adapter behavior changed.
- Layer 3 / Canonical enterprise model: no schema or data changed.
- Layer 4 / Products: browser QA gate packaging can now use the accepted all-layer readback proof as a prerequisite. Product routes are not repointed by this release.
- Operations: heartbeat and browser-QA gate scripts now accept explicit proof paths or a sibling operator worktree proof bundle.

## Client Applicability

- All clients: no runtime product behavior changes.
- Specific clients: none.
- Internal only: ECL operator automation and proof-gate status reporting.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_ecl_heartbeat_status_agent.py`
- `scripts/ecl/write_ecl_product_browser_qa_gate_package.py`

## QA / Validation

- pass — `python3 -m py_compile scripts/ecl/run_ecl_heartbeat_status_agent.py scripts/ecl/write_ecl_product_browser_qa_gate_package.py scripts/ecl/validate_ecl_product_browser_qa_gate_package.py`
- pass — `npm run ecl:heartbeat-agent:advance`
- pass — `npm run ecl:product-browser-qa-gate:package`
- pass — `npm run ecl:product-browser-qa-gate:validate`
- pass — `git diff --check`

The heartbeat run accepted actual ACA readback proof with 24 compared ECL tables and zero drift checks for relationship endpoints, cube metrics, cube measures, and claimable Source value rows.

## Rollout Plan

Merge to `main`. The existing recurring heartbeat fetches `origin/main` in its clean worktree before running, so it will pick up the updated status logic on the next run.

## Deployment Authority

- Repo-owned deploy workflow: not required for this script-only control-plane release.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required only for later product route/browser execution, not for this status-gate change.

## Rollback Plan

Revert this release if the heartbeat incorrectly accepts readback proof. The rollback restores the previous behavior, where the status agent waits on the local Azure approval packet.

## Audit Evidence

- Local heartbeat summary: `outputs/ecl-heartbeat-status-agent/heartbeat-agent-summary.json`
- Product browser QA gate summary: `reports/ecl-product-browser-qa-gate-package-2026-08-23/ecl_product_browser_qa_gate_summary.json`
- Actual ACA readback compare summary supplied by the operator worktree.

## Known Gaps

This does not repoint product routes, execute browser QA, deploy a web change, retire legacy assets, or claim live product proof.
