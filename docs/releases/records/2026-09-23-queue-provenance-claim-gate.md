# 2026-09-23-queue-provenance-claim-gate — A claim is bound to the generator that wrote its queue

## Release ID

`2026-09-23-queue-provenance-claim-gate`

## Status

`candidate`

## Plain-English Summary

Agents pick their next piece of work from a generated file. The generators that
write it were moved into this repository so they could be reviewed and tested,
and the older copies were left standing in the operator's own directory. Those
copies still run, and they have drifted.

A previous change made the repo-owned queue refuse a board summary that the
repo-owned board had not written. That covers the *mixed* case. It does not cover
the case that actually happens: the two superseded copies used together. That
pair is self-consistent — the old board writes a summary with no record of who
wrote it, and the old queue never asks — so the guard never fires, and the only
remaining signal was a sentence in the generated file saying that a file without
it should be treated as stale on sight.

Measured on 2026-09-23, two consecutive runs missed that sentence. On
byte-identical inputs the superseded pair offered **61** items as ready to take
where the repo-owned pair offers **1**; it reported *"None held. Every claim in
the log is released or expired"* while **three** claims were live, which means it
offered work another agent was mid-way through; and it counted **110** items
whose only remaining step needs a person as available to an agent. The
"regenerate this file" instruction printed inside it names the generators by bare
filename, which resolves back to the superseded copies — so following the
artifact's own instructions reproduces the fault. One run did exactly that and
re-checked three long-finished items in lane order before noticing.

This moves that obligation off the reader and onto a check:

- the queue now records the **sha256 of the generator's own file**, read at the
  moment it runs, inside the file it writes;
- a small verifier compares that against the generator sitting beside it;
- **the claim helper refuses to write a claim when they do not match.**

A superseded copy cannot forge the stamp without being byte-identical to the
repo-owned generator — at which point it is not superseded.

## Layer Impact

Release lane: `internal-admin` — an AbarVa-only operations capability. Platform
tooling only. No product layer is touched: not client intake, not the source
adapters, not the canonical model, not any of the seven products. Nothing under
`src/` changes, and no runtime, route, schema, migration, job or prompt is
affected.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — an operator control, its wiring, and its CI contract.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/queue-provenance.mjs` — **new.** Writes and reads a versioned
  provenance stamp, evaluates a queue file against a generator, and exposes a
  CLI (`--register` or `--queue`, `--generator`, `--json`) that exits `0` only
  for `repo_owned`.
- `scripts/exec/queue-provenance.test.mjs` — **new.** 30 behavioural cases.
- `scripts/exec/build-execution-queue.mjs` — writes the stamp, hashing its own
  file at run time, plus a paragraph in the generated header saying what the
  stamp is for and how to check it independently.
- `scripts/exec/append-claim.mjs` — refuses a claim whose queue is not
  `repo_owned`, before the ownership gate runs. New optional `--queue`.
- `scripts/exec/append-claim.test.mjs` — its `fixture()` now writes a current
  queue beside each register, because a claim asserts its item is a row of one.
- `scripts/exec/build-execution-queue.test.mjs` — `queue-provenance.mjs` added
  to the toolchain files a fixture copies, since the generator now imports it.
- `.github/workflows/execution-queue-toolchain.yml` — runs the new suite.
- `scripts/exec/README.md` — documents the stamp, the verdicts, the wiring, and
  the one asymmetry below.

### Three design choices, each with its reason

1. **Hash, not path.** T-711's reason, reused deliberately: the same generator
   legitimately runs from a worktree, from a fixture directory a suite copied it
   into, and from a CI checkout. A path comparison refuses all three. The path
   is carried in the stamp anyway, because it is the evidence that *names* the
   copy that wrote the file, and a refusal that cannot name the copy is a
   refusal someone has to go and investigate.
2. **Every unknown verdict fails closed** — `unstamped`, `absent`, `unreadable`
   and `generator_missing`, not just `superseded`. A guard whose unknown case
   passes is opt-in, and the first file to reach it is by definition the one
   that predates it. The cost of failing closed is one regeneration, printed
   with the refusal; the cost of failing open is the queue this item was filed
   against.
3. **Only a claim is gated.** A release and an abstention *take* nothing, and a
   stale queue is exactly the moment a holder most needs to hand work back.
   Gating those would strand a live claim behind a regeneration and push the
   correction into a hand-written line, which is the path the helper exists to
   replace. This is the same asymmetry that already lets an abstention through a
   refused pre-claim gate.

## QA / Validation

**Red first, over the same scope.** `scripts/exec/queue-provenance.test.mjs`
against the branch point `origin/main` `b300d3108`, with the verifier present but
neither the generator stamp nor the helper wiring: **21 passed / 8 failed.** The
eight are exactly the two missing halves — three cases for "the real generator
writes a checkable stamp", five for "the real helper refuses a claim taken from a
stale queue". With both halves: **30 passed / 0 failed.**

**Every pre-existing suite in the directory, measured on both sides.** Baseline
taken by running each suite from a clean extraction of `origin/main` `b300d3108`,
not from memory:

| suite | `origin/main` | this branch |
|---|---|---|
| `append-claim.test.mjs` | 50 passed / 0 failed | 50 / 0 |
| `build-execution-queue.test.mjs` | 140 / 0 | 140 / 0 |
| `build-source-board.test.mjs` | 23 / 0 | 23 / 0 |
| `register-time-authority.test.mjs` | 186 / 0 | 186 / 0 |
| `worktree-retention.test.mjs` | 22 / 0 | 22 / 0 |

Both changed suites failed first and were repaired by teaching them the new
precondition, not by weakening anything: `append-claim.test.mjs` went 50/0 →
**28/22** → 50/0 once each fixture register carried a current queue beside it,
and `build-execution-queue.test.mjs` crashed on collection (`ERR_MODULE_NOT_FOUND`
for `queue-provenance.mjs`) until the fixture copied the module the generator now
imports. Both numbers are recorded rather than smoothed over: they are the
contract change stating itself.

**Mutation check: 14 deliberate breakages, 14 caught.**

| # | mutation | caught by |
|---|---|---|
| M1 | `unstamped` returns `repo_owned` | "a queue with no stamp is unstamped" + 4 more (25/5) |
| M2 | a stamp's presence alone is accepted, hash never compared | "a queue stamped by a different generator is superseded" + 5 more (24/6) |
| M3 | a missing queue file returns `repo_owned` | "no queue file at all is absent" + 2 more (27/3) |
| M4 | a missing generator returns `repo_owned` | "a generator we cannot find fails closed" (29/1) |
| M5 | the hash pattern relaxed from 64 hex to any token | "no prose mention of this control satisfies the stamp reader" (29/1) |
| M6 | `isRepoOwned` inverted to "not superseded" | "isRepoOwned refuses every verdict that is not repo_owned" + 4 more (25/5) |
| M7 | the stamp hashes a constant instead of the generator's file | "the stamp records the hash of the file it was given" + 6 more (23/7) |
| M8 | the derived queue path taken from `cwd`, not the register's directory | "the derived queue path is the register's own directory"; also `append-claim` 50/0 → 28/22 |
| M9 | the generator stops writing the stamp | "a queue the real generator wrote is repo_owned" + 3 more (26/4) |
| M10 | the generator stamps the board's hash instead of its own | "a queue the real generator wrote is repo_owned" + 2 more (27/3) |
| M11 | the claim-side check never runs | the five wiring cases (25/5) |
| M12 | the refusal downgraded to a warning that continues | the five wiring cases (25/5) |
| M13 | releases and abstentions gated as well as claims | "a RELEASE beside a stale queue is still recorded" + the abstention case (28/2) |
| M14 | the check accepts any verdict | the five wiring cases (25/5) |

Every mutation that could over-reach in the permissive direction (M1–M7, M11,
M12, M14) is caught by more than one case, and M13 is the only one that
over-reaches in the *restrictive* direction — it is held down by its own pair of
cases, because a control that refuses a release is worse than no control.

**Wiring, not just correctness.** Eight cases run the real `append-claim.mjs` as
a child process against real temporary operator roots. One case runs a **drifted
copy of the generator** over a synthetic operator root and asserts the queue it
writes is refused and that the refusal names the copy — the live situation, not
an invented one.

**Proven on the real register, which the suite cannot claim.** The control
refused and then permitted a real claim on the operator's own append-only log:

- The live queue at `06:17Z` carried no stamp. Pointing the helper at a file of
  that shape returned exit `1`, the verdict `unstamped`, and the regenerate
  command. Nothing was appended.
- Regenerating from this branch produced a `repo_owned` queue
  (`sha256 16e9ba3114d0`), and the same claim then appended normally.

Both are in the register's own T-720 lines, including the ordering, which is
disclosed rather than tidied.

- `node scripts/exec/queue-provenance.test.mjs` → `30 passed, 0 failed`
- all five pre-existing suites → table above, no regression
- `npx eslint` over the six changed files → exit 0
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 0**, zero diagnostics
- `node scripts/release-check.mjs --base origin/main --head HEAD` → exit 0

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` changes, so the
deployed image's behaviour is unchanged. The repo-owned ACA workflow builds and
deploys the merge commit as it does for every merge.

**One operator step, and it is the point of the change.** The first claim after
this merges will be refused if the live queue was written by any generator other
than the merged one. That refusal prints the fix and the fix is one command. It
is not a regression; it is the control doing exactly what it was built for, on
the first file that reaches it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` mutation of any kind.
- Approved image digest: n/a — no runtime behaviour changes.
- ACA runtime invariant: proven post-merge from the deploy run at or after the merge SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, structurally — nothing under `src/`
  changes, so no signed-in surface can differ.

## Rollback Plan

Revert the PR. The stamp is a comment in a generated file and the check is a
precondition on one script; reverting removes both and restores the prior
behaviour, in which a claim is not checked against its queue. No migration, no
data, no runtime state. A queue generated by the reverted generator simply
carries no stamp, and nothing then reads for one.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `exec/t-720-queue-provenance-gate`.
- The `Execution queue toolchain` check, step `Run the queue provenance contract`.
- The mutation table above; each row reproducible by applying the named breakage
  and re-running the two suites.
- The operator register lines for item T-720 — the claim, the amendment that adds
  the workflow file, and the refusal-then-permission ordering — all appended
  through the T-708 gate wiring.

## Known Gaps

- **The superseded copies still exist.** This makes them *detectable at the
  moment they matter*; it does not remove them. Removing files from an
  operator's own directory is outside this repository and is not something an
  unattended run should do on its own initiative. It remains owed, exactly as
  T-711 recorded it, and the honest change is that following the stale
  artifact's instructions now costs one refusal instead of a wasted run.
- **A regenerate instruction still names bare filenames** inside any queue the
  superseded copy writes, because that text comes from the superseded copy. That
  cannot be fixed from here; the refusal is what interrupts the loop.
- **The check binds a claim to a queue, not to a queue's correctness.** A
  repo-owned queue can still be *stale* relative to its inputs — that is
  `assertSummaryIsCurrent`'s job (T-711) and it is unchanged. A queue that is
  current and repo-owned can still offer a row whose item was closed minutes
  ago; re-verifying an item on current `main` before writing code remains the
  rule and no check replaces it.
- **The stamp is only as strong as the generator's file being what CI reviewed.**
  Anyone able to edit `scripts/exec/build-execution-queue.mjs` in a working tree
  can regenerate a queue that matches it. That is the right scope: the control
  is against *drift between two copies*, not against an author of this
  repository.
- **One case does not discriminate in the red state.** "An explicit `--queue` is
  checked instead of the one beside the register" passes before the wiring
  exists, because nothing is checked at all. It discriminates after, and M8
  proves it; it is named here so the red count of 8 is not read as 9.
