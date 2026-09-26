# 2026-09-26 Tower outcome-report fallback fixture — a guard that could not fail

## Release ID

`2026-09-26-tower-outcome-report-fallback-fixture`

## Status

`candidate`

## Plain-English Summary

The Control Tower outcome-report download has an authorization fallback for
internal admin accounts whose active tenant has not resolved: it lets them
export **their own** tenant, and nothing else. One test was written to prove the
"and nothing else" half. It could not.

The identity that test used had been taken off the canonical client-admin roster
in an earlier security narrowing, so it could not reach the fallback at all. Two
of the suite's four cases were failing as a result, and both failures were
recorded as expected in the CI ratchet baseline. The third case — the one named
for the widening it was meant to prevent — was passing, but for the wrong
reason: the request was refused because the identity was not admin-like, not
because the tenant did not match. Measured here rather than assumed: deleting
the same-tenant condition from the route entirely left that case green and the
suite failing on exactly the same two cases as before.

This change repairs the fixture, does **not** widen the roster, and adds the
cases the guard's remaining branches never had. Every branch of the fallback now
has a case that goes red when that branch alone is destroyed. No product code
changed.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** tests, CI baselines and a triage record only. No product code, no
  route, no schema, no data plane, no UI. The route under test
  (`src/app/api/v1/tower/outcome-report/route.ts`) and the roster
  (`src/lib/auth/canonical-auth-roster.ts`) are **unmodified** — both were
  edited only transiently, as mutations, and restored.
- Layer 3 (canonical model) and layer 4 (products) are untouched.

## Client Applicability

- **All clients:** no behavior change. The authorization logic is byte-identical.
- **Specific clients:** none.
- **Internal only:** the fallback this suite covers is an internal-admin path;
  the change is to its proof, not to the path.
- **Public/demo only:** not applicable.
- **Feature flag:** none.

## Changes Included

- `src/app/api/v1/tower/outcome-report/__tests__/route.test.ts` — the fixture
  identity now uses an address that is on the current canonical client-admin
  roster, so the fallback is reachable. Four cases become seven: the widening
  case is given independent truth (it first proves the same identity **is**
  admitted for its own tenant, then requires the other tenant to be refused,
  comparing substrate-read and render call counts rather than never-called); a
  new case covers the admin half of the condition (same tenant, not admin-like,
  must be refused); a new case covers the metadata half of the same-tenant
  condition; and a new case pins the fixture address to the roster so a future
  narrowing names its own cause instead of leaving three cases red for an opaque
  one. Assertions read tenant keys from the fixture constants rather than
  repeating string literals.
- `docs/ci/tower-test-baseline.json` — the entry for that suite is removed,
  because it no longer fails. The ratchet fails on an improvement it still has
  room for, so this had to move in the same change. `recordedAt`, `totalTests`
  and `totalSuites` are refreshed with it.
- `docs/architecture/t479-stale-suite-triage.json` — the row for that suite
  declares, additively, which item removed its baseline entry. The historical
  `declaredKnownFailingInBaseline` quote is left exactly as it was measured; it
  is a record of a past run, not a live assertion.
- `src/__tests__/behaviors/t479-stale-suite-triage-record.test.ts` — the control
  that cross-checks that record against the live baseline had no case for a row
  that has since been **fixed**, so as written no baselined row could ever
  improve without turning it red. It now accepts a removed entry only when the
  row names the item that removed it and gives a reason; an undeclared removal
  is still a failure, and so is a declaration made while the entry is still
  present, so the declaration records one event rather than standing open.

## QA / Validation

Baselines were measured in a **separate worktree at the same commit**
(`e1ed972d2`), not from a stash, so "before" is a clean tree.

**The suite under repair** — `src/app/api/v1/tower/outcome-report/__tests__/route.test.ts`

- Before: **2 failed / 2 passed of 4**, both failures the fallback cases,
  expected 200 received 403.
- After: **7 passed / 0 failed of 7**.

**The guard can fail — seven mutations, seven caught, each with its firing case.**
The route or the roster was mutated, the suite run, and the file restored:

| mutation | cases that went red |
|---|---|
| same-tenant condition dropped from the fallback (the original escape) | `does not let a same-client fallback widen into another requested client` |
| admin-like condition dropped | `does not let a same-client non-admin skip the program-access policy` |
| fallback always allows | both of the above |
| roster narrows again, the pinned address removed | the roster pin, both stream cases, the widening case, the metadata case (5) |
| same-tenant: address-inference half removed | both stream cases, the widening case (3) |
| same-tenant: metadata half removed | the metadata case |
| admin-like: roster check removed, role check kept | both stream cases, the widening case, the metadata case (4) |

Before this change the first of those left the whole suite unchanged. The
fourth, fifth, sixth and seventh had no case that could see them at all.

**The re-recorded baseline is a tightening, not a loosening.** With the new
baseline in place and the test file reverted to its `main` content, the tower
ratchet exits **1** (`NEW FAILURE`). It cannot be used to hide the old failures.

**The record control can fail.** Four negative cases, all caught, each turning
`verifies every quoted baseline knownFailing entry against the baseline file and
the measured run` red (27 of 28): the declaration deleted while the live entry is
absent; the declaration present while the live entry is still there; the
declaration naming something that is not an item id; the declaration giving a
token instead of a reason. A fifth probe inverts the control itself — accept any
missing live entry — and the undeclared removal then passes, which is what
confirms the new branch is the thing producing those reds rather than something
else in the suite.

**Scope baselines, same invocation both sides**

| scope | before (clean worktree, `e1ed972d2`) | after |
|---|---|---|
| tower ratchet (`docs/ci/tower-test-baseline.json`) | 1790/1801 tests, 8 failing suites, exit **0** | 1795/1804 tests, 7 failing suites, exit **0** |
| `src/__tests__/behaviors` | 139 suites / 1348 tests / **0 failing** | 139 / 1348 / **0 failing** |
| `t479-stale-suite-triage-record.test.ts` alone | 28 passed of 28 | 28 passed of 28 |

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, with `tsconfig.tsbuildinfo` deleted first. Judged on the exit code;
  zero `error TS` lines.
- `npx eslint` on the changed suite — exit 0, clean.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — exit 0, shape
  unchanged.

## Rollout Plan

Merge to `main` (squash). No runtime rollout: nothing here is shipped in an
image or read at request time. The repo-owned ACA workflow will build and deploy
the merge commit as it does every commit on `main`, and this change contributes
no runtime difference to that image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command was run.
- Approved image digest: not applicable — no runtime template change is requested
  by this release.
- ACA runtime invariant: unaffected. The deploy proof for the merge commit is
  recorded in the execution pulse entry for this run.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. Nothing in this change is observable
  from a signed-in session — the product behavior is byte-identical, and what
  changed is which tests can fail. Stated as not required rather than as owed.

## Rollback Plan

`git revert` the squash commit. It restores four files and nothing else; there is
no migration, no flag and no runtime state. The only consequence of reverting is
that the two fallback cases go back to failing and the ratchet baseline goes back
to expecting them.

## Audit Evidence

- The PR for this release, and its required checks.
- The mutation tables above are reproducible: each row names the condition that
  was removed from `src/app/api/v1/tower/outcome-report/route.ts` (or the roster)
  and the case that went red. The tree is restored after each; `git status` is
  clean of those two files in the shipped diff.
- `docs/ci/tower-test-baseline.json` diff — three lines of substance. Verified
  against what `scripts/ci/test-ratchet.mjs --update` produces on a scratch copy:
  **exactly one** `knownFailing` entry differs between the committed baseline and
  the regenerated one, and it is the entry this item fixes. No other suite's
  recorded failure count was absorbed.
- `docs/architecture/t479-stale-suite-triage.json` diff — four inserted lines,
  nothing rewritten.

## Known Gaps

- **Two descriptive fields in the tower baseline were already stale before this
  change, and refreshing them is not this item's work being passed off as a
  measurement.** On the unmodified tree the ratchet measured 1801 tests across
  136 suites while the file recorded 1799 across 135. Of the move to 1804/136,
  **+3 tests are this change**; the remaining +2 tests and +1 suite accrued
  between 2026-09-18 and now from other work. Only `floor` gates, so neither
  field was ever enforced. The seven surviving `knownFailing` entries were
  confirmed unchanged on the clean tree in the same run.
- **The committed test-CI coverage census is stale, and not because of this
  change.** `--check` reports `testFiles 2454 -> 2462 (+8)` and the identical
  drift is reported on the unmodified tree, so it predates this work. It is left
  for whoever owns the refresh; this change adds no test files.
- The mutation set covers the fallback's own conditions. The program-access
  policy path and the no-active-tenant branch of the same route keep the coverage
  they already had; neither was in this item's scope.
