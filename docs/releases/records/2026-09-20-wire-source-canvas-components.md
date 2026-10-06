# 2026-09-20-wire-source-canvas-components — a deliberate overlap, and a correction

## Release ID

`2026-09-20-wire-source-canvas-components`

## Status

`candidate`

## Plain-English Summary

`src/components/source/canvas` is 48 suites and 227 tests. Four of its
directories, holding 17 test files, were reached by no workflow. This change
runs the whole tree by naming the parent directory.

That means **31 suites now run twice per pull request** — they were already
named individually by another workflow. The duplication is deliberate, and this
record exists mostly to say why, and to correct something already published.

## The correction

The change that deferred this decision — PR#8074, release record
`2026-09-20-wire-source-facts-and-agent-generation` — excluded this tree and
described the overlap as **"a different order of magnitude"** from a 1.8-second
overlap the repository had previously measured and accepted. It also said, more
carefully, that the number "has not been taken yet".

The number has now been taken, and **the aside was wrong**:

| | suites / tests | time |
|---|---|---|
| already-covered portion, re-run by this step | 31 / 183 | **2.577s** |
| the whole tree | 48 / 227 | **2.639s** |

**~2.5 seconds per pull request** — the same order as the 1.8-second overlap
already accepted, not a different one.

The error is worth naming precisely, because it is easy to repeat: it conflated
suite **count** with **cost**. Thirty-one suites sounds an order of magnitude
worse than two; it costs about eight tenths of a second more. Cost is what the
decision turns on, and the count was standing in for it.

## Why the overlap is the better of the two options

The alternative was naming the four uncovered subdirectories instead of the
parent. That is the hand-maintained list this repository keeps removing: it is
correct the day it is written and silently stale the day someone adds a fifth
directory, with nothing to notice. Naming the parent costs ~2.5 seconds and
makes a suite added under `canvas` tomorrow run the day it lands.

The two existing per-directory steps in the other workflow are left alone. They
answer a different question there — those suites are named as declared surface
controls, not as a coverage sweep — and rewriting a working wiring for
consistency is the thing the wiring convention explicitly says not to do.

## Layer Impact

- `global-control-lane`. One CI workflow step and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step naming the parent directory,
  with the cost measurement and the correction recorded beside it.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `0dbb766b2`.

| What | Result |
|---|---|
| The step's exact command | **48 suites, 227 tests, all passing** |
| Suites failing to collect | **0** |
| Coverage-census behaviour guards | passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | Before | After |
|---|---|---|
| covered test files | 1180 | **1197** (+17) |
| uncovered test files | 1143 | **1126** (−17) |
| directories fully covered | 111 | **115** (+4) |
| directories with unrun tests | 365 | **361** (−4) |

### The set diff confirms the overlap arithmetic independently

Exactly **four directories left the uncovered set, none entered, the partial set
did not move** — `responses`, `workspace-tabs`, `bafo` and
`contract-optimization`.

The counts move by **17, not 48**, which is the check that the overlap is real
and understood: the census already counted the other 31 files as covered, so
running them again adds nothing to the number. A change that claimed to cover 48
here would have been describing work the repository had already paid for.

The dark-directory ratchet under `src/lib/programs` is not in scope for this
tree and should not move. That was checked rather than assumed, as in the
previous change: **26 before, 26 after.**

## Rollout Plan

Merge to `main`. The step runs on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the four
directories to the uncovered set and removes the duplicated ~2.5 seconds.

## Audit Evidence

- The PR diff — one workflow step, one regenerated census.
- The two timing runs above and the set diff, all on the same base.

## Known Gaps

- **This spends runner time on purpose, forever.** ~2.5 seconds per pull
  request, for as long as both wirings exist. If the other workflow ever stops
  naming those two directories, this step already covers them and the overlap
  disappears on its own — but nothing prompts anyone to check.
- **It proves the suites run, not that they are good.** 227 cases were run
  unchanged and not reviewed.
- **361 directories still carry unrun tests.** The remaining large candidates
  are now mostly red rather than merely unwired, which is a different and harder
  problem than this one.
