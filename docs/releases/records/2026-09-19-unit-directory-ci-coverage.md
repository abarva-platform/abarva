# 2026-09-19-unit-directory-ci-coverage — Run the unit test tree in CI, and repair the stale case it was hiding

## Release ID

`2026-09-19-unit-directory-ci-coverage`

## Status

`candidate`

## Plain-English Summary

Eleven test suites live in `src/__tests__/unit`. No workflow ran them and no npm
script named them, so nothing in this repository had executed them for as long
as the census has been able to measure. One of them had been failing since
2026-08-27 and nobody could have known.

This change does two things. It adds a workflow that runs that tree on every
pull request, with a behavioural case that refuses a new unrun tree under
`src/__tests__`. And it repairs the failing case, which was stale rather than
finding a product defect.

The stale case is worth describing, because it is the same shape as several
repaired this week. It asserted that an ordinary tenant browsing an ordinary
page does not cause the proxy to call the identity provider on every request —
a real and valuable contract — and it named one specific tenant to stand for
"ordinary". That tenant was later added to the set of foundation tenants, in a
change about something else entirely, so the input silently stopped meaning what
the case needed it to mean. The contract is now tested with a tenant *derived*
from the foundation set rather than typed by hand, so the next addition to that
set cannot quietly hollow it out again.

No product code changed. No route, prompt, schema, tenant data, auth decision or
deployment path was touched.

## Layer Impact

- **Layer 4 (Products):** none. No product surface, route or read path changes.
- **Layer 3 (Canonical model):** none.
- **Layers 1–2 (Intake, adapters):** none.
- **CI / test tooling:** one new workflow (`.github/workflows/unit-suites.yml`),
  one new behavioural case, one repaired test file.

Release lane: `global-control-lane`. Shared CI behaviour for all clients, with no
feature gate and no client-scoped data, schema or runtime effect.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — CI and test scope only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/unit-suites.yml` (new) — runs `src/__tests__/unit` on pull
  requests and merge queue, plus the ratchet case below.
- `src/__tests__/behaviors/unit-directory-ci-coverage.test.ts` (new) — holds the
  wiring mechanic and refuses a new dark tree under `src/__tests__`.
- `src/__tests__/unit/proxy-session-identity.test.ts` — the stale case repaired
  and two contracts added.

## QA / Validation

**Baseline, measured on a clean checkout of `6166725d0` before any edit.**
`src/__tests__/unit`: 11 suites, **1 failed / 54 passed / 55 total**. The single
failure is `shouldFetchClerkUserForProxyIdentity(staleIdentity, "/home")`
returning `true` where the case expects `false`.

**Cause, established by history rather than assumed.** The predicate has not
changed since `e4f980c48` (2026-07-30), the commit that wrote the case. What
changed is the set it consults: `6a623e3cc` (2026-08-27) added a tenant key to
`FOUNDATION_TENANT_KEYS`, and the case had hard-coded that same key to mean "an
ordinary, non-foundation tenant". At the time the case was written that set held
two preview fixtures; it now holds four, two of which are ordinary product
fixtures. The input silently stopped modelling the thing the case named.

**Measured before and after over the same scope** (`src/__tests__/behaviors` plus
`src/__tests__/unit`, same commit):

| | Suites | Tests |
|---|---|---|
| Before | 1 failed / 46 passed of 47 | 1 failed / 420 passed of 421 |
| After | 48 passed of 48 | 428 passed of 428 |

The test count rises by seven because four cases are new in the behavioural file
and the repaired case became three, not because anything was deleted.

**Ten deliberate mutations, ten caught**, each applied to the real execution path
and reverted, with a clean control run before and after:

| # | Mutation | Failing cases |
|---|---|---|
| 1 | Drop the foundation clause from the predicate | 1 |
| 2 | Predicate returns `true` unconditionally | 2 |
| 3 | Proof-route branch returns `false` | 1 |
| 4 | Every canonical tenant resolves as foundation-bound | 2 |
| 5 | No tenant resolves as foundation-bound | 1 |
| 6 | Delete the workflow's run step | 3 |
| 7 | Trailing slash on the wired path | 3 |
| 8 | Wrapper script instead of a direct jest invocation | 3 |
| 9 | Add a sibling directory the wired name prefixes | 2 |
| 10 | Add a brand-new unrun tree under `src/__tests__` | 1 |

Mutations 7 and 8 are the two forms that look correct and register nothing; both
have cost this repository time before, which is why they are pinned here.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit
0**, judged by exit code. `npx eslint` on both changed source files **exit 0**.

## Rollout Plan

Merge to `main`. The workflow begins running on the next pull request. No image
build, no migration, no flag, no data-plane action is required for this change to
take effect.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change mutates no Azure resource.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: to be verified after merge as routine practice, not
  because this change can affect it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — CI and test scope; no route, component,
  prompt, schema, tenant data or auth path changed.

## Rollback Plan

Revert the commit. The workflow stops running and the repaired case returns to
its previous form. Nothing else is affected: no migration, no deployed artifact,
no persisted state.

## Audit Evidence

- The pull request and its check run, including the new `Unit suites that pass on
  main` job executing on a real runner before merge.
- The before/after numbers above, reproducible with
  `npx jest src/__tests__/behaviors src/__tests__/unit` at `6166725d0` and at the
  merge commit.
- `git log -L 439,471:src/proxy.ts` and `git show 6a623e3cc:src/lib/tenant/foundation-tenants.ts`,
  which are the two reads that establish the cause.

## Known Gaps

Three sibling trees under `src/__tests__` remain unrun and are deliberately not
wired here, because a red directory is wired by fixing it and never by adding it
to a green command. Measured together on `6166725d0`: `features` (1 suite),
`guardrails` (1) and `hygiene` (6) are **4 failed / 4 passed of 8 suites, 4
failing cases**. One of the four is a live finding rather than a stale
assertion — a retired import path that still exists in product code. They are
filed as their own backlog item with those numbers, and the ratchet in the new
behavioural case names all three so a fourth cannot join them silently.

Two structural findings are recorded and deliberately **not** encoded here:

1. The "changed integration suites have a CI owner" gate is hard-scoped to
   `src/__tests__/integration/`, in two independent places — the changed-file
   filter and the ancestor walk in `candidateRegistrationPaths`. A suite in any
   other tree has no owner question asked of it even when a pull request edits
   it. Widening that scope changes what the gate blocks and deserves its own
   review.
2. The proxy refreshes identity-provider metadata whenever a session's ordinary
   tenant identity canonicalises into the foundation set and the foundation
   fields are absent. For a tenant whose users have no such metadata to fetch,
   that condition can never be satisfied, so it repeats on every request. The
   refresh is load-bearing for the foundation fence, so narrowing it is an auth
   change, not a test change. Filed as a decision, with a recommendation.
