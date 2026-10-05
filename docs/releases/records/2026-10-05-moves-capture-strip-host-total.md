# 2026-10-05-moves-capture-strip-host-total — Moves: pin the capture strip's route-aware total at its host call site (test-only)

## Release ID

`2026-10-05-moves-capture-strip-host-total`

## Status

`candidate`

## Plain-English Summary

The redesigned capture flow shows a strip of the six phases, each reading
"N of M answered". A recent fix made the M — how many questions that phase
actually asks — depend on the Move's confirmed solution route, because one phase
(P3 Design) asks a narrower set of questions for a technical-product route and a
wider set for a limited process change. That fix lives in a small pure helper
with its own tests.

What had no test was the wiring: whether the component that draws the strip
actually hands the route to that helper. It is the easiest thing in the slice to
lose, because the helper takes the route as an *optional* argument — drop it and
the code still compiles, the strip still draws all six rows, and the only
symptom is that one row quietly states the wrong number of questions. A row can
then read "6 of 7", which can never complete, or "8 of 7", which is impossible.

This change adds five cases to the component's existing test suite that render
the real component and read the figure off the real P3 row: once with no
confirmed route, once with a technical-product route, once with a limited
process change, plus a case asserting the figure survives purely from the
hydration prop and a guard case asserting the three question sets genuinely
differ in size — without which the others could pass against a component that
ignored the route entirely.

No product file changes. No behaviour changes. This closes a gap this
workstream's own previous records named as still open: "the host's own call site
(flag/route → join inputs) remains untested".

## Layer Impact

Lane: `experimental` — the only code this exercises is reachable behind a
non-default feature flag, and this change adds no product code at all.

Layer 4 (Products · Moves), test scope only. No change to layer 1 intake, layer
2 adapters, or layer 3 canonical model. No schema change, no migration, no new
persisted field, no API route touched, no metric or fact value computed or
displayed. One test file is modified; no product file is modified.

## Client Applicability

Not applicable — no client receives anything. The change is confined to a test
file, so no tenant's rendering, data, or enrollment is affected. The capability
the tests exercise is gated on the existing `moves_capture_v2`
(`policy: "tenant"`), whose tenant list is non-empty — one synthetic demo tenant
enrolled for signed-in review — and that enrollment is unchanged by this slice.

No new feature flag was introduced, so the shared flag-declaration seat is
untouched.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — one new nested describe, five cases:
  1. **The three P3 question sets really do differ in size.** A precondition,
     not a behaviour: if the default, technical-product, and limited-process
     sets were the same size, every case below would pass against a host that
     dropped the route. Asserted against the capture contract itself rather
     than against hard-coded numbers, so a future change to any set keeps the
     cases meaningful instead of silently making them vacuous.
  2. **No confirmed route → the P3 row states the default total.**
  3. **A confirmed technical-product route → the row states the narrower
     total**, and explicitly *not* the default total, which is the figure a host
     that dropped the route would print.
  4. **A confirmed limited process change → the row states the wider total.**
     This case needs the whole route object to reach the contract, not just its
     `route` field: the wider set is selected by the workflow-change and
     role-accountability fields both being non-material.
  5. **The route is read back from the hydration prop.** That prop has been
     dropped from this component once before, and the loss is invisible to an
     assertion that the strip renders — every row still appears, one row just
     states the wrong total.

No product file is included in this change. No test registration artifact
changes either: the suite already exists and is already listed by exact path in
the required check, so neither
`.github/workflows/ai-surface-control-catalog.yml` nor
`docs/architecture/test-ci-coverage-census.json` needed an edit.

## Design Authority

No new surface, no new copy, no token or layout change — nothing for design to
authorize. The figures asserted are the ones the already-approved strip renders.

## QA / Validation

- `jest` (the five new cases) — **PASS**: 5/5.
- Whole `src/components/strategic-moves/__tests__` directory — **PASS**: 31
  suites / 369 tests. Run in full rather than as the single suite because the
  cases render the shared host component, and the siblings' suites that render
  through the same component are the evidence that the new cases' fixtures did
  not disturb them.
- Mutation check — **PASS** (both mutations killed, and each killed *only* by
  the new cases):
  - Dropping the route argument at the host call site (the exact defect these
    cases exist to catch) failed 3 of the 5 new cases.
  - Dropping the hydration seed, so the component starts with no route instead
    of the prop's value, failed 3 cases. Run against the **whole** suite, not
    just the new describe: 145 tests, and the only 3 failures were the new
    ones. That is the direct measurement of the gap this slice closes — before
    it, ~140 cases rendered this component and none of them noticed the route
    being lost.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0, whole project.
  Judged on the exit code, not on absence of output.
- `eslint` on the changed file — **PASS**: 0 errors, 0 warnings.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: all 11
  gates.
- Suite registration — **NOT RUN / not applicable**: the suite is pre-existing
  and already registered by exact path, so there is no census delta to prove.
  Verified by checking the catalog workflow already lists the path, rather than
  by regenerating the census.
- Signed-in visual walk — **NOT RUN**: this change adds no product code and
  alters nothing a signed-in user can see, so there is nothing to walk. Nothing
  here is claimed live-proven.
- Phone-width layout — **NOT RUN**: jsdom does not lay out, and this change adds
  no element.

## Rollout Plan

Merge to `main` via squash. There is nothing to enable or stage: no product code
ships and no tenant's enrollment changes. The new cases begin gating merges as
soon as they land, through the required check that already lists this suite.
Ships only through the repo-owned `aca-main-deploy` workflow on merge.

## Rollback Plan

Revert the squash commit. The change is one test file, persists nothing and
introduces no flag, so the revert is self-contained and restores the suite
exactly. Reverting removes protection; it cannot break a runtime.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab web traffic,
mutates no revision weights, and touches no Container App template, env var, or
secret.

## Known Gaps

- The strip's **answered** count (the N) has its own host wiring, and that is
  not pinned here. A separate open change re-attributes it from the Move's
  progress phase to the phase on screen; pinning it at the host has to wait for
  that change, because asserting the corrected attribution today would assert a
  behaviour `main` does not yet have.
- One further route-blind read of the capture contract remains, in the finder's
  initial-section selection. It is benign today because all three P3 variants
  begin with the same first section, and it was deliberately recorded as such
  rather than fixed. These cases do not cover it; it becomes a defect only if a
  variant reorders its first section.
- Phases other than P3 have no route dimension to pin, so the cases exercise
  exactly one row. If a second phase ever becomes route-dependent, the guard
  case will still pass while covering less than it appears to.
- Nothing flag-gated in this surface has been measured at phone width.

## Audit Evidence

- Branch: `feat/moves-capture-strip-host-total`.
- The gap this closes is quantified, not asserted: the hydration mutation was
  run against the whole 145-test suite and only the new cases failed.
- Each mutation's failure count recorded above.
- The precondition case is what keeps the others from being vacuous, and it
  reads the contract rather than hard-coded totals.
