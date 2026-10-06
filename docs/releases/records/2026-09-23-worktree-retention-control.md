# 2026-09-23-worktree-retention-control — Worktree retention: a rule with a control

## Release ID

`2026-09-23-worktree-retention-control`

## Status

`candidate`

## Plain-English Summary

Agents working this repository each create a private `git worktree` — a full
checkout of their own — so that two of them never share one index or HEAD. The
standing instruction is to remove that checkout once the work merges. That
instruction is a line in a task file: nothing reads it and nothing can fail it.

It went unfollowed long enough to stop a run. On 2026-09-23 a scheduled run
could not begin at all: the disk held **580 MiB free of 926 GiB** and
`git worktree add` died `ENOSPC` part-way through the checkout, with **798**
registered worktrees on disk and `git worktree prune` removing **none** of them,
because every one of them still exists.

This adds the control the rule never had. `scripts/exec/worktree-retention.mjs`
reports, per registered worktree, whether it is **provably** safe to remove, and
exits non-zero when free space is below a floor. **It removes nothing.**
Removing another agent's checkout is the destructive version of the very
collision the claim protocol exists to prevent, so `removable` requires three
independent proofs and everything short of all three is reported as `unknown`.

The asymmetry is the whole design: a worktree wrongly called `keep` costs one
item's disk; a worktree wrongly called `removable` costs someone's uncommitted
work.

## Layer Impact

Release lane: `internal-admin` — an AbarVa-only operations capability. Platform tooling only. No product layer is touched: not client intake, not the
source adapters, not the canonical model, not any of the seven products.
Nothing under `src/` changes, and no runtime, route, schema, migration, job or
prompt is affected.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — an operator control plus its CI contract.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/worktree-retention.mjs` — **new.** Parses `git worktree list
  --porcelain`, reads each checkout's `git status --porcelain` with
  `--no-optional-locks`, indexes merged pull requests by head branch, reads the
  operator claim register, and classifies each worktree `removable` /
  `unknown` / `keep` with its reasons. Modes: default table, `--json`,
  `--check --free-floor-gib <n>`, `--emit-removals <file>`.
- `scripts/exec/worktree-retention.test.mjs` — **new.** 22 behavioural cases.
- `.github/workflows/execution-queue-toolchain.yml` — runs the new suite.
- `scripts/exec/README.md` — documents the rule, the three proofs, the exit
  codes, and where the wiring stops.

### The three proofs, and why each is shaped the way it is

1. **Merged by PR `mergedAt`, not by ancestry.** A squash merge is not an
   ancestor of the branch it closed, so `merge-base --is-ancestor` would report
   every squash-merged branch as unmerged and leave the disk exactly as full.
   An open PR on the branch is not a merge; the index is keyed on `mergedAt`
   rather than on the row's existence, and when a branch carries several merged
   PRs the newest `mergedAt` is the one quoted.
2. **`git status --porcelain` empty.** Read with `--no-optional-locks`, so this
   control never takes the index lock of the run it is measuring. A status that
   was never read, or that git refused, is `unknown` — not clean.
3. **No live claim names the branch or the path.** The whole register line is
   read, not its `files:` list, because a claim states its branch in prose and
   lists source files; a `files:`-only reader would free every checkout in
   flight. A claim stamped *ahead* of the clock reading it still holds — T-457
   measured six such lines in a single day, they are real claims with a wrong
   stamp, and treating "ahead of now" as "outside the window" would free
   precisely the checkouts in use.

Structural `keep`s on top of those: the primary checkout, a bare repository, a
locked worktree, and the checkout the control is itself running in.

## QA / Validation

**Red first, over the same scope.** `scripts/exec/worktree-retention.test.mjs`
against the file on `origin/main` `6215ec2cc`: the module does not exist, the
suite fails to import, `0 passed`. With the classifier present: `22 passed,
0 failed`. The honest sequencing note is below under Known Gaps.

**The rest of the directory's contract, same scope, both sides.** All four
pre-existing suites on `origin/main` `6215ec2cc` and again on this branch:
identical, no regression.

**Mutation check: 15 deliberate breakages, 15 caught, each by a named case.**

| # | mutation | caught by |
|---|---|---|
| M1 | the dirty-tree check never fires | "a merged branch with two uncommitted paths is keep" + 3 more |
| M2 | an unread or unreadable tree is treated as clean | "an unreadable working tree is unknown" + "never read is unknown" |
| M3 | the merge index is keyed on the PR row rather than `mergedAt` | "an open PR on the branch does not make it merged" + 3 more |
| M4 | a branch with no merged PR falls through to `removable` | "no merged PR … is unknown, never removable" + 4 more |
| M5 | the 3-hour claim window is ignored, so every claim holds forever | "a claim four hours old does not hold the worktree" |
| M6 | a future-stamped claim is skipped as out of window | "a claim stamped three hours in the future still holds" |
| M7 | claim matching reads the branch only, not the path | "a live claim naming only the worktree path holds it" |
| M8 | a detached HEAD falls through to `removable` | "a clean, unclaimed, detached worktree is unknown" |
| M9 | a locked worktree is no longer kept | "a locked worktree is keep and the lock reason is carried" |
| M10 | the primary checkout is no longer kept | "the primary checkout is keep" |
| M11 | the running checkout is no longer kept | "the worktree this run is working in is keep" |
| M12 | `--check` returns 0 below the floor | "--check exits 1 below the floor and names …" |
| M13 | `--emit-removals` also emits `unknown` | "--emit-removals writes the merged+clean worktree and NOTHING else" |
| M14 | the porcelain parser flushes only on a blank line | "four records parse … and the last record survives" |
| M15 | `refs/heads/` is left on the branch name | "four records parse …" + 3 more |

Every mutation that could over-reach (M1, M3, M4, M12) is caught by more than
one case, and at least one of those cases runs the real CLI against real
worktrees rather than a fixture.

**Wiring, not just correctness.** Four cases run the CLI as a child process
against a **real temporary git repository** with three real worktrees git
itself created — merged-and-clean, merged-and-dirty, open-PR — and assert the
verdicts, both exit codes of `--check`, and that `--emit-removals` writes the
one removable path and leaves every checkout on disk. This is deliberate:
re-proving the decision function is the substitution that lets unwired wiring
look wired (T-708).

**CI reads fixtures, never the operator's machine.** A GitHub runner has
neither the operator's free space nor the operator's worktrees; a gate
asserting on a subject it cannot see is the unfailable kind this directory
exists against.

- `node scripts/exec/worktree-retention.test.mjs` → `22 passed, 0 failed`
- `npx eslint scripts/exec/` → exit 0
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → judged by exit code
- `node scripts/release-check.mjs --base origin/main --head HEAD` → exit 0

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` changes, so the
deployed image's behaviour is unchanged. The repo-owned ACA workflow will build
and deploy the merge commit as it does for every merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` mutation of any kind.
- Approved image digest: n/a — no runtime behaviour changes.
- ACA runtime invariant: proven post-merge from the deploy run at or after the merge SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, structurally — the change touches no
  file under `src/`, so no signed-in surface can differ.

## Rollback Plan

Revert the PR. The control is read-only and additive: reverting removes a
report and a CI step and restores nothing, because nothing depends on it. No
migration, no data, no runtime state.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `exec/t-719-worktree-retention-control`.
- The `Execution queue toolchain` check, step `Run the worktree retention contract`.
- The mutation table above; each row reproducible by applying the named
  breakage to `scripts/exec/worktree-retention.mjs` and re-running the suite.
- The operator claim register line for item T-719, appended through the
  T-708 gate wiring.

## Known Gaps

- **The suite was written after the classifier, not before it.** The failing-
  test-first sequence was not followed literally: the disk had too little
  headroom to create a worktree until a control existed to say what was safe to
  reclaim, so the classifier and its suite were written outside the repository
  first. The mutation table is the stronger claim offered in its place — every
  guard was broken deliberately and a named case failed — but it is not the
  same thing as red-first, and it is recorded rather than glossed.
- **`--check` is an operator control and nothing invokes it.** That is
  the T-706 shape: available, correct, and only as good as its being run. CI
  cannot close this, for the reason given above. Closing it properly means the
  operator task file running `--check` before `git worktree add`, which is a
  change to a file outside this repository.
- **Classifying the live population is slow.** `git status` on 798 checkouts of
  this repository's size takes a long time; the run started for this release
  had not finished within the session. `--check` on a machine with a normal
  number of worktrees is fast, and the cost is proportional to the mess.
- **This reclaims nothing by itself.** One checkout was freed during this work
  by running the control's own criteria by hand — branch merged by PR #8157 at
  `2026-09-21T17:22:04Z`, tree clean, newest claim naming it ~36 hours old —
  which took the disk from 1.6 GiB to 3.0 GiB free. That bought one run. The
  population and the retention decision for it remain open.
- **The 412 loose `~/Projects/nexus-*` sibling checkouts measure 139.4 GB**
  (~340 MB each), correcting an earlier estimate of ~1.2 GB each. They are the
  largest group by count and nobody has been treating them as a population.
  Whether they are agent-owned is not established here and is not guessed.
