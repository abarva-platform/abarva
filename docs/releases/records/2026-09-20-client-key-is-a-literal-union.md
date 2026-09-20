# 2026-09-20-client-key-is-a-literal-union — ClientKey is the declared tenant union, not `string`

## Release ID

`2026-09-20-client-key-is-a-literal-union`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

The application keeps one registry of the tenants it knows about, and derives a
`ClientKey` type from the ids in that registry. Several lookup tables are then
declared as "one entry per `ClientKey`", which is meant to mean the compiler
will refuse a table that is missing a tenant or that names something which is
not a tenant at all.

That was not happening. The registry array carried a type annotation that threw
the literal ids away before the type was derived from them, so `ClientKey` was
just "any string". Every table declared against it accepted any key and
required none. The probe that proved this assigned the string
`"definitely-not-a-tenant"` to a `ClientKey` and indexed two of those tables
with it; the whole project typechecked clean.

Removing the widening annotation turns the check back on, and it immediately
found six places where the tables had already drifted:

- Two tenant-branding maps on the Home surface, and one display-name map used
  by the Setup screens, were each missing a tenant. The branding maps have a
  fallback, so that tenant was rendering a generic monogram and a blank
  strapline rather than crashing.
- One dataset map declared a key that is not a tenant — a legacy alias that
  resolves to a different tenant, so the entry could never be reached.
- Six test fixtures fed tenant keys that no tenant has: a broker-vocabulary
  key, an alias, and two invented placeholder strings. One of those fixtures
  had propagated into two assertions, so the expectations described a value the
  running code does not produce.

No behaviour changes for a signed-in user. The branding gap that this surfaced
is recorded as a separate item rather than fixed here, because filling it means
authoring client-facing copy.

## Layer Impact

Release lane: `global-control-lane`. Shared application behaviour for all
clients, with no feature gate.

- **Canonical model (layer 3):** the tenant registry now keeps its declared ids
  literal, so the two registry lookup tables keyed by tenant are exhaustive and
  closed at compile time.
- **Products (layer 4):** three product-side maps were repaired to match the
  registry — one gained the tenant it was missing, two are now typed to say
  honestly that they are partial, and a fourth lost an unreachable entry.
- No intake, adapter, schema, migration or data-plane change.

## Client Applicability

- All clients: no functional change. The type is checked at build time.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/client-config.ts` — `ALL_CLIENTS` uses `satisfies readonly
  ClientOption[]` instead of a widening `: ClientOption[]` annotation; adds
  `RegisteredClientOption`; `getClientOption` returns it so callers keep the
  narrowed id.
- `src/scripts/tenants/add-tenant.ts` — the onboarding patcher's two text
  anchors track the new declaration.
- `src/lib/admin/setup-acts-registry.ts` — adds the missing tenant, resolved
  from the registry rather than hand-typed.
- `src/components/home/HomeTenantHeader.tsx`,
  `src/components/home/HomeOverviewV2.tsx` — the branding maps are typed
  `Partial<Record<ClientKey, …>>`, which is what they are; both readers already
  had a fallback. A key that is not a tenant is still rejected.
- `src/lib/home/v6-context-browser.ts` — removes an unreachable entry.
- `src/lib/admin/tenant-switch-authority.ts` — annotates the map callback so
  the option widens where it is built, not at the filter predicate.
- Six test fixtures corrected to the keys production supplies.
- `src/__tests__/behaviors/client-key-literal-union.test.ts` — new.

## QA / Validation

Base commit `57331dc6cb4eeb21c42df4b1622be7d481845288`.

- **Failing test first.** With the new suite added and no fix applied,
  `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  exits **2** with exactly one error: `Unused '@ts-expect-error' directive`.
  After the fix it exits **0** with **0** errors. `tsconfig.tsbuildinfo` is
  removed before each run and the exit code is judged, not the grep.
- **The same suite under jest passes 8/8 both before and after the fix**, and
  the suite says so in its own header: ts-jest does not report type errors, so
  the type half of this control runs in the typecheck job and the runtime half
  runs in jest. Both halves are exercised below.
- `npm run test:behaviors`: **55 suites / 570 tests, 0 failing → 56 / 578,
  0 failing.**
- `npm run test:nav`: 1 suite / 26 tests, 0 failing, unchanged.
- `jest src/__tests__/integration` measured on a pristine tree at the same base
  commit and on this branch: **54 failing suites of 462 on both sides, and the
  failing suite sets are byte-identical.** Those failures are pre-existing and
  not caused by this change.
- The eight suites over the directly affected modules, same comparison:
  **27 failing of 188 suites / 54 failing of 1729 tests on both sides,
  identical failing sets.**
- `npx eslint` over every changed file: exit 0.

**Eight mutations, eight caught, plus a passing control.**

| mutation | caught by |
|---|---|
| control — no mutation | tsc 0 errors; jest 8/8 pass |
| restore the widening `: ClientOption[]` annotation | tsc exit 2 — unused `@ts-expect-error` |
| drop a tenant from the db-name table | tsc exit 2 **and** jest 2 failed |
| add a key that is not a tenant to the industry-code table | tsc exit 2 **and** jest 1 failed |
| negative control — the positive case given a key that is not a tenant | jest 1 failed |
| remove the Setup-acts entry this change added | tsc exit 2 |
| revert the onboarding-script anchor | jest 6 failed |
| a tenant with an empty db-name list | jest 1 failed |
| put the untruthful exhaustive type back on a branding map | tsc exit 2 |

The third and fourth rows are the two directions that matter: a missing tenant
and a key that is not one. The negative control excludes a guard that passes by
rejecting everything.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys from
the merge SHA. No migration, no flag, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by that workflow from the merge SHA.
- ACA runtime invariant: to be proven after merge — Container App template
  image equals the 100%-traffic revision image equals the worker job images,
  all digest-pinned.
- Worker image invariant: same check, no worker change in this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** No route, component render path,
  prompt, schema or API response changes. The three product-side map repairs
  are compile-time only: the unreachable entry could not be reached, the added
  Setup-acts entry replaces a lookup that returned `undefined` with the same
  registry name that surface already resolves elsewhere, and the two branding
  maps keep exactly the entries they had.

## Rollback Plan

Revert the PR. No migration, no data change, nothing to unwind. Reverting
restores the widened `ClientKey` and the tables become unchecked again.

## Audit Evidence

- PR and its CI run, including the typecheck job and the behaviour-coverage
  floor.
- The mutation table above is reproducible from the commands in the PR body.
- The base-versus-branch failing-suite diffs for the integration scope and the
  module scope.

## Known Gaps

- **One tenant has no authored branding** on the two Home maps. That predates
  this change; the type now states it instead of hiding it, and the reader's
  existing fallback still applies. Filling it means writing client-facing copy,
  which is a product call, so it is recorded as a separate item rather than
  guessed at here.
- **A `clientKey` boundary is untyped on both sides.** The Source approval route
  forwards the app-tier key into the stage-entry autodraft path, which declares
  `clientKey: string` all the way down to the write adapter, while the fixtures
  along that path asserted the canonical key. Correcting the fixtures to what
  the route actually produces moved two assertions. Which vocabulary the stored
  column uses cannot be settled from the application tier and is recorded as a
  separate data-plane item; nothing in this release changes what the route
  sends.
