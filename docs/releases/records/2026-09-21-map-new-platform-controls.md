# 2026-09-21-map-new-platform-controls — Map new execution controls

## Release ID

`2026-09-21-map-new-platform-controls`

## Status

`candidate`

## Plain-English Summary

Four newly filed execution-control items are assigned to the internal platform-integrity track so the fail-closed Source board and work queue can regenerate. The mapping does not credit any CPO lifecycle stage with product progress.

## Layer Impact

- `global-control-lane`: repository-owned execution-board structure only. No application or data layer changes.

## Client Applicability

- All clients: No product behavior changes.
- Specific clients: None.
- Internal only: Source execution-board and queue operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/exec/source-stage-map.json`: place T-510, T-581, T-582, and T-583 on the platform-integrity track.

## QA / Validation

- **PASS:** captured the board build failing closed with the ids unmapped.
- **PASS:** regenerated the board and queue with zero unmapped ids after mapping.
- **PASS:** confirmed proof-weighted vision completion stayed unchanged.
- **PASS:** execution-queue behavioral contract.
- **PASS:** release control check.

## Rollout Plan

Squash-merge the pull request. The repository-owned generated board and queue consume the map on their next run. No application deployment is required.

## Deployment Authority

- Repo-owned deploy workflow: Not required; no runtime files change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is internal execution metadata.

## Rollback Plan

Revert the squash commit and regenerate the board and queue. There is no database, runtime, or tenant-data state to repair.

## Audit Evidence

- Pull-request diff and CI checks.
- Red and green board-generator output.
- Execution-queue behavioral-test output.
- Release-control output.

## Known Gaps

The map only restores dispatchability. It does not implement any of the four mapped controls.
