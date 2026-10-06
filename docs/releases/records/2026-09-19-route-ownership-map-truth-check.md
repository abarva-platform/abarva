# 2026-09-19-route-ownership-map-truth-check — the QA route map described an app that no longer exists

## Release ID

`2026-09-19-route-ownership-map-truth-check`

## Status

`candidate`

## Plain-English Summary

`src/lib/qa/active-route-ownership-map.ts` is the QA reference for what is
actually mounted: which file serves each route, which page component it renders,
which shell or nav it pulls in. Other audits read it, and people read it to
decide whether a surface is live.

**Nothing checked that any of it was true.** Eleven of its import claims were
false, across six of its eight routes.

### How it surfaced, and what it cost

Backlog item T-016 asked a product question: the largest cluster of quarantined
Source integration failures is components throwing on a **null event** —
`SourceScopeStageWorkspace.tsx:365` reading `dataReadiness`, and the same shape
for `stages`, `id`, `vendorResponses`, `name`. Should those components render a
governed empty state, or is the harness wrong to pass null?

**Neither.** Tracing the component up:

- `SourceScopeStageWorkspace` is rendered only by `SourceActiveStageWorkspace`,
  which is rendered only by `SentinelEngagementCanvas`.
- `SentinelEngagementCanvas` is imported by **no file under `src/app`**. The
  whole tree is unmounted.
- The live route, `/source/events/[eventId]`, imports `SourceAnalyticsCanvas`
  instead — and handles a missing event at line 89 with `if (!event) notFound()`.
  **A null event never reaches a component on the live path; the route 404s.**

So the suites in that cluster test dead code with an input the product cannot
produce. Repairing them either way would have polished an unmounted tree and
moved the quarantine number without proving anything about the product.

**The map is what made them look live.** It named `SentinelEngagementCanvas` as
the `currentPrimaryVisibleComponent` of that route. A stale map is worse than no
map, because it is consulted.

### What the map actually describes

Read against the files, five of the eight routes are **redirect shims** left
over from the `/admin` and `/programs` consolidations, while the map presented
them as rendering components:

| route | map claimed | reality |
|---|---|---|
| `/platform/admin` | `StewardAdminRail` | redirect to `/admin` |
| `/platform/admin/production-readiness` | decision flow + live panel | redirect to `/admin/production-readiness` |
| `/source` | `SourceFoundationShell`, `PageShell` | re-exports `./workspace/page` |
| `/source/events` | `SourceFoundationShell` | redirect to `/source` |
| `/source/events/[eventId]` | `SentinelEngagementCanvas` + `SourceCommercialEventSection` | `SourceShellWorkspace`, `SourceAnalyticsCanvas` |
| `/tenant/[tenantSlug]/programs` | `ProgramsCanonicalIndex` | redirect to `/programs` |
| `/tenant/[tenantSlug]/programs/[programSlug]` | `ProgramCanonicalDetail` | redirect, or `notFound()` |

Every entry is corrected to what its file does, and the two remaining routes
(`/platform/admin/build-progress`, and the detail route's shell) were already
accurate.

### The check, and the two ways it could have been useless

`src/__tests__/behaviors/route-ownership-map-is-true.test.ts` asserts each entry
names a route file that exists, imports every component it claims, and renders
the page component it names.

**Emptying the claims would satisfy all of that**, turning a stale map into an
empty one and losing the same information. So two more cases: a route whose file
is a redirect shim must *say* it is a redirect, and a shim must carry no
component claims. The map cannot now be made to pass by deleting from it.

**The first draft of the shim test was wrong and a mutation caught it.** It
treated any `redirect(` as a shim, which flagged `/platform/admin/build-progress`
— a route that calls `redirect('/sign-in')` as an **auth guard** and then renders
`BuildProgressDashboard` exactly as the map says. A shim renders nothing, so the
test now asks whether the file returns any JSX.

## Layer Impact

Release lane: `global-control-lane`.

- **QA reference data** — `active-route-ownership-map.ts` corrected to match the
  route files.
- **Repository CI** — one new behaviour suite, which runs in the existing
  behaviours job; no new workflow.
- **No product code changes.** No route, component, projection, schema,
  migration or runtime config. The corrected entries change what the map
  *reports*, not what any route does.

## Client Applicability

No client receives this change; it is internal QA reference data and a test.

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `src/lib/qa/active-route-ownership-map.ts` | corrects 7 entries — 11 false import claims and 4 false primary-component claims |
| `src/__tests__/behaviors/route-ownership-map-is-true.test.ts` | new — 28 cases |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `route-ownership-map-is-true.test.ts` | **pass** — 28/28 (it failed 11 of 26 against the map as it stood) |
| `npx jest src/__tests__/behaviors` | **pass** — 38 suites / 403 tests |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both changed files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| re-introduce the stale `SentinelEngagementCanvas` claim | caught | 1 of 28 red |
| point an entry at a route file that does not exist | caught | 3 of 28 red |
| empty a shim's claims but stop admitting it redirects | caught | 1 of 28 red |
| give a redirect shim a component claim again | caught | 2 of 28 red |
| name a page component the file does not contain | caught | 1 of 28 red |
| widen the shim test to any `redirect(` | caught | 2 of 28 red |
| empty the whole map | caught | 4 red, and the parameterised cases vanish (28 → 7) |

The last two matter most. Emptying the map is the cheapest way to satisfy a
naive version of this check, and widening the shim test is the false positive
the first draft actually had.

## Rollout Plan

Squash merge to `main`. The suite runs in the existing behaviours job on the next
PR. No image build, no deploy, no migration, no flag.

## Deployment Authority

Not applicable. No Azure Container Apps, deploy workflow, runtime image, flag,
environment variable, worker job, traffic, DNS or environment promotion is
affected.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no — nothing here is observable to a signed-in user

## Rollback Plan

Revert the commit. The map returns to its stale claims and the check stops
running. No product behaviour changes either way.

## Audit Evidence

- Corrected map: `src/lib/qa/active-route-ownership-map.ts`
- The check: `src/__tests__/behaviors/route-ownership-map-is-true.test.ts`
- The unmounted tree: `SentinelEngagementCanvas` → `SourceActiveStageWorkspace`
  → `SourceScopeStageWorkspace`, referenced by no file under `src/app`
- The live route's own handling: `src/app/(maestro)/source/events/[eventId]/page.tsx:89`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **T-016's quarantined suites are not repaired, deliberately.** The finding is
  that they test an unmounted tree; the decision of whether to delete them, or
  delete the components, or mount the canvas, is a product call and is recorded
  for the owner rather than taken here.
- **The check is textual.** It asks whether a route file *contains* a component
  name, not whether it renders it on any given path. A name in a comment or a
  dead branch would satisfy it. That is deliberate — resolving real reachability
  needs the import-graph walk that the reachability audit already does — but it
  means this catches staleness, not subtler forms of wrongness.
- **A pre-existing failure was found and not fixed:**
  `src/__tests__/integration/admin/production-readiness-tracker.test.ts` fails
  one case (`data-admin-home-native` absent from the admin route). It fails
  identically on clean `main` — 1 failed, 23 passed both sides — so it is not
  caused by this change, and it is recorded in the backlog rather than absorbed
  here.
