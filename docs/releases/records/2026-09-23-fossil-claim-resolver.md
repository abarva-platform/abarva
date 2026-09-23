# 2026-09-23-fossil-claim-resolver — Resolve the work queue's suppressed candidates against git and GitHub

## Release ID

`2026-09-23-fossil-claim-resolver`

## Status

`candidate`

## Plain-English Summary

The internal work queue that agents take items from suppresses an item whenever
the last note about it mentions a branch or a pull request, on the reasoning
that somebody is still working on it. That signal is never re-checked, so once
an item enters that bucket it never leaves. The rendered queue asks the reader
to finish the job by hand — look up each branch and pull request, and retire the
dead ones — and that manual step was never performed.

This adds a small command that performs it. Given the queue and the claim
register, it reads each suppressed item's branch from the note that suppressed
it, asks `git` whether the branch still exists and GitHub what was ever opened
from it, and reports one of four verdicts.

Run against the live documents, **none of the fourteen suppressed items was
actually in flight**: four had merged a day and a half earlier with their
branches deleted, nine had no branch and no pull request that ever existed, and
one names no branch at all. Six of the nine have nothing on `main` matching what
they describe, so the queue had been reporting "nothing claimable" while hiding
genuinely unclaimed work.

The verdicts `fossil` (this claim's work merged) and `abandoned` (this claim
produced nothing) are kept strictly apart, and only a `fossil` gets an offered
release line. Three of the nine abandoned claims name work that did land from a
different branch and three name work that never landed, so treating the two the
same would record undone work as finished.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only execution tooling. No product
surface, no client data plane, and no public or demo path is touched.

- **Layer 4 — Products:** none. No product surface imports this module and no
  tenant-facing behaviour changes.
- Repository tooling only: one new script and its behavioural suite in
  `scripts/exec/`, one CI step, and documentation.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — internal execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/fossil-claims.mjs` (new) — the resolver and its CLI.
- `scripts/exec/fossil-claims.test.mjs` (new) — 49 behavioural cases, every
  probe injected.
- `.github/workflows/execution-queue-toolchain.yml` — one appended step.
- `scripts/exec/README.md` — how and when to run it, and the verdict table.
- This release record.

`scripts/exec/build-execution-queue.mjs` is **deliberately untouched**. Letting
the queue generator read the repository was the other candidate remedy and would
make rendering the queue require a network and a credential; it would also move
the generator's `sha256`, which is the queue-provenance stamp, and so refuse
every concurrently-running agent's claim.

## QA / Validation

**Red first.** The suite was written before the module and failed to collect
(`ERR_MODULE_NOT_FOUND`). With the module present but its real-corpus cases
running against the live documents, it went `36 passed, 2 failed` — the two
failures being a subject grammar narrower than the queue generator's, which
resolved no claim line at all for three of the fourteen real candidates. Aligned
and re-run: `49 passed, 0 failed, 0 skipped`.

**Runner figures, predicted rather than read back.** With the operator documents
absent the three real-corpus cases skip and the suite prints
`46 passed, 0 failed, 3 skipped`. Skips are counted separately so a skipped case
cannot read as a passing one, and `46 + 3 = 49` reconciles both ways.

**Mutation proof: 11 mutations, 11 caught.** Two survived their first fixture
and are the interesting ones:

| mutation | failing cases |
|---|---|
| conflate `abandoned` into `fossil` | 3 |
| fail open on a probe error | 3 |
| fail open when no branch is named | 4 |
| treat an `OPEN` pull request as settled | 1 |
| ignore whether the branch still exists | 4 |
| offer a release line for an abandoned claim | 1 |
| read `branch none` as a real branch name | 1 |
| demand the timestamp at the start of the line | 3 |
| scan for an id anywhere rather than first-written-wins | 1 |
| report a stale result with exit 0 | 1 |
| scrape the prose after the em dash as ids | 1 |

The first escape looked like a redundant guard: a list of absence words
(`none`, `n/a`, …) sitting in front of a rule that already requires a branch
name to contain a slash. `none` has no slash, so removing the list changed
nothing — but `n/a` does, and without the list it would be probed, come back
with no ref and no pull request, and be reported `abandoned`: a verdict about a
branch the claim said it did not have. A case for `branch n/a` now pins it, and
removing the whole list fails that case.

The second escape was the em-dash split that separates the id run from the
sentence after it. Today's prose happens to contain no id-shaped token, so
scraping the whole line changes nothing on the live corpus; the ids in this
backlog include bare numbers and the generator writes counts into that same
sentence, so a fixture with a number in the prose now pins it.

Each mutation was applied to a copy of the original bytes and the file restored
and compared with `cmp` afterwards; the file is byte-identical to its pre-mutation
state.

**The CI step was proven able to fail before it was satisfied.** With the
`fossil`/`abandoned` split collapsed, the step exits 1 under the runner's
environment; restored, it exits 0.

**Real-corpus run**, `GH_TOKEN=` so the CLI keychain credential is used, against
`origin/main` `feeca0fcfcada7800a198e69e93b2788aa142958`:

```
Suppressed candidates resolved: 14
  fossil     4      (#8157, #8180, #8183, #8185 — all MERGED, branches deleted)
  abandoned  9
  alive      0
  unknown    1      (the claim declares `branch none`)
```

This reproduces, by execution, a lookup that was first done by hand for all
fourteen ids — the item was taken specifically so the detector would be proven
on real known positives rather than on fixtures alone.

**Scope baseline over the same scope**, both runs with `HOME` pointed at a
directory holding no operator documents so the two are comparable. *Before* is a
clean `git archive origin/main scripts/exec` extraction, not this working tree:

| | suites | passed | failed | skipped |
|---|---|---|---|---|
| before | 9 | 621 | **0** | 3 |
| after | 10 | 667 | **0** | 6 |

Every pre-existing suite is byte-identical in verdict and in count; the whole
movement is the new suite's 46 + 3. `toolchain-manifest.test.mjs` is unchanged
at 17/0 with the new module present, which is the assertion that matters for it
— its fixture copies the directory rather than a list, so a module added today
is picked up without anyone editing it.

`eslint`, `tsc --noEmit` judged by exit code, and `release-check` results are
recorded in the pull request.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` imports this module,
so the deployed image's behaviour is unchanged. The repo-owned Azure Container
Apps workflow will ship the merge as it ships every merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — this change makes no Azure call
- Approved image digest: not applicable; no runtime image change is requested
- ACA runtime invariant: unaffected by this change
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and this is a property of the change
  rather than an omission — no product surface imports the new module, so a
  signed-in session would have nothing to look at

## Rollback Plan

Revert the pull request. The new script has no callers inside the product and no
persistent state, so reverting removes a command and a CI step and nothing else.
No migration is involved.

## Audit Evidence

- The pull request and its check run
- The CI step `Run the fossil-claim resolver contract` in
  `Execution queue toolchain`
- The mutation table above, reproducible from the suite
- The real-corpus output quoted above

## Known Gaps

- **The subject grammar is a second copy.** Which item a register line is about
  is decided by three grammars and a first-written-wins contest, implemented
  here and in `build-execution-queue.mjs`. One shared parser is the right
  repair and is not taken here because editing the generator moves its `sha256`
  — the queue-provenance stamp — and would make every concurrently-running
  agent's claim be refused. Each grammar and the precedence rule is pinned by a
  case, and the live register is replayed so drift is loud, but two copies can
  still drift.
- **The resolver reports; it never appends.** Retiring a fossil is still a
  decision someone takes, and the choice of mechanism for retiring suppressed
  claims in general remains open and is not settled by this change.
- **The branch half of the suppression signal does not match the branch naming
  this tooling's own operator instructions produce.** The generator recognises
  `codex/…` and `claude/…`; branches created by the documented
  `git worktree add -b` step are named `exec/…`, which that pattern does not
  match. Filed separately rather than changed here, because changing it changes
  what the queue offers.
