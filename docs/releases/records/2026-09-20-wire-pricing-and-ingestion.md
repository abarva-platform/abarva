# 2026-09-20-wire-pricing-and-ingestion — widening one step, adding another

## Release ID

`2026-09-20-wire-pricing-and-ingestion`

## Status

`candidate`

## Plain-English Summary

Two more library trees now run on every pull request, by two different moves:

- **`src/lib/pricing`** — an earlier change in this lane wired only
  `pricing/effort-engine`, 14 suites. The whole tree is **42 suites / 384
  tests** and all of it is green. The narrow step is **replaced** by the parent
  rather than joined by it, so the original 14 do not start running twice.
- **`src/lib/ingestion`** — **11 suites / 76 tests**, 13 importers, reached by
  no workflow and no npm script.

**+39 test files covered.**

### Three candidates measured and not taken, each for a different reason

| candidate | measurement | outcome |
|---|---|---|
| `data-plane/write-adapters` | **already covered** — 0 uncovered rows | skipped |
| `__tests__/integration/ops` | 2 failed of 14, in a **flat** directory | left red |
| `app/api/admin` | 2 failed of 18, across **15** test directories | deferred, needs a decision |

`write-adapters` is the one worth dwelling on. It was on the candidate list from
an earlier ranking that showed 11 unwired files, and the census now reports zero
uncovered rows beneath it. The previous change in this lane spent real effort
accusing the census of miscounting coverage and was wrong — the census resolves
coverage through four hops, including a ratchet baseline JSON, which a hand-rolled
grep does not see. So this time the census was believed and the candidate was
dropped without a second investigation. That is the correction from that episode
being applied rather than restated.

`integration/ops` is a flat directory: 12 green files and 2 red ones with no
subdirectory structure to split them by. Wiring it would need a list of twelve
individual files, which is worse than leaving it, so it stays red and unwired.

`app/api/admin` has green siblings — the two failures sit in two of fifteen test
directories — but the choice there is between a thirteen-entry directory list
and naming the parent with an ignore pattern for the two red files. The
repository has precedent for generated ignore arguments, so this is a real
decision with a real trade, and it is filed rather than made in passing.

## Layer Impact

- `global-control-lane`. Two CI workflow steps and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — the `pricing/effort-engine` step widened
  to `pricing`, and a new `ingestion` step.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `d133f6c83`, re-proved after each of several rebases: the four directories and every delta were unchanged each time, and only the absolute baselines moved, because other suite-wiring changes kept landing while this was open.

| What | Result |
|---|---|
| `src/lib/pricing` | **42 suites, 384 tests, all passing** |
| `src/lib/ingestion` | **11 suites, 76 tests, all passing** |
| Suites failing to collect | **0** |
| Coverage-census behaviour guards | 3 suites, 38 tests, passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

Only the deltas are quoted here, and that is deliberate. This branch was rebased
four times while open because other suite-wiring changes kept landing on the same
workflow file. Every time, the four directories and all five deltas were
identical and only the absolute baselines had moved. An earlier revision of this
record quoted baselines against a named base and, on one rebase, the base SHA was
updated without the numbers under it — so the table briefly labelled one base's
figures as another's. The absolute column is dropped rather than chased: it is
the part that goes stale, and it was the part that went wrong.

| Count | Delta |
|---|---|
| covered test files | **+39** |
| uncovered test files | **−39** |
| directories fully covered | **+4** |
| directories with unrun tests | **−4** |
| `high`-band directories with unrun tests | **−3** |

Set diff: **four directories left the uncovered set, none entered, the partial
set did not move** — `ingestion/__tests__`, `pricing/__tests__`,
`pricing/governed-load/__tests__`, `pricing/moves-workflow/__tests__`.

The +39 reconciles exactly: 11 from `ingestion`, 28 from the three `pricing`
rows. The 14 `effort-engine` files are not in the figure because they were
already covered — which is the arithmetic confirming that widening the step
duplicated nothing.

The programs dark-directory ratchet is not in scope for these trees; checked
rather than assumed, **26 before and 26 after**.

## Rollout Plan

Merge to `main`. Both steps run on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the four
directories to the uncovered set and narrows the pricing step back to
`effort-engine`.

## Audit Evidence

- The PR diff — two workflow steps, one regenerated census.
- The set diff above, run against the same base as the change.

## Known Gaps

- **It proves the suites run, not that they are good.** 460 cases were run
  unchanged and not reviewed.
- **Several hundred directories still carry unrun tests**, and the exact figure
  moves with every concurrent merge, so it is not quoted. What remains is harder
  than what has been taken: trees that are red, trees that are flat with red
  files in them, and trees needing an ignore-pattern decision.
- **`app/api/admin` is deferred, not solved**, and the two red files inside it
  are unfixed either way.
- Widening a step is invisible in a diff review unless the reader notices the
  path got shorter. The reason is recorded in a comment beside it for that
  reason.
