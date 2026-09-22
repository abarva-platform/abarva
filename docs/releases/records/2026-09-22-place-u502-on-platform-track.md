# Place U-502 On The Platform Track

## Release ID

`2026-09-22-place-u502-on-platform-track`

## Status

`candidate`

## Plain-English Summary

The generated Source execution queue stops when a backlog item is absent from
its structure map. This change places the remaining admin orphan-decision item
on the platform track, where it cannot count as progress against a Source
lifecycle stage.

## Layer Impact

- Lane: `internal-admin`.
- Operator-tooling structure only. No product route, runtime code, schema,
  migration, tenant data, approval, supplier action, or model context changes.

## Client Applicability

- Internal only. No client-specific behavior or data is affected.

## Changes Included

- Add `U-502` to `scripts/exec/source-stage-map.json` under `platformTrack`.

## QA / Validation

- Generated board: exit `0`; unplaced items `1 -> 0`.
- Generated queue: exit `0`; five claimable items emitted.
- Lifecycle stage rungs: unchanged.
- Proof-weighted CPO vision completion: unchanged at `35.4%`.
- `git diff --check`: passed.

## Rollout Plan

Merge through the normal pull-request path. The operator regenerates the board
and queue from the updated map; no product deployment is required for this
tooling-only change.

## Deployment Authority

- Repo-owned ACA deploy workflow: not required for this operator-only map.
- Shared runtime, traffic, environment flags, and worker images: unchanged.
- Signed-in product acceptance: not applicable because no product code reads
  this file.

## Rollback Plan

Revert the pull request. The item becomes unplaced and queue generation returns
to a non-zero exit.

## Audit Evidence

The board and queue command output records the before/after unplaced count,
unchanged lifecycle rungs, and unchanged proof-weighted completion.

## Known Gaps

The map remains hand-maintained because its backlog inputs live in the operator
workspace. This change does not alter backlog prioritization or resolve the
separate id-band exhaustion warning.
