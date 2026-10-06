# 2026-09-20-wire-admin-api-routes-with-quarantine — ten directories, two quarantined

## Release ID

`2026-09-20-wire-admin-api-routes-with-quarantine`

## Status

`candidate`

## Plain-English Summary

Twelve directories under `src/app/api/admin` were reached by no workflow. Ten
of them are green and now run on every pull request. **Two are red and are
explicitly quarantined** rather than quietly left out.

**16 suites / 74 tests / ~0.4s**, and the step would fail on arrival without the
two exclusions — which is why they are named in the step with the reason beside
them.

### Why the parent with two exclusions, rather than ten directory names

Listing ten green subdirectories is the hand-maintained list this repository
keeps removing: correct the day it is written, silently stale the day an
eleventh directory appears, with nothing to notice. Naming the parent runs a new
directory the day it lands.

The cost is that this step re-runs four governed approval suites another step
already owns. **Measured: 4 suites / 20 tests / 0.17 seconds** — the same order
as the overlaps this repository has already measured and deliberately kept.
Count is not cost, and two lines that shrink to zero when the suites are fixed
beat ten that grow.

### The quarantine is a quarantine

The two excluded files hold five failing tests between them. Nothing here fixes
them and nothing here hides them: they stay in the census as uncovered, they are
named in the workflow, and this record says what they are. **Nothing forces the
list to shrink when they are repaired** — that is a real weakness of the
approach, and it is two lines rather than ten, which is the whole of its
defence.

## Layer Impact

- `global-control-lane`. One CI workflow step and the regenerated coverage
  census. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour. No test was added, changed, skipped or
  deleted — the two red suites are excluded from one command, not modified.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step naming the parent with two
  quarantine exclusions.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `4735d934f`.

| What | Result |
|---|---|
| The step's exact command | **16 suites, 74 tests, all passing, ~0.4s** |
| The overlap it re-runs | 4 suites / 20 tests / **0.17s** |
| The two quarantined files, unchanged | still red, 5 failing tests |
| Every behaviour guard that reads this workflow | 5 suites, 45 tests, passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | Delta |
|---|---|
| covered test files | **+12** |
| uncovered test files | **−12** |
| directories fully covered | **+10** |
| directories with unrun tests | **−10** |
| `high`-band directories with unrun tests | **−10** |

### The set diff proves the quarantine, not just the coverage

Exactly **ten directories left the uncovered set and none entered** — and the
half that matters:

| directory | after this change |
|---|---|
| `context-layer/csv-upload/__tests__` | **still uncovered** ✓ |
| `users/provision/__tests__` | **still uncovered** ✓ |

A wiring change that claimed twelve directories here would be reporting two
suites as run that this step explicitly skips. That is the exact failure the
census fix in `4735d934f` removed for quoted patterns, and it is why the
quarantine half of the set diff is checked rather than assumed — a coverage
number that counts a skipped suite is worse than no number.

## Rollout Plan

Merge to `main`. The step runs on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the ten
directories to the uncovered set.

## Audit Evidence

- The PR diff — one workflow step, one regenerated census.
- The set diff above, including the two directories that deliberately did not
  move.
- The overlap timing.

## Known Gaps

- **Nothing forces the quarantine to shrink.** When those five tests are fixed,
  no gate will notice the two lines should come out.
- **The two red suites remain red.** This change does not repair them and does
  not claim to; it stops their directory's ten green neighbours being held
  hostage to them.
- **It proves the suites run, not that they are good.** 74 cases were run
  unchanged and not reviewed.
- **A bracketed route segment would need different treatment.** `[id]` is a
  character class to a jest path argument, so a future exclusion naming one must
  use `--runTestsByPath` or escape it. No path in this step has one, and nothing
  warns if someone adds one that does.
