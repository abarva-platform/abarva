# 2026-09-20-stop-collecting-eleven-non-suites — the noise drowning the signal

## Release ID

`2026-09-20-stop-collecting-eleven-non-suites`

## Status

`candidate`

## Plain-English Summary

Eleven files that are not test suites were being collected as test suites. Each
then failed with *"Your test suite must contain at least one test"*, and there
were enough of them to bury the failures that matter.

They are excluded now. Combined with two suite repairs already merged, the
number of suites under `src/` that **fail to collect** goes from **14 to 1**.

A suite that fails to collect runs **zero assertions** while still appearing in
the log as an ordinary red suite, and the coverage census counts it as a covered
test file regardless. It is the least visible kind of gap in the test estate,
and it was hidden behind eleven files that were never suites at all.

## Which eleven, and why they were collected

`next/jest` supplies the default `testMatch`, which includes
`**/__tests__/**/*` — so **every** file under a `__tests__` directory is
collected, suite or not. Three groups qualified:

- six ESM shims under `src/__tests__/__mocks__/`, wired up through
  `moduleNameMapper` in this same config;
- four Atlas eval files under `src/__tests__/atlas-eval/` — three probes and a
  runner, which is a script rather than a suite;
- one standalone helper named `spec.ts`, which the default pattern also matches
  by suffix rather than by location.

Every one of them was **already failing** with "must contain at least one
test", which is what makes excluding them safe: it removes noise, not coverage.

## The change that was NOT made, and why

The tempting fix is to narrow `testMatch` to require a `.test.` or `.spec.`
suffix. That would have **silently stopped running a real suite.**

`src/lib/source/__tests__/specialists/specialist-test-utils.ts` carries no
suffix — it looks exactly like the eleven — but it contains a genuine
`describe` with a passing case. Someone had added a self-test so the file would
not trip the "must contain at least one test" rule, and a suffix-based
`testMatch` would have dropped it without a word.

That was checked before choosing, not after. Targeted exclusions were taken
instead, naming three locations rather than reshaping the pattern for the whole
repository.

## Layer Impact

- `global-control-lane`. One Jest config file. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour. **No
  test was added, changed, skipped or deleted**, and no file that contains a
  test stopped being collected.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI tooling
- Public/demo only: no · Feature flag: none

## Changes Included

- `jest.config.ts` — `testPathIgnorePatterns` naming the three locations, with
  the reasoning and the rejected alternative recorded beside it.

## QA / Validation

Measured on base `8ee157e75`.

| What | Result |
|---|---|
| Files Jest collects | **2630 → 2619** — exactly 11 fewer |
| Suites failing to collect under `src/` | **14 → 1** |
| The one that remains | a suite whose subject was genuinely deleted |
| `specialist-test-utils.ts` still collected | **yes** — 1 suite, 1 test, passing |
| The ESM mocks still resolve | verified by running two suites that depend on them |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

### Attribution, kept base-independent

The 14 was measured on an earlier base, and `main` has moved since, so the
before/after totals are not a clean subtraction. The attribution that **is**
clean is the collected-file count: **2630 → 2619 is exactly eleven**, every one
of the eleven previously reported "must contain at least one test", and the
remaining fail-to-collect suite is the one this change never claimed to touch.

Two of the original fourteen were repaired separately and are already on `main`;
this change accounts for the other eleven.

### The mocks were checked, not assumed

Excluding a file from collection does not affect `moduleNameMapper`, but that is
a claim worth testing rather than reasoning about, because six of the eleven are
mocks this config maps. Two suites that depend on them were run before and after:
**identical results, 1 failed and 15 passed both times** — the failure is
pre-existing and unrelated, which is why it was baselined rather than blamed on
the change.

## Rollout Plan

Merge to `main`. Eleven fewer spurious suite failures in any full run. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores the
eleven spurious failures.

## Audit Evidence

- The collected-file count before and after.
- The post-change sweep showing one remaining fail-to-collect suite.
- The before/after run of two mock-dependent suites.

## Known Gaps

- **No gate prevents the next one.** Fail-to-collect is now at 1, which is
  small enough to hold with a ratcheted ceiling, but this change does not add
  that ceiling — and a gate shipped without measuring first is how gates end up
  failing on arrival.
- **The census still cannot see this class of problem.** A suite that collects
  nothing counts as a covered test file, and nothing here changes that.
- **The remaining suite is not repaired.** Its subject has been searched for
  under other names and not found; its disposition is a separate decision.
- **This does not touch the 133 suites that fail on assertions.** They fail
  honestly and are a different problem.
