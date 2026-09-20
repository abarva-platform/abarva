# 2026-09-20-execution-queue-status-attribution — Exact Operator Queue Status

## Release ID

`2026-09-20-execution-queue-status-attribution`

## Status

`candidate`

## Plain-English Summary

The generated execution board now advances an item's status only from evidence that belongs to
that item. A reference to an older pull request in a new problem statement no longer makes the new
work look as though it already has a pull request. The queue also trusts the board's interpreted
owner blocker instead of hiding any item whose instructions merely mention a signed-in-shaped test.

## Layer Impact

- `global-control-lane` internal operator tooling: status and blocker derivation for the generated execution board and
  queue are corrected. No product data, canonical model, read model, or product surface changes.

## Client Applicability

- All clients: No direct product behavior changes.
- Specific clients: None.
- Internal only: Generated engineering execution board and queue.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/exec/build-source-board.mjs`
- `scripts/exec/build-execution-queue.mjs`
- `scripts/exec/build-execution-queue.test.mjs`
- `scripts/exec/source-stage-map.json`

## QA / Validation

- Failing-first fixtures proved that a predecessor PR reference promoted an untouched item and that
  descriptive signed-in prose hid executable work.
- `node scripts/exec/build-execution-queue.test.mjs`: 29 checks passed.
- Real operator regeneration: zero unmapped ids; the four affected open items are claimable; true
  migration, policy, decision, and product-session blockers remain blocked.
- Mutation direction: restoring whole-prose rung inference or raw acceptance blocker scanning makes
  the new fixtures fail.

## Rollout Plan

Squash-merge through the protected repository path. The normal repository-owned ACA workflow may
build the merge because it runs on every main update, but this change is internal operator tooling
and needs no product runtime activation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Recorded by the workflow after merge.
- ACA runtime invariant: Required from the repo-owned workflow artifact if a web image is deployed.
- Worker image invariant: Required from the same artifact.
- Feature/env flag update path: None.
- Live signed-in proof required: No; no product surface or client data path changes.

## Rollback Plan

Revert the squash merge. Regenerate the board and queue from the unchanged operator documents.

## Audit Evidence

- Behavioral test output for the repository-owned queue generator.
- Generated `source-board-summary.json` and `EXECUTION_QUEUE.md` under the operator directory.
- Pull request and required-check results after opening.

## Known Gaps

Historical item identifiers still contain collisions; this change does not renumber them. The board
continues to report ambiguous definitions and requires section-qualified claims for those ids.
