# 2026-09-22-source-board-claim-record-boundary — Source board claim-record boundary

## Release ID

`2026-09-22-source-board-claim-record-boundary`

## Status

`candidate`

## Plain-English Summary

The internal execution board reads an append-only operator log in which each
record begins with a timestamp. The board decided where one record ended and
the next began by matching a timestamp written to the minute and followed by a
pipe. Any line that did not match that exact shape was treated as a
continuation and glued onto the record above it.

The log is not written that way. Lines are routinely stamped to the second, and
a second, pipe-less record form is documented in the toolchain's own README.
Measured over the current log: 1,207 lines open with a timestamp, 633 were
recognised as records, and 574 — 47.6% — were absorbed into a neighbouring
record. A single parsed "record" could therefore carry dozens of unrelated
lines, and every item id named anywhere inside it inherited all of the progress
language in all of them.

That is not cosmetic. The board assigns each backlog item a proof rung from the
text attributed to it, and the queue generator uses that rung directly: rung 0
is the test for "claimable work", rung 7 is the test for "finished". An item
that absorbed a neighbouring record's proof language read as finished and
disappeared from every bucket the queue renders — it was neither offered as
work nor listed as waiting on anyone.

This change makes the board recognise the same record grammar the queue
generator already accepts, and adds a behavioural suite that holds the boundary
shut in both directions.

## Layer Impact

Release lane: `internal-admin`. This is an AbarVa-only operations capability —
an internal planning generator — with no client-facing surface.

- **Layer 4 (products): none.** No product surface, route, component, tenant
  dataset, adapter, or canonical model object is touched.
- **Internal tooling only.** The change is confined to the execution-board
  generator that renders an internal planning view from operator-owned
  documents that live outside this repository.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — internal planning toolchain only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs`
  - `executionClaimEntries` now starts a record on a timestamp at minute *or*
    second precision, with the following pipe optional, matching the grammar
    `build-execution-queue.mjs` already accepts in `parseClaimRecord`. Before
    this, the two repo-owned generators disagreed about what a record is by 574
    lines of the same file.
  - Parser invariants for the boundary are asserted beside it, including the
    continuation case, so a later regex edit cannot quietly re-absorb half the
    log.
  - `latestClaimByStampThenAppend` now compares timestamps through
    `stampSortKey`. With both precisions present a raw string comparison is
    backwards — `":"` sorts below `"Z"`, so `T13:14:48Z` compared as earlier
    than `T13:14Z`. The stamp itself is never rewritten; only the comparison
    key is normalised.
- `scripts/exec/build-source-board.test.mjs` — new behavioural suite, five
  cases, run as child processes over synthetic fixtures.
- `.github/workflows/execution-queue-toolchain.yml` — runs the new suite.
- `scripts/exec/README.md` — documents the three record grammars and why the
  boundary is covered in both directions.

## QA / Validation

Red first. The five new cases were written and run against the unmodified
generator: **5 failed, 0 passed.** After the fix: **0 failed, 5 passed.**

Two of the five failures were leaks (an item inheriting a neighbour's proof)
and two were the opposite — a record the parser did not recognise at all, so
an item's *own* proof was invisible. The boundary was failing in both
directions.

Clean baseline over the same scope, before and after, measured on
`origin/main` `2412d513d` and on this branch:

| suite | before | after |
|---|---|---|
| `build-execution-queue.test.mjs` (runs both generators) | 133 passed, 0 failed | 133 passed, 0 failed |
| `register-time-authority.test.mjs` | 27 passed, 0 failed | 27 passed, 0 failed |
| `build-source-board.test.mjs` (new) | 5 failed, 0 passed | 0 failed, 5 passed |

**Mutation-proved.** Each mutation was applied deliberately and reverted
byte-identically, and each landed on exactly the intended cases by name:

| mutation | result |
|---|---|
| boundary reverted to minute-precision + mandatory pipe, with the in-file invariant removed so only the behavioural cases can object | 0 passed, **5 failed** |
| seconds accepted but the pipe still mandatory — a *partial* fix | 3 passed, **2 failed** (the pipe-less case and the record count, 2 parsed instead of 3) |
| continuation join dropped, so every line becomes its own record — the *opposite* error | 4 passed, **1 failed** (the continuation guardrail) |
| mixed-precision comparison reverted to a raw string compare | the in-file resolver invariant throws and the process exits non-zero |

**Effect on the rendered view, measured on a frozen copy of the operator
documents so both sides read identical inputs:**

| | before | after |
|---|---|---|
| records parsed | 633 | 1,207 |
| items reading `Signed-in proven` | 129 | 38 |
| claimable | 0 | 4 |
| blocked on owner | 147 | 182 |
| held / expired-idle / expired-in-flight / released | 3 / 93 / 118 / 128 | 3 / 93 / 118 / 128 |

**105 items change rung and every one of them moves DOWN the ladder; none moves
up.** The change can therefore only surface work, never hide it. A known
positive identified before the change — an item whose own body declares an open
question, which nonetheless read `Signed-in proven` from a record belonging to
another lane — now reads from its own record. A negative control, an item whose
own text states its proof, is unchanged.

`node scripts/release-check.mjs --base origin/main --head HEAD` run before
opening the pull request.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is imported by the
application, and the generator runs only when an operator invokes it locally or
when CI executes the fixture suites. The repo-owned Azure Container Apps deploy
workflow will build and deploy the merge commit as it does for any change to
`main`; that deployment carries no behaviour from this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime code path changes
- ACA runtime invariant: verified after merge as standing practice, not as a
  condition of this change
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: **no.** Nothing here renders a signed-in
  surface. The reason is stated rather than the check being implied.

## Rollback Plan

Revert the pull request. There is no migration, no data write, and no runtime
state; reverting restores the previous boundary immediately. No rollback
constraint applies.

## Audit Evidence

- The pull request and its diff.
- The `Execution queue toolchain` CI job, which now runs three fixture suites.
- The suite output quoted above, reproducible with
  `node scripts/exec/build-source-board.test.mjs`.

## Known Gaps

- The board attributes a record to an id if the id appears anywhere in it, and
  a long record routinely names several. Repairing the boundary removes the
  cross-record leak but not this within-record one: the known positive above
  still reads `PR / CI` from a pull request number that belongs to a different
  item named in the same line. The queue generator solved the equivalent
  problem for release verdicts with a nearest-token rule and an
  intervening-id veto; the rung has no such rule. Filed as a follow-up rather
  than widened into this change, so the boundary repair could be measured
  alone.
- Four backlog ids are absent from the repo-owned structure map, so the board
  exits non-zero after writing its summary. That is pre-existing, unrelated,
  and unchanged here.
