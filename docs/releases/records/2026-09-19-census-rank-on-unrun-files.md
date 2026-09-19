# 2026-09-19-census-rank-on-unrun-files — the wiring queue now ranks on files no workflow runs, not on whether a directory has any covered file at all

## Release ID

`2026-09-19-census-rank-on-unrun-files`

## Status

`candidate`

## Plain-English Summary

`docs/architecture/test-ci-coverage-census.json` answers one operational
question: **which directory of tests gets wired into CI next.** Agents and
humans work that ranking top-down, one directory at a time.

The ranking was built from uncovered directories only — `governedRiskRows`
filtered on `coveredTestFiles === 0`. A directory with one covered file out of
eighty therefore ranked **below an empty one with two**, because it was not in
the list at all.

Measured on `49cca7400` before this change: **22 partially covered directories
held 257 test files that no workflow runs, and not one of those directories
appeared anywhere in the 151-entry ranking.**

The ranking is now computed over every directory holding a file no workflow
runs, partial and uncovered alike, and the unrun count is the tie-breaker in
place of directory size. Governed-risk *scoring* is unchanged; only what feeds
the ranking changed.

### What that did to the queue

| | before | after |
|---|---|---|
| directories in the ranking | 151 | **168** |
| directories holding unrun files (the denominator) | not printed | **389** (367 uncovered + 22 partial) |
| `critical` band | 44 | **59** |
| `high` band | 107 | **109** |
| partially covered directories visible | **0 of 22** | 17 of 22 carry a governed signal, holding **213 unrun files** |

**Thirteen of the new top twenty-five were previously invisible**, and they take
ranks 1 through 10:

```
1. src/__tests__/integration                    10 unrun of 45   critical
2. src/app/api/programs/phase-gate/__tests__     1 unrun of 2    critical
3. src/app/api/v1/programs/[programId]/advance/__tests__
                                                 1 unrun of 2    critical
4. src/components/source/__tests__              19 unrun of 21   critical
5. src/components/programs/__tests__             5 unrun of 7    critical
```

Every one of those five carries a `declared_ai_surface_control` or
`approval_or_lifecycle_write` signal. This does not wire any of them — it makes
them visible to the queue that decides what gets wired.

### The distinction that had to be kept

"Rank the partials too" and "rank everything" differ in exactly one place: a
**fully covered** directory has nothing left to wire and must stay out. That is
the negative control in the new test — a fully covered directory carrying the
same governed signal, larger than the uncovered one, asserted absent from both
the ranking and the printed summary.

### Two headings were wrong after the change, so they changed

`top uncovered governed-risk directories:` and `uncovered governed risk:` both
became false the moment partial directories could appear. They now read
`top governed-risk directories by unrun tests:` and a separate
`directories with unrun tests:` line, and each ranked row prints
`N unrun of M tests` rather than `M tests`. The pre-existing ranking case was
updated to the new heading; no assertion was removed or loosened.

`counts.unclassifiedRiskDirectories` was `uncovered − ranked`. With partials in
the ranking that subtraction goes **negative**, so its minuend is now
`directoriesWithUnrunTestFiles`, which is printed rather than implied.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository tooling** — `test-ci-coverage-census.mjs` changes what feeds the
  ranking and adds `unrunTestFiles` to each ranked row, one new `counts` key,
  and two summary lines. Governed-risk scoring, banding and signal detection
  are untouched.
- **Repository CI** — one new case in an existing behaviours suite. No new job,
  no new gate, exit code untouched.
- **Derived artifact** — the committed census is regenerated in the same change,
  because a committed ranking computed by the old rule would keep handing out
  the old work order until someone remembered to run `--write`.
- **No product code, no route, no schema, no migration, no workflow change.**

## Client Applicability

No client receives this change.

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `scripts/quality/test-ci-coverage-census.mjs` | ranking filter and tie-break move to unrun files; `unrunTestFiles` reported on ranked rows and evidence; `directoriesWithUnrunTestFiles` count added; unclassified denominator corrected; two summary headings and the ranked-row line updated; one `method` line rewritten |
| `src/__tests__/behaviors/test-ci-coverage-census.test.ts` | new case (15th); pre-existing ranking case updated to the changed heading |
| `docs/architecture/test-ci-coverage-census.json` | regenerated |

## QA / Validation

**Status: pass.** Measured, not inferred — every figure below comes from a run.

| check | before | after |
|---|---|---|
| `test-ci-coverage-census.test.ts` (identical file both sides) | **1 failed / 14 passed of 15** | **0 failed / 15 passed of 15** |
| `npm run test:behaviors`, same command both sides | 43 suites / **426 passed, 0 failed** | 43 suites / **427 passed, 0 failed** |
| `npx tsc --noEmit` (judged by exit code, `tsconfig.tsbuildinfo` removed first) | exit 0 | exit 0 |
| `npx eslint` on both changed files | — | exit 0 |
| `node scripts/quality/test-ci-coverage-census.mjs` | drift: 136 covered files stale | `committed census matches this run` |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | — | recorded on the PR |

The +1 assertion is the new case. The baseline was taken in a separate worktree
at the same base SHA (`49cca7400`), not inferred from the branch.

### Mutation results — six that must fail, one that must pass

| mutation | expected | observed |
|---|---|---|
| restore the real defect: filter on `coveredTestFiles === 0` | caught | 1 of 15 red |
| revert the tie-break to directory size (`b.testFiles - a.testFiles`) | caught | 1 of 15 red |
| stop reporting `unrunTestFiles` on ranked rows | caught | 1 of 15 red |
| rank every directory, covered or not | caught | 1 of 15 red |
| revert the unclassified denominator to the uncovered count | caught | 1 of 15 red |
| drop the unrun count from the printed summary line | caught | 1 of 15 red |
| **control** — compute the denominator by an equivalent expression | passes | 15 of 15 green |

**The tie-break mutation is the one worth naming.** The first version of this
fixture would have survived it: `partial` held 4 test files and `small` held 1,
so ranking by size and ranking by unrun files produced the same sequence and the
assertion proved nothing. The fixture now carries a fourth directory of
**the same size as `partial` but with fewer unrun files**, so the two orderings
disagree by construction and a revert to `testFiles` cannot pass. The fixture
also holds every governed score equal at 100, which is asserted, so the order
can only be the tie-breaker's doing.

The harness was confirmed to be running tests rather than reporting a skip:
every mutation run reported `15 total`.

## Rollout Plan

Squash merge to `main`. The new ranking appears the next time anyone reads the
census or runs it. No image build, no deploy, no migration.

## Deployment Authority

Not applicable — no Azure Container Apps, workflow, image, flag, worker,
traffic or DNS is affected.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the commit. The ranking returns to uncovered-only and the committed
census returns to the previous file. Nothing else changes; no gate depends on
either.

## Audit Evidence

- The change: `governedRiskRows` and `summarize` in
  `scripts/quality/test-ci-coverage-census.mjs`
- The guard: the `ranks a partially covered directory on its unrun files, and
  still drops a fully covered one` case in
  `src/__tests__/behaviors/test-ci-coverage-census.test.ts`
- The regenerated measurement: `docs/architecture/test-ci-coverage-census.json`
- The registry entries this works within: `audit:test-ci-coverage` and
  `audit:test-ci-coverage:write` in `docs/architecture/ci-gate-registry.json`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **This changes the order of work, not the amount of it.** 389 directories hold
  a file no workflow runs. Seventeen partial directories became visible; none of
  them is wired by this change, and none has been measured for whether it is
  green or red.
- **The five newly top-ranked directories are unmeasured.** Whether each is
  green like the last directory wired or 44 days red like the one before it is
  unknown until someone runs it. That measurement is the first step of wiring
  each, not an afterthought.
- **The committed census is regenerated here and will drift again.** The
  recorded decision is that refreshing is manual and the drift line is the
  remedy; that decision is unchanged by this PR.
- **A bare side-effect import is not read as a governed edge.** The scorer
  collects `from` / `require` / dynamic-import specifiers plus an inferred
  sibling module, so `import "../route";` contributes nothing — a test that
  loads a governed module only that way scores zero. It was found while building
  this fixture and is recorded as a separate backlog item rather than changed
  here; it is not introduced by this change and no existing case depended on it.
