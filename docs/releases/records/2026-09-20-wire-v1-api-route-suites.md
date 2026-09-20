# 2026-09-20-wire-v1-api-route-suites — thirty-six directories, one tree left red

## Release ID

`2026-09-20-wire-v1-api-route-suites`

## Status

`candidate`

## Plain-English Summary

Five subtrees under `src/app/api/v1` were reached by no workflow. They are green
and now run on every pull request: **55 suites / 328 tests**, covering **36
directories** that ran nowhere.

| subtree | suites / tests | newly covered |
|---|---|---|
| `v1/source` | 28 / 166 | 21 files |
| `v1/programs` | 24 / 128 | 12 files |
| `v1/agent` | 1 / 20 | 1 |
| `v1/artifacts` | 1 / 10 | 1 |
| `v1/moves` | 1 / 4 | 1 |

**`v1/atlas` is not here: 3 suites, all three failing**, 4 of 8 tests red. A red
directory is wired by fixing it, never by adding it to a green command.

The suite counts exceed the newly-covered counts because other steps already own
some of these files, notably the governed approval routes. The overlap is
deliberate and cheap — the two large subtrees run in about 0.74s and 0.72s in
total — and it buys a wiring that does not need editing every time a route is
added.

### Bracketed route segments

Every path named here is bracket-free, and the directories **below** them are
full of `[eventId]` and `[programId]`. That is the point: a literal prefix
matches its bracketed descendants, while naming one of those directories
directly would not, because a jest path argument is a regex and `[id]` is a
character class. It is why the governed approval routes are run by exact path
with `--runTestsByPath`.

Two of the directories this change completes are themselves bracketed —
`v1/programs/[programId]/advance/__tests__` and
`v1/source/[eventId]/nexus/ask/__tests__` — which is the design premise
confirmed by the measurement rather than assumed.

## Layer Impact

- `global-control-lane`. One CI workflow step and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step naming five bracket-free
  subtrees.
- `docs/architecture/test-ci-coverage-census.json` — regenerated. **This also
  absorbs pre-existing drift**, see below.

## QA / Validation

Measured on base `e0362a92e`.

| What | Result |
|---|---|
| The step's exact command | **55 suites, 328 tests, all passing** |
| `v1/atlas`, unchanged | 3 suites, all failing — left unwired |
| Every behaviour guard that reads this workflow | 5 suites, 45 tests, passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | Delta |
|---|---|
| covered test files | **+38** |
| uncovered test files | **−38** |
| directories fully covered | **+38** |
| directories with unrun tests | **−38** |
| `high`-band directories with unrun tests | **−33** |
| `critical`-band directories with unrun tests | **−1** |

Set diff: **36 directories left the uncovered set, none entered**, and
`v1/atlas/__tests__` is still uncovered, as intended.

### Thirty-six directories, thirty-eight files — reconciled, not rounded

The two numbers differ, so the difference was chased rather than averaged over.
Two **partially** covered directories were completed by this change, each
holding one remaining uncovered file: 36 + 2 = 38. Both are the bracketed
directories named above.

### The committed census was already stale, and this change absorbs that

Regenerating the census produced changes a workflow edit cannot cause —
`testFiles` 2330 → 2332 and `directoriesWithTests` 476 → 477. A workflow edit
cannot change how many test files exist, so that could not be this change.

It was measured separately: regenerating the census on the **unmodified** base
reproduces exactly that drift and nothing else (+2 test files, +2 covered, +1
directory). Some earlier merge added two test files without refreshing the
committed census. **The figures quoted above are this change's effect measured
against a freshly regenerated baseline**, not against the stale committed one,
so none of that drift is claimed as coverage won here. The regenerated file in
this diff necessarily carries both.

## Rollout Plan

Merge to `main`. The step runs on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the
thirty-six directories to the uncovered set.

## Audit Evidence

- The PR diff — one workflow step, one regenerated census.
- The set diff, taken against a freshly regenerated baseline.
- The drift measurement on the unmodified base.

## Known Gaps

- **`v1/atlas` is still red and still unwired**, and nothing here repairs it.
- **The census drift is absorbed, not investigated.** Two test files landed
  without the committed census being refreshed. Nothing gates that today — the
  drift report exists but is not run in CI — so it will happen again.
- **It proves the suites run, not that they are good.** 328 cases were run
  unchanged and not reviewed.
- **Nothing warns if a future addition names a bracketed path.** The convention
  is recorded in a comment beside the step; it is not enforced.
