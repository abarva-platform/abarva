# 2026-09-27-register-merge-coverage — Report merges that the deployment register never names

## Release ID

`2026-09-27-register-merge-coverage`

## Status

`candidate`

## Plain-English Summary

A change can merge to `main`, ship, and alter a product surface while nothing in the
deployment register names it. Every downstream reader of that register is keyed to a
line, so a merge with no line acquires no `merged` state, no `deployed` state and no
signed-in question — and no item reports it as unfinished. The absence of a row and
the absence of work look identical, and until now nothing could tell them apart.

This adds an operator-invoked detector that reports, per merge on `main` since a given
base, whether any register line names that merge — by its merge SHA or by its pull
request number — and names an unnamed merge as **its own reported state** rather than
as silence.

Four related controls already ask whether a register line decides a row *correctly*.
This asks the question one level up: is there a line at all.

## Layer Impact

- `internal-admin` — operator tooling and CI contract only. One new script, one new
  behavioural suite, one CI step, one README section.
- No product layer changes. Nothing renders, routes, queries, prompts, or reads tenant
  data. No migration, no schema change, no auth or RLS change.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: **yes** — AbarVa operations tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-merge-coverage.mjs` — the detector.
- `scripts/exec/register-merge-coverage.test.mjs` — its behavioural contract, 50 cases.
- `.github/workflows/execution-queue-toolchain.yml` — one step running that suite.
- `scripts/exec/README.md` — a section for the tool, plus five suite lines the `Verify`
  block was missing while the workflow already ran four of them.

### What the detector decides, and the two readings it had to fix

Three naming states, and the middle one is the reason a `grep` is not this tool:

| verdict | meaning |
|---|---|
| `named` | some register line's **subject** pull request is this merge's |
| `mentioned-only` | the SHA or the number is on file, and no line is about it |
| `unnamed` | neither appears anywhere in the register |
| `unresolved` | the pull request lookup was skipped, so the question is withheld |

The item that asked for this was filed on a measurement that grepped for
ten-character SHA abbreviations. Re-running it through the register's own grammar
moved five of its nine findings, in opposite directions:

- **Match a SHA by prefix relation, never at a fixed width.** git abbreviates to
  whatever length is unambiguous and the register quotes whatever git printed — 8, 9,
  10 and 40 characters all appear in it. A ten-character probe missed the one merge of
  the nine that the register does name, at eight characters, and also by its pull
  request number.
- **A SHA in another item's prose is not that merge's line.** Four more of the nine do
  appear, at nine characters, and none of them is named: each is quoted as another
  item's base, another item's merge narrated in passing, or the SHA of a deploy run a
  different item was queued behind. A substring reader calls all four accounted-for.
  This is the subject-versus-passing distinction an earlier item had to draw about
  pull requests, asked about SHAs, and the join reuses that module's
  `subjectPullRequest` rather than re-implementing it.

Provenance is reported as three answered states plus one unasked one. A commit whose
only associated pull request is **closed without being merged** is its own state: the
API does not say how such a commit reached `main`, and a reader told "no pull request"
would look for a direct push while one told "merged" would look for a merge that did
not happen. `--no-github` answers `pull-request-unresolved`, never
`no-pull-request`, and `--strict` refuses that run at exit 2 — a run that asked
nothing has produced silence rather than measured it.

### A guard that was built, measured, and removed

The obvious second condition for `named` is that the line also asserts the merge
happened. It closes a real false-`named` shape — a mid-flight line reading
`PR OPEN, NOT MERGED` whose subject genuinely is that pull request. It was built that
way and then measured over the 2026-09-26 window: requiring it moved **12 merges out
of `named`, every one of them wrongly**, because the repository's existing merge-token
reader is tuned for a different question and an ordinary release line reading
`36 applicable CI successes, squash merge <sha>` carries no token it recognises.
Twelve false findings to close one false pass is the wrong trade, and widening the
token to fit is the defect a sibling item already recorded. The flag now rides on the
row as `namedWithoutMergeReport`, is counted in the report, and decides nothing. The
suite pins both halves.

### The direction this is allowed to be wrong in

A false `unnamed` or `mentioned-only` costs one lookup, and the report prints the
clause to do it with. A false `named` costs the whole point: a merge nothing accounts
for, reported as accounted for, silently. So `named` requires positive attribution.

## QA / Validation

**Measured on the live corpus, `--since 2026-09-26T00:00:00Z`, 2026-09-27:**
76 merges read against 1055 register entries — **64 named, 8 mentioned-only, 4
unnamed, 0 unresolved**; provenance 76 merged, 0 closed-unmerged, 0 no-pull-request.
12 of the 64 are named only by line(s) that do not themselves report the merge
(reported, not a verdict).

Both directions are therefore live-calibrated: the detector is not counting merges,
because 64 of 76 come back accounted for, and it is not blind, because 12 do not.
The nine merges the item listed reconcile exactly as 1 named + 4 mentioned-only +
4 unnamed.

**Red first, against the status-quo reader** — fixed-width ten-character substring
matching, two naming states, no subject grammar, the third provenance state folded
away, and an unasked lookup read as "none":

```
31 passed, 19 failed
```

**After:**

```
50 passed, 0 failed, 0 skipped
```

**Mutation proof: 15 applied, 15 caught.** Each was verified to change the file
before its result was counted, because a no-op mutation reads exactly like a caught
one.

| # | mutation | cases failed |
|---|---|---|
| 1 | naming by substring, dropping the subject grammar | 8 |
| 2 | fixed-width ten-character SHA matching | 13 |
| 3 | fold `mentioned-only` into `unnamed` | 9 |
| 4 | fold `pull-request-unresolved` into `no-pull-request` | 5 |
| 5 | fold `pull-request-closed-unmerged` into `pull-request-merged` | 1 |
| 6 | drop the no-pull-request fence on the SHA-alone path | 2 |
| 7 | drop the outcome-lead requirement on that path | 1 |
| 8 | `unreportable` always answers clean | 3 |
| 9 | `mergesIn` seeds `pulls` as `[]` rather than `null` | 3 |
| 10 | drop `--first-parent` from the git window | 1 |
| 11 | ignore unrecognised flags | 1 |
| 12 | reverse the prefix direction in `mentionsSha` | 13 |
| 13 | `reportsMerged` always false | 2 |
| 14 | `shaClause` returns the whole line | 2 |
| 15 | `referenceIndex` ignores the pull request | 1, **after a first attempt survived** |

Mutation 15 survived its first application: the pull-request branch of the reference
lookup was unreached, because every case reaching it also carried a SHA. A case
driving a line that carries **no SHA at all** was added, and the mutation is caught.

**Baseline over the same scope, from a separate clean worktree at
`origin/main cc2d13f2bc` rather than a stash:**

| suite scope | before | after |
|---|---|---|
| all 14 `scripts/exec` suites | 1 failing | 1 failing (**the same case**) |
| `npm run test:behaviors` | 146 suites / 1550 tests / 0 failing | 146 / 1550 / 0 |

The one failing case is `id-collision.test.mjs`'s real-corpus classification ratio.
It fails identically at `origin/main` and is not caused by this change; it is a
live-corpus case whose subject is an operator document.

- `npx eslint` on both new files: exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: **exit 0,
  zero diagnostics** — judged on the exit code, not on a grep of the output.
- `node scripts/quality/test-ci-coverage-census.mjs --check`: exit 0. The new suite
  resolves as covered (`coveredTestFiles` +1 alongside `testFiles` +1), so the
  coverage shape is unchanged and the committed census is deliberately not
  regenerated here.

**What this suite does not do, stated rather than implied.** It makes no network call
and runs no `git` against this repository's own history. Pull request lookups are
passed in as data; the one case exercising the git window builds its own two-commit
repository, because CI checkouts are shallow and a case reading real commits would
pass locally and be unreachable on the runner. The live-corpus cases assert only what
an append-only register cannot undo — a named merge stays named, a mentioned one stays
at least mentioned — and deliberately do **not** assert that any merge is still
`unnamed`, which would turn red on the day somebody wrote the line it is missing.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is served, rendered or
executed by the web application or by any worker. The CI step becomes active on the
next pull request touching `scripts/exec/**` or this workflow file. The detector
itself is operator-invoked, in the shape of the other agent-run checks in that
directory, and is deliberately not a CI gate — its subject is an operator register
and the GitHub API, neither of which a runner has, and a control taking its truth
from a subject the pull request never saw cannot fail.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command, no traffic shift, no template write.
- Approved image digest: not applicable — no runtime artifact changes.
- ACA runtime invariant: to be re-proven after merge as the standing post-merge check,
  not because this change can move it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and this says so rather than leaving the
  field blank. The change ships one operator script, one behavioural suite, one CI
  step and documentation. Nothing renders, routes, queries or prompts.

## Rollback Plan

Revert the squash commit. There is no migration, no data write and no runtime state,
so revert is complete and immediate. Reverting removes the CI step and the detector
and restores the previous README; no other behaviour changes.

## Audit Evidence

- The pull request and its CI run, including the `Execution queue behavioral contract`
  job's new step and the count it prints.
- `node scripts/exec/register-merge-coverage.test.mjs` — 50 passed, 0 failed,
  0 skipped locally, with three live-corpus cases that skip on a runner and are
  counted separately so a skip cannot read as a pass.
- `node scripts/exec/register-merge-coverage.mjs --since 2026-09-26T00:00:00Z` —
  the live census quoted above, reproducible on a host holding the operator register
  and a GitHub credential.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Known Gaps

- **The third provenance state has no live instance.** The item names one commit as
  being on `main` with its only pull request closed and unmerged. Re-verified against
  the API, that pull request has `merged_at 2026-09-26T19:09:12Z` and merged normally,
  and all 76 merges in the window resolve to a merged pull request. The state is
  implemented because the API plainly permits it and the item specifies it, and it is
  proved on a fixture rather than on a real positive. Both the module and this record
  say so, so a later reader does not rediscover it.
- **A `named` verdict says a line is about the merge, not that the line is right.**
  Whether that line's account of the merge is accurate is the question the sibling
  controls already ask.
- **The 4 unnamed and 8 mentioned-only merges are not back-filled here, deliberately.**
  Hand-writing those twelve lines would leave the thirteenth merge unguarded; the
  detector is the deliverable. Settling them is follow-on work against the item.
- **A hexadecimal token in prose could in principle prefix a real merge SHA** — a
  decimal run id is hexadecimal — which would produce a spurious *mention*. It can
  never produce a `named` verdict, because a mention alone is not positive
  attribution.
