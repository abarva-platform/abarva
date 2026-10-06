# 2026-10-05-moves-charter-basis-host-join — Moves: the charter-basis host join becomes testable (behaviour-preserving)

## Release ID

`2026-10-05-moves-charter-basis-host-join`

## Status

`candidate`

## Plain-English Summary

The per-field charter basis family — the control that asks "how do you know
this?", the amber assumption badge, the hand-off read-back, and the gate
dialog's disclosure — is now five merged slices deep. Every *rendering* half of
it is pinned by a suite, and the gate's own fold of the counts has its own.

One part had nothing: the join that decides whether any of it is reached at all.

Three guards sit between the flag and the first pixel. The surface exists only
on P1, because the gate a basis is declared *for* exists for P1 alone — a basis
recorded anywhere else would be recorded against no gate. Within P1 it exists
only on the capture sections that declare a charter evidence family, because
those are the sections the gate reads. And the charter-level fold has to
distinguish "there is no basis surface here" from "the fold found nothing",
because the first must render nothing and the second would render a rollup
saying zero of zero.

All three lived inline in the phase workspace component, which is 9,600 lines
and has no suite. So the guards that keep this capability *off* were the one
part of it that nothing could fail.

This increment moves those three decisions into a pure module and has the
component call it. No behaviour changes: the same conjunction, the same section
filter, the same null. What changes is that each guard can now be removed and
have a test notice — which is what was checked, by removing each one in turn.

## Layer Impact

Lane: `experimental` — every code path this touches is governed by a
non-default, flag-gated capability; nothing outside that flag's reach changes.

Layer 4 (Products · Moves) only, and within it only the derivation of
presentation state. No change to layer 1 intake, layer 2 adapters, or layer 3
canonical model. No schema change, no migration, no new persisted field, no API
route touched. No metric, fact, or read-model value is computed or displayed.
The gate itself (`src/lib/programs/p1-charter-evidence.ts`) is not read or
modified by this change.

## Client Applicability

Behaviour-preserving for every tenant, enrolled or not. The capability this
touches is gated on the existing `moves_charter_basis_v1`
(`policy: "tenant"`), whose tenant list is non-empty as of the capture
enablement change — one synthetic demo tenant. For that tenant the surface
renders exactly as it did before this change; for every other tenant it
continues to render nothing.

No new feature flag was introduced and no flag's enrollment changed. The slice
extracts an existing flagged capability's own guards, so it does not touch the
shared flag-declaration seat.

## Changes Included

- `src/lib/programs/charter-basis-host-join.ts` (new) — the four join decisions
  as pure functions: `charterBasisSurfaceActive` (flag ∧ P1),
  `charterBasisSectionKeys` (the charter-family section filter),
  `charterBasisSurfaceForSection` (the one predicate all three per-section
  surfaces share, so they cannot drift into disagreeing about scope), and
  `charterBasisRollupSections` (the fold's rows, or `null` when there is no
  surface). No React, no flag lookup, no fetch — the caller resolves the flag;
  this module only says what follows from it.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — calls the
  module at all five sites that previously inlined these decisions. The three
  per-section guards now go through one shared predicate instead of three
  copies of a set lookup. Net effect on rendered output: none.
- Tests: `charter-basis-host-join.test.ts` (11).
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite registered
  by exact path; census refreshed.

## Design Authority

No design change and no new surface. The approved design canvas
(`Charter Evidence Basis`) and its tokens are untouched — this slice renders
nothing new, so there was nothing to design. Design-locked tokens remain as
shipped: cream `#f5f1eb`, surface `#fff`, ink `#2c2c2a`, teal `#1d9e75`, amber
`#ba7517`; Fraunces / Inter / JetBrains Mono.

## QA / Validation

- `jest` on the seven Moves capture/charter suites — **PASS**: 7 suites, 70
  tests, including the 11 new ones. No existing suite changed behaviour, which
  is the behaviour-preservation evidence: the rendering suites assert against
  the same output as before.
- `tsc -p tsconfig.json --noEmit` — **PASS** (exit 0). Judged by exit code.
- `eslint` on the three changed files — **PASS**, 0 errors. Three
  `no-unused-vars` warnings in `MovesPhaseStandaloneClient.tsx` are unrelated to
  this change and pre-date it (`MovesCaptureFlow`, `PHASE_CANONICAL_KEYS`,
  `_phase`).
- **Mutation-checked**, four mutations, one per guard, each run against the full
  new suite and reverted after:
  - dropping the P1 conjunct, so the surface activates on any phase with the
    flag on — **caught** (1 failure).
  - dropping the inactive-surface early return, so section keys resolve with the
    flag off — **caught** (1 failure).
  - returning an empty fold instead of `null` when there is no surface —
    **caught** (1 failure).
  - making the per-section predicate always admit — **caught** (2 failures,
    one per side of that predicate's pair).
  The suite returns to 11/11 with each mutation reverted, so each failure is the
  assertion biting rather than collateral breakage. Both conjuncts of the
  activation guard are pinned with the *other* conjunct satisfied, so a
  one-sided guard cannot pass.
- **Suite registration proven by census delta**, not by grep: `coveredTestFiles`
  2523 → 2524 with `uncoveredTestFiles` unchanged at 164.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**, all
  gates.
- **Signed-in live walk: NOT RUN.** See Known Gaps.
- **Phone-width layout: NOT RUN.** jsdom does not lay out, and this slice
  renders nothing new.

## Rollout Plan

Merge to `main` via squash. Because the slice is behaviour-preserving, there is
no staged enablement to plan: the enrolled synthetic tenant sees what it saw
before and no tenant's enrollment changes. Ships only through the repo-owned
`aca-main-deploy` workflow on merge.

## Rollback Plan

Revert the squash commit. The slice adds one module and rewrites five call sites
in one component; it persists nothing, migrates nothing, and introduces no flag,
so the revert is self-contained and restores the inline decisions byte-for-byte.
The flag lever still exists independently — returning
`moves_charter_basis_v1` to no tenants removes the whole surface without a
deploy — but it is not the rollback for this change, since this change is not
what makes the surface render.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab web traffic,
mutates no revision weights, and touches no Container App template, env var, or
secret.

## Known Gaps

- **No signed-in proof.** This record does not claim `live-proven`. A walk of
  the charter-basis family is now claimable against the enrolled synthetic
  tenant and is owed for the family as a whole, but it is the gate on that
  family's enablement rather than a step in a behaviour-preserving extraction —
  there is no new behaviour for a walk to confirm here.
- **The component's own call sites remain untested.** The decisions are now
  pinned; the wiring that feeds them the flag and the section list is still
  inside a 9,600-line component with no suite. Extracting the join narrows that
  gap without closing it, and the honest statement is that a mis-wired call
  site would still pass every test here.
- **The per-section predicate is thin by construction.** It is a set lookup;
  its value is that three surfaces share one, not that the lookup is subtle. A
  future surface added without going through it would reintroduce the drift the
  shared predicate exists to prevent, and nothing mechanically forces the next
  author through it.
- **An answer edited after its basis was declared still clears that basis**, and
  the charter-level fold then counts it as unrecorded. That is correct and is
  explained at the field by a separate in-flight slice; nothing in this one
  changes it.
- **Phone-width layout unmeasured** for the family as a whole, unchanged by this
  slice.

## Audit Evidence

- Branch: `feat/moves-charter-basis-host-join`.
- Behaviour preservation evidenced by the unchanged rendering suites passing
  against the rewritten host, not asserted in prose.
- Each of the four guards' mutation result recorded above with its failure
  count.
- Suite registration evidenced by the census count delta rather than by
  grepping the census for the filename, which returns nothing by design.
