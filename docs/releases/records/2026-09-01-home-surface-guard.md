# 2026-09-01-home-surface-guard — Run the Home tests in CI

## Release ID

`2026-09-01-home-surface-guard`

## Status

`candidate`

## Plain-English Summary

The Home surface has 315 tests. None of them ran in CI.

Twenty-five checks run on a Home pull request — lint, typecheck, bundle budget,
accessibility, tenant allowlist, release record — and not one of them executes
`src/components/home/**` or `src/lib/home/**`. The tests were passing on the
machine of whoever last ran them, and gating nothing.

That is not theoretical. A test went red and reached `main`: a context item fed
to the model had lost the assessment id naming the record it was built from, so
two tenants' packets read identically in the model's context. Every check on
that pull request went green.

This adds a dedicated workflow that runs those suites on every pull request and
every push to `main`, plus a check that the guard itself still covers something.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-4:** unchanged. No product, data or schema change.
- **CI:** one new workflow and one new script.

## Client Applicability

- No client-visible change. This is delivery control.
- Feature flag: none.

## Changes Included

- `.github/workflows/home-surface-guard.yml` (new) — runs the two Home suites.
- `scripts/ci/assert-home-test-floor.mjs` (new) — reads the Jest report and fails
  on a failing test, a missing report, or a test count below a floor.

### No path filter, deliberately

Most of what has broken this surface was changed somewhere else: the projection
builder, the tenant registry, a shared component. A guard that only fired when
`src/components/home/**` changed would not have caught any of them, including the
regression that prompted this.

### A green run is not proof of coverage

A passing run proves the tests that ran passed. It does not prove anything in
particular is still tested — a deleted suite, a skipped `describe`, or a renamed
directory all leave a passing run behind them. So the report is read rather than
trusted: the step fails if any test failed, if no report was produced, or if
fewer than 300 tests ran against a current count of 315.

The floor is set well under the current count so ordinary refactoring does not
trip it. Lowering it is a decision to cover less, and the message says to argue
for that in the pull request that does it.

## QA / Validation

- PASS the guard against the real suites: 315/315 across 25 suites
- PASS all four failure modes, each provoked and observed:
  - a failing test — exit 1, "3 failing tests"
  - a report that was never written — exit 1
  - a suite shrunk below the floor — exit 1, naming both possible causes
  - Jest pointed at a path matching no tests — Jest itself exits 1
- Adds roughly 3-4 minutes to a pull request, run alongside the existing checks
  rather than in front of them

## Rollout Plan

Merge to `main`. The workflow begins reporting on the next pull request.

## Deployment Authority

- Repo-owned deploy workflow: not involved; this changes CI only
- Shared runtime mutators: none
- ACA runtime invariant: not affected
- Live signed-in proof required: no

## Rollback Plan

Delete the workflow file. Nothing depends on it.

## Audit Evidence

- The four provoked failure modes above, each with its exit code and message.

## Known Gaps

- Reporting a failure and blocking a merge are different things. Under the
  current speed-mode ruleset this check does not block merges; making it a
  required check is a repository-settings decision, not a code one. Until then it
  makes a red test visible on the pull request and on `main` — which is strictly
  more than the zero coverage it replaces, and less than a gate.
- Only the two Home suites are covered. Whether other surfaces have the same hole
  is not answered here; the same question is worth asking of each of them.
