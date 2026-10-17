# u681 — Breakeven realisation: the share of modelled value at which NPV is zero

## Release ID

`2026-10-17-moves-breakeven-realisation`

## Status

`candidate`

## Plain-English Summary

An investment committee's first question after "what is the NPV?" is usually "how much of this has to come true for us to break even?". The synthetic golden P4 workbook answers it with a breakeven share. Our value engine had no answer: its per-lever breakeven holds every other lever at base and uses an undiscounted, steady-state basis. u679 recorded that as a known gap.

The engine now computes **breakeven realisation**: the share of the modelled cash, received on the same schedule, at which NPV is exactly zero. NPV scales with that share, so it is the cost divided by the same discounted year sums the NPV uses, rounded to 4 decimals. The value is 0 when there is no cost. It is unknown when the case's discounted cash is not positive. Above 100% means the modelled value does not cover the cost within the horizon.

It appears in three places:

- **P4 value step:** "Breakeven realisation · plan 45.7% of the modelled value", with its sources. A viewer without figure access sees nothing. The viewer projection already withholds all economics.
- **P4 financial model:** a live formula on the Economics sheet, over the NPV's own year sums, and a Check row against the engine for each scenario.
- **Engine results:** `economics.breakevenRealisation` for low, base and high.

For the synthetic golden case it is 110% at base. The case pays back in month 35 of 36 undiscounted, but at an 8% discount rate it needs 110% of its modelled value to reach NPV zero. Payback alone hides this.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves value engine, P4 value step, P4 financial model):** a new derived figure from existing engine inputs. No data, route, schema or flag change. Tower figures are not touched.

## Client Applicability

- **All clients:** yes, wherever the P4 value case is evaluated.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/programs/value-engine/economics.ts`: `breakevenRealisation`.
- `src/lib/programs/value-engine/case-model.ts`, `evaluate.ts` and `types.ts`: a per-scenario `economics.breakevenRealisation`.
- `src/lib/programs/value-engine/financial-model-workbook.ts`: an Economics row as a live formula, a Check row, and README and layout entries.
- `src/components/strategic-moves/step-page/p4-step-pages.tsx`: the P4 readback line. It is absent from an older engine response, and it says "not reached" when there is no positive cash.
- Tests:
  - engine: exact value, NPV zero at the share, its relation to the NPV sign, edge cases;
  - workbook: formula, number format, Check row, no-positive-cash case;
  - P4: shown through the real viewer projection; honest when null or absent; withheld for a restricted viewer and for a blocked case;
  - the forecast behaviour fixture gains the field.

## QA / Validation

- Engine, workbook and P4 page suites: pass, 144 / 144.
- Mutation testing: 10 / 10 mutants killed:
  - engine: no rounding, zero-cost boundary, non-positive cash boundary, undiscounted denominator;
  - workbook: no ROUND, no Check row, wrong number format;
  - P4: low instead of plan, null shown as a share, shown when absent.
- LibreOffice recalculation of 7 samples (golden case Low, Base and High; phased Base; AI scenario Low, Base and High): Check YES on every row (13 / 13, or 15 / 15 with the scenario), 0 error values. The workbook's breakeven realisation equals the engine's in every sample (1.1652, 1.1016 and 1.0446 for the golden case).
- `npm run typecheck`: pass. ESLint: pass. Programs, strategic-moves, behaviours, programs API and deliverables suites: 936 suites, 13991 tests, pass. `npm run release:check`: pass (exit 0). `audit:lib-orphans`: no change.

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The live demo Move reaches P4 only after its P3 design sign-off.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the P4 value step and a financial model download from a Move at P4.

## Rollback Plan

Revert the squash commit and redeploy. No data or schema change.

## Known Gaps

- **Not yet on the investment deck.** A deck figure needs a governed slot and its own exhibit rules; that follows separately.

## Audit Evidence

- PR URL and CI run; the LibreOffice recalculation readout in the PR.
