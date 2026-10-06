# 2026-09-20-census-was-right — withdrawing an accusation against an instrument

## Release ID

`2026-09-20-census-was-right`

## Status

`candidate`

## Plain-English Summary

The previous change in this lane reported a discrepancy in the test-coverage
census: a directory the census counted as covered that, as far as that change
could tell, no CI command ran. It filed the discrepancy as a defect in the
instrument the whole unwired-suite queue is ranked by.

**There is no defect. The census was right and the check that doubted it was
wrong.**

`src/components/admin/tower` is listed in `docs/ci/tower-test-baseline.json`.
`scripts/ci/test-ratchet.mjs` runs that baseline as `jest <paths>`, and
`home-surface-guard.yml` runs the ratchet on `pull_request`. The directory is
covered, on pull requests, exactly as the census said.

The probe that contradicted it searched two places — workflow YAML and npm
scripts — for a literal jest path. The census searches four: a workflow step, an
npm script (recursively), a repository script file, and **a ratchet baseline
JSON reached by that script**. It documents those four hops in a comment
immediately above the code that implements them. The probe modelled less of the
system than the thing it was auditing, and reported the difference as the
instrument's fault.

This change therefore does two things: it removes the duplicate step the
previous change added for that directory, and it corrects the previous release
record in place.

## Layer Impact

- `global-control-lane`. One line removed from a CI workflow step, plus
  corrections to a release record. No product surface, tenant data, schema,
  projection, migration, flag, code path, or runtime behaviour. No test was
  added, changed, skipped or deleted, and no coverage was lost.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI hygiene
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — `src/components/admin/tower` removed
  from the admin-components step, with the reason recorded beside it.
- `docs/releases/records/2026-09-20-wire-green-subtrees-inside-red-trees.md` —
  the section asserting the discrepancy is marked resolved in place, and the
  stale "unexplained" gap is corrected. The wrong reasoning is **kept, not
  deleted**, because it is the useful part of the record.

## QA / Validation

Measured on base `6a41b203a`.

| What | Result |
|---|---|
| The amended step's command | **5 suites, 21 tests, all passing** |
| The tower ratchet still runs that directory | `test-ratchet "tower": 1788/1799 tests, 8 failing suites (baseline 8), no movement` |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

### The proof is that nothing moved

Removing the line and regenerating the census produced **no change to
`docs/architecture/test-ci-coverage-census.json` at all** — the regenerated file
is byte-identical to the committed one, so it does not appear in this diff.

That is the cleanest available demonstration of the claim. If the directory had
been covered only by the line being removed, the census would have moved it back
into the uncovered set and the file would have changed. It did not, because the
ratchet covers it either way.

## Rollout Plan

Merge to `main`. One fewer duplicate jest invocation per pull request. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state.

## Audit Evidence

- The PR diff — one workflow line, one corrected record.
- The ratchet run above, showing the directory's suites executing.
- The unchanged census, which is the positive proof of coverage.

## Known Gaps

- **The tower ratchet tolerates known failures.** It reports 8 failing suites
  against a baseline of 8 and passes. "Covered" here means the suites are run
  and held against a floor, not that they are green — a distinction the census
  does not draw, and which anyone reading a coverage number off it should keep
  in mind.
- **This does not audit the rest of the census.** One accusation was withdrawn
  on its own evidence; no claim is made that every other covered directory is
  correctly classified. What can be said is that the specific failure mode
  alleged — covered with nothing running it — was not real in the one case
  examined, and the mechanism blamed does not exist.
- The general lesson is not recorded anywhere a tool would enforce it: **a probe
  that contradicts an instrument should first be checked against what the
  instrument actually does.** That is a habit, not a gate.
