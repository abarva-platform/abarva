# 2026-09-21-execution-map-t508 — Execution Queue Map Update

## Release ID

`2026-09-21-execution-map-t508`

## Status

`candidate`

## Plain-English Summary

Adds backlog item `T-508` to the repo-owned execution structure map so the generated Source operator board and claim queue stop failing on an unmapped item. This is a map-only internal-admin change: it does not implement the underlying dataset-write guard, run the full test collection, or weaken the requirement that tracked `datasets/` changes must fail visibly.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 products: no product runtime path changes.

Control tooling: the board and queue generators can classify `T-508` as platform integrity work and continue to fail closed if the item is removed from the map.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: none.
- Internal only: execution-board and queue operators.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/source-stage-map.json` maps `T-508` to the platform integrity track.
- `scripts/exec/build-execution-queue.test.mjs` proves `T-508` is platform integrity work and that removing its map reference fails the generated board.

## QA / Validation

- PASS: `node scripts/exec/build-execution-queue.test.mjs`.
- PASS: `SOURCE_EXECUTION_HOME=/Users/anand/Downloads node scripts/exec/build-source-board.mjs --json` reports `not placed on the map: 0`.
- PASS: `SOURCE_EXECUTION_HOME=/Users/anand/Downloads node scripts/exec/build-execution-queue.mjs` regenerates the queue from the current operator documents.
- PASS: `npx eslint scripts/exec/build-source-board.mjs scripts/exec/build-execution-queue.mjs scripts/exec/build-execution-queue.test.mjs`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.
- PASS: `git diff --check`.

## Rollout Plan

Merge to `main` through a pull request after ordinary CI is green. No manual deployment, Azure mutation, migration, data load, or signed-in acceptance is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: if the normal main workflow runs after merge, it is repo-owned only.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not applicable to this control-map change before merge.
- Worker image invariant: not applicable to this control-map change before merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the merge commit and regenerate the operator board and queue from the previous structure map.

## Audit Evidence

Inspect the PR diff, local command output, and generated operator artifacts showing zero unmapped backlog items after the map update.

## Known Gaps

This release does not close `T-508`, identify the test writer, run bare full Jest, mutate tenant data, apply migrations, contact vendors, deploy by hand, or claim signed-in acceptance. The underlying dataset-write safety requirement remains open.
