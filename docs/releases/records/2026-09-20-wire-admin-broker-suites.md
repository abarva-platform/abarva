# 2026-09-20-wire-admin-broker-suites — 21 green suites no workflow reached

## Release ID

`2026-09-20-wire-admin-broker-suites`

## Status

`candidate`

## Plain-English Summary

Twenty-one unit suites under the admin broker tree ran in no CI job and no npm
script. They are green, they are fast, and the modules they cover are live: forty
non-test files import them, including webhook routes, cron routes, server actions
and admin pages. They now run on every pull request.

Two corrections came out of measuring rather than accepting the request:

- **The count was wrong.** The item asked for 16, which is the top-level
  `__tests__` directory only. Two nested directories are separate rows in the
  coverage census and were missing from it. Naming the parent directory covers
  all three: **21 test files, 211 tests, ~1s**.
- **The neighbouring directory is red and stays unwired.** The sibling tree one
  level up is 5 failed of 62 suites, 9 failing cases. Widening this command to
  the parent would have wired those failures in as well, so the command stops at
  the broker subtree. A red directory is wired by fixing it, never by adding it
  to a green command.

## Layer Impact

- `global-control-lane`. One CI workflow step and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step running the broker subtree by
  directory name, with the measurement and the exclusion reasoning beside it.
- `docs/architecture/test-ci-coverage-census.json` — regenerated. The committed
  census matched before this change, so the whole diff is attributable to it.

## QA / Validation

Measured on base `c1b315cb5`, re-proved after a rebase (see below).

| What | Result |
|---|---|
| The step's exact command | **21 suites, 211 tests, all passing** |
| Suites failing to collect | **0** |
| Non-test files importing the subtree | **40** |
| Sibling tree one level up, unchanged | 5 failed of 62 suites, 9 cases — left red, not wired |

Coverage census, before → after, against the same base:

| Count | Before | After |
|---|---|---|
| covered test files | 999 | **1020** (+21) |
| uncovered test files | 1324 | **1303** (−21) |
| directories fully covered | 91 | **94** (+3) |
| directories with unrun tests | 385 | **382** (−3) |
| `critical`-band directories with unrun tests | 55 | **54** (−1) |

### How this was proved, and one number withdrawn

The wiring was not verified by re-reading the YAML. It was verified by running the
census resolver — an independent instrument that parses workflow commands and
decides which suites CI reaches — and diffing the directory **sets**, not the
totals: exactly three directories left the uncovered set, none entered, and the
partial set did not move.

The set diff is what caught an error in an earlier reading, twice. A first census
run in this session was taken before another agent's suite-wiring change landed on
`main`, so comparing its summary against the current tree mixed their change into
the totals and suggested four directories had moved. **The correct figure is
three directories and 21 files.** The aggregate would have been published wrong;
the set diff could not be.

It happened a second time on the way in. Another suite-wiring change landed while
this one was open, the census conflicted, and the branch was rebased onto it. The
conflict was resolved the only way a generated file can be — by taking the new
base's copy and regenerating, never by hand-merging — and every figure here was
then re-proved against the new base. The **deltas did not move** (+21 covered,
−21 uncovered, +3 directories, −1 `critical`), but two absolute baselines did, and
this table carries the re-measured pair rather than the original ones.

One directory that appears in the diff — a programs approval route's test
directory — did not change coverage. It entered the top-N governed-risk ranking
because a broker row left it, and it remains uncovered.

## Rollout Plan

Merge to `main`. The step runs on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the three
directories to the uncovered set.

## Audit Evidence

- The PR diff — one workflow step, one regenerated census.
- The census set diff above, run against the same base as the change.

## Known Gaps

- **This moves 21 of 1,303 unrun test files.** The census counts 382 directories
  with unrun tests, 54 of them `critical`-band. One directory is one directory.
- **It proves the suites run, not that they are good.** Nothing here inspects
  whether the 211 cases assert anything worth asserting; they were run unchanged
  and not reviewed case by case.
- **A green directory today can go red tomorrow**, and naming the directory is
  deliberately what makes a suite added under it run on arrival — that is the
  point, and it is also how this step will one day block a pull request.
- The green sibling `ai-initiatives` (2 files, 8 tests) is still unwired. It was
  left out rather than folded in, so it needs its own item.
