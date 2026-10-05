# 2026-10-04-moves-p0-capture-mount — Moves: P0 Originate on the 3-step capture flow (flag OFF)

## Release ID

`2026-10-04-moves-p0-capture-mount`

## Status

`candidate`

## Plain-English Summary

The redesigned Moves phase capture — one repeatable three-step flow per phase —
was described as covering the whole journey, and its step grouping really does:
the shared step-group contract defines three steps for **all six** phases, and a
standing invariant test asserts that each phase's steps reference every one of
that phase's canonical inputs exactly once, P0 included.

But the flow was only ever _mounted_ for phases 1–5. The mount condition read
`phase >= 1 && phase <= 5`, so P0 Originate fell through to the legacy
finder-columns canvas. The effect was that the first screen a person meets on a
new Move — the one that decides whether a business bet becomes a governed Move
at all — was the only phase still on the old presentation, while its eleven
inputs sat already grouped into **Why now / The bet / Readiness**, unused.

This increment mounts the existing flow for P0. It is a mount change, not a new
capture surface: P0's eleven canonical sections and keys, their help text, their
structured editors, their saves, and its authorization and evidence gates are
all the ones already in force.

One thing did need building. The legacy canvas renders P0's gate button through
`StepHeaderActionPortal`, whose target element (`#mxw-step-progress-action`) does
not exist in the capture flow — which is why the flow takes its submit control as
an inline slot instead. For phases 1–5 that slot holds the phase's
`PhaseApproveAndBuild`. P0 has no deliverable build; its gate is approval of the
origination brief. So the slot gains a P0 arm that renders P0's own gate control
inline, driving the **same** action (`approveP0Gate`) behind the **same** two
conditions the legacy canvas applies:

- the signed-in user must be an authorized approver, and
- no required P0 evidence item may still be open.

That second condition is read from the value the component already computes for
this exact purpose, so the capture flow and the legacy canvas cannot disagree
about whether P0 may advance. **P0 still cannot advance on intake answers
alone** — an unsatisfied evidence requirement renders a refusal in place of the
button, not a disabled-looking button that might be mistaken for a near-miss.

Everything is behind a new flag, `moves_capture_p0_v1`, **off for every tenant**,
and it is deliberately _separate_ from `moves_capture_v2`: a tenant already on
the redesigned phases 1–5 must not have its P0 screen change without its own
review. Both flags must resolve on for anything here to render.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_capture_p0_v1`, off for all tenants).

- `4 PRODUCTS` (Moves): the phase workspace's mount condition for
  `MovesCaptureWorkspace` widens to include phase 0 when both flags resolve on,
  and the capture flow's approve slot gains a P0 arm. A `data-capture-p0`
  attribute is added beside the existing `data-capture-v2` so the state is
  observable from server HTML during a signed-in walk.
- `3 CANONICAL MODEL`: unchanged. No new field, table, key, or persisted shape.
  P0's capture sections, its step grouping, and its gate action all already
  exist; this release adds no writer and changes no read path.
- `1 CLIENT INTAKE` / `2 SOURCE ADAPTERS`: unchanged.

Two incidental repository fixes are included, both mechanical:

- **The committed test-CI coverage census is refreshed.** It went stale on `main`
  when a recently merged change added a test file without regenerating it, which
  reds the census gate for every PR branched afterwards. The refresh is three
  count lines and no policy change.
- **The generated Nexus manual is added to `.prettierignore`.** Its format is
  owned by `scripts/docs/build-nexus-manual.ts`, and the nexus-manual-spine
  release gate byte-compares the committed file against that generator's output.
  Prettier pads markdown tables, which the generator does not, so the pre-commit
  formatter rewrote the regenerated manual and the generator's own `--check` then
  failed. Any change that touches the feature-flag registry regenerates this
  file, so the conflict would recur on every one. The generated census JSON is
  already exempt for exactly this reason; this puts the manual on the same
  footing and leaves the generator authoritative. No gate is weakened: the spine
  gate still byte-compares, and it now has a file prettier will not rewrite
  underneath it.

## Client Applicability

No client receives this change: it is gated by the `moves_capture_p0_v1`
feature flag, which has `includeTenants: []`,
so P0 renders the legacy canvas for every tenant exactly as it does today. The
demo tenant that has `moves_capture_v2` and `moves_home_v2` enabled is
explicitly _not_ enabled on this flag, so its P0 screen is unchanged by this
merge.

## Changes Included

- `src/lib/features/registry.ts`: registers `moves_capture_p0_v1`
  (`policy: "tenant"`, `includeTenants: []`).
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`:
  resolves the flag server-side and passes it to the client.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: the
  `captureP0Enabled` prop; a `captureP0Active` predicate requiring both flags and
  phase 0; the widened mount condition; the P0 arm of the approve slot with its
  own confirmation state; the `data-capture-p0` attribute.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`:
  eight cases (below).
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md`: regenerated for the new
  flag (`npm run docs:nexus-manual`).
- `docs/architecture/test-ci-coverage-census.json`: refreshed, and
  `.prettierignore`: exempts the generated manual (both: see Layer Impact).

No new test file: the cases were added to the existing suite, which is already
registered by exact path in `.github/workflows/ai-surface-control-catalog.yml`,
so no catalog change was required.

## QA / Validation

- `jest` (`MovesPhaseStandaloneClient`) — **PASS**: 136/136, including the eight
  new cases.
- **Mutation-checked, four independent mutations, each breaking exactly one
  test**: dropping the `captureP0Enabled` conjunct; dropping the
  `captureV2Enabled` conjunct; dropping the required-evidence gate; dropping the
  authorization check. Each conjunct is pinned with the others satisfied, so a
  single removed condition cannot pass unnoticed. The restore is green.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0.
- `eslint` on every changed file — **PASS**: 0 errors (3 pre-existing warnings in
  the touched component, none introduced here).
- `npm run audit:test-ci-coverage` — **PASS** after the refresh: "committed
  census matches this run".
- `npx tsx scripts/docs/build-nexus-manual.ts --check` — **PASS**: "Nexus manual
  is current", with the prettier exemption in place. **Verified the failure it
  fixes**: with the manual formatter-rewritten, this check fails; with the
  generator's own output committed, it passes.
- `npm run release:check --base origin/main --head HEAD` — **PASS**.
- Signed-in visual walk — **NOT RUN**: the flag is off for every tenant, so P0
  renders the legacy canvas everywhere and there is no surface to walk. Owed
  before any tenant is enabled — see Known Gaps.

## Rollout Plan

Merge to `main` via squash PR. Both flags off ⇒ no runtime behaviour change on
merge. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. Enabling a tenant is a separate controlled change, and must enable
`moves_capture_p0_v1` _in addition to_ `moves_capture_v2`.

## Rollback Plan

Revert the PR, or leave `includeTenants: []` (already the state). Either returns
P0 to the legacy finder-columns canvas for every tenant. No data migration: this
release persists no new shape and changes no stored value, so there is nothing to
unwind.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab web traffic,
mutates no revision weights, and touches no Container App template, env var, or
secret. With the flag off for all tenants the merged code is inert at runtime
until a separate controlled change enables a tenant.

## Known Gaps

- **No signed-in proof, and none is claimable.** With the flag off for every
  tenant, P0 renders the legacy canvas everywhere, so this record claims
  `merged`, not `live-proven`. A signed-in walk of a P0 Originate — all three
  steps, a save surviving reload, and the gate control appearing only when an
  approved P0 source file exists — is owed as the gate on enabling the first
  tenant. `data-capture-p0` is on the root element so that walk can read the
  state from the server HTML rather than inferring it.
- **The P0 hand-off does not generate the origination brief.** The flow's
  submit is gate approval, matching the legacy canvas. Wiring P0's hand-off to
  brief generation is not attempted here.
- **The legacy P0 gate-criteria section does not render under the flag.** It is
  part of the component the capture flow replaces, so an enabled P0 shows the
  refusal note rather than the itemised criteria list. Carrying a criteria
  summary into the hand-off step is a follow-up, and is the main thing to look
  at during the owed walk.
- No change to P0's evidence requirements, authorization model, or stored phase
  state.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  pins: the legacy canvas with both flags off; the legacy canvas with each flag
  on alone (both directions); the flow with both on, opening on P0's own first
  step and not a phase-1 heading; the inline gate control once required evidence
  is covered; its refusal while a required item is open; its absence for an
  unauthorized user; and that the P0 flag alone changes nothing on phases 1–5.
