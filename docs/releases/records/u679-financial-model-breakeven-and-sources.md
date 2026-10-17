# u679 — Breakeven and Sources sheets in the P4 financial model

## Release ID

`2026-10-17-moves-financial-model-breakeven-sources`

## Status

`candidate`

## Plain-English Summary

The P4 financial model is the Move's value case as a live-formula workbook. We compared it sheet by sheet with the synthetic golden P4 investment workbook, which a consulting reviewer would expect to match. Two things the golden carries were missing:

- **A breakeven.** The value engine already solves one for each lever's driver: holding the rest of the case at base, it finds the driver change at which steady-state annual cash × horizon years covers the investment. The product computed it, but the workbook left it out. A new Breakeven sheet shows each lever's outcome in words, the driver change and driver value at breakeven, the driver's bounds and the solving method. The sheet states its basis: the breakeven is not timed or discounted, so it is not where NPV reaches zero.
- **A source list.** A new Sources sheet lists every recorded source behind the inputs: register rows, approved evidence, the approved estimate, figures stated in the value plan, and the investment basis. Each one names the lever terms that use it. The sheet also says plainly whether any input was counted from an open register row, which must be validated before approval. Terms the engine computes, such as unit conversions, exclusions and release gates, are not inputs and are not listed.

No figure is new: both sheets carry the engine's own results as values, the same way Sensitivity does.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves P4 financial model download):** two value-only sheets and a README line. No route, data, flag or formula change.

## Client Applicability

- **All clients:** yes, wherever the P4 financial model is offered.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged (the download keeps its own gate).

## Changes Included

- `src/lib/programs/value-engine/financial-model-workbook.ts`:
  - `Breakeven` and `Sources` sheets;
  - outcome words for each engine breakeven status;
  - a source-kind reader for the recorded source prefixes;
  - README rows.
- `src/lib/programs/__tests__/value-engine-financial-model-workbook.test.ts`: tests for:
  - every breakeven outcome, its numbers and its format;
  - the source list, de-duplicated across baseline → target sources;
  - each source kind;
  - the open-register-row line, both with and without such inputs;
  - no engine-computed term listed as an input.

## QA / Validation

- Workbook and financial-model route suites: pass, 23 / 23.
- Mutation testing: 10 / 10 mutants killed. The mutants swapped outcome words, showed a delta for unsolved levers, listed engine terms, stopped splitting baseline → target sources, always printed "no open inputs", swapped two source kinds, dropped the investment basis kind, swapped the method words, and dropped de-duplication.
- LibreOffice recalculation: the golden case under Low, Base and High, and the AI-scenario sample. Check reads YES on 12 / 12 (14 / 14 with the scenario), with 0 error values. The new sheets read as expected after conversion.
- `npm run typecheck`: pass. ESLint: pass. Programs, value-engine, step-page and reachability suites: 269 suites, 4500 tests, pass. `npm run release:check`: pass (exit 0). `audit:lib-orphans`: no change.

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The live demo Move cannot reach P4 until its P3 design is signed off, so live proof waits for that.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: a P4 financial model download from a Move at P4.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Breakeven is per lever, on the engine's steady-state basis.** The golden case also shows the realisation share at which NPV reaches zero. The engine does not compute that yet, so the workbook does not invent it.
- **Open-register inputs are named by engine key** (for example `L1.baseline`), not by register row ID.

## Audit Evidence

- PR URL and CI run; the LibreOffice recalculation readout in the PR.
