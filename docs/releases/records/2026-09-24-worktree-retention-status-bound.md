# 2026-09-24-worktree-retention-status-bound — Bound the retention control's per-worktree status probe

## Release ID

`2026-09-24-worktree-retention-status-bound`

## Status

`candidate`

## Plain-English Summary

A developer-tooling control that reports which local scratch checkouts are safe to delete could not
finish, so it never reported anything.

The control inspects every registered checkout and asks whether it is provably safe to remove:
its branch merged, its files all committed, and nobody currently working in it. To answer the
second question it ran a status command inside each checkout, and that command had no time limit.
On this build machine a handful of checkouts live in a folder whose contents are stored remotely
and fetched on demand, so every file read waits on the network — about a second per file, against
roughly a millisecond on ordinary local storage. One such checkout holds four thousand files, which
puts it at about an hour on its own, and there are four of them.

The effect was not a wrong answer. It was no answer: the control ran for over half an hour without
printing a single line, and every run that tried it gave up before it finished. Meanwhile the disk
filled, and an automated run failed outright because there was no space left to create the checkout
it needed. That is the second time that exact failure has happened.

This change puts a time limit on each status read. A checkout that exceeds it is reported as
**unknown**, never as safe to remove — exactly the same answer the control already gave for a
checkout it could not read at all — and the paths that exceeded the limit are now printed by name,
because "some checkouts could not be read" is not something an operator can act on.

The limit is one minute per checkout, chosen well above any legitimate read (an ordinary checkout
answers in about a second) and well below the pathological case it exists for.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operator tooling, with no client-facing surface and no
data-plane reach.

None of the four product layers is touched. This is developer and operator tooling only.

- **Client intake, source adapters, canonical model, products:** unaffected. Nothing under `src/`
  imports `scripts/exec/*`, so no runtime code path, no product surface, no tenant data and no
  model prompt is touched by this change.
- **Operator tooling:** `scripts/exec/worktree-retention.mjs` gains a bounded status probe, a
  `--status-timeout-ms` flag, and a named report of the checkouts that exceeded the bound.

## Client Applicability

- All clients: none — no runtime effect.
- Specific clients: none.
- Internal only: yes. Operator tooling on developer and agent build machines.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/worktree-retention.mjs` — new exported `STATUS_TIMEOUT_MS` (60 s) and
  `--status-timeout-ms` flag; `readDirtyPaths` now passes `timeout` and `killSignal: "SIGKILL"` to
  the per-checkout status call and returns the timed-out paths alongside the state map; `main`
  threads the bound through, adds `summary.timedOut` and a `timedOut` array to `--json`, and prints
  the timed-out paths by name in the default report.
- `scripts/exec/worktree-retention.test.mjs` — four new behavioural cases (20–23) driving the real
  CLI as a child process against a real temporary git repository with real worktrees.

A timed-out read resolves to the same `null` the "unreadable checkout" case already produced, so
`classifyWorktree` is unchanged: the safe branch existed and was already covered by a case, and
what changed is which inputs reach it.

## QA / Validation

Commands run from a dedicated worktree branched from `origin/main` `9edfb7233`.

**The slow path under test is real, not mocked, and it genuinely exceeds the bound.** A `git` shim
placed earlier on `PATH` passes every subcommand through to the real git except `status`, which
sleeps 3 s against a 300 ms bound — ten times over, so no case here turns on a race. The sleep is
finite on purpose: with the bound removed the shim returns clean output after 3 s and the mutation
*fails* the cases rather than hanging them.

| run | result |
|---|---|
| clean baseline, `HEAD` unmodified, same suite | **22 passed, 0 failed** |
| new cases added, fix **not** applied (red first) | **23 passed, 3 failed** |
| after the fix | **27 passed, 0 failed** |

The red-first failure is the defect stated at its sharpest: a checkout whose status could not be
read within any bound was classified `removable`, with reasons `["branch merged by PR #1 …",
"clean, merged, unclaimed"]` — it would have been written into `--emit-removals`.

**Mutations — four applied, four caught,** each reverted from a pristine copy before the next:

| # | mutation | result |
|---|---|---|
| 1 | delete `timeout` and `killSignal` from the status call | 24 passed, **3 failed** |
| 2 | a timed-out read is recorded as a **clean** tree (`[]` instead of `null`) | 26 passed, **1 failed** |
| 3 | stop recording which paths timed out | 25 passed, **2 failed** |
| 4 | `isTimeout` always returns `false` | 25 passed, **2 failed** |

Mutation 2 is the dangerous inversion — it is the one that would delete uncommitted work — and it
is caught by the safety case alone.

**Stated rather than claimed: one decision here is not mutation-provable.** `killSignal: "SIGKILL"`
rather than the default `SIGTERM` is a judgement about a child blocked in a filesystem fault, and
the fixture's `sleep` dies to either signal, so no case in this suite distinguishes them. It is
argued in a comment at the call site and is not presented as tested.

**Case 22 ("the control returns") passes on unfixed code by design** and is a guardrail, not a
red-first case: a finite 3 s shim cannot demonstrate unboundedness. It is recorded here rather than
counted as evidence.

Typecheck and lint were not run against these two files and that is deliberate: both are
`scripts/exec/*.mjs`, outside the TypeScript project and outside the `src/` ESLint scope. The
repository-owned gates that do cover them run on the PR.

## Rollout Plan

Merge to `main`. No runtime rollout: this is a developer/operator script with no importer under
`src/`, so the ACA image carries it only as an inert file. No migration, no flag, no env var, no
worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. This change mutates no Container App, revision, traffic weight,
  secret or environment variable.
- Approved image digest: not applicable — no runtime behaviour changes.
- ACA runtime invariant: unaffected; the post-merge deploy still asserts it as it does for any
  merge.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing in this change renders on a product surface, so a
  signed-in session has nothing to accept. This is stated so the item is not read as owing a proof
  it cannot have.

## Rollback Plan

Revert the commit. The control returns to its previous behaviour, which is that it does not return;
no data, schema or runtime state is involved, so there is nothing else to undo.

## Audit Evidence

- The PR, its CI run, and the suite output in that run.
- The four mutation runs and the clean baseline recorded in the QA table above.
- The first complete classification of the live checkout population, which this change makes
  possible and which is reported on the item rather than here, because it is a finding about one
  machine and not part of the release.

## Known Gaps

- **The control still only reports; it removes nothing,** by design. A disk at 100% is therefore
  not repaired by this change — it is made diagnosable. Whether anything is then removed remains a
  reviewed, operator-run step through `--emit-removals`.
- **Whether four checkouts belong under a remotely-stored folder at all is an operations question,
  not a code one,** and is explicitly out of scope: the cause is a property of the storage, so
  excluding those paths by name would have gone stale the moment a checkout moved.
- The 60 s default is calibrated against measurements on one machine. It is a flag, not a constant
  in disguise, so a machine with different storage can set its own without a code change.
