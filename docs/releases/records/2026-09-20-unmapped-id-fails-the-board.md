# 2026-09-20-unmapped-id-fails-the-board — An item nobody could be offered

## Release ID

`2026-09-20-unmapped-id-fails-the-board`

## Status

`candidate`

## Plain-English Summary

A backlog item that is not in the structure map is invisible to the execution queue. It is
never offered to any agent, and the only sign was one line in a wall of generator output
that nothing required anyone to read. The run exited 0.

Two ids reached that state in a single afternoon. Worse, the move of this toolchain into
the repository made the trap quieter: the structure map is now repo-owned, so mapping an id
in the copy still sitting in the operator root is a **silent no-op**. The agent who does it
sees a successful edit and the item stays invisible.

An unmapped id now fails the run — after the board is written, so the output is still there
to read and the status says it is incomplete. A gate that produces nothing teaches people
to stop running it.

**This starts clean: 0 unmapped at the time it was added.**

## Layer Impact

- `global-control-lane`. The repo-owned execution toolchain and its suite. No product
  surface, tenant data, schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — operator tooling
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — an unmapped id sets a non-zero exit status, with
  a message naming the ids and the file to edit.
- `scripts/exec/source-stage-map.json` — `T-535` and `T-600` placed. `T-600` had been
  mapped in the superseded copy and was still invisible.
- `scripts/exec/README.md` — a section on the superseded copies in the operator root.
- `scripts/exec/build-execution-queue.test.mjs` — four cases and a fixture helper.

## QA / Validation

| What | Result |
|---|---|
| The execution toolchain suite | **17 passed, 0 failed** (was 13 cases) |
| Board run with everything mapped | exit 0 |
| `eslint` | exit 0 |
| `tsc --noEmit` | exit 0 |
| Mutation harness, two directions | **5 mutations, 5 caught, 0 survived** |

Direction 1 stops the guard guarding: no failure on an unmapped id; the message stops naming
the id; it stops naming the file to edit. Direction 2 makes it over-fire or stop reporting:
failing whether or not anything is unmapped, and exiting before the board is written.

### The existing suite caught a regression in this change, which is how the fixture got fixed

Adding the guard turned an existing case red: the staleness case appends `T-997` to the
fixture backlog and reruns the board, and `T-997` is unmapped, so the board began failing
for a reason that had nothing to do with staleness. The gate was right and the case's
subject was being masked. The fixture now maps the injected id through a helper, so that
case still isolates the trap it was written for. **The case was not weakened** — it asserts
the same thing about the same subject.

### Two findings behind this

- **The structure map is repo-owned but the old copy still exists.** Mapping an id in
  `~/Downloads/source-stage-map.json` changes nothing, because the generator resolves the
  map next to itself. `T-600` was mapped there and stayed invisible. Mapping is now a pull
  request, which nothing had said.
- **The generator in the operator root has drifted from the repo one.** Running it produces
  a different board from the same inputs with no warning. Both are documented in the README
  rather than left to be rediscovered by diffing, which is how this one was found.

## Rollout Plan

Merge to `main`. The next board run enforces it. No image build, migration, flag, or
runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns an unmapped id to
printing a line and exiting 0.

## Audit Evidence

- The PR diff.
- Suite 13 → 17 cases, all passing; board exit 0 with everything mapped.
- The five mutation results.

## Known Gaps

- **The superseded copies in the operator root are documented, not removed.** They are in
  the operator's own directory and deleting another party's working files is not this
  change's call. The README says they can go.
- The guard fires on *any* unmapped id. There is no allowance for an id deliberately left
  off the map, because none exists today — if one is ever wanted it needs a declared
  exception rather than a silent omission, which is the same absent-vs-recorded shape this
  repository applies elsewhere.
- This does not address how an item's rung is derived, which is a separate open question
  with its own measurements recorded against it.
