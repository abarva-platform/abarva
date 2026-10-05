# 2026-10-05-moves-charter-basis-host-callsite — Moves: pin the charter-basis host call site (test-only)

## Release ID

`2026-10-05-moves-charter-basis-host-callsite`

## Status

`candidate`

## Plain-English Summary

The per-field "how do you know this?" charter basis surface is made of three
parts: a pure decision module that says when the surface exists, the components
that draw it, and the wiring in the phase workspace component that feeds the
decision its inputs. The first two have had test cover for several increments.
The third did not — so the one thing nothing checked was whether the workspace
hands the decision the *right* inputs.

This change adds no product behaviour. It adds six cases to the phase workspace
component's existing suite that pin that wiring:

- with the capability's flag off, the capture flow renders and carries no basis
  control at all;
- with it on, every charter question on the opening Charter step carries the
  control, offering all three bases;
- with it on but the redesigned capture flow off, the legacy canvas carries no
  control (the surface is only reachable through the flow);
- looking back at a completed Charter — the Charter screen of a Move that has
  already advanced — the control is still there;
- on a later phase's screen there is no control, because a basis belongs to the
  Charter gate and nothing else reads it;
- and a basis the Move already recorded is **read back** — an assumption shows
  as selected and is badged as an assumption; an assertion is not badged.

The last of those is the one most worth having. The prop that hydrates recorded
bases was dropped from this component once before, and that failure is invisible
at a glance: the control still appears, it just silently forgets every basis the
Move has recorded. Asserting the control *exists* would not have caught it;
asserting the recorded basis is read back does.

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
  is gated by `moves_charter_basis_v1` (tenant policy, non-empty list — one
  synthetic demo tenant). This change alters neither the flag nor its list.
- Internal only: No.
- Public/demo only: No.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — six cases pinning the charter-basis host call site: the flag conjunct, the
  capture-flow reachability conjunct, the phase number the join is given, and
  the hydration of recorded bases into the rendered control and its badge.

No other file is modified. The suite is already registered by exact path in
`.github/workflows/ai-surface-control-catalog.yml`, so neither the catalog nor
the CI coverage census changes.

## QA / Validation

- `jest` (the six new cases) — **PASS**: 6/6.
- `jest` (`src/components/strategic-moves/__tests__`, the whole directory) —
  **PASS**: 30 suites / 363 tests. The whole directory rather than the one
  suite, because the cases render through a component that sibling suites also
  render through.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, no type errors.
- `eslint` on the changed file — **PASS**: 0 problems.
- Mutation check of the three inputs the cases claim to guard — **PASS**: three
  mutations of the call site, three deaths. Substituting the Move's progress for
  the viewed phase killed the backward-look case; hard-coding the flag conjunct
  to true killed the flag-off case; dropping the hydration prop from the
  component's initial state killed the read-back case. Each mutation was
  reverted and the suite re-run clean.
- Visual signed-in walk — **NOT RUN**, and not applicable: this change ships no
  renderable difference. The capability itself was walked signed-in in an
  earlier increment.

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

- The phase-number conjunct in the join is **defence in depth, not the only
  guard**, and the cases say so inline. Only the Charter phase's capture
  sections declare a charter evidence family, so the section filter already
  blocks the surface on every other phase. That means substituting the Move's
  progress for the viewed phase is observable in one direction only — losing
  the surface on a backward look at a completed Charter — and only that
  direction can fail a test. Recorded rather than papered over; the forward case
  is still real regression cover for the surface being absent off the Charter.
- An insert from pasted notes still records a basis before the answer it belongs
  to is saved. Non-atomic by choice, carried forward from an earlier increment.
- Nothing in this capability has been measured at phone width — jsdom does not
  lay out, so no test in this suite can establish it.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The pure decision module these cases feed is covered by
  `src/lib/programs/__tests__/charter-basis-host-join.test.ts`; the components
  they render by `CharterBasisField.test.tsx`. This increment closes the join
  between them.
