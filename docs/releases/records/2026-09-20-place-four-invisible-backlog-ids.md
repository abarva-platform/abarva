# 2026-09-20-place-four-invisible-backlog-ids — Work nobody could be offered

## Release ID

`2026-09-20-place-four-invisible-backlog-ids`

## Status

`candidate`

## Plain-English Summary

Four backlog items were not in the structure map, so the execution queue never offered them
to anyone. They are real work — two merges sitting at a merge SHA with no run proving them
deployed, and three governed-risk directories with unrun suites between them.

The gate added the previous change found them on its first real run against live inputs,
which is exactly what it exists for. Placing them makes **three of them claimable
immediately**.

## Layer Impact

- `global-control-lane`. One structure-map file in the repo-owned execution toolchain. No
  product surface, tenant data, schema, projection, migration, code path, or runtime
  behaviour. The map contains structure only, no status.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — operator tooling data
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/source-stage-map.json` — `T-400`, `T-401`, `T-402`, `T-403` placed, plus
  `T-536` for this change.

## QA / Validation

| What | Result |
|---|---|
| Board run against live inputs | **exit 0**, nothing unmapped (was exit 1, five unmapped) |
| Claimable rows | **0 → 3** |
| Execution toolchain suite | 17 passed, 0 failed |
| `release-check` | passed |

No behaviour changed and no code was touched. The verification that matters is that the
board now exits 0 and the queue offers work it previously could not see.

### Why there is no new test

The mechanism — an unmapped id failing the run — was added and mutation-proofed in the
previous change, with four cases including both directions. This change is data that
satisfies that gate. A test asserting these four particular ids are mapped would restate
the gate against a snapshot, and would have to be edited every time an id is added, which
is the hand-maintained-list shape this repository keeps removing.

## Rollout Plan

Merge to `main`. The next board run offers the three claimable items. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting makes the four items
invisible again and the board run fail until they are replaced.

## Audit Evidence

- The PR diff — one data file.
- Board exit 1 with five unmapped before, exit 0 after; claimable rows 0 → 3.

## Known Gaps

- **Placing an item is not triaging it.** These four are now visible and claimable; nothing
  here says whether their premises hold. One of them asserts that two merges lack a deploy
  run, and that claim is unverified by this change.
- The four sit in the id band reserved for a human or anything else, so who filed them is
  not recorded. The map does not carry that and neither does this record.
