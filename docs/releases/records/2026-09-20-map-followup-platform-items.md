# 2026-09-20-map-followup-platform-items - Restore Execution Queue Coverage

## Release ID

`2026-09-20-map-followup-platform-items`

## Status

`candidate`

## Plain-English Summary

Six newly recorded platform-integrity tasks and this mapping-maintenance task are now classified in
the generated execution board. The queue can offer them without attributing any of the work to a
Source lifecycle stage.

## Layer Impact

- `internal-admin`: updates the repo-owned execution-board structure map only.
- Product and data layers: no runtime, schema, tenant-data, or product behavior changes.

## Client Applicability

- All clients: No direct product change.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Maps `T-422` through `T-427` and `T-607` once under `platformTrack.items`.

## QA / Validation

- The execution queue behavior suite passes.
- The real operator board and queue regenerate from Downloads with zero unmapped references.
- The generated queue contains no duplicate row for the newly mapped identifiers.
- Release control passes before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA main deploy may publish the same
commit, although the change affects only internal generated execution artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Verified by the repo-owned workflow after merge.
- Worker image invariant: Verified by the repo-owned workflow after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; there is no product surface change.

## Rollback Plan

Revert the squash commit. The tasks will become visibly unmapped again; no database or tenant state
rollback is required.

## Audit Evidence

- Pull request and CI checks created from `codex/T607-map-next-platform`.
- Operator-root board and queue regeneration output captured in the execution record.

## Known Gaps

The structure map is intentionally maintained separately from the append-only operator backlog.
New backlog items still require a corresponding repo change before the queue can offer them; the
generator fails loudly and names every omitted identifier rather than silently dropping work.
