# 2026-10-06-t837-per-unit-top-rung — A per-unit item at the top rung no longer goes dark in the execution queue

## Release ID

`2026-10-06-t837-per-unit-top-rung`

## Status

`candidate`

## Plain-English Summary

The execution queue is the file an agent reads to answer "what do I work on
next". Most rows it offers are work nobody has started. One section exists for a
different and harder case: an item whose acceptance is written **per unit** —
"one row at a time", "one directory at a time" — stops being offered the moment
its *first* unit ships, because the queue's claimable filter only offers items at
rung 0. The rest of the row set would then be invisible to every later run, so
the queue renders it in a bucket of its own named "Residual work a proof rung
cannot close".

Two independent defects let an item slip past that bucket as well, and an item
that is in neither place is in **no** place: it reads as finished to every
reader while its remaining units are untouched.

1. The bucket recognises a per-unit acceptance by matching a list of phrases.
   The list had "one *unit* at a time" but no pattern for the sibling idiom "one
   *unit* per pull request", which is how one live item words exactly the same
   requirement.

2. The bucket excluded any item at the top rung ("signed-in proven"). For an
   item whose acceptance covers the whole item, that is right — the top rung
   *is* its proof. For a per-unit acceptance it means **one unit** reached
   signed-in proof, and the row set is no more settled than it was two rungs
   lower. It is in fact the worst rung for this to happen at, because the row
   now reads as fully proven rather than partly done.

Both are fixed. The practical effect: the bucket's "no owner blocker" line — the
rows that appear in no other bucket of the file at all, which is the state the
section was built to report — goes from 3 rows to 6.

## Layer Impact

- **Layer 4 (products):** none. No route, component, read model, prompt, answer
  path or tenant-visible behaviour changes.
- **Layer 3 (canonical model):** none.
- **Layer 2 (source adapters) / Layer 1 (client intake):** none.
- **Execution tooling (outside the four layers):** the work-queue generator
  `scripts/exec/build-execution-queue.mjs` and its behavioural suite. This
  changes which backlog rows an agent is shown as open; it does not change any
  product, dataset or governance artifact.

Release lane: `internal-admin`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator work-queue tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs`
  - `PER_UNIT_PHRASES` gains `/\bone [a-z]+ per (?:pull request|pr)\b/i`.
  - The `residualAtRung` filter no longer excludes rung 7. It is now
    `i.rung > 0 && Boolean(perUnitPhrase(i))`.
  - `isFinished` itself is **unchanged**, and its two other call sites
    (`partlyGated`, the *Blocked on Anand* partition) are untouched.
- `scripts/exec/build-execution-queue.test.mjs`
  - Case (b) inverted, with the reason recorded in the suite: it previously
    asserted that a per-unit item at rung 7 must **not** appear, which is the
    defect itself.
  - Cases (e), (f), (g) added — see QA below.

## QA / Validation

**Premise re-verified by execution on current `origin/main` `91d90ad59f`, not
read from the backlog.** The live instance is item `C-593`: rung 7 "Signed-in
proven", `blocker: null`, lane C, acceptance beginning "One workflow per pull
request, not six in one". It appeared in **no bucket** of the generated queue —
not claimable (above rung 0), not residual (finished, and its phrase unmatched),
not blocked (no blocker). Its own register release line records four of five
workflows untouched, and three were still red at their newest scheduled run when
this was written (runs `37298722313`, `37362299683`, `36896498313`).

**Each defect measured independently on the live summary of 790 items**, because
the fix is only correct if both halves are needed:

| variant | residual set | live instance reachable |
|---|---|---|
| before | 18 | no |
| phrase pattern only | 21 | **no** |
| rung 7 admitted only | 19 | **no** |
| both | **23** | **yes** |

**Over-capture measured before proposing**, on the same terms the phrase list
states for itself. The new pattern matches 6 of 790 acceptances and every one is
genuinely per-unit: "One line per PR" (`T-581`, `T-584`, `T-586`, `T-474`), "One
caller per PR" (`C-527`), "One workflow per pull request" (`C-593`). A previous
widening of this list was rejected for taking the set 9 → 21 by matching
per-direction proof language; this one adds five rows.

**Suite, same scope, same file:**

- clean baseline on `origin/main`: **229 passed / 0 failed**
- with the new cases, before the fix: **231 passed / 2 failed**
- after the fix: **233 passed / 0 failed**

**Mutations, each applied alone so one red is attributable to one guard.** The
mutator refuses unless the target string occurs exactly once, so a mutation that
silently edits nothing cannot be mistaken for a survivor.

| mutation | result | killed by |
|---|---|---|
| remove the new per-PR phrase | 1 failed | (g) |
| restore `!isFinished(i)` in the filter | 1 failed | (b) |
| admit rung 0 into the bucket | 1 failed | (e) |
| make every acceptance count as per-unit | 3 failed | (c), (d), (f) |
| delete a `rungLabel !== "Closed"` clause | **0 failed — SURVIVED** | — |

The survivor was diagnosed rather than reported as a coverage gap, and it
changed the shipped code. A first draft kept `rungLabel !== "Closed"` in the
filter for symmetry with `isFinished`. That clause can never fire: all three
`Closed` returns in `deriveRung` are `rung: 0`, and all 25 `Closed` items in the
live summary are at rung 0, so it sits unreachable behind `rung > 0`. A guard
that cannot fail is the thing this tooling exists to stop shipping, so it was
removed and the behaviour asserted instead — case (e) drives a per-unit item to a
`CLOSED` verdict and requires it to stay out of the bucket, and mutation 4 proves
that case can fail.

**Other checks**

- `npx eslint` on both changed files: exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`:
  **exit 0**, judged by exit code and not by grepping for `error TS`; zero lines
  of output.
- `audit:named-suite-requiredness`: exit 0, 36 directories swept by a required
  job.
- `audit:ci-gate-registry`: exit 0. No new `audit:`/`check:`/`validate:` npm
  script was added, so there is nothing new to classify.
- `audit:ci-gate-registry-order`: exit 0, 237 entries sorted.
- `scripts/release-check.mjs --base origin/main --head HEAD`: see Audit Evidence.
- Disclosure scan over the staged diff for client cover names, the control
  database name, image digests and key prefixes: zero hits. `gitleaks` is not on
  PATH in a worktree (`hooksPath` is main-checkout only), so this was done by
  hand and is stated as such rather than implying a tool ran.

## Rollout Plan

Merge to `main` via squash. No runtime rollout: this file is a developer-tooling
generator run by an operator on demand, is not imported by the application, and
is not part of any image. No ACA deploy is required for it to take effect.

## Deployment Authority

Not applicable — the change cannot affect Azure Container Apps, deploy
workflows, runtime images, flags, environment variables, worker jobs, traffic,
DNS, or environment promotion.

- Repo-owned deploy workflow: not used
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no client surface changes

## Rollback Plan

Revert the squash commit. The generator is regenerated from source on every run,
so a revert restores the previous queue output on the next invocation with no
state to unwind. No migration, no data, no runtime.

## Audit Evidence

- PR: see `Changes Included`; the PR body carries the same before/after numbers.
- Branch: `exec/run-20261006T005901Z`.
- Suite output: `node scripts/exec/build-execution-queue.test.mjs`, reproducible
  locally; the three figures above are 229 / 231+2 / 233.
- The live effect is reproducible without the operator documents being mutated:
  regenerate the board and queue with `--operator-root` pointed at a copy and
  read the residual bucket's own stated count and its "no owner blocker" line.

## Known Gaps

- **`C-593` itself is not closed by this change, and must not be read as
  closed.** This makes its remainder *visible*; the remainder is still open.
  Measured during this work and recorded so the next run does not re-diagnose
  it: of its five workflows, one is repaired and its owed proof is now
  discharged (two consecutive scheduled successes, runs `37213962907` at
  `2026-10-04T15:41:40Z` and `37363970322` at `2026-10-05T19:31:37Z`), one is
  healthy and reporting a true finding that belongs to `D-516`, and the three
  remaining are blocked on operator-minted credentials rather than on code — one
  reports no context-database secret on the operator job plus missing Azure
  client/tenant/subscription ids, one fails credential redemption against a
  different instance than the one that minted it (already filed as `C-581`), and
  one resolves no DNS for its lab database host. None of those three is closable
  by an agent; they are the same shape as `C-577`.
- **The committed test-CI census is stale by +1 on `origin/main` and this change
  did not cause it and does not repair it.** `testFiles 2724 -> 2725`,
  `coveredTestFiles 2560 -> 2561`. This commit adds and deletes zero files
  (`git diff --diff-filter=AD origin/main...HEAD` is empty), so the file count
  cannot have moved because of it. `docs/architecture/test-ci-coverage-census.json`
  is also held by another live claim at the time of writing, so refreshing it
  here would collide. Left to its holder.
- The `Closed` exclusion is now carried by `rung > 0` rather than by a named
  clause. That is deliberate and asserted, but it does mean the generator no
  longer *says* "Closed" anywhere in this filter. Case (e) of the suite is the
  thing holding it shut.
