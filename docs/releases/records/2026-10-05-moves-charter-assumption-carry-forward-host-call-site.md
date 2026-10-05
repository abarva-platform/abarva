# 2026-10-05-moves-charter-assumption-carry-forward-host-call-site — Moves: pin the host call site of the charter-assumption carry-forward

## Release ID

`2026-10-05-moves-charter-assumption-carry-forward-host-call-site`

## Status

`candidate`

## Plain-English Summary

P1 of a Move tells the person, in four places, that a charter answer they marked
as an assumption "carries into Discover to be validated". P2 now keeps that
promise: a band at the top of the Discover capture screen lists what P1 left
open, who owns each item, and the validation plan the person typed.

Two separate capabilities produce that band, and both are flag-gated and
resolved on the server. The fold that decides which assumptions are still open
has its own test suite. The band itself has its own test suite. What had no
coverage at all was the join between them — the component that decides **where**
the band is mounted and **what** it is handed.

That join carries two decisions worth pinning. The band is a slot on the
redesigned capture flow, so it exists only where that flow renders; and the
component passes the server's rows through verbatim, re-reading no flag,
re-deriving no row and re-counting nothing. The second matters more than it
reads: the resolution capability's whole job is to drop an assumption Discover
has already closed, and a component that re-counted or re-added rows would
silently re-open findings that are done.

This change is test-only. Six cases are added to the component's existing suite.
No product file is touched, no behaviour changes, and no flag is declared or
enrolled.

## Layer Impact

Lane: `experimental` — the surface these cases cover is behind two tenant-scoped
feature flags whose enrollment this change does not alter.

Layer 4 (Products) only, and within it only the test layer. No canonical object,
field, table, key or migration is touched. No React component, route, API
handler or pure module is modified. No product gains or loses ownership of data.

## Client Applicability

Specific clients, selected by feature flag — and in practice none, because this
change ships no runtime behaviour at all. The surface it covers renders only
where both of the two capture-assumption flags are enabled for a tenant, and
those tenant lists are unchanged by this record. Tenants are resolved from code,
never from a list written here.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 6 cases added to the existing registered suite, pinning the host call site
  of the carry-forward band:
  1. the surface inactive (the server hands the component `null`) renders no
     band, with the capture flow asserted up so the absence is the surface and
     not an unmounted screen;
  2. active, the band renders inside the capture flow and **precedes** the first
     question, asserted by document position rather than by source order;
  3. each row's owner and validation plan render — values that live in the P1
     basis record, which is loaded on phase 1 only, so they cannot have been
     re-derived from any state the component also holds;
  4. one row in, one row out: the rendered count and the list length both equal
     the prop's length, and the row the server filtered out is absent;
  5. an active surface with nothing assumed renders nothing — an empty charter
     is never announced as a clean one;
  6. without the redesigned capture flow, the legacy canvas grows no band.
     This half is structural, not a droppable conditional — the band is a slot
     on the flow — so the case pins the consequence rather than a branch.

No other file changed. The suite is already registered by exact path in
`.github/workflows/ai-surface-control-catalog.yml`, so neither that catalog nor
`docs/architecture/test-ci-coverage-census.json` needed an edit, and no registry
flag changed, so the generated manual is untouched.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__` — **PASS**, 36 suites /
  488 tests. The component's own suite goes 176 → 182 tests.
- `npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `npx eslint` on the one changed file — **PASS**, 0 errors, 0 warnings.
- Mutation checks against the component's whole suite, **4 of 4 killed**:
  - the component drops the prop and hands the band `null` — **3 of 182 red**.
  - the component re-slices the prop before passing it (a stand-in for any
    client-side re-count or re-filter) — **1 of 182 red**.
  - the band is moved below the questions instead of above them — **1 of 182
    red**.
  - an empty list renders the band instead of nothing — **1 of 182 red**.
    The size of the hole is the complement: before this change, 176 cases
    rendered this component and none of them noticed the carry-forward call site
    being broken in any of those four ways.
- Signed-in walk of this change — **NOT RUN**, and not applicable: the change
  ships no runtime behaviour. The walk owed on this workstream is the one for
  the merged product slices from the capture-flow figure family onward, which
  needs a settled deploy queue; the queue showed a pending and a queued
  main-deploy run at the time of this build.

## Rollout Plan

Merge to `main` with squash auto-merge. The repo-owned ACA main deploy workflow
builds and ships the commit on merge. Because the change is test-only there is
nothing to enroll, no flag to flip, no data build, no migration and no job run;
the deployed runtime is byte-identical in behaviour before and after.

## Rollback Plan

Revert the single commit. It adds test cases to one existing file and touches
nothing else, so the revert restores the previous suite exactly and has no
runtime, data or configuration effect of any kind.

## Deployment Authority

Only the repo-owned ACA main deploy workflow shifts shared Product/Lab web
traffic. No ad-hoc `az containerapp` command, no branch workflow and no local
build was used or is required for this change. The runtime image stays
digest-pinned by that workflow.

## Known Gaps

- The structural half of case 6 cannot be expressed as a mutation. The band is
  a slot on the capture flow rather than a conditional inside the component, so
  there is no single expression to remove; the case pins the consequence
  instead, which is weaker evidence than the other five carry.
- The resolution capability's filtering is pinned here only by its consequence
  at the host — that the component shows exactly the rows it is handed. The
  filtering decision itself is pinned in the fold's own suite, and the write
  path that would produce a resolution is not yet built.
- The hand-off recap step does not render the band, because the slot is scoped
  to the three question steps. That is deliberate and is not asserted here.
- Nothing on this surface has been measured at phone width; jsdom does not lay
  out, and the band's owner/plan pair collapses to a single column on a narrow
  viewport.

## Audit Evidence

- Suite run, type check, lint run and all four mutation runs recorded above,
  each with its own red count against a 182-test baseline.
- No census registration proof applies: the suite was already registered, so
  `coveredTestFiles` and `uncoveredTestFiles` are both unchanged by this change
  and neither generated artifact is in its diff.
- `npm run release:check -- --base origin/main --head HEAD` run locally before
  push.
