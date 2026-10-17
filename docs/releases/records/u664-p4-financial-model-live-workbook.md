# u664 — P4 financial model as a live-formula workbook

## Release ID

`2026-10-17-moves-p4-financial-model`

## Status

`candidate`

## Plain-English Summary

P4's financial model existed only as a table pasted into Excel, with no formulas, so a finance reviewer could not test an assumption. P4 Step 3 now offers **Download financial model (.xlsx)** beside the value case. Every figure is a formula over the value engine's own inputs, written the way the engine computes it.

- **Inputs:**
  - every lever input term at low, base and high, in the order the engine multiplies them, with its source;
  - a Low / Base / High switch that selects all of them at once;
  - the investment used in each scenario (a low-value scenario uses the high cost), the discount rate and the horizon;
  - each lever's start month, ramp, payment lag and phase-down steps.
- **Levers:** each annual value is `ROUND(PRODUCT(inputs), 0)`. Program value uses the same product with the attribution term as 1. An overlap or release gate is one of the inputs, so excluded levers show their zero.
- **Monthly Schedule:** for each in-cash lever, the earned fraction (ramp × the latest phase-down step), credited and program value earned, and paid after the lag. Then totals, cumulative cash, discounted cash, and the month cash first covers the investment.
- **Economics:** annual cash, investment, discounted cash by year, NPV, payback month, and the four three-year bases (credited and program value, earned and paid) with ROI.
- **Sensitivity:** the engine's one-at-a-time results, shown as values and labelled as such.
- **Check:** the engine's figures for each scenario beside the workbook's for the chosen one: annual cash, NPV, payback, the four three-year totals and each lever. It reads YES when they agree.

**Read path.** The case is read through the value-case route itself, so P4's access rule, figure withholding, cost basis and refusals apply unchanged. A value-case refusal passes through with its own sentence. The download also refuses, each with its own sentence, when:
- figures are withheld;
- the case is blocked;
- the saved model can't be read;
- the saved model no longer reproduces the evaluated case. The builder recomputes every lever's curve and the case's cash, NPV and payback, and refuses on any difference.

The button appears only beside an evaluated case whose figures the viewer can see. Nothing is stored.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_value_engine_v1` flag.

- **Layer 4, products (P4 value step, new read-only route, new workbook module):** no schema, migration or data write. The generated `financial_model` document and its renderer are unchanged.

## Client Applicability

- **All clients:** yes, where the Moves value engine is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_value_engine_v1` (existing).

## Changes Included

- `src/lib/programs/value-engine/financial-model-workbook.ts`: the workbook and its consistency check.
- `src/lib/programs/value-engine/financial-model-refusals.ts`: every refusal with its sentence.
- `src/app/api/v1/programs/[programId]/financial-model/route.ts`: the read-only download, fenced directly with `requireTenancy`.
- `src/components/strategic-moves/step-page/p4-step-pages.tsx`: the download beside the value case.
- `src/testing/fixtures/synthetic-value-case.ts`: the value engine's synthetic golden case, shared.
- Census refreshes: `docs/architecture/test-ci-coverage-census.json`, `docs/security/tenancy-fence-coverage.json`.

## QA / Validation

- Suites:
  - workbook: 9;
  - route: 6;
  - P4/P5 step pages: 52, three of them new;
  - all pass.
- **Independent recalculation:** two cases were rebuilt with every cached result stripped: the golden case and the golden case with a two-step phase-down. Each was recalculated from scratch in LibreOffice under Low, Base and High. All six workbooks have zero formula errors and all 11 checks read YES. Annual cash, NPV, payback, the four three-year totals and every lever equal the engine, including NPVs below zero and a payback outside the horizon.
- Mutation check: 16 hand mutants, all killed. They covered:
  - the UI offer;
  - phase-down step order;
  - attribution kept in program value;
  - payback MAX instead of MIN;
  - the withheld-figures and blocked-case refusals;
  - the mismatch refusal;
  - the per-lever timing check;
  - the scenario index;
  - the cost selection;
  - the UI error sentence;
  - earned without the /12;
  - discounting by multiplication;
  - pass-through of value-case refusals;
  - the delivery query;
  - a lever-set mismatch.
- `npm run typecheck` clean; ESLint clean; `audit:lib-orphans` no change; the census adds 2 test files, both covered; the fence census adds 1 route, fenced directly.

## Rollout Plan

Ships in the next repo-owned ACA main deploy after merge. It does not depend on the open pricing PRs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. On a Move with a structured, evaluated value case, open P4 Step 3, download the model and confirm Check reads YES. The demo Move has no structured value model yet.

## Rollback Plan

Revert the squash commit and redeploy. Nothing is stored.

## Known Gaps

- **Sensitivity is not live.** It shows the engine's values; change an input and re-run the case to refresh them.
- **Excel rounds halves away from zero, and the engine rounds them up.** The two agree for every non-negative figure, and engine inputs are non-negative. A negative midpoint would differ by one cent.
- **The generated P4 `financial_model` document is unchanged.** Replacing its table companion with this workbook is a separate, gated change.

## Audit Evidence

- PR URL and CI run.
- The mutation table and the recalculation result in the PR description.
