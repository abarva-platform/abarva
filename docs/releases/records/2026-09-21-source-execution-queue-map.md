# 2026-09-21-source-execution-queue-map — Source Execution Queue Map Repair

## Release ID

`2026-09-21-source-execution-queue-map`

## Status

`candidate`

## Plain-English Summary

Repairs the repo-owned Source execution structure map so newly filed backlog items are visible to the generated operator board and claim queue. The change classifies each item by what it actually describes: Source lifecycle work, cross-cutting Source lifecycle capability work, platform integrity work, or work outside the Source lifecycle.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 products: no product runtime path changes. This only changes the execution-control metadata that places Source backlog items on generated operator views.

Control tooling: the board and queue generators now receive the full current backlog ID set from the structure map, including a duplicate ID that is intentionally disambiguated by source section.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: none.
- Internal only: execution-board and queue operators.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/source-stage-map.json` maps the current previously-unmapped backlog IDs.
- `scripts/exec/build-execution-queue.test.mjs` adds a fixture proving duplicate IDs can be placed with `definedIn` without becoming ambiguous or invisible.

## QA / Validation

- PASS: `SOURCE_EXECUTION_HOME=$HOME/Downloads node scripts/exec/build-source-board.mjs --json` reports `not placed on the map: 0`.
- PASS: `SOURCE_EXECUTION_HOME=$HOME/Downloads node scripts/exec/build-execution-queue.mjs` writes the queue and reports `8 claimable`.
- PASS: `node scripts/exec/build-execution-queue.test.mjs` reports `30 passed, 0 failed`.
- PASS: `npx eslint scripts/exec/build-source-board.mjs scripts/exec/build-execution-queue.mjs scripts/exec/build-execution-queue.test.mjs`.
- PASS: `npm run typecheck` reports `typecheck: clean`.
- PASS: `npm run release:check`. The command regenerates unrelated legacy-purge report drift; that drift is not included in this release.
- PASS: `git diff --check`.

## Rollout Plan

Merge to `main`. No manual deployment, Azure mutation, migration, data load, or signed-in acceptance is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: if the normal main workflow runs after merge, it is repo-owned only.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not applicable to this control-map change before merge.
- Worker image invariant: not applicable to this control-map change before merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the merge commit. The generated board and queue can then be regenerated from the previous structure map.

## Audit Evidence

Inspect the PR diff, local command output, and generated board/queue stdout showing zero unmapped IDs and the actual claimable count.

## Known Gaps

This release does not complete any backlog item, perform signed-in acceptance, apply migrations, write tenant data, or deploy by hand. It only makes the currently filed items visible to the generated execution queue.
