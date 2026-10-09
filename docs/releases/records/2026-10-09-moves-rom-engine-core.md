# 2026-10-09 — Moves ROM cost engine, increment 1: engine core

## Release ID

`2026-10-09-moves-rom-engine-core`

## Status

`candidate`

## Plain-English Summary

The first increment of the rough-order-of-magnitude (ROM) cost engine for
Moves. It extends the existing effort engine in
`src/lib/pricing/effort-engine/` with pure calculation code only. Nothing
calls the new options yet, so no user sees a change.

What the engine can now do, all opt-in:

- **Program friction.** `programFactors.frictionFactor` multiplies every
  hours line after the module factors. It is applied exactly once: a
  percentage-of-labor line reads the pre-friction hours of the packs it
  selects. The trace shows it as "× friction 1.10".
- **Pod pricing basis.** `pricingBasis: 'pod'` makes the engine emit
  hours-only lines: no role split, no rate, and no "missing role mix" gap.
  The default, `role_mix`, is the original behaviour.
- **Pod pricer.** A new pure module buys whole weeks of a pod. Weeks are
  `ceil(hours ÷ (total FTE × hours per FTE-week × productive share))`. The
  productive share is applied only here, never to the hours. The capacity
  bought beyond what the hours need is reported as its own slack line,
  inside the labor cost. Bad input returns a typed refusal, never NaN.
- **Rates from the cost foundation.** A pod member is a role, a level, a
  delivery location and an optional provider class from the committed
  reference pack. The pricer takes no bare hourly number. A thin adapter
  resolves each rate from the reference rate bands and the existing
  rate-card resolver. Each rate carries its provenance: the band or card
  line, the basis (loaded cost, scarcity-adjusted cost or bill rate), and
  the location and provider multipliers. The trace reads, for example,
  "rate = band ROL-x-LVL-y loaded_rate $80.00 × location LOC-z 0.35 ×
  provider 1.00 (not applied: …)".
- **Tool licences.** Optional licence lines are charged per pod-week or per
  whole month, from a reference agent-cost row or given directly. No AI
  productivity credit is applied.
- **Unit-hours overrides.** A rule's reference unit hours can be replaced,
  with a required reason. The trace shows "8 h (reference) → 10 h
  (override: …)". Unknown, unsupported, negative or unexplained overrides
  are refused.
- **Structured formula terms.** Every hours line now carries
  `formulaTerms` beside the unchanged text trace: count, unit hours,
  factors, allocation, rate and result. They reconcile exactly to the
  line's hours and cost. When the engine's 4-decimal step rounding differs
  from a plain product, the difference is an explicit rounding term.
- **Named range policy.** `applyNamedRangePolicy` applies a named low/high
  band (for example 0.75 / 1.50 for a pre-design release) next to the
  existing score tiers, which are unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 (canonical model) calculation library only. No schema, migration,
  reference data, route, UI or generation wiring changes.
- Products: none read the new options yet.

## Client Applicability

- All clients: no runtime or user-visible change. With the new options
  absent, the engine's output is unchanged.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none needed. Nothing calls the new code paths yet.

## Changes Included

- `effort-engine.ts`: `programFactors`, `pricingBasis`,
  `unitHoursOverrides`, per-line `formulaTerms`, and typed errors for bad
  options.
- `types.ts`: the new option, term and named-range types. New line and
  output fields are optional on the type, so hand-built line items stay
  valid.
- `formula-terms.ts` (new): builds and evaluates the reconciling terms.
- `pod-pricer.ts` (new): the pod pricer, rate provenance checks and tool
  licence lines.
- `pod-rate-adapter.ts` (new): resolves pod rates from the reference rate
  bands, delivery locations and provider classes, through the existing
  `resolveRoleRate`.
- `range-policy.ts`: `applyNamedRangePolicy`.
- `index.ts`: exports the new modules.
- `__fixtures__/test-fixtures.ts`: reads the reference bands, locations and
  provider classes for tests.
- Four new test suites under `effort-engine/__tests__/`.

## QA / Validation

- Pricing suites: pass. `npx jest src/lib/pricing`: 46 suites, 488 tests.
  Before this change: 42 suites, 379 tests. No existing test file was
  edited.
- No-change proof: pass. A temporary comparison ran the original engine
  (from `origin/main`) and the new engine on every archetype in the
  committed pack, across four scenarios, with module factors and rate gaps.
  2,528 line items matched exactly, field by field and as JSON, once the
  two new fields were removed. The comparison was deleted afterwards.
- Exact-arithmetic tests: pass. They cover friction, pod pricing (ceil,
  slack, floating-point noise), rate provenance, tool licences, overrides,
  term reconciliation and named ranges. Shared-foundation dedup: a shared
  line priced in two use cases is counted once by `rollUpPortfolio`.
- Term reconciliation: pass. Terms reconcile on every line of every
  archetype in the committed pack, in both pricing bases.
- Mutation checks: pass, 92 of 93 mutants killed. Each new behaviour was
  broken one edit at a time and restored. The one survivor is
  behaviour-neutral by construction: for a band bill rate, the adapter
  takes its base from `resolveRoleRate`, which reads the same band column
  the mutant reads directly.
- `npm run typecheck`: pass. `npx eslint src/lib/pricing`: pass.
- Census regenerated: pass. Four new test files, all swept
  (`coveredTestFiles` 2,766 → 2,770; uncovered unchanged at 164).

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. Nothing calls the new
code, so the deploy changes no behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: none; no flag.
- Live signed-in proof required: none for this increment. There is no
  runtime or user-visible change.

## Rollback Plan

Revert through a pull request. No data, schema or caller depends on the new
code.

## Audit Evidence

- Pull request and CI results.
- The suites, no-change comparison and mutation results above.

## Known Gaps

- No reference unit hours for ROM rules yet. This increment adds the engine
  only; reference data comes later.
- No consumer yet. No route, generation step, workbook builder or UI calls
  the new options, the pod pricer or the formula terms.
- Persisted estimate line items do not store `formulaTerms`, the friction
  factor or override details. The execution service persists the original
  columns only.
- Rate-card lines are used as-is. The existing resolver does not match a
  line's location or provider, so the adapter shows those multipliers as
  1 and marks them not applied.
- The location scarcity multiplier is not applied.
- Tiered, percentage and manual rules cannot take a unit-hours override.
- Months for monthly tool licences use a caller-supplied weeks-per-month.
  There is no reference value for it yet.
- `rollUpPortfolio` dedups by shared-cost reference alone. Within one Move,
  a shared pack with several rule or role lines counts only its first line
  in the deduped total. This is existing behaviour, pinned by an existing
  test, and is not changed here.
