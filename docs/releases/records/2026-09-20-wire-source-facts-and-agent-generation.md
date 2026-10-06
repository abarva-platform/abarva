# 2026-09-20-wire-source-facts-and-agent-generation — 31 more suites nothing ran

## Release ID

`2026-09-20-wire-source-facts-and-agent-generation`

## Status

`candidate`

## Plain-English Summary

Two Source library trees ran in no CI job and no npm script. Both are green and
both are imported by code outside themselves. Together they are **31 suites and
396 tests**, and they now run on every pull request.

| tree | suites / tests | non-test importers |
|---|---|---|
| `source/facts` | 18 / 264 | 24 |
| `source/agent-generation` | 13 / 132 | 46 |

This is the third change in the same lane today. The interesting part is not
these two trees; it is the two candidates that were measured alongside them and
**excluded for different reasons**.

### Why `components/source/canvas` is not here

It looked like the biggest remaining prize: 48 suites. It is not, because it is
already half-wired. Only **17 files across four rows** are uncovered — another
workflow already runs `canvas/__tests__` and `canvas/analytics`. Naming the
parent, which is the move that paid off in the two previous changes, would here
run **31 already-covered suites a second time on every pull request.**

That is a real decision with a cost on both sides: naming the four uncovered
subdirectories reintroduces the hand-maintained list this repository keeps
removing, and accepting the overlap spends runner time forever. An earlier change
accepted an overlap of this kind after measuring it at 1.8 seconds; 31 suites is
a different order of magnitude and the number has not been taken yet. It is filed
as its own item so the choice is made on a measurement rather than by momentum.

### Why `intelligence/ask` is not here

**3 failed of 29 suites.** A red directory is wired by fixing it, never by adding
it to a green command.

## Layer Impact

- `global-control-lane`. Two CI workflow steps and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — two steps, one per tree, each naming a
  directory, with the two exclusions recorded beside them.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `0b80d8c7a`.

| What | Result |
|---|---|
| The two steps' exact commands | **31 suites, 396 tests, all passing** |
| Suites failing to collect | **0** |
| Coverage-census behaviour guards | 4 suites, 54 tests, passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | Before | After |
|---|---|---|
| covered test files | 1149 | **1180** (+31) |
| uncovered test files | 1174 | **1143** (−31) |
| directories fully covered | 106 | **111** (+5) |
| directories with unrun tests | 370 | **365** (−5) |

### Proved by set diff, and one gate checked rather than assumed

The census resolver was run and the directory **sets** diffed: exactly **five
directories left the uncovered set, none entered, and the partial set did not
move.** Five rows for two commands, because `facts` is four nested rows.

The previous change in this lane tripped a behaviour gate that pins the exact
count of dark directories under `src/lib/programs` using equality, so being under
the count fails as loudly as being over. Neither tree here is under that root, so
it should not move — but "should not" is not a measurement. It was checked: the
count is **26 before and 26 after**, and the gate passes.

### The pattern these three changes share

A backlog item, or a single census row, consistently understates its tree:

- an item asked for 16 suites where the tree held 21;
- `expert-kernel` is nine nested rows behind one directory name;
- `facts` is four rows behind one;
- and `canvas` is 48 suites behind four uncovered rows — in the opposite
  direction, where the tree is mostly already covered.

Running the parent and reading the set diff is what tells these apart. Neither
the item text nor the row count does.

## Rollout Plan

Merge to `main`. The two steps run on every subsequent pull request. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the five
directories to the uncovered set.

## Audit Evidence

- The PR diff — two workflow steps, one regenerated census.
- The set diff above, run against the same base as the change.

## Known Gaps

- **It proves the suites run, not that they are good.** 396 cases were run
  unchanged and not reviewed.
- **Importer count is not reachability.** It shows a tree is not dead; it does
  not show every module in it is reached from a live route.
- **365 directories still carry unrun tests**, and the largest remaining
  candidates are now the ones with a complication — already-partial coverage, or
  red suites — rather than clean wins.
- The `canvas` overlap is described here but **not measured in seconds**. That
  measurement belongs to its own item and should decide it.
