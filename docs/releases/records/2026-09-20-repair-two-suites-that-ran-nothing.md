# 2026-09-20-repair-two-suites-that-ran-nothing — zero tests, presented as red

## Release ID

`2026-09-20-repair-two-suites-that-ran-nothing`

## Status

`candidate`

## Plain-English Summary

Two suites under the approvals server actions were not failing. They were not
running at all.

```
Test suite failed to run
ReferenceError: Cannot access 'FakeAdminAuthError' before initialization
```

Both died during collection, so they executed **zero tests** while appearing in
the log as ordinary red suites. That is strictly worse than a failing assertion:
a red test tells you something is broken, a suite that never collects tells you
nothing at all, and its name still appears as though it were pulling its weight.

After the repair the two suites **run and pass: 14 tests where there were 0.**

## What was actually wrong — and it was not the obvious thing

The tempting diagnosis is "the fake class is declared after the `jest.mock` that
uses it". It is not: the class is declared **above** the mock in both files.

The real cause is that `jest.mock` factories are hoisted above the file's
`import` statements, and the subject here is imported **statically** at the top
of the test. That static import is evaluated before the class statement runs, so
the factory fires while `FakeAdminAuthError` is still in its temporal dead zone.

The second instance was checked rather than assumed, and it is what proved the
diagnosis. Two sibling suites use the **identical** declare-outside shape:

| suite | subject import | collects? |
|---|---|---|
| the two repaired here | static `import … from '../escalate-approval'` | **no — 0 tests** |
| `v1/programs/[programId]/pricing` × 2 | lazy `await import(…)` inside a case | yes — 16 tests pass |

So the shape is not the bug. The shape **plus a static import** is. Had the fix
been copied from the shape alone it would have been cargo-culted onto files that
never had a problem, and the two that did would have stayed broken.

## The fix, and why this one

The fake class is moved **inside** the mock factory, and the test takes its
reference back out of the mocked module. The alternative — converting these
files to the lazy `await import(…)` convention the passing siblings use — also
works, but it restructures every case in both files. Declaring inside the
factory is immune to import timing rather than dependent on it, and is a
localized change.

`instanceof` identity matters here, because the subject branches on
`err instanceof AdminAuthError` and the cases construct that error themselves. If
the test's reference and the factory's class were different objects the branch
would silently stop being exercised, so that was mutation-proved rather than
argued: replacing the constructed error with a plain `Error` **fails the case**.

## Layer Impact

- `global-control-lane`. Two test files. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour. **No
  assertion was weakened, skipped or deleted** — the suites went from running
  nothing to running everything they always claimed to.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — test repair
- Public/demo only: no · Feature flag: none

## Changes Included

- `…/_actions/__tests__/escalate-approval.test.ts`
- `…/_actions/__tests__/notify-sponsor.test.ts`

## QA / Validation

Measured on base `f89668f29`.

| | before | after |
|---|---|---|
| suites collecting | **0 of 2** | 2 of 2 |
| **tests executed** | **0** | **14** |
| tests passing | 0 | 14 |

The success criterion was the **test count**, not the suite status. A suite that
fails to collect and a suite that runs and passes differ by whether any
assertion executed, and only the count distinguishes them.

| Mutation | Result |
|---|---|
| construct a plain `Error` instead of the mocked class | **1 case fails** |
| as shipped | 7 pass |

| Other checks | Result |
|---|---|
| `v1/atlas`, the other known red tree | 8 tests run, 4 fail — **honest assertion failures, 0 collection failures** |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

## Rollout Plan

Merge to `main`. Fourteen assertions begin executing that never have. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns both
suites to running zero tests.

## Audit Evidence

- The before/after test counts.
- The mutation result.
- The sibling comparison that isolated static-versus-lazy import as the cause.

## Known Gaps

- **This does not wire the directory into CI.** It removes one of the four
  quarantine entries a previous measurement said would be needed there; three
  remain, which is still too many to justify that wiring, so it stays declined.
- **No sweep was done for other suites that fail to collect.** Finding them all
  means running every suite in the repository and grepping for "failed to run",
  which was not done here. The two found were found by accident while measuring
  something else, and the coverage census cannot see this class of problem at
  all — a suite that collects nothing still counts as a covered test file.
- **Nothing prevents the next one.** The static-import-plus-outside-class
  combination is legal, common, and silent until it is not.
