# 2026-09-24-c507-route-tenant-fence-proof — Behavioral proof for two governed route tenant fences

## Release ID

`2026-09-24-c507-route-tenant-fence-proof`

## Status

`candidate`

## Plain-English Summary

Two API routes check that the caller is allowed to act on the tenant they name before
the route does anything with that tenant's data. Both checks were covered only by tests
that read the route's **source text** — they asserted that certain words appear in the
file, and that one word appears before another. A test of that shape cannot notice a
check that has been reversed or removed, because the words are all still there.

That was not a theory. The prior change that triaged these suites recorded the exact
edits that survive them, and this change reproduced both before writing a line: reversing
the tenant comparison on one route, so a request naming somebody else's tenant is let
through and a legitimate one is refused, and removing the refusal from the other route, so
a caller whose tenant never resolved falls through into the handler. Both edits were
applied at once and **both suites stayed green on all four of their cases**.

This change adds a suite that calls the two routes and reads the responses. No route, and
no other product file, is modified — the routes were already correct. What was missing was
any way to find out if they stopped being correct.

The committed test-CI-coverage census is refreshed in the same change, which the census
contract requires when a test file is added.

## Layer Impact

Release lane: `global-control-lane` — the guards these tests cover are shared control-plane
behavior applying to every tenant, and the suite runs for all clients rather than being
gated or client-scoped.

- **Layer 4 — Products (Intelligence, and the strategy-session chat surface):** no behavior
  changes. The two route handlers are byte-identical to `origin/main`; only test coverage
  over them is added.
- **Layers 1–3 (intake, adapters, canonical model):** untouched. No loader, adapter,
  projection, migration or tenant record is read or written by this change.

## Client Applicability

- All clients: yes, in the sense that the guards now have executable proof for every tenant.
  No client-visible behavior changes.
- Specific clients: none.
- Internal only: the test suite and the census artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/c507-route-tenant-fence-behavior.test.ts` — new. Ten cases over
  `POST /api/chat/step` and `POST /api/intelligence/query`, all collaborators stubbed at the
  module boundary so nothing reaches a database, a retriever or a model.
- `docs/architecture/test-ci-coverage-census.json` — refreshed counts (see QA below; the
  refresh absorbs one file that is not this change's).
- No product file changed. `src/app/api/chat/step/route.ts` stays at sha256
  `8f2072c4d603aeccfe8008ae48a949d8b77f9c02786a2c9e6aad20f17f473a56` and
  `src/app/api/intelligence/query/route.ts` at
  `a22bd37c5f4af5d24f5cd5fdc250c7926b4eb9dcbc1e173ebbf864ed50db6c69`, each verified after
  every mutation below was reverted.

### Two suites deliberately NOT changed, and why

`src/app/api/chat/step/__tests__/route-boundary.test.ts` and
`src/app/api/intelligence/query/__tests__/route-boundary.test.ts` are left byte-identical.
Their import-boundary cases are sound, and `src/__tests__/behaviors/zero-product-source-suite-triage.test.ts`
recomputes, from each file's own body, whether that file proves its subject by reading bytes.
Rewriting either one as a behavioral test would turn that control red and would quietly
edit the subject of a recorded verdict. The missing proof is **added beside** them rather
than relocated into them.

For the same reason `docs/architecture/t758-zero-product-source-triage.json` is not edited.
Its `vacuous_control_proof` verdicts are verdicts about **those two suites**, and they remain
true: those suites still prove nothing about the fences. What changes is that something else
now does.

## QA / Validation

### The defect, reproduced before anything was written

On `origin/main` `2b98de396`, both mutations applied together:

| id | subject | edit | old byte-scanner suites |
|---|---|---|---|
| M-A | `src/app/api/chat/step/route.ts` | invert both comparisons of the active-tenant guard (`!==` → `===`) | **4 of 4 green** |
| M-B | `src/app/api/intelligence/query/route.ts` | `catch` branch no longer returns `tenancyErrorResponse(err)`; both identifiers preserved | **4 of 4 green** |

Both subjects were then restored and their sha256 confirmed byte-identical to the values
recorded by the prior triage — which is how this change knows it reverted cleanly rather
than approximately.

### Break-the-fix: eight mutations, eight caught, each by cases that name the defect

Every mutation was asserted to be a real edit before its result was believed (the harness
aborts on a no-op substitution), and every subject was byte-restored and re-hashed after.

| id | edit | new suite | old scanners |
|---|---|---|---|
| M-A | invert both comparisons of the chat/step fence | **3 failed** / 7 passed | 4 of 4 green |
| M-A2 | delete the chat/step fence outright | **3 failed** / 7 passed | not re-run |
| M-A3 | move the fence to *after* retrieval — a leak with a tidy 403 | **2 failed** / 8 passed | not re-run |
| M-A4 | key retrieval off `body.clientId` instead of the resolved tenant | **1 failed** / 9 passed | not re-run |
| M-B | drop the tenancy error return, both identifiers preserved | **3 failed** / 7 passed | 4 of 4 green |
| M-B2 | answer every tenancy failure with a flat 403 | **2 failed** / 8 passed | not re-run |
| M-B3 | broker the query under a hardcoded tenant | **1 failed** / 9 passed | not re-run |

The failing case names are specific, not incidental: M-A3 fails *builds no RAG context for a
foreign tenant*, M-B2 fails *returns 503 rather than 403 when the tenant lookup is
unavailable*, M-B3 fails *brokers the query under the resolved tenant when tenancy does
resolve*.

### One mutation survived the first draft, and the reason is recorded rather than quietly fixed

**M-A4 initially passed 10 of 10.** The case asserting that retrieval is keyed by the
resolved tenant posted the tenant's *key*, which made the caller's string and the expected
retrieval key the same value — so substituting one for the other was undetectable. The case
now posts the *clientId* and expects the *clientKey*, and asserts up front that the two
differ, so the assertion cannot be satisfied by them being equal. M-A4 fails it after the
repair. A fixture whose two sides agree cannot test which one was used.

### Baselines, same command over the same scope on both sides

`npx jest --runTestsByPath` over every file in `src/__tests__/behaviors` (the CI-gated scope):

- **Before** (this change's test file absent, otherwise this tree): **116 suites / 1074 tests / 1 failing**
- **After**: **117 suites / 1084 tests / 0 failing**

And under the gate's own command (`jest src/__tests__/behaviors --coverage --runInBand`, which
enumerates the directory rather than taking a path list), **119 suites / 1104 tests / 0 failing**
before and **120 / 1114 / 0** after. The two scopes differ by suites the path-list form does not
pick up; both are reported because the gate runs the second one.

The delta is this change's own suite (+1 suite, +10 tests) plus the repair of the one
pre-existing failure, described next.

### The census refresh absorbs one file that is not this change's, and this says so

`npm run audit:test-ci-coverage:check` on `origin/main` **with this change's file removed**
already reported `testFiles 2423 -> 2424 (+1)`. That pre-existing drift is the single failing
behaviors suite in the "before" baseline; it is PR #8420's test file, added 21 minutes before
this work began without a census refresh. With this change's file the drift is `(+2)`.
Refreshing the census therefore clears two files' worth of drift, only one of which is mine.
The refreshed counts are `testFiles` 2423 → 2425, `coveredTestFiles` 1974 → 1976,
`pullRequestCoveredTestFiles` 1971 → 1973. The `+2` on the covered counts is also the evidence
that this change's suite is **reached by a workflow** rather than dark — it is the census's own
resolver answering, not a grep over `.github/workflows`, which answers a different question.

`census shape: coverage shape matches the committed census` both before and after, so the
shape gate T-760 wired was never the failing half.

### The first version of this suite failed the behavior coverage gate, and the cause is worth recording

Every test passed — 120 suites, 1114 tests, 0 failing — and the job still failed. The
`Behavior coverage floor` gate is a **percentage** floor over the coverage the behaviors run
collects, and jest instruments whatever a test actually loads.

This suite needs the real `tenancyErrorResponse` and `TenancyError`, because the status each
failure maps to is part of the fail-closed behavior under test. Taking them via
`jest.requireActual("@/lib/auth/tenancy")` also loaded that module's entire transitive graph:
**33 files, 6,864 instrumented lines, 42.1% covered**, dominated by `postgresCompat`,
`seed-route-resolver`, `evidence-registry`, `resolveTenant` and `current-user` — roughly 3,900
unexercised lines, none of them this suite's subject, all of them landing in the denominator
as though they were.

Measured, both sides, with the real gate:

| | lines | statements | functions | branches | verdict |
|---|---|---|---|---|---|
| `origin/main` baseline, this suite absent | 91.02% | 91.02% | 69.31% | 68.86% | — |
| first version (CI run 36007665930) | **88.68%** | **88.68%** | **58.36%** | 68.53% | **failed** three floors |
| after stubbing the tenancy module's own collaborators | **90.89%** | **90.89%** | **69.31%** | 68.52% | **exit 0** |

The repair stubs the collaborators *of* the module under test, so loading it loads it and not
the graph behind it: 33 files and 6,864 lines become **3 files and 473 lines**. The real
functions and `tenancyErrorResponse` are still the real ones — nothing about what is asserted
changed, only what is dragged in behind it. The suite's own cost against the baseline is
**−0.13pp lines and −0.34pp branches, with functions unchanged**, and every floor is cleared.

**All eight mutations were re-run against the restructured suite** rather than assumed to still
hold, because changing the mock boundary can weaken a case silently. Same results as the table
above, and both subjects re-hashed byte-identical afterwards.

### Toolchain

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged
  by exit code with `tsconfig.tsbuildinfo` removed first, 0 diagnostics.
- `npx eslint` on the new suite — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on merge as it
does for every change. Nothing in this change is reachable from the running application, so
there is no runtime rollout to stage, no flag to flip and no migration to apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not set by this change; the deploy workflow's own digest applies.
- ACA runtime invariant: to be proven from the deploy run keyed to this change's merge SHA
  and appended to the register. Not claimed here.
- Worker image invariant: unchanged; no worker job definition is touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and none is claimed. A test file and a generated
  census artifact are not reachable from the running application, so `deployed` is the
  terminal rung for this item. No product surface moved — both route handlers are
  byte-identical to `origin/main`.

## Rollback Plan

Revert the PR. The change adds one test file and refreshes one generated artifact; reverting
restores the prior census counts and removes the suite. No migration, no data and no runtime
state is involved, so there is no ordering constraint and no replay.

## Audit Evidence

- The pull request and its check runs.
- `docs/architecture/t758-zero-product-source-triage.json` — the prior triage's record of both
  surviving mutations and both `restoredSha256` values, which this change reproduced
  independently rather than accepting on report.
- `src/__tests__/behaviors/c507-route-tenant-fence-behavior.test.ts` — the suite header records
  each mutation it is written against, including the one that survived the first draft.
- The mutation table above; each row is reproducible by applying the named edit and running
  the suite by path.

## Known Gaps

1. **The two byte-scanner suites still carry case titles that claim more than they assert** —
   *enforces active-tenant matching before building RAG context* and *leaves tenancy
   enforcement in the route shell*. They are left untouched for the control reason above, so
   a reader who finds those cases first may still over-read them. Retitling them to describe
   what they actually assert is a bounded follow-on; it is not done here because it would edit
   the subject of a recorded verdict inside the change that discharges the verdict's cause.
2. **Coverage is over these two routes only.** The triage examined six suite directories; the
   third `vacuous_control_proof` row is an Admin page whose real proof requires mounting a
   server component, which is different work and is not attempted here.
3. **Whether other governed routes have fences proven the same vacuous way is unmeasured.**
   This change proves two; it does not survey the rest. The shape — a tenancy guard asserted
   by the presence and order of substrings — is mechanically detectable and worth a sweep.
