# 2026-09-20-wire-green-unwired-library-trees — 129 suites nothing ran

## Release ID

`2026-09-20-wire-green-unwired-library-trees`

## Status

`candidate`

## Plain-English Summary

Four library trees ran in no CI job and no npm script. All four are green, all
four are imported by code outside themselves, and together they are **129 suites
and 2,140 tests**. They now run on every pull request.

The trees were not chosen by reading the backlog. The coverage census was ranked
by size, the seven largest candidates were **run**, and the split fell out of the
results rather than out of the plan:

| tree | suites / tests | non-test importers | verdict |
|---|---|---|---|
| `programs/expert-kernel` | 75 / 1662 | 43 | green — wired |
| `data-plane/read-adapters` | 20 / 193 | 43 | green — wired |
| `source/data-model` | 20 / 145 | 33 | green — wired |
| `pricing/effort-engine` | 14 / 140 | 5 | green — wired |
| `lib/deliverables` | 2 failed of 79 suites | — | **red — not wired** |
| `lib/context-ingestion` | 3 failed of 27 suites | — | **red — not wired** |
| `components/admin` | 3 failed of 31 suites | — | **red — not wired** |

Three of the seven are red and stay unwired. A red directory is wired by fixing
it, never by adding it to a green command, and wiring one here would have failed
on arrival. They are recorded above with their numbers so the next person starts
from a measurement instead of a survey.

## Layer Impact

- `global-control-lane`. Four CI workflow steps and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — four steps, one per tree, each naming a
  directory. Four rather than one so a failure names the family it came from.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the
  dark-directory count lowered 35 → 26, with the accounting written beside it.

## QA / Validation

Measured on base `ced75d7c3`.

| What | Result |
|---|---|
| The four steps' exact commands | **129 suites, 2140 tests, all passing** |
| Suites failing to collect | **0** |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

Coverage census, before → after, same base:

| Count | Before | After |
|---|---|---|
| covered test files | 1020 | **1149** (+129) |
| uncovered test files | 1303 | **1174** (−129) |
| directories fully covered | 94 | **106** (+12) |
| directories with unrun tests | 382 | **370** (−12) |
| `high`-band directories with unrun tests | 110 | **108** (−2) |

### Proved by set diff, not by totals

The census resolver — which parses workflow commands and decides which suites CI
reaches — was run and the directory **sets** were diffed: exactly **12
directories left the uncovered set, none entered, and the partial set did not
move.**

The set diff is the check that matters, because a total can move for reasons that
have nothing to do with the change. Both of this session's earlier suite-wiring
changes had their totals contaminated by another agent's work landing on `main`
mid-flight, and in both cases the set diff was what said so.

### The ratchet this tripped, and why that is the system working

CI refused the first push of this change. A behaviour gate holds an exact count
of directories under `src/lib/programs` that no workflow reaches, and it asserts
equality — so coming in **under** the count fails exactly as loudly as going over.
Wiring `expert-kernel` took it from 35 to 26, and the gate stopped the merge until
the constant came down in the same change.

That is the gate doing its job, not an obstacle to route around. The number was
lowered only after the nine were accounted for: **all nine directories that left
the uncovered set under that root are `expert-kernel` rows**, and none of them
stopped existing as a test directory — which is the distinction the previous
entry in that constant's history had to make and could not reconcile.

The lowered constant was then mutation-proofed in both directions:

| constant | result |
|---|---|
| 25 | **fails** |
| **26** | **passes** |
| 27 | **fails** |

### Why twelve directories for four commands

`expert-kernel` alone is **nine** census rows: the tree's own `__tests__` plus
eight nested ones. Naming the parent directory covers all of them in one command,
and it is why the suite count here is 75 rather than the 22 the largest single
row would suggest. An item that names a directory is naming one row; the tree is
usually bigger.

## Rollout Plan

Merge to `main`. The four steps run on every subsequent pull request. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the twelve
directories to the uncovered set.

## Audit Evidence

- The PR diff — four workflow steps, one regenerated census.
- The set diff above, run against the same base as the change.

## Known Gaps

- **It proves the suites run, not that they are good.** 2,140 cases were run
  unchanged and not reviewed. Nothing here asks whether any of them assert
  something worth asserting, and a large green suite is exactly where a vacuous
  one hides best.
- **Importer count is not reachability.** Forty-three files importing a tree
  shows it is not dead; it does not show every module in it is reached from a
  live route. One of these trees is recorded elsewhere as only partly integrated
  with the layer above it, and this change does not test that seam.
- **370 directories still carry unrun tests** after this, 54 of them
  `critical`-band. This is a large bite, not the end of the queue.
- The three red trees above are now measured but unfixed, and their failures are
  older than this change.
- Naming a directory is deliberately what makes a suite added under it run on
  arrival — which is the point, and also how these steps will one day block a
  pull request that adds a failing suite.
