# 2026-09-23-in-flight-branch-field — The work queue reads a claim's own branch field

## Release ID

`2026-09-23-in-flight-branch-field`

## Status

`candidate`

## Plain-English Summary

The execution work queue decides whether a claim is still being worked on, and
one of its two signals is "does this claim name a branch?". That question was
answered by a hard-coded list of two branch-name prefixes. The operator
instructions tell every run to cut its own worktree and name its own branch, and
the branch names those runs actually produce are not on that list. A claim
naming such a branch was therefore filed as idle, which the queue prints under
the heading **free to take** — and offering work that someone else is holding is
the collision the claim register exists to prevent.

The prefix list is replaced by the claim's own answer. Every claim written by
the append helper carries an explicit branch field; a claim that cut no branch
says so in the same field, and that is honoured rather than read as a name. The
grammar for reading that field is not written a second time here: the sibling
resolver module already owns it, already knew about the newer branch names, and
one shared answer means the two tools cannot disagree about the same line.

Nothing about what the queue offers gets looser. Branch evidence and pull-request
evidence are unioned, so an item can only move toward *do not take*.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operator tooling. No client-facing
surface ships in this release.

- **Layer 4 (Products):** none. No product surface, route, API, model prompt or
  tenant read path is touched.
- **Operator tooling only:** one function inside the queue generator, plus its
  behavioural suite. The generator is not imported by anything under `src/`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — the execution queue is an internal operator document
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — the in-flight branch test now calls
  `branchesInClaim` from `scripts/exec/fossil-claims.mjs` and unions it with the
  pull-request-number signal, which is not a branch and stays local.
- `scripts/exec/build-execution-queue.test.mjs` — eight new behavioural cases.

No migration, no schema, no workflow, no runtime image, no dependency change.

## QA / Validation

**Baseline over the same scope, both sides extracted the same way.** "Before" is
a clean `git archive origin/main scripts/exec` extraction rather than the working
tree.

| | suite | passing | failing |
|---|---|---|---|
| before | `build-execution-queue.test.mjs` | 145 | 0 |
| after | `build-execution-queue.test.mjs` | 157 | 0 |

The delta of twelve is exactly the twelve cases added. No pre-existing case
changed verdict. The whole toolchain is green on the branch: `append-claim`
50/0, `build-execution-queue` 157/0, `build-source-board` 23/0, `cli-entry`
19/0, `fossil-claims` 49/0, `id-collision` 70/0, `queue-provenance` 30/0,
`register-time-authority` 258/0, `toolchain-manifest` 17/0,
`worktree-retention` 22/0.

**Red first.** With all twelve cases added and the generator restored to its
`origin/main` bytes, the suite ran **154 passed / 3 failed** — the three cases
that describe the defect. The other nine are negative controls and regression
guards that pass on unchanged code, which is what makes those three mean
something.

**Thirteen mutations applied, eleven caught, two escaped.** Each was applied to a
copy of the original bytes, confirmed to have changed the file before running,
and the file restored and `cmp`-verified afterwards. Both suites were run for
every mutation, because the grammar is now shared.

| | mutation | queue suite | sibling suite |
|---|---|---|---|
| M1 | in-flight always false | 9 failed | — |
| M2 | in-flight always true | 6 failed | — |
| M3 | drop the branch signal, PR only | 8 failed | — |
| M4 | drop the PR signal, branch only | 1 failed | — |
| M5 | union becomes intersection | 9 failed | — |
| M6 | invert the branch signal | 14 failed | — |
| M7 | PR number four digits becomes five | 1 failed | — |
| M8 | absence veto deleted | 2 failed | 1 failed |
| M9 | absence veto made case-sensitive | 1 failed | — |
| M10 | `exec/` dropped from the fallback token | 1 failed | — |
| M11 | declared-field read disabled | 1 failed | — |
| M12 | **slash requirement dropped** | **survived** | **survived** |
| M13 | **absence veto continues instead of returning** | **survived** | **survived** |

**Four escapes were found and repaired during the work rather than reported
away**, and each was the same shape this backlog exists against — a guard no
case could fail:

- The PR-number half of the union could be deleted with every case still green,
  because every fixture leaning on it also named a branch. A claim carrying a PR
  number and no branch was added.
- The absence veto could be deleted with every case still green. The three
  `none` cases written for it use a value with no slash, and the shared grammar
  drops a slashless name anyway, so the slash requirement was absorbing the
  mutation. A slash-bearing absence marker — the case the veto alone decides —
  was added, and an upper-case one for the veto's case-insensitivity.
- `exec/` could be removed from the grammar's prose fallback with every case
  still green, because all of them reach the declared field first. Measured on
  the live register, 161 lines mention an `exec/…` name and 87 do so without the
  `branch` keyword, so the fallback carries real weight. A prose-only case was
  added.

**M12 and M13 survive and are reported rather than hidden.** Both mutate the
sibling module's own grammar in ways neither suite can see: dropping the
requirement that a declared branch name contain a slash, and letting the absence
veto continue past a `branch none` field instead of returning. Neither is
introduced by this change — both are pre-existing gaps in that module's
coverage, made visible only because this release runs its suite against these
mutations for the first time. Filed as a follow-on rather than fixed here,
because widening scope into a second module's contract is how a bounded change
stops being reviewable.

**The live bucket movement, measured rather than predicted.** Both queues were
rendered from one frozen snapshot of the register and the same backlog, one with
the `origin/main` generator and one with this branch:

| bucket | before | after | moved |
|---|---|---|---|
| claimable | 0 | 0 | — |
| held by a live claim | 1 | 1 | — |
| expired, in flight | 127 | 128 | one item entered |
| expired, idle — **free to take** | 90 | 89 | the same item left |
| explicitly released | 159 | 159 | — |
| suppressed candidates | 9 | 9 | — |

**One item moves, and it moves in the safe direction.** Its newest register line
is a claim that was never released, naming a branch the old prefix list did not
recognise, and the queue was printing it as free to take. Independently checked
afterwards: that branch is gone from `origin` and its pull request is merged — so
the work is done and the claim is a fossil, retired by appending a release line,
not by a second agent picking the item up. The queue deliberately does not read
the network; the sibling resolver does.

**Why only one, stated rather than glossed.** The branch signal is consulted only
for an expired claim that has not been released. 31 lines in the live register
carry a branch field the old pattern missed, but 30 of them belong to items whose
newest line is a release. The measured blast radius today is one item; the
mechanism is the one that hands live work to a second agent, and it missed the
claim line for this very item thirty seconds after it was written.

`node scripts/release-check.mjs --base origin/main --head HEAD` passes.

Not run, because nothing in this change can reach them: the Jest suites under
`src/`, typecheck, and any signed-in acceptance.

## Rollout Plan

Merge to `main`. There is no runtime rollout: the generator is an operator script
and no product image or route depends on it. Each run regenerates the board and
the queue from its own checkout, so the first regeneration after merge carries the
change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as it does for every commit; this change alters nothing it deploys.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release.
- ACA runtime invariant: unaffected — no file under `src/`, no Dockerfile, no
  workflow and no dependency changes.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no. No product surface changes, so there is
  nothing a signed-in user could observe.

**Queue-provenance note.** The stamp printed in `EXECUTION_QUEUE.md` is the
sha256 of this generator's own bytes, so editing it moves the stamp, and the
append helper refuses a claim whose stamp does not match the generator beside it.
This is the documented and intended fail-closed behaviour: a concurrent agent
still holding the previous copy is refused rather than allowed to append against
a queue it did not generate, and regenerating from its own checkout clears it.
The queue in the operator root is regenerated as part of this run.

## Rollback Plan

Revert the single commit. No migration, no data change, no deployed artifact, so
the revert is complete on merge. A regenerated queue immediately returns to the
previous bucket assignment.

## Audit Evidence

- The pull request and its CI run, in particular the
  `execution-queue-toolchain` workflow step that runs
  `scripts/exec/build-execution-queue.test.mjs` on a Linux runner.
- The before/after bucket table above is reproducible: render the queue twice
  from one register snapshot, once with each generator.

## Known Gaps

- Two mutations survive, M12 and M13 above, both in the sibling module's shared
  branch grammar and both pre-existing. Filed as a follow-on item.
- The measurement above is a snapshot of one register at one time. The bucket
  movement on a later register will differ, and that is expected.
- This changes which claims the queue calls in flight. It does not retire a
  fossil claim; a claim whose branch is gone and whose pull request is merged is
  still retired by appending a release line, and the resolver that determines
  that is a separate tool by design.
