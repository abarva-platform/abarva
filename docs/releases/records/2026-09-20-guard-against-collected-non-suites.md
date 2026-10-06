# 2026-09-20-guard-against-collected-non-suites — stopping the twelfth

## Release ID

`2026-09-20-guard-against-collected-non-suites`

## Status

`candidate`

## Plain-English Summary

Eleven files that were not test suites were being collected as test suites, and
were excluded in the previous change. This adds the case that stops the
twelfth.

It asserts that **every file Jest collects under `src/` declares at least one
test**. Today that is 2,338 files and zero violations, so it ships green.

The reason this class matters is that it hides the class below it. A file that
declares nothing fails with "Your test suite must contain at least one test",
and eleven of those were drowning three suites that genuinely failed to
**collect** — the least visible defect in the estate, because such a suite runs
zero assertions while appearing in the log as an ordinary red suite, and the
coverage census counts it as a covered test file regardless.

## Why it is scoped to `src/`

Outside `src/`, **73** collected files declare no test: 62 standalone
`run-*.mjs` regression runners under `scripts/`, each with a shebang and its
own npm entry point, and 11 Playwright smoke specs. None are Jest suites.

A repository-wide assertion would therefore **fail on arrival**, which is the
one thing a new gate must never do. The scope was chosen from that measurement
rather than from taste, and the 73 are named in the case's own comment so the
next reader does not have to rediscover why the boundary is where it is.

## What it does not duplicate

The ignore list is **read from `jest.config.ts`**, not restated. A second copy
would be a hand-maintained list beside the one it mirrors, and the two would
drift the first time someone edited only one — which is the shape this
repository keeps removing.

## Layer Impact

- `global-control-lane`. One behaviour test. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI hygiene
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/__tests__/behaviors/collected-files-declare-a-test.test.ts` — new.

## QA / Validation

Measured on base `002420dc4`.

| What | Result |
|---|---|
| The new case | **2 tests, passing** |
| Files it checks | **2,338** |
| Violations today | **0** — green on arrival |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

### The instrument was verified against the real collector

The case replicates Jest's selection statically, so the obvious failure mode is
that it checks a different set than Jest actually collects. That was not
assumed: the static list was compared against `jest --listTests` filtered to
`src/`, and they match **exactly, 2,338 to 2,338**.

The first comparison read 2,338 against 2,337 and the difference was chased
rather than waved through — the snapshot predated this very file being created.
Re-running the collector confirmed the match.

### Mutation-proofed, including the vacuity control

| Mutation | Result |
|---|---|
| plant a non-suite file under `src/__tests__` | **fails, and names the planted file** |
| make the collection return nothing | **the floor case fails** |
| as shipped | 2 pass |

The second is the one worth having. With an empty collection the main
assertion **passes vacuously** — there is nothing to violate — and only the
floor case catches it. That is what makes the floor a negative control rather
than decoration, and it is why the count is asserted separately instead of
being trusted.

The violation list is reported **by name, not by count**. A count tells the
next reader to change a number; a list tells them which file to move or
exclude.

## Rollout Plan

Merge to `main`. The case runs wherever the behaviours suite runs. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state.

## Audit Evidence

- The static-versus-`--listTests` comparison.
- The two mutation results.

## Known Gaps

- **This guards the noise, not the signal.** It prevents another non-suite
  being collected; it does **not** detect a suite that fails to collect for a
  real reason — a bad import, an unresolvable mock, a missing file read at
  module scope. Those need the suite to actually run, and the one remaining
  example under `src/` is still unrepaired.
- **The 73 outside `src/` are untouched**, so a full `npx jest` with no
  arguments still reports them. Whether those runners and smoke specs should be
  excluded from collection entirely is a separate decision with a different
  owner.
- **The floor is a magic number.** 1,500 against an actual 2,338: low enough to
  survive churn, high enough to catch an empty glob, and arbitrary in between.
- **The pattern is a replica, not the real matcher.** It agrees with Jest today
  and was checked; a future change to `testMatch` could separate them, and
  nothing would notice except this comment.
