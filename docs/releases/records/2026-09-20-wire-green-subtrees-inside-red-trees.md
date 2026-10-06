# 2026-09-20-wire-green-subtrees-inside-red-trees — 30 suites a label hid

## Release ID

`2026-09-20-wire-green-subtrees-inside-red-trees`

## Status

`candidate`

## Plain-English Summary

Three trees had been written off as red and skipped by earlier changes in this
lane. They were only red in **two directories each**. Behind those sat 30 green
suites and 348 tests that nothing ran, and this change runs them.

| tree | red directories | green behind them |
|---|---|---|
| `lib/deliverables` | 2 of 10 | **7 subtrees, 22 suites** |
| `components/admin` | 2 of 6 | **4 subtrees, 6 suites** (one later removed as already covered — see below) |
| `lib/admin` | all 5 failures in 1 | `ai-initiatives`, **2 suites** |

### The mistake this corrects

The earlier changes measured a candidate by running the **whole parent tree** and
recording pass or fail for the tree. That is the right first question and the
wrong last one: a tree reported as "2 failed of 79 suites" is not a red tree, it
is a green tree with two red directories in it. Writing the whole thing off cost
30 wireable suites across three trees.

Checking **which** directories failed is one extra command, and it is now part of
the method: when a tree is red, find the failing directories before excluding the
tree.

Two of the five exclusions turned out to be correct, and are left alone with the
reason recorded: `intelligence/ask` has a single test directory and all three of
its failures are in it, and `context-ingestion` has two directories with failures
in both. Neither has a green sibling to rescue.

### Why these steps name subdirectories instead of a parent

Every previous change in this lane named a parent directory, deliberately, so
that a suite added underneath it runs the day it lands. These three steps do the
opposite and name subdirectories, because **each parent contains red suites** —
naming the parent would wire a known failure into a green command.

The cost is real and is stated in the workflow: a new directory added under these
parents will **not** run here. That cost disappears when the red suites are
fixed, and the right repair is to fix them and collapse these lists back into
their parents.

### One subtree excluded for reaching nothing

`lib/deliverables/synthesis` is green, and is not wired. Its single file is
imported by nothing outside its own tree **except `deliverables/__tests__/
golden-regression.test.ts`, which is one of the two failing suites.** No
production code reaches it. Running it would add a number to the census without
covering anything that executes.

## Layer Impact

- `global-control-lane`. Three CI workflow steps and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — three steps, grouped by area, naming
  subdirectories, with the reason for that departure recorded beside them.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `3720e95eb`.

| What | Result |
|---|---|
| The three steps' exact commands | **30 suites, 348 tests, all passing** |
| Suites failing to collect | **0** |
| Coverage-census behaviour guards | passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | Before | After |
|---|---|---|
| covered test files | 1197 | **1226** (+29) |
| uncovered test files | 1126 | **1097** (−29) |
| directories fully covered | 115 | **127** (+12) |
| directories with unrun tests | 361 | **349** (−12) |

Set diff: **twelve directories left the uncovered set, none entered, the partial
set did not move.** The programs dark-directory ratchet is not in scope for these
trees; checked rather than assumed, **26 before and 26 after**.

> **RESOLVED, and this section was wrong.** The census was right; the check that
> doubted it was at fault. `src/components/admin/tower` is named in
> `docs/ci/tower-test-baseline.json`, which `scripts/ci/test-ratchet.mjs` runs as
> `jest <paths>`, driven by `home-surface-guard.yml` on `pull_request`. The
> probe below searched workflow YAML and npm scripts for literal jest paths and
> missed the third hop — workflow → repo script → ratchet baseline JSON — which
> the census implements deliberately and documents in a comment above the code.
> No census defect exists. The follow-up item is closed as not-a-defect, and the
> duplicate step this change added for that directory has been removed. The
> section is kept rather than deleted because the reasoning error is the useful
> part: an instrument was accused on the strength of a probe that modelled less
> of the system than the instrument did.

### 30 suites run, 29 files newly covered — and the one that does not reconcile

The arithmetic is one short, and chasing it found something worth filing rather
than rounding away.

Eleven of the twelve steps' directories appear in the set diff. One does not:
`src/components/admin/tower/__tests__`, a single suite of two tests. It is absent
from the uncovered set **both before and after** this change, so the census
already considered it covered.

It should not have. No workflow command names that directory or any path that
reaches it — the only line in the repository that does is the one this change
adds. The census is not blind to the file: its own total, 2,323 test files,
matches an independent count of test files under `src/` exactly, so the file is
enumerated and then classified as covered by something that could not be found.

That is a discrepancy in the instrument this entire queue is ranked by, and if
the census can call a directory covered when nothing runs it, other directories
may be hidden from the queue the same way. It is filed as its own item with this
evidence. It does not block this change: naming that directory either adds the
coverage the census already assumed, or duplicates 0.16 seconds. Either way the
suite now demonstrably runs.

## Rollout Plan

Merge to `main`. The three steps run on every subsequent pull request. No image
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

- The PR diff — three workflow steps, one regenerated census.
- The set diff above, run against the same base as the change.

## Known Gaps

- **The pinned subdirectory lists go stale by design.** A new directory under any
  of these three parents will not run until someone adds it, and nothing will
  notice. This is the hand-maintained-list shape the repository keeps removing,
  accepted here only because the parents are red.
- **The red suites are still red** and are now the blocker for collapsing those
  lists: two in `deliverables`, two in `components/admin`, five in
  `lib/admin/__tests__`.
- **It proves the suites run, not that they are good.** 348 cases were run
  unchanged and not reviewed.
- **The census discrepancy above is resolved**, and the census was correct: the
  directory is covered by the tower test-ratchet baseline. The covered/uncovered
  split this lane ranks against stands. The duplicate step for that one directory
  was removed in the follow-up change.
