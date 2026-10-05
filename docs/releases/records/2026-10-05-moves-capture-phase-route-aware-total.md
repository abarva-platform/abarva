# 2026-10-05-moves-capture-phase-route-aware-total — Moves: the capture phase strip states each phase's own question total (flag-gated)

## Release ID

`2026-10-05-moves-capture-phase-route-aware-total`

## Status

`candidate`

## Plain-English Summary

The redesigned Moves capture flow shows a strip of the six phases, each row
reading "N of M answered". The M in that row — how many questions the phase
asks — was derived without the one input that changes it.

P3 Design is the only phase whose question set is not fixed. Once a Move's
solution route is confirmed, the capture surface asks a **narrower** set for a
technical-product route and a **wider** set for a limited process change. The
strip's row total ignored the route and always reported the default set's size,
so on a Move with a confirmed route the row described a question set the Move was
not being asked:

- on the narrower route, a person could answer **every** P3 question and the row
  would still sit short of its own total — a phase that can never read complete;
- on the wider route, answering them all produced **more answers than
  questions** — an impossible count of the same shape as the one fixed in the
  preceding increment, but from an unrelated cause;
- and for a P3 the Move had already passed, the row stated a total that was
  simply not the number of questions that Move had answered.

This change derives each row's total from the same inputs the capture surface
itself uses, so the figure describes the phase it names. Behaviour is otherwise
untouched: no phase other than P3 has a route-dependent question set, and a Move
with no confirmed route keeps the default total it has today.

The strip only renders inside the redesigned capture flow, which is itself
feature-flagged (`moves_capture_v2`); on the legacy canvas there is no such
figure. This is a correctness fix inside an already-flagged surface, so it
declares no new flag.

## Layer Impact

Lane: `experimental` — a correctness fix confined to a feature-flagged,
non-default capability (`moves_capture_v2`). No new flag is introduced. With the
flag off, the surface that renders this figure does not exist, so the change is
inert.

- `4 PRODUCTS` (Moves): the per-phase capture strip's stated total per row. No
  gate, no advance rule, no persistence and no API shape changes — the figure is
  derived at render time from facts already loaded.
- `3 CANONICAL MODEL`: unchanged. No schema, no migration, no stored value. The
  confirmed solution route and the phase capture contract are both read exactly
  as they already are.

## Client Applicability

- All clients: No.
- Specific clients, selected by feature flag: the capture flow renders only
  where `moves_capture_v2` is enabled; its tenant list is currently non-empty
  (one synthetic demo tenant used for signed-in review).
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_capture_v2` (tenant policy; no new flag added by this
  change).

## Changes Included

- `src/lib/programs/capture-phase-section-totals.ts` — **new**, pure.
  `capturePhaseSectionTotal(phase, confirmedSolutionRoute)` returns the size of
  the section set the capture surface will actually render for that phase, and
  `capturePhaseTotalDependsOnRoute` names whether omitting the route would
  misstate it. Both are thin by design: the decision worth pinning is _which
  inputs_ a stated total is allowed to be derived from.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the phase
  strip's per-row total now goes through that module with the Move's confirmed
  solution route, which the component already holds (it is a Move-level fact, so
  the same value is correct for every row regardless of which phase is on
  screen). One call site; the rest of the component is unchanged.
- `src/components/strategic-moves/__tests__/capture-phase-section-totals.test.ts`
  — **new**: the stated total equals the rendered set's size for every phase and
  every route; P3 narrows on a technical-product route and widens on a limited
  process change; a confirmed _material_ process change keeps the default total;
  every other phase is route-invariant; and the fully-answered viewed phase never
  exceeds its own total on any route.
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new suite by
  exact path, since `src/components/strategic-moves/__tests__` is not swept by
  directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `jest` (new suite `capture-phase-section-totals`) — **PASS**: 7/7.
- `jest` (whole `src/components/strategic-moves/__tests__` directory, the
  preservation evidence for a change inside that host component) — **PASS**:
  31 suites / 364 tests (re-run on the rebased base, which carries the sibling's
  host-join refactor of the same component).
- Mutation check of the new guards — **PASS**, both deliberate mutations died:
  dropping the route argument (i.e. restoring the defect) failed 5 of the 7
  cases; forcing `capturePhaseTotalDependsOnRoute` to `false` failed 1.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0, 0 type errors across
  the project.
- `eslint` on all changed files — **PASS**: 0 errors (3 pre-existing unused-symbol
  warnings in the host component, untouched by this change).
- `prettier --check` on all changed files — **PASS**.
- Test-CI registration proof — **PASS**: census `coveredTestFiles` 2524 → 2525
  with `uncoveredTestFiles` unchanged at 164, both counts regenerated on this
  change's own base rather than read from the committed file.
- Signed-in visual walk of this fix — **NOT RUN**: it needs the ACA deploy that
  carries this commit. Owed, and listed under Known Gaps.

## Rollout Plan

Merge to `main` via squash PR with auto-merge. Ships with the next ACA web image
through the repo-owned `aca-main-deploy` workflow. No flag change, no tenant
enrollment change and no data migration are part of this rollout. On tenants
where the capture flow is enabled, the strip's P3 row begins stating that Move's
own question total from the first render after deploy.

## Rollback Plan

Revert the PR — the figure returns to the route-blind derivation with no data to
unwind, since nothing is persisted. Alternatively, disabling `moves_capture_v2`
for a tenant removes the surface that renders the figure entirely. Both are
immediate and need no migration.

## Deployment Authority

No ad-hoc Azure action was taken or is required. Ships only via the repo-owned
`aca-main-deploy` workflow on merge to `main`. This change shifts no shared
Product/Lab web traffic, mutates no revision weights, changes no Container App
template, env var, scale rule or secret, and runs no data-build job.

## Known Gaps

- **No signed-in walk of this fix yet.** It requires the deploy carrying this
  commit. The defect class was found by a read-only signed-in walk, and the
  verification of the fix belongs on the same surface.
- The host component's own call site — the wiring that feeds the route and the
  phase list into this derivation — is still not covered by a component test;
  the decision is pinned, the wiring is not. That gap is shared with the
  preceding increments and is unchanged by this one.
- The audit that produced this fix covered the component's per-phase _capture_
  figures. One further route-blind read remains and is deliberately left: the
  initial finder section key also omits the route, but all three P3 variants
  share the same first section, so it selects the same key on every route and is
  not a defect today. It would become one if a variant ever reordered its first
  section.
- Nothing in this flag-gated surface has been measured at phone width; jsdom
  does not lay out.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR, plus the newly
  registered suite in the AI-surface control catalog job.
- The route-dependence of the P3 question set, and the agreement between a stated
  total and the set actually rendered, are covered by
  `src/components/strategic-moves/__tests__/capture-phase-section-totals.test.ts`.
- Registration of that suite is evidenced by the census delta recorded above.
