# 2026-09-23-t735-branch-grammar-mutation-pins — Pin the two unfalsifiable guards in the claim-branch grammar

## Release ID

`2026-09-23-t735-branch-grammar-mutation-pins`

## Status

`candidate`

## Plain-English Summary

The execution toolchain reads an operator register of work claims and decides, from each line's
text, whether an item is still being worked on. The function that pulls a branch name out of a
claim line has two guards: a branch must look like a path (contain a `/`), and a line that says it
has no branch must not be given one by a name it merely mentions in passing. Both guards were
**unfalsifiable**: deleting either one left both behavioral suites entirely green, so neither was
actually being proved by anything. That is the exact defect this toolchain exists against — a
control whose test cannot fail is indistinguishable from no control.

This change pins both guards with cases that fail when the guard is removed, and answers the
open question about the first one with a measurement rather than an opinion.

It also repairs a real defect found while writing those cases. The "no branch" guard returned
early, so an absence phrase **anywhere later in the line** discarded a branch the line had already
correctly declared. One live register line is in that state today: it declares its own branch and
then narrates the string `branch n/a` in a sentence describing this very guard, and the whole line
resolved to no branch at all. On that line the consequence is nil, because it is a release line and
a release outranks in-flight. On a *claim* line the same shape would drop a held item back into the
"free to take" list and hand work someone is holding to a second agent — the failure the register
exists to prevent.

## Layer Impact

Release lane: `internal-admin`. AbarVa-only execution tooling; no client-facing capability ships.

No product layer. This is platform tooling only: `scripts/exec/fossil-claims.mjs` and its
behavioral suite. No client intake, source adapter, canonical model or product surface is touched.
No route, schema, migration, job, image, flag or env var changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — execution-board toolchain, repo-owned scripts and tests
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/fossil-claims.mjs` — `branchesInClaim` now records an absence declaration instead
  of returning on it, and applies that absence only after the declared-field pass has found
  nothing. Three paragraphs of the doc comment now state what each guard is for and what evidence
  supports it.
- `scripts/exec/fossil-claims.test.mjs` — four cases added: two pinning the path-shape
  requirement, one pinning the absence veto against the prose fallback, and one pinning the
  ordering repair.
- `docs/releases/records/2026-09-23-t735-branch-grammar-mutation-pins.md` — this record.

## QA / Validation

Baseline over the same scope, on `origin/main` at `2b13075e1`, before any edit:

| suite | before | after |
|---|---|---|
| `node scripts/exec/fossil-claims.test.mjs` | 49 passed, 0 failed | 53 passed, 0 failed |
| `node scripts/exec/build-execution-queue.test.mjs` | 157 passed, 0 failed | 157 passed, 0 failed |

**The item re-verified by execution, not by reading it.** Each mutation was applied to the
unmodified file on `origin/main` and both suites run:

| mutation applied to `origin/main` | `fossil-claims` | `build-execution-queue` |
|---|---|---|
| drop `if (name.includes("/"))` | 49 passed, 0 failed | 157 passed, 0 failed |
| absence veto `return []` → `continue` | 49 passed, 0 failed | 157 passed, 0 failed |

**Neither mutation is a no-op** — a mutation that changes nothing reads exactly like a coverage
gap, so each was run against the real function and shown to change its answer:

| input | unmutated | slash guard dropped | veto continues |
|---|---|---|---|
| `… branch wip …` | `[]` | `["wip"]` | `[]` |
| `… branch none … codex/some-branch …` | `[]` | `[]` | `["codex/some-branch"]` |

**Mutation proof after the change** — each guard broken deliberately, only its own case failing:

| mutation | result |
|---|---|
| drop `if (name.includes("/"))` | 51 passed, **2 failed** — both path-shape cases |
| delete `if (declaredAbsent) return [];` | 52 passed, **1 failed** — the fallback case |
| restore the order-blind early `return []` | 52 passed, **1 failed** — the ordering case |
| none (as merged) | 53 passed, 0 failed |

**The path-shape verdict is measured, not asserted.** Across the 2,170-line live register, 575
lines carry a `branch <value>` match. Every no-slash value captured is prose, not a name:
`deleted` 44, `is` 13, `was` 9, `and` 9, `merged` 7, `pushed` 5, `rebased` 3. Dropping the
requirement turns **19** lines that are not in flight today into lines that are, including a
parseable claim line whose sentence "the … branch has no PR" would yield the branch names `has`
and `left`. So the requirement stays, and the explicit answer to the open question is: a declared
branch with no `/` is **not** read as a branch. That is a real limit, and it holds only while every
branch in this register carries a `codex/`, `claude/` or `exec/` prefix. A convention that ships an
unprefixed branch name must change this guard rather than work around it.

**Blast radius of the ordering repair, measured on the live register:** exactly **1** line changes
its extracted branch list, and **0** lines change their in-flight answer. Rendering the full queue
from identical inputs with the pristine and the fixed module produces byte-identical output apart
from the provenance stamp — same 0 claimable, same 128 in-flight, same 9 suppressed candidates,
same 89 free to take.

Also run, all green and unchanged: `append-claim` 50/0, `build-source-board` 23/0, `cli-entry`
19/0, `id-collision` 70/0, `queue-provenance` 30/0, `register-time-authority` 258/0,
`toolchain-manifest` 17/0, `worktree-retention` 22/0.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged by
exit code rather than by grepping stdout. `npx eslint` on both changed files — exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: these scripts are developer and agent tooling, not part of any
built image or served route. The repo-owned ACA deploy workflow will build and deploy the merge
commit as it does for every merge, and that deploy carries no behavior from this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release
- Shared runtime mutators: none — no `az containerapp` command, no image, flag, env var, scale or
  secret is touched
- Approved image digest: not applicable; this release changes no runtime input
- ACA runtime invariant: unchanged by this release; the post-merge digest equality is recorded in
  the execution register as routine deploy proof, not as evidence for this change
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product surface, route or rendered output changes

## Rollback Plan

Revert the single squash commit. Nothing persists: no migration, no data write, no generated
artifact is committed. The execution queue is regenerated on demand and would immediately return
to the pre-change reader.

## Audit Evidence

- The pull request for this record, its CI run, and the squash SHA
- The two suites above, runnable offline with no credential:
  `node scripts/exec/fossil-claims.test.mjs` and `node scripts/exec/build-execution-queue.test.mjs`
- The mutation tables in QA / Validation, each reproducible by applying the named edit to the file
  and re-running the suite

## Known Gaps

- **The guard is pinned, the grammar is not widened.** A declared branch with no `/` is still not a
  branch. That is now a recorded decision with its evidence rather than an accident, but it remains
  a limit of this reader.
- Out of scope, and deliberately not touched here: whether the queue's in-flight suppression should
  ever expire. A separate finding from this run is that the resolver can call a suppressed claim
  `abandoned` — branch gone, no pull request ever opened — and there is no register verb for that
  verdict, so the item stays suppressed permanently. Eight items are in that state today. It is
  filed as its own backlog item and is not addressed by this change.
