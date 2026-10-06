# 2026-10-04-moves-p1-charter-basis-ui — Moves: per-field charter basis control (flag OFF)

## Release ID

`2026-10-04-moves-p1-charter-basis-ui`

## Status

`candidate`

## Plain-English Summary

The P1 Charter minimum-viable-evidence gate landed its mechanism first: the
advance check, the API persistence of a recorded basis, and the data model. It
deliberately shipped with no way for a person to *declare* a basis, and its own
record named that as the gap — a tenant enabled on the gate with no control
would have been blocked rather than unblocked.

This increment is the visible half: each P1 Charter field now carries a
**"How do you know this?"** control directly under its answer, offering the
three bases the gate already understands —

- **Backed by evidence** — bound to a named approved source in this workspace.
  Offered only when there *is* one; otherwise it is disabled with a note saying
  an assertion or an owned assumption is enough to move on.
- **I'm asserting this** — the signed-in workspace user is stating it. One
  click, no upload.
- **It's an assumption** — stated with an **owner** and **how Discover
  validates it**. Both are required before anything is recorded.

The rule the control exists to enforce is that an assumption is never dressed up
as evidence. Choosing it turns the whole control amber, puts an
**"Assumption · validate in Discover"** badge beside the question itself, and
describes the field in words that say it completes the charter *without*
becoming established fact. No copy anywhere in the control says a field is
"evidence covered" unless approved evidence actually backs it.

Everything is behind `moves_charter_basis_v1`, **off for every tenant**. With
the flag off, the capture flow's two new slots receive nothing and each question
renders exactly as it does today — same label, same helper, same input, same
spacing.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_basis_v1`, off for all tenants).

- `4 PRODUCTS` (Moves): the 3-step capture flow (`MovesCaptureFlow`) gains two
  optional presentation slots — a per-field affordance rendered below the input,
  and a badge rendered beside the label. Both default to absent. The phase
  workspace fills them only for P1 Charter fields in an evidence family, and
  only when the flag resolves on for the tenant.
- `3 CANONICAL MODEL`: unchanged. No new field, table, or key. The control
  writes through the existing `p1BasisBySection` body field on the phase-capture
  route and reads the already-computed per-section basis the phase page resolves
  server-side. Nothing new is persisted by this increment.
- `1 CLIENT INTAKE` / `2 SOURCE ADAPTERS`: unchanged.

## Client Applicability

No client receives this change: it is gated by the `moves_charter_basis_v1`
feature flag, which has `includeTenants: []`, so the
control does not render for any tenant and the legacy P1 approved-evidence lock
remains in force everywhere. The demo tenant that has `moves_capture_v2` and
`moves_home_v2` enabled is explicitly *not* enabled on this flag.

## Changes Included

- `src/components/strategic-moves/CharterBasisField.tsx` (new): the per-field
  basis control, the assumption badge, and the `isCharterAssumption` predicate
  that keeps the badge and the control from drifting apart. Presentational — the
  host owns the value, the save, and the flag gate. Design-locked tokens only
  (cream `#f5f1eb`, surface `#fff`, ink `#2c2c2a`, amber `#ba7517`; Inter /
  JetBrains Mono), built from the approved design canvas.
- `src/components/strategic-moves/MovesCaptureFlow.tsx`: two optional slots
  (`renderSectionBasis`, `renderSectionBadge`) and a label row that can hold a
  badge. Absent slots change nothing.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: the
  `charterBasisEnabled` and `initialP1CharterBasisBySection` props, the basis
  state, and the save that posts `p1BasisBySection` to the phase-capture route
  and adopts the server's returned basis map and revision. A half-filled
  assumption (missing owner or validation plan) is held in local state and not
  sent, so the route is never asked to reject one.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`:
  resolves the flag with the same tenant gate the route applies, and passes the
  per-section basis map it already computed but previously dropped.
- `.github/workflows/ai-surface-control-catalog.yml` +
  `docs/architecture/test-ci-coverage-census.json`: the new suite registered by
  exact path and the census refreshed.

## QA / Validation

- `jest` (`CharterBasisField`, `MovesCaptureFlow`, `MovesCaptureWorkspace`,
  `p1-charter-evidence`) — **PASS**: 26/26. Includes the flag-off case asserting
  that with no slots supplied there is no basis radiogroup and no badge, and
  that an assumption's note never reads as evidence.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0, no diagnostics.
- `eslint` on every changed file — **PASS**: 0 errors.
- `npm run release:check --base origin/main --head HEAD` — **PASS**.
- Signed-in visual walk — **NOT RUN**: the flag is off for every tenant, so
  there is no tenant on which this control renders, and nothing to walk. Owed
  before any tenant is enabled — see Known Gaps.

## Rollout Plan

Merge to `main` via squash PR. The flag is off for all tenants, so there is no
runtime behaviour change on merge. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. Enabling a tenant is a separate
controlled change and must be preceded by the signed-in walk below.

## Rollback Plan

Revert the PR, or leave `includeTenants: []` (already the state). Either returns
every tenant to a capture flow with no basis control and the legacy
approved-evidence lock. No data migration: this increment persists no new shape,
and any basis already recorded by the gate increment is simply not rendered.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab web traffic,
mutates no revision weights, and touches no Container App template, env var, or
secret. With the flag off for all tenants the merged code is inert at runtime
until a separate controlled change enables a tenant.

## Known Gaps

- **No signed-in proof, and none is claimable.** With the flag off for every
  tenant the control renders nowhere, so this record claims `merged`, not
  `live-proven`. A signed-in walk of a P1 Charter — choose each of the three
  bases, reload, confirm the choice survives and the amber badge is on the right
  question — is owed as the gate on enabling the first tenant.
- **Editing an answer clears its basis.** That is the route's existing
  behaviour, and it is correct: a changed answer is no longer the thing the
  basis was recorded against. The control re-prompts, but does not yet *say*
  why it went blank. Worth a one-line explanation in a follow-up.
- **No charter-level rollup.** A reviewer can see each field's basis, but there
  is no "4 of 7 asserted, 2 assumptions open" summary on the hand-off screen or
  in the gate dialog. The gate itself is unaffected.
- The deferred capture polish (paste-client-notes → governed fill-from-notes in
  the dock; suppressing the duplicate stage head) remains out of scope here.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- `src/components/strategic-moves/__tests__/CharterBasisField.test.tsx` pins the
  three bases, the assumption's required owner and validation plan, the
  never-called-evidence wording, the disabled evidence option when nothing is
  approved, and the flag-off no-render case.
