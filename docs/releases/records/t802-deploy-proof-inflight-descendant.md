# 2026-10-05-t802-deploy-proof-inflight-descendant — the deploy-proof resolver no longer calls an in-flight deploy "not deployed"

## Release ID

`2026-10-05-t802-deploy-proof-inflight-descendant`

## Status

`candidate`

## Plain-English Summary

An operator tool answers one question: has the deploy for this merge actually
happened? It can answer `deployed`, `superseded` (a later build carried the
commit), `not_deployed` — which is a finding somebody has to act on — or
`unresolved`, which means come back in a minute.

It was answering `not_deployed` in a case where the honest answer is "come
back". The deploy pipeline cancels a build when a newer push supersedes it, so
for the first few minutes after a merge the common shape is: the build keyed to
the merge itself got cancelled, and the build that is actually carrying that
commit is still running, keyed to a later commit. The tool only looked for a
still-running build on the merge commit exactly. Finding none, and finding no
*finished* later build either, it fell through and reported that the commit was
never deployed — about a commit whose deploy was in mid-air.

That is the false state this tool was written to remove, reached from the other
side: the module's own header names this exact trap. Because the pipeline
cancels on most merges, this was not a rare window — it was the default path for
the first few minutes of every merge into a busy queue.

The fix keys the "come back" answer to the same ancestry test the tool already
uses for its proof: a still-running build counts as something to wait for when
its commit is a descendant of the merge, and when it started after the merge
existed. It is deliberately *not* "any build that happens to be running" — by
timing alone the newest build is routinely from a different branch entirely, and
waiting on that one would hand this commit's verdict to whoever merged next.
That is the opposite trap, and two of the new test cases exist to hold it shut.

## Layer Impact

Release lane: `internal-admin`. The change is an AbarVa-only operations
capability — the tool an operator or agent uses to decide whether a merge's
deploy has happened — and it reaches no client surface and no tenant data.

No product layer changes. This is operator tooling only — layer 4 surfaces,
layer 3 canonical model, the source adapters and client intake are all
untouched, and no tenant data is read or written.

The affected module is `scripts/exec/deploy-proof-resolver.mjs`, which reads
workflow-run records and a git ancestry oracle and returns a verdict. It
mutates nothing, calls no Azure API, and shifts no traffic.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — operator/agent release tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/deploy-proof-resolver.mjs` — step 3's in-flight set is now the
  runs that are in flight **and** pass `notBeforeTheMerge` **and** pass the same
  `isAncestor(mergeSha, run.headSha)` test the `descendants` filter in step 2
  already uses, sorted by `createdAt`. Previously `exact.find(isInFlight)`,
  which can only see a run whose head is the merge SHA itself. The reason string
  now names the descendant when the waited-on run is on one. `isAncestor` is an
  identity on `exact`, so the pre-existing exact-SHA behaviour is unchanged.
- `scripts/exec/deploy-proof-resolver.test.mjs` — 4 new cases, 6 new
  assertions (`11a`–`11d`), grouped with the existing in-flight cases 10 and 11.

## QA / Validation

Re-verified on current `main` (`a48fd427d5`) before writing any code. The item's
described defect reproduces at unit level against the unmodified module, with
the shape the backlog line cites:

```
resolveDeployProof({ mergeSha: <merge>, mergedAt: <before>, runs: [
  { headSha: <merge>,      status: "completed",   conclusion: "cancelled" },
  { headSha: <descendant>, status: "in_progress", conclusion: null        },
], isAncestor: <merge is ancestor of descendant> })
→ verdict "not_deployed", run null,
  reason "every run on the exact SHA failed or was cancelled ... and no descendant run succeeded"
```

After the fix the same call returns `unresolved` and names the in-flight
descendant run.

Baseline over the same scope, `node scripts/exec/deploy-proof-resolver.test.mjs`:

| state | result |
|---|---|
| `main` as-is, before the new cases | 44 passed, 0 failed |
| new cases added, fix NOT applied (red first) | 47 passed, **3 failed** |
| new cases and fix both applied | 50 passed, 0 failed |

The three reds are `11a` (two assertions) and `11b`. `11c` and `11d` pass before
the fix as well as after — they are regression pins on the two filters the
widening must keep, not demonstrations of the defect, and the mutations below
are what show they can fail.

Mutation check — three mutations, each applied to the fixed module in isolation
and then reverted:

| mutation | cases killed | result |
|---|---|---|
| 1. narrow the in-flight set back to `exact` (the pre-fix code) | `11a` ×2, `11b` | 47 passed, 3 failed |
| 2. drop `.filter((run) => isAncestor(mergeSha, run.headSha))` — widen to any in-flight run | `11c` ×2 | 48 passed, 2 failed |
| 3. drop `.filter(notBeforeTheMerge)` | `11d` | 49 passed, 1 failed |

Each mutation is killed by the case that pins it, and mutation 2 is the specific
over-correction the module header warns about, so the guard against it can fail.

Whole-directory sweep, which is what the blocking job runs — 17 suites under
`scripts/exec/`, 1,458 assertions, 0 failed, including the 229-assertion queue
generator and the 354-assertion register time-authority contract:

```
for suite in scripts/exec/*.test.mjs; do node "$suite"; done   # 0 failed
```

`npx eslint scripts/exec/deploy-proof-resolver.mjs scripts/exec/deploy-proof-resolver.test.mjs`
— exit 0, no findings.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit
code recorded in the pull request; both changed files are `.mjs` and outside the
TypeScript program, so this is a no-regression check rather than coverage of the
change.

**Which check can fail a merge over this.** The suite is run by two jobs, and
they are not equivalent. `Execution queue behavioral contract` in
`.github/workflows/execution-queue-toolchain.yml` names it in its own step and
is required by no ruleset — a red there cannot stop a merge. The job that can is
`Run hygiene_gate.sh`, which is one of the 19 required contexts on `main` (read
by name from the rulesets API during this change) and which sweeps
`scripts/exec/*.test.mjs` by glob, echoing each suite's path before running it,
so the blocking run carries a quotable line for this suite. That wiring is
item C-582's, not this item's; it is stated here because "the suite runs in CI"
would otherwise be a true sentence about a run that gates nothing.

## Rollout Plan

Merge to `main`. No runtime rollout: no Azure Container Apps image, no revision,
no worker job, no environment variable, no feature flag and no migration is
touched. The change takes effect the next time an operator or agent invokes the
resolver from a checkout containing it.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy
workflows, runtime images, flags, environment variables, worker jobs, traffic,
DNS, or environment promotion.

- Repo-owned deploy workflow: unchanged; `aca-main-deploy.yml` is not modified
- Shared runtime mutators: none
- Approved image digest: n/a — no image is built or deployed by this change
- ACA runtime invariant: unaffected; `readRuntimeInvariant` is not modified
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no — there is no product surface in this change

## Rollback Plan

`git revert` the squash commit. The module is pure and stateless, nothing
persists a verdict computed under the new behaviour, and the only effect of
reverting is that the pre-fix false `not_deployed` returns. No migration, no
data backfill and no redeploy are involved.

## Audit Evidence

- Pull request, with the red/green/mutation numbers in the body.
- CI: `Run hygiene_gate.sh` on the pull request — the required context whose
  glob sweep runs this suite; its log names
  `--- scripts/exec/deploy-proof-resolver.test.mjs` before running it.
- CI: `Execution queue behavioral contract` — advisory, not required.
- The reproduction and mutation numbers above are reproducible from the
  commands given, with no credential and no network access.

## Known Gaps

- **The live reproduction window has closed and is not re-observable.** The item
  measured the defect against real runs at `2026-10-05T15:37Z`: run
  `37333964109` `cancelled` on the merge SHA, run `37334281622` `in_progress` on
  a descendant that `git merge-base --is-ancestor` confirms. Re-read at
  `2026-10-05T16:08Z`, run `37334281622` has itself completed `cancelled` — a
  later push superseded it too. So the GitHub-side state is gone; what stands is
  the unit-level reproduction above, which is the same shape stated as a fixture
  and does not depend on a transient queue.
- The resolver still answers `not_deployed` when the only in-flight run is on a
  commit this checkout cannot see — a branch deleted and garbage-collected
  before the question was asked. `gitAncestry` answers false for an unknown SHA
  by design, and that is deliberate and documented in the module: an unprovable
  ancestry must not be credited. It is named here because it is the one
  remaining path to a `not_deployed` on a commit that may be mid-deploy, and it
  is a refusal to guess rather than a defect.
- `UNRESOLVED` is reported once; the resolver does not poll. A caller that wants
  a settled answer must re-ask. Unchanged by this item.
