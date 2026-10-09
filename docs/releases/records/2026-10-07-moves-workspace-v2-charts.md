# 2026-10-07-moves-workspace-v2-charts — Moves phase-workspace v2 OUTCOME charts (Increment 3)

## Release ID

`2026-10-07-moves-workspace-v2-charts`

## Status

`candidate`

## Plain-English Summary

Increment 3 of the Moves phase-workspace redesign, behind the same feature flag
that is OFF for everyone by default. With the flag off, the product renders
exactly as it does today.

Increment 2 made the OUTCOME step a findings surface for the two intelligence
phases. This increment adds the **charts / intelligence layer** beneath those
findings, on the same two phases — P2 Discover & Diagnose and P4 Roadmap &
Business Case:

- **P2 Discover — "Governed share by domain."** A horizontal bar per required
  evidence family, derived from this Move's real current-state readiness status
  (committed / in-review / staged / not-provided). It is a projection of the
  governed states the readiness report already computed — not a measured sample —
  and every bar names its real status.
- **P2 Discover — "Why the current state isn't trusted."** A root-cause Pareto
  with a cumulative line, counting this Move's real OPEN evidence gaps by
  root-cause category. The counts are real; committed families are excluded.
- **P4 Business case — "Delivery cost scenarios," a "Value bridge" and
  "Sensitivity."** Low–high range bars, a net-value waterfall, and a tornado.
  These have **no governed baseline** (the Finance baseline is the P4 input that
  is "Not supplied" until it lands), so every figure is a clearly labelled
  **illustrative placeholder**, never a tenant number and never a computed
  saving.

Each chart carries a provenance chip: a readiness/gap-derived chart shows a
neutral "Readiness-derived" / "Gap-derived" chip, and an illustrative chart
shows the amber "Illustrative" chip. Whenever any series on a phase is
illustrative, the honesty note is shown beneath the grid. No figure is presented
as a confirmed client measurement.

This is a presentation and derivation change only, additive to the OUTCOME
surface. It introduces no persistence, writes nothing, and — per AGENTS.md — the
charts CONSUME governed numbers and never calculate spend / value / ROI / risk:
Tower read models still own all values, Claude owns narrative, and where no
governed value exists the chart is labelled illustrative rather than inventing
one. With the flag off, the surface is byte-for-byte Increment 2.

## Layer Impact

Lane: `global-control-lane`.

- **Products (Moves):** the phase-workspace OUTCOME presentation layer only. No
  product owns data here and none is introduced — the P2 charts are a projection
  of the canonical readiness report (layer 3), and the P4 charts are static
  illustrative placeholders with no data source at all. No change to the
  canonical model, loaders, adapters, tenancy, or any gate/evidence/readiness
  logic. The charts read no tenant values and compute no metric.

## Client Applicability

- All clients: no — flag is OFF by default, so behaviour is unchanged.
- Specific clients: none enrolled in this change.
- Internal only: no.
- Public/demo only: intended for signed-in review enrolment later, per the flag.
- Feature flag: `moves_workspace_v2` (`tenant` policy, `includeTenants: []`,
  default OFF). Conjoined server-side with `moves_capture_v2`. Unchanged by this
  increment — it reuses the Increment 1/2 gate.

## Changes Included

- `src/lib/programs/moves-phase-charts.ts` — new pure read model. `buildPhaseCharts`
  returns the chart series for an intelligence phase (null otherwise): the P2
  governed-share and root-cause-Pareto series DERIVED from the readiness report's
  real per-family states and open gaps, and the P4 cost/value/sensitivity series
  as labelled illustrative placeholders. It emits semantic numbers only; it reads
  no tenant data and computes no spend/value/ROI/risk. Where no readiness report
  exists, P2 falls back to a clearly illustrative placeholder shape.
- `src/components/strategic-moves/MovesPhaseCharts.tsx` — new presentational
  surface drawing faithful inline SVG to scale from those numbers (horizontal
  bars, Pareto with cumulative line and 80% threshold, low–high range bars, a
  waterfall with connectors, and a tornado). Each chart carries a provenance chip
  and an accessible label naming the values it reaches; the honesty note renders
  when any series is illustrative. Theme-correct in the v2 locked-light tokens.
- `src/components/strategic-moves/MovesPhaseFindings.tsx` — adds an optional
  `charts` prop; when a non-pending charts model is passed, the OUTCOME step
  renders the charts beneath the findings. Absent the prop it renders exactly as
  Increment 2.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — builds the
  charts model from the same `currentStateReadiness` the findings model uses and
  passes it into the OUTCOME findings slot for intelligence phases.
- `.github/workflows/ai-surface-control-catalog.yml` — names
  `MovesPhaseCharts.test.tsx` in the Moves visible-controls step. That directory
  is not swept by a glob, so a new suite beside those controls would otherwise
  run in no job and the coverage census would count it as an untriaged unrun
  file.
- `docs/architecture/test-ci-coverage-census.json` — regenerated after naming the
  new suite in CI (`npm run audit:test-ci-coverage:write`).
- Tests: `moves-phase-charts.test.ts` (new, read model), `MovesPhaseCharts.test.tsx`
  (new, surface), plus charts-host cases added to `MovesPhaseFindings.test.tsx`.

## QA / Validation

- `npx jest src/components/strategic-moves src/lib/programs/__tests__/moves-phase-findings.test.ts src/lib/programs/__tests__/moves-phase-charts.test.ts src/lib/programs/__tests__/moves-workspace-v2-spine.test.ts`
  — 54 suites, 799 tests pass.
- `npx jest .../moves-phase-charts.test.ts` — 14 pass. `.../MovesPhaseCharts.test.tsx`
  — 6 pass. `.../MovesPhaseFindings.test.tsx` — 14 pass (incl. 3 new charts-host
  cases and an absent-prop control pinning the Increment 2 shape unchanged).
- `tsc --noEmit` — clean.
- `npx eslint` on all changed files — 0 errors (2 pre-existing unused-import
  warnings in `MovesPhaseStandaloneClient.tsx`, not introduced here).
- `npm run audit:test-ci-coverage:write` after naming the new suite in CI —
  covered test files 2638 -> 2642 (both new suites counted), uncovered FLAT at
  164, fully-covered directories unchanged at 439; census drift matches this run.
- `npm run release:check -- --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to `main` via squash after human review (auto-merge intentionally NOT
enabled). No runtime rollout is triggered by this change: the flag is OFF for
every tenant, so merging changes no client's behaviour. Enrolment for signed-in
review is a later, separate flag flip through the normal feature-flag path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none — this PR mutates no shared runtime.
- Approved image digest: n/a (no image/runtime change in this PR).
- ACA runtime invariant: unaffected (no deploy in this PR).
- Worker image invariant: unaffected.
- Feature/env flag update path: `moves_workspace_v2` stays OFF; any later
  enrolment goes through `includeTenants` / the approved env override, not this PR.
- Live signed-in proof required: not for this PR (flag OFF, no behaviour change);
  required before any future enrolment flip is called live-proven.

## Rollback Plan

Revert the PR, or leave the flag OFF (its default), which already disables every
behaviour in this change. No migration, data build, or runtime image is involved,
so there is no state to roll back.

## Audit Evidence

- PR URL: see the pull request opened for branch `feat/moves-v2-charts`.
- CI: the PR's checks on `main`.
- Test output: the jest / tsc / eslint / release:check results listed under
  QA / Validation.

## Known Gaps

- The P4 cost / value / sensitivity charts are illustrative placeholders by
  design: they carry no governed baseline until Finance supplies one, and are
  labelled as such. Wiring a supplied Finance baseline into a real P4 series is a
  later increment, gated on that governed input existing.
- The P2 governed-share bar maps a family's discrete readiness status to a
  readiness LEVEL for display; the real status word is shown on every bar so the
  level is never read as a standalone measured percentage.
- Chart interactivity (hover/tooltips) is out of scope; the SVGs are static and
  accessible-labelled.
