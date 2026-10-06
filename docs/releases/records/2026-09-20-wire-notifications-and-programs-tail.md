# 2026-09-20-wire-notifications-and-programs-tail — the tail, and a drift I caused

## Release ID

`2026-09-20-wire-notifications-and-programs-tail`

## Status

`candidate`

## Plain-English Summary

Four more library trees ran in no CI job: **38 suites / 487 tests**, all green,
all imported by code outside themselves.

| tree | suites / tests | non-test importers |
|---|---|---|
| `lib/notifications` | 10 / 127 | 9 |
| `programs/phase-packs` | 10 / 187 | 11 |
| `programs/discovery` | 9 / 56 | 23 |
| `programs/exports` | 9 / 117 | 7 |

Three neighbours were measured at the same time and are **not** here, because
each is partly red: `visual-system` (1 failed of 10), `enterprise-context` (2 of
9) and `knowledge` (3 of 31). A red directory is wired by fixing it, never by
adding it to a green command.

## Four names, six directories, and a ratchet that moved by four

The four names reach **six** census directories — `exports` carries a nested
`renderers/__tests__` and `notifications` carries `templates/__tests__`. That is
the same "the tree is bigger than the row" shape this lane keeps meeting.

Four of those six sit under `src/lib/programs`, which is held by an equality
ratchet: **26 → 22**, lowered in this change. The four were read off the set of
directories that left the uncovered set and each is a descendant of one of the
three programs names, so the arithmetic reconciles exactly rather than
approximately.

| `DARK_DIRECTORY_COUNT` | result |
|---|---|
| 21 | **fails** |
| **22** | **passes** |
| 23 | **fails** |

## A drift in this diff is partly mine

Regenerating the census moved `testFiles` 2336 → 2338, which a workflow edit
cannot cause. Measured on the unmodified base, that drift reproduces exactly
and accounts for `+2` covered files.

**One of those two files is the guard added in the previous change, which did
not regenerate the census.** That is the same silent-drift mechanism flagged
two changes ago, caused here by the flagging. It is stated rather than absorbed:

- **this change's own effect is +38 covered / −38 uncovered**, matching the 38
  suites exactly;
- the extra `+2` covered and `+2` `testFiles` are drift, one file of it mine.

The regenerated census in this diff necessarily carries both, and the fix for
the general problem — nothing in CI notices census drift — is still unbuilt.

## Layer Impact

- `global-control-lane`. One CI workflow step, one ratchet constant, and the
  regenerated census. No product surface, tenant data, schema, projection,
  migration, flag, code path, or runtime behaviour. No test was added, changed,
  skipped or deleted.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI coverage
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step naming four trees, with the
  three excluded neighbours and their numbers recorded beside it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` —
  `DARK_DIRECTORY_COUNT` 26 → 22, with the accounting.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `024adb43f`.

| What | Result |
|---|---|
| The step's exact command | **38 suites, 487 tests, all passing** |
| All six behaviour guards that read this workflow | 6 suites, 47 tests, passing |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

| Count | This change's delta |
|---|---|
| covered test files | **+38** |
| uncovered test files | **−38** |
| directories fully covered | **+6** |
| directories with unrun tests | **−6** |
| `src/lib/programs` dark directories | **26 → 22** |

Set diff: **six directories left the uncovered set, none entered.**

## Rollout Plan

Merge to `main`. The step runs on every subsequent pull request. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the six
directories to the uncovered set and requires the ratchet constant to go back
to 26.

## Audit Evidence

- The set diff and the six named directories.
- The drift measured separately on the unmodified base.
- The ratchet mutation table.

## Known Gaps

- **It proves the suites run, not that they are good.** 487 cases were run
  unchanged and not reviewed.
- **Census drift is still ungated**, and this change demonstrates why that
  matters: the previous change caused some of it without noticing, and only a
  manual comparison on the unmodified base separated it out.
- **The three red neighbours are measured but unfixed**, and whether each has
  green subtrees worth naming separately is an open question, not a settled
  one.
- **The largest remaining trees are all red** — the admin library, the
  intelligence ask path, and a flat ops directory. What is left in this lane is
  repair work, not wiring.
