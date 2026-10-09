# 2026-10-10 — Moves value engine, increment 1: the core engine

## Release ID

`2026-10-10-moves-value-engine-core`

## Status

`candidate`

## Plain-English Summary

A Move's value plan is free text today, and the existing value forecast
starts from one gross range and applies a fixed six-factor haircut. Nothing
computes value from levers, drivers, attribution, overlap or timing. This
release adds the deterministic engine that does. Engines compute the numbers;
narrative explains them.

- **Levers.** Each lever names a driver (baseline → target), an ordered list
  of terms whose product is the annual figure, an attribution, a probability,
  timing and an optional overlap group. Every input is a typed reference: a
  literal with its source, an approved-evidence value with its unit and date,
  or a register row or ROM snapshot read through an injected resolver.
- **Conversion rules.** Added volume needs a refill share and a contribution
  margin. A cost reduction needs a spend base and a bought-less assumption.
  Revenue needs a margin. Avoided risk is reported separately and kept out of
  cash unless the case opts in. Hours saved count $0 until a role or contract
  release path resolves to a counted input; then only the released cost
  counts, and the hours stay reported.
- **No guessed numbers.** An input that cannot be resolved blocks its lever
  and the case. A blocked case shows no total, because a total missing a
  lever would understate the case.
- **Figures.** Annual low/base/high per lever and in total, in integer cents.
  Each figure carries formula terms that recompute it exactly. The engine also
  produces a monthly cash curve after start, ramp, payment lag and phase-down,
  NPV, payback month, breakeven per lever driver (closed form, or bisection
  inside an overlap group, with "never within bounds"), and one-at-a-time
  sensitivity.
- **Risk is not discounted twice.** Attribution × probability prices risk per
  lever. The adapter to the existing forecast shape applies no haircut on top;
  the old haircut is reported beside it as a cross-check only.
- **First consumer, behind a flag.** With `moves_value_engine_v1` on, a P4
  value plan saved as a structured value model counts as complete only when
  the engine can evaluate it. Free-text value plans complete exactly as
  before. With the flag off, nothing changes.

## Product decisions recorded

Settled by the product team for this engine:
- **Risk is not discounted twice.** Lever probability × attribution prices risk;
  the expert-kernel haircut is reported as a cross-check only, never applied
  on top.
- **Hours saved count $0** unless a release path (a role or contract
  released) references a counted input; hours still report as a non-money
  metric.
- **A released cost is also scaled by attribution × probability:** a credited
  saving is a share of the saving, like any other lever.
- **The low scenario pairs low value with high cost** (the downside case is
  conservative).
- **A blocked case shows no partial totals**, so an incomplete number cannot
  be read as the case.
- **Breakeven is steady-state:** the driver value at which steady-state annual
  cash × horizon equals cost. It is labelled as such; it is not a timed or
  discounted breakeven.

## Layer Impact

- Release lane: `experimental` (feature-flagged; default off).
- Products layer: a new pure library under `src/lib/programs/value-engine/`
  and a parser for a structured P4 value plan. No new data is stored.
- Capture route: passes the tenant's flag into the completeness check.
- Canonical model: no schema change.

## Client Applicability

- All clients: no change while the flag is off.
- Specific clients: the synthetic demo tenant has the flag on.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_value_engine_v1` (tenant policy).

## Changes Included

- `src/lib/programs/value-engine/`: types, input resolution, conversion
  rules, lever evaluation, overlap groups, timing, economics, breakeven,
  sensitivity, formula terms, case evaluation and the expert-kernel adapter.
- `src/lib/programs/value-model-capture.ts`: reads and writes a structured
  P4 value plan (`kind: "value_model"`, version 1). Free text reads as legacy
  text.
- `src/lib/programs/phase-capture-contract.ts`: the flagged completeness
  check for P4 `value_plan`.
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts`: resolves the
  flag for the tenant on read, on write and on a stale-revision refusal.
- `src/lib/features/registry.ts` and the generated manual: the new flag.
- Tests: two new suites under `src/lib/programs/__tests__/` and new cases in
  the capture route suite.

## QA / Validation

- A synthetic golden case with four levers: premium labour, length of stay,
  emergency-department boarding in the same overlap group, and documentation
  hours with no release path. Every expected figure was worked by hand:
  - Annual cash: $1,075,200 low, $1,132,800 base, $1,190,400 high.
  - The boarding lever is counted once, through the larger length-of-stay
    lever. The hours lever counts $0 and reports 7,200 hours.
  - Payback: month 35 (base) and month 34 (high). The low case does not pay
    back within the 36-month horizon.
  - NPV at 8% matches an independent month-by-month discount.
  - Breakeven: a 3.33% premium-labour reduction in closed form. It falls to
    2.96% at a higher spend base and rises to 3.81% at a lower one. Length of
    stay breaks even at 0.151 days by bisection.
  - Every lever, total and NPV figure recomputes exactly from its terms.
- Rule refusals, unresolved and uncounted inputs, confidence bands, overlap
  primaries and ties, phase-down, lag past the horizon, breakeven boundaries,
  release paths and the adapter are each covered.
- New tests: value engine (68), value model capture (8), capture route (5).
- Mutation checks: 111 mutations across every new module and the wiring, each
  applied alone and restored from memory. All 111 fail a test. Four
  survivors from the first pass were closed: three with new tests, and one
  by removing a redundant filter.
- Combined run: programs library, feature flags and capture route
  (224 suites, 3,256 tests) pass.
- `npm run typecheck`: clean. ESLint: clean on all changed files.
- `npm run audit:lib-orphans`: no change against the baseline. All 15 new
  modules are reached by product code.
- `npm run audit:test-ci-coverage:write`: covered test files rise by exactly
  the two new suites (2,772 → 2,774 on the current main).
- `npm run docs:nexus-manual:check`: current.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The flag is on only for
the synthetic demo tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: `moves_value_engine_v1` in the flag registry,
  with the tenant allowlist environment variable.
- Live signed-in proof required: on the demo Move's P4, confirm a free-text
  value plan still completes. No editor writes a structured model yet, so the
  structured path is proven by the route tests until increment 4.

## Rollback Plan

Turn the flag off, or revert through a pull request. No data is written in a
new shape. A structured value plan saved by hand stays a string and reads as
complete free text while the flag is off.

## Audit Evidence

- Pull request and CI results.
- The golden case, mutation results and census change above.

## Known Gaps

- Register rows and ROM snapshots are typed but resolved only through an
  injected resolver; nothing in product code supplies one yet (increment 2).
  Until then a model that references them is incomplete.
- No editor, generation context, gate, workbook or Tower projection reads the
  engine yet (increments 3 to 5).
- Breakeven uses steady-state annual cash × horizon against cost, and says
  so on every result. It does not include ramp, lag or discounting.
- The investment is one cost at month 0. Phased cost is not modelled.
- In a blocked case, a lever that resolved still shows its own status but no
  figure.
