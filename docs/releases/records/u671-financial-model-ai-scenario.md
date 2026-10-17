# u671 — The AI-assisted scenario in the P4 financial model

## Release ID

`2026-10-17-moves-financial-model-ai-scenario`

## Status

`candidate`

## Plain-English Summary

The P4 financial model (u664) models the case on the approved estimate. When the estimate carries an approved AI-assisted scenario, the value case already evaluates the same value at the scenario's build cost (u661). This release adds that comparison to the workbook, as live formulas:

- **Inputs:** the scenario's investment at low, base and high, selected by the same scenario switch and labelled "a comparison, not the funding basis".
- **Monthly Schedule:** one more row, the first month cash covers the scenario's investment.
- **Economics:** a separate "AI-assisted scenario (comparison only)" section. It shows the investment, an NPV computed on the same discounted value, the NPV against the funded case, and the payback month. The case stays funded on the estimate above it.
- **Check:** the engine's scenario NPV and payback at low, base and high, beside the workbook's.

The scenario is modelled only if the value case marks it as not the funding basis and evaluates it, and only if its value schedule is exactly the funded case's: same value, different build cost. Otherwise it is left out. Until u661 ships, the value-case read carries no scenario and the workbook is unchanged.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_value_engine_v1` flag.

- **Layer 4, products (financial-model workbook and route):** no schema, data or other route change.

## Client Applicability

- **All clients:** yes, where the Moves value engine is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_value_engine_v1` (existing).

## Changes Included

- `src/lib/programs/value-engine/financial-model-workbook.ts`: `aiScenario` input, its rows, section and checks; the builder refuses when the scenario's NPV or payback differs from the engine's.
- `src/app/api/v1/programs/[programId]/financial-model/route.ts`: passes the value case's `aiAssisted` result when it is evaluated and not the funding basis.
- Tests in the workbook and route suites.

## QA / Validation

- Workbook and route suites: pass, 19 / 19. `npm run typecheck`: pass (clean). ESLint: pass.
- **Independent recalculation:** a scenario workbook, with every cached result stripped, was recalculated from scratch in LibreOffice under Low, Base and High. Every run has 0 formula errors and 13 / 13 checks YES, the scenario's NPV and payback included.
- Mutation check: 6 hand mutants, all killed:
  - NPV on the funded cost;
  - payback on the funded cost;
  - the schedule check skipped;
  - a funding-basis scenario accepted;
  - the check rows dropped;
  - the scenario cost's selection order (killed after its formula was pinned).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. It takes effect for a Move once u661 is deployed and an estimate is approved with a confirmed scenario.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: on a Move with a scenario, the downloaded model's Check reads YES.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Sensitivity for the scenario is not shown.** Only its NPV and payback are modelled.

## Audit Evidence

- PR URL and CI run.
