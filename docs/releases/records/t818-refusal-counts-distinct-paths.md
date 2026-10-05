# 2026-10-05-t818-refusal-counts-distinct-paths — the claim gate's refusal headline counts paths, not hold records

## Release ID

`2026-10-05-t818-refusal-counts-distinct-paths`

## Status

`candidate`

## Plain-English Summary

The execution register has a gate that stops two agents editing the same file at
once. When it refuses a claim it prints a one-line summary followed by a list of
who holds what. The summary said, for example, `4 of 3 requested path(s) already
held` — more held paths than were asked for, which cannot be true.

The two numbers were counting different things. The list underneath is one entry
per holder-line, deliberately: the register is append-only, so one agent's claim
plus its later amendment are two lines, and both cite the same files. The
summary was using the length of that list as its first number while its second
number was the count of paths the agent actually asked about. One path cited on
two lines was therefore counted twice.

The cost is not cosmetic. That block of code exists, by its own comment, so an
agent "cannot tell WHICH of the files it asked for is held" stops being true —
otherwise it re-runs the gate one path at a time. In the real case measured here
a run asked about three paths, two were held and **one was free**; `4 of 3`
cannot express that, and `2 of 3` tells the reader to go find the clear one.

The first number is now the count of distinct requested paths that are held. The
list below it is unchanged and still names every holding line, because
collapsing it to make the numbers agree would hide one of two holders — which is
the failure the gate's own comment warns about, and which is pinned here by a
test of its own.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling. No product
surface and no client environment is in scope.

None of the four product layers. This is operator/agent tooling only:
`scripts/exec/append-claim.mjs` renders a refusal report for a gate that runs
before a register write. No tenant data, no canonical model, no adapter, no
product surface, and no served route reads or renders anything changed here.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — agent execution tooling; the only consumer is an
  agent or operator reading a refusal on the terminal
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/append-claim.mjs` — the file-half refusal headline now reports
  the number of distinct requested paths that are held. The per-holder list is
  untouched.
- `scripts/exec/append-claim.test.mjs` — case 29 (item T-818): six cases, two of
  them the acceptance, two of them guardrails.

No workflow, migration, route, dataset, manifest or env var changed.

## QA / Validation

Baseline and result over the same scope — `node scripts/exec/append-claim.test.mjs`:

| | passed | failed |
|---|---|---|
| before this change (clean `origin/main` `e2d5096330`) | 94 | 0 |
| with the new case, before the fix | 98 | **2** |
| after the fix | **100** | **0** |

So **2 failing before, 0 after**, same scope. The 4 extra passes are the new
case's two setup assertions and two guardrails.

The failing test came first and it drives the real helper as a child process
over a fixture register in a temp directory — no case reads an operator file.
Its setup assertion takes independent truth from the gate itself
(`register-time-authority.mjs --preclaim --json`): 4 hold records, 2 distinct
held paths, 3 requested. Without that, the acceptance could pass against a gate
that never produced the shape.

**The fix was then broken deliberately, in both directions:**

| mutation | result |
|---|---|
| 1. first number back to the hold-record count (`conflicts.length`) | **killed** — 2 failed: both acceptance cases (`98 passed, 2 failed`) |
| 2. make the numbers agree by de-duplicating the LIST instead | **killed** — 1 failed: the guardrail (`99 passed, 1 failed`) |

Mutation 2 is the one that matters. It is the tempting fix, it passes *both*
acceptance cases, and only the guardrail catches that it has silently dropped
one of the two holders from the list.

Full toolchain, all 17 suites in `scripts/exec/`: **1364 passed, 0 failed**
(`append-claim` 100, `register-time-authority` 354, `build-execution-queue` 229,
`build-source-board` 106, `signed-in-proof-reconcile` 127, `fossil-claims` 91,
`self-falsifying-assertion-probe` 91, `id-collision` 72, `register-merge-coverage`
53, `deploy-proof-resolver` 50, `worktree-sweep-hazard` 38, `cli-entry` 34,
`queue-provenance` 30, `worktree-retention` 27, `claimable-preconditions` 23,
`register-citation-check` 22, `toolchain-manifest` 17).

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit
0**, judged by exit code and not by grepping for `error TS`.
`npx eslint scripts/exec/append-claim.mjs scripts/exec/append-claim.test.mjs` —
exit 0.

**Measured on the live register as well, which is where the defect was found.**
Two probes, both `--dry-run`, both refused, nothing appended:

| probe | before | after |
|---|---|---|
| 3 paths, 2 held by one claim on 2 live lines | `4 of 3` | `2 of 3` |
| 2 paths, both held by one claim on 2 live lines | `4 of 2` | `2 of 2`, all 4 citing lines still listed |

A caveat on reading those, because they are point measurements: the register's
3-hour window moved between the two readings, so the first probe's "after" is
also one holder-line shorter than its "before". The controlled before/after over
identical bytes is the fixture case, and it is the one the table at the top of
this section reports.

## Rollout Plan

Merge to `main`. There is no runtime rollout: the changed file is a Node script
invoked by hand from a worktree and is not built into the web image, not read by
any route, and not executed by any Container Apps job. The repo-owned ACA deploy
workflow will build and deploy the merge commit as it does every merge, and that
deploy carries no behaviour from this change.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy
workflows, runtime images, flags, env vars, worker jobs, traffic, DNS, or
environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none; no `az` command is run by this release
- Approved image digest: not applicable — no runtime image is selected here
- ACA runtime invariant: unaffected; the deploy keyed to this merge is incidental
- Worker image invariant: unaffected; no worker job reads this script
- Feature/env flag update path: none
- Live signed-in proof required: **no** — nothing served changes. The only
  consumer is a terminal reader.

## Rollback Plan

Revert the squash commit. No migration, no data, no flag, no runtime state; the
revert restores the previous headline wording and nothing else. A rollback is
also harmless to leave undone, since the worst case is the previous misleading
summary line beside a list that was always correct.

## Audit Evidence

- PR and CI run: recorded on the pull request for this branch
- `node scripts/exec/append-claim.test.mjs` output: 100 passed, 0 failed
- The two mutation runs above, each with its own failure count
- The live-register probe output, before and after, in the QA section
- Register line: `2026-10-05T22:16:22Z | source-backlog-executor#20261005T2208Z`
  claims T-818 and declares these exact files

## Known Gaps

- **The second emitter was left alone, on purpose.**
  `register-time-authority.mjs` prints the same facts as
  `N requested, M contended` — two independent counts with no claimed subset
  relation between them, so it is not wrong and needed no change. Its paths are
  held by another live claim this hour in any case.
- **The sibling defect is filed, not fixed, and is a different item.** T-804
  covers the gate locking a path that appears only in a claim line's
  explanatory prose. It is the reason both lane-T rows were unavailable when
  this item was filed, and its files are held by a live claim. Nothing here
  changes which paths are locked — only how many are reported.
- **The fallback ladder's step 2 is exhausted and that is recorded here because
  nothing else records it:** all 50 declared controls in
  `docs/security/ai-surface-control-catalog.json` now carry a `behavioralTest`,
  measured this run. The scheduled task's own instructions still say "only four
  of eighteen have one", which was true on 18 Sep and is now stale.
