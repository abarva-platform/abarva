# 2026-09-20-wire-knowledge-with-file-quarantine — quarantine the files, not the directories

## Release ID

`2026-09-20-wire-knowledge-with-file-quarantine`

## Status

`candidate`

## Plain-English Summary

`src/lib/knowledge` ran in no CI job. It is **28 suites / 339 tests** once three
red suites are quarantined, and **81 non-test files import it**.

Three neighbours were measured together and this is the only one that could be
split. What made it splittable is the shape of its failures, not their number.

## Quarantining files, not directories, and why that is the whole gain

The three red suites sit in directories of mostly-green ones — 9, 5 and 4 test
files respectively. Three ways to wire this were measured:

| approach | suites reached |
|---|---|
| name the five green subtrees | 13 |
| name the parent, exclude the three red **directories** | 13 |
| name the parent, exclude the three red **files** | **28** |

Excluding directories would have dropped **fifteen passing files** in order to
quarantine three. The exclusions are therefore file paths, and the difference
between the obvious approach and this one is more than double the coverage.

The set diff confirms it precisely: five directories became fully covered, and
the three holding a quarantined file became **partially** covered rather than
staying dark. That the three moved to partial rather than to covered is the
evidence that the file-level exclusion is real — a directory-level exclusion
would have left them uncovered, and no exclusion at all would have shown them
fully covered while a red suite silently failed the step.

## The two that could not be split

`visual-system` (1 failed of 10) and `enterprise-context` (2 failed of 9) each
have a **single flat test directory**. There is no green subtree to name and no
directory boundary to quarantine along, and quarantining by file there would
mean naming individual files inside the only directory the tree has — a list
that grows with the tree. They stay unwired, red, and recorded.

This is the same conclusion an earlier flat directory reached, and it is worth
stating as a rule: **a tree's splittability depends on whether its failures
respect a directory boundary, not on how many there are.** Three failures
across eight directories is workable; one failure in a flat tree is not.

## Layer Impact

- `global-control-lane`. One CI workflow step and the regenerated census. No
  product surface, tenant data, schema, projection, migration, flag, code path,
  or runtime behaviour. No test was added, changed, skipped or deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step, parent named, three files
  excluded.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `216228cde`.

| What | Result |
|---|---|
| The step's exact command | **28 suites, 339 tests, passing, ~0.9s** |
| Non-test importers of the tree | **81** |
| The census shape gate shipped earlier today | **exit 0** on this branch |
| Census and coverage behaviour guards | 4 suites, 54 tests, passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | This change's delta |
|---|---|
| covered test files | **+28** |
| uncovered test files | **−28** |
| directories fully covered | **+5** |
| directories partially covered | **+3** (the quarantined three) |
| directories with unrun tests | **−5** |

Set diff: **eight directories left the uncovered set, none entered**, and the
three holding a quarantined file appear in the partial set.

A further `+1` on `coveredTestFiles` and `testFiles` is **not** this change: a
test file landed on `main` while this was open. The same drift as before, and
the newly shipped gate is indifferent to it by design — counts move, shape does
not.

## Rollout Plan

Merge to `main`. The step runs on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the eight
directories to the uncovered set.

## Audit Evidence

- The three-way comparison of wiring approaches.
- The set diff, including the three directories that moved to partial.
- The shape gate passing on this branch.

## Known Gaps

- **Nothing forces the quarantine to shrink.** Three files, each with the
  reason beside it; when they are fixed no gate will notice the lines should
  come out.
- **The three quarantined suites stay red**, and this does not repair them.
- **It proves the suites run, not that they are good.** 339 cases were run
  unchanged and not reviewed.
- **The two flat trees remain unwired** and will stay that way until their
  failures are fixed, because their shape offers nothing to split on.
