# 2026-09-19-census-drift-is-reported — the coverage census now says how stale it is, and why it must not gate

## Release ID

`2026-09-19-census-drift-is-reported`

## Status

`candidate`

## Plain-English Summary

`docs/architecture/test-ci-coverage-census.json` is a derived file refreshed by
hand, by a recorded decision: it is a measurement with no failure path, and
`--write` belongs to whoever is re-measuring rather than to a PR check.

The cost of that choice was invisible. The committed file is the input to
**which directory gets wired into CI next**, so a stale one mis-ranks that
queue — and nobody sees the staleness until someone regenerates and finds the
rank-1 entry buried inside an 800-line diff.

The census now prints how far the committed file has drifted from what the run
measures. It reports; it does not gate.

### The item recommended enforcement next. The measurement says no.

The backlog item proposed three options and recommended **(c) print the drift
first, then (a) a PR check that fails on disagreement** — on the reasoning that
printing costs nothing and answers whether (a) would be noisy.

That reasoning was right, and the answer it produced is that **(a) is not
viable as framed.** Over the last fourteen days on `main`:

| | |
|---|---|
| commits | 596 |
| commits touching a test file or a workflow — i.e. that would change the census | **403 (68%)** |
| commits that refreshed the committed census | **5** |

A check that failed whenever the committed file disagreed would fire on roughly
**two thirds of all pull requests**, almost none of which have anything to do
with the census. That is the gate that gets switched off in a week, and
switching it off would leave the file staler than it is now with a dead check
beside it.

**Decision: (c), and stop there.** If the file should stop being stale, the
lever is a refresh on merge to `main` — the file is derived, so a machine
should maintain it — not a check that makes 400 unrelated authors maintain it.
That is option (b), and it is a workflow change with its own review; it is
recorded, not taken here.

### The drift report shipped vacuous first, and printed the opposite of the truth

The first version compared `committed.coveredTestFiles` against the same name
on the measured object. **The counts live under `counts`.** Both sides were
`undefined`, no difference was found, and it printed:

```
census drift: committed census matches this run
```

against a file that was 43 covered files stale. It was caught by reading the
committed values directly rather than trusting the report — the report had no
way to fail.

Two things changed as a result. The comparison resolves the real fields, and a
field it cannot read is now its own reported state rather than a skipped
iteration:

```
census drift: cannot compare testFiles, coveredTestFiles, uncoveredTestFiles —
the census shape changed, so this report is not telling you whether the file is
stale. Fix describeDrift before trusting it.
```

**A report that cannot fail is worse than no report, because it is read as
assurance.**

### What it says today

```
census drift: committed census is STALE: testFiles 2293 -> 2286 (-7);
coveredTestFiles 732 -> 776 (+44); uncoveredTestFiles 1561 -> 1510 (-51)
```

The committed census is 44 covered files behind. The item recorded 75; it has
been partially refreshed since, which is exactly the movement nobody could see
before.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository tooling** — `test-ci-coverage-census.mjs` gains a drift report
  on its human-readable output. `--json` output is unchanged, so anything
  parsing it is unaffected.
- **Repository CI** — one new behaviour suite in the existing behaviours job.
- **No product code, no schema, no migration, no workflow change.** In
  particular no new gate: the exit code is untouched.

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
| `scripts/quality/test-ci-coverage-census.mjs` | adds `describeDrift` and prints it after the summary |
| `src/__tests__/behaviors/census-drift-is-reported.test.ts` | new — 4 cases |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `census-drift-is-reported.test.ts` | **pass** — 4/4 |
| `node scripts/quality/test-ci-coverage-census.mjs` | **pass** — exit 0, reports the drift |
| `npx jest src/__tests__/behaviors` | **pass** — 40 suites / 410 tests |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both changed files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| read the counts from the top level again — the original bug | caught | 1 of 4 red, and the report prints `cannot compare` rather than `matches` |
| skip unreadable fields instead of reporting them | caught | 1 of 4 red |
| turn the report into a gate (`process.exit(1)`) | caught | 1 of 4 red |
| drop the drift report entirely | caught | 1 of 4 red |

The first is the one worth naming: it restores the exact defect that shipped,
and the report now says it cannot tell rather than saying everything is fine.

## Rollout Plan

Squash merge to `main`. The report appears the next time anyone runs the census.
No image build, no deploy, no migration.

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

Revert the commit. The census stops reporting its drift; nothing else changes.

## Audit Evidence

- The report: `describeDrift` in `scripts/quality/test-ci-coverage-census.mjs`
- The guard: `src/__tests__/behaviors/census-drift-is-reported.test.ts`
- The recorded decision it works within: the `audit:test-ci-coverage` and
  `audit:test-ci-coverage:write` entries in `docs/architecture/ci-gate-registry.json`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **The drift is reported, not closed.** The committed census is 44 covered
  files stale as this ships, and nothing here refreshes it. Refreshing is still
  a deliberate act by whoever is re-measuring.
- **Option (b) — refresh on merge — is not taken.** It is the right lever if the
  staleness matters, and it is a workflow change deserving its own review.
- **The churn figure is a fourteen-day window on one branch.** It is enough to
  reject (a), which needed only an order of magnitude; it is not a stable rate,
  and a quieter period would not make (a) safe, because the census changes with
  test count rather than with time.
- **The counts moved between two runs minutes apart** (2285 → 2286 covered
  files) because other lanes were merging test files concurrently. That is
  further evidence against a gate: the file can go stale between a PR opening
  and its checks completing.
