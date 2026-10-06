# 2026-10-05-moves-phase-rollup-host-callsite — Moves: pin the phase-strip saved-count host call site (test-only)

## Release ID

`2026-10-05-moves-phase-rollup-host-callsite`

## Status

`candidate`

## Plain-English Summary

The redesigned phase capture draws a strip of all six phases, but the screen
holds live answers for exactly one of them — the phase on screen. The other five
rows therefore state a bare question count. A recent increment let those five
rows say how many of the phase's questions hold a **saved answer**, from capture
rows the route already loads for the whole Move.

That capability is made of three parts: a derivation that counts saved answers
per phase, the row rendering that prints the figure under its own word, and the
wiring in the phase workspace component that hands the derivation's output to
the strip. The first two have their own suites. The third did not — so the one
thing nothing checked was whether the counts reach the strip, land on the right
rows, and stay apart from the stronger figure beside them.

This change adds no product behaviour. It adds six cases to the phase workspace
component's existing suite that pin that wiring:

- an unmeasured row states the count the component was handed, under the word
  "saved" and never under "answered";
- two different phases' counts land on their **own** rows — not one figure
  repeated across the strip;
- a phase the rollup says nothing about keeps its bare question count (the
  vacuity guard for the case above);
- the row the screen **can** measure keeps its measured figure even when the
  rollup also names that phase, and shows no saved figure at all;
- with no rollup supplied — the default, and what every tenant sees today — no
  row anywhere in the strip claims a saved count;
- a fully saved but unmeasured row still earns **no completion tick**;
- and the saved figure is stated against the same route-aware question total as
  the row itself, on the one phase whose question set depends on the Move's
  confirmed route.

The last two are the ones most worth having. A tick is a claim that a phase is
finished, and saved answers are weaker than measured ones — a saved answer is
only a persisted non-empty value, while the measured count additionally requires
structured validity, evidence readiness and, on Charter, a satisfied basis. A
strip that ticked a row on saved work would report work nobody finished, which is
the same over-claim an earlier increment removed, arriving from the other
direction. And a figure derived against the route-aware question set but printed
against the default total would state a pair that disagrees about which
questions the phase even asks.

## Layer Impact

Lane: `experimental` — test-only cover for an existing feature-flagged,
non-default capability. No product file changes, so the live product is
unchanged on every code path regardless of flag state.

- `4 PRODUCTS` (Moves): **no change**. One existing test file gains cases. No
  component, route, API, flag registry or generated artifact is touched.
- `3 CANONICAL MODEL`: no change. No schema, no migration, no stored shape.

## Client Applicability

- All clients: No — nothing ships to any surface.
- Specific clients, selected by feature flag: the capability these cases cover
  is gated by `moves_capture_phase_rollup_v1` (tenant policy, empty enrolled
  list — it renders for nobody today) and requires the redesigned capture flow.
  This change alters neither flag nor either list.
- Internal only: No.
- Public/demo only: No.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — six cases pinning the saved-count host call site: that the rollup reaches
  the strip, its per-phase attribution, the untouched row the rollup omits, the
  measured row's precedence over a rollup figure naming it, the flag-off
  default, the no-tick invariant, and the route-aware total the figure is
  stated against.

No other file is modified. The suite is already registered by exact path in
`.github/workflows/ai-surface-control-catalog.yml`, so neither the catalog nor
the CI coverage census changes, and no feature-flag registry edit means no
regenerated product manual.

## QA / Validation

- `jest` (the six new cases) — **PASS**: 6/6.
- `jest` (`src/components/strategic-moves/__tests__`, the whole directory) —
  **PASS**: 36 suites / 492 tests. The whole directory rather than the one
  suite, because the cases render through a component sibling suites also
  render through.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, no type errors.
- `eslint` on the changed file — **PASS**: 0 problems.
- Mutation check of the wiring these cases claim to guard — **PASS**: four
  mutations of the call site, four deaths (3, 2, 1 and 2 of the six cases red
  respectively). Dropping the rollup from the call site killed the attribution,
  no-tick and route-aware cases; broadcasting one phase's figure across every
  row killed the omitted-row and attribution cases; dropping the route from the
  row's total killed the route-aware case; and substituting the Move's progress
  for the phase on screen killed the measured-row-precedence case. Each
  mutation was reverted and the suite re-run clean at 6/6.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: 11 of
  11 gates.
- Visual signed-in walk — **NOT RUN**, and not applicable: this change ships no
  renderable difference, and the capability itself renders for no tenant.

## Rollout Plan

Merge to `main` via squash PR. Nothing to roll out — no product code changes, so
the merged commit is inert at runtime. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow like any other commit.

## Rollback Plan

Revert the PR. Because the change is confined to one test file, reverting
removes test cover and nothing else; no data migration, no flag change, no
runtime effect either way.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var or secret.

## Known Gaps

- The two conjuncts the row rendering carries for legibility — `measured &&`
  on the tick and `!measured &&` on the saved figure — are redundant by
  construction and remain unguarded by design; the increment that added them
  recorded the same thing. No test can distinguish their removal, so these
  cases do not pretend to.
- The derivation clamps a saved count to the row's own total. These cases
  exercise the clamp only indirectly, through the route-aware case; the clamp
  itself is covered where it lives.
- The capability renders for no tenant, so no signed-in walk is claimable for
  it. Enabling a first tenant is the gate on that walk, not a step in this
  increment.
- Nothing in this capability has been measured at phone width — jsdom does not
  lay out, so no test in this suite can establish it.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The derivation these cases feed is covered by
  `src/lib/programs/__tests__/capture-phase-saved-answers.test.ts` and
  `src/lib/programs/__tests__/capture-phase-progress.test.ts`; the row
  rendering by `MovesCaptureFlow.test.tsx`. This increment closes the join
  between them.
