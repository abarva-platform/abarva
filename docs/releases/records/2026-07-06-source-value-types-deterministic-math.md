# 2026-07-06-source-value-types-deterministic-math — value-type classification + deterministic, defensible value math

## Release ID

`2026-07-06-source-value-types-deterministic-math`

## Status

`candidate`

## Plain-English Summary

Reframes Source's value story from "chase a savings %" to **classify the value
architecture**, and makes every value number **deterministic and defensible** — not
authored by the model.

Two changes to the archetype value-lever contract:

1. **Value types.** Every `ValueLeverRule` now declares one of five value TYPES —
   `expected_concession` (giveback already in the vendor's first bid), `incremental_negotiated`
   (value earned beyond it), `solution_tightening` (a better solution, not just a lower
   price), `protected` (post-award leakage avoided), `risk_adjusted` (value net of
   delivery/underpricing/solution risk). The first vendor bid is treated as the vendor's
   opening position, not the baseline, so a price drop is classified rather than claimed as
   Source-created savings.

2. **Deterministic computation contract.** Every rule now carries a required `computation`
   block: the typed fact inputs it consumes (each with a unit, a source, and whether a
   citation is required), a human-readable formula, a machine `formulaId` for the pure
   evaluator that implements it, and a range method. Missing a required input yields
   "insufficient evidence" — never a guess. This is the "defend our math" contract: a number
   is derived by code from cited facts, and the model only narrates it.

The advisory block injected into the deliverable prompts now surfaces the value type, the
formula, the inputs, and the insufficient-evidence guard, and instructs the model to
classify (not sum to a headline) and never invent a number the inputs do not support.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients. Extends the
  archetype contract (`ValueLeverRule`) with `valueType`, `commercialRisk`, `capabilityRef`,
  and a required `computation` contract (`ValueComputation` + `ValueComputationInput`), and
  retrofits the AMS reference rule set with real formulas. Updates the prompt projection in
  `buildArchetypeAdvisoryBlock`. No data, schema, seed, or migration. Archetypes without
  value-lever rules render exactly as before.

## Client Applicability

- All clients: yes (AMS-classified events carry value-typed, computation-backed levers;
  other archetypes unchanged until their rule sets are authored)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/archetypes/types.ts` — new `ValueType`, `ValueInputSource`, `ValueUnit`,
  `ValueComputationInput`, `ValueComputation` types; extended `ValueLeverCategory`; added
  required `valueType` + `computation` and optional `commercialRisk` + `capabilityRef` to
  `ValueLeverRule`.
- `src/lib/source/archetypes/registry.ts` — retrofitted the 6 AMS `valueLeverRules` with
  their value type and a deterministic computation contract (formulas:
  `AVOIDABLE_SPEND_OVER_TERM`, `BAND_STEPDOWN_SAVINGS`, `PRODUCTIVITY_CREDIT_POOL`,
  `RETAINED_EFFORT_DELTA`, `SLA_CREDIT_PROTECTION`, `TRANSITION_RISK_EXPOSURE`).
- `src/lib/source/agent-generation/archetype-advisory.ts` — renders the value-type
  classification doctrine, the per-lever formula + inputs, and the insufficient-evidence /
  no-invented-number guard.
- `src/lib/source/agent-generation/__tests__/archetype-advisory.test.ts` — value-type +
  derivation + guard assertions.

## QA / Validation

- `npx jest src/lib/source/{agent-generation,archetypes}` → **17 suites / 119 tests pass**. **pass.**
- `npx tsc --noEmit` (full project, exit-code gated) → **0 errors**. **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Not live-proven: value-typed levers with their derivation in a real AMS deliverable need a
  signed-in walkthrough (folded into the Lakeshore value-case proof). **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. ACA main deploy auto-runs on merge; record the revision. No
migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main).
- Shared runtime mutators: none — archetype contract + prompt block only.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — verify an AMS event's deliverables classify value by
  type and show the derivation (with range/confidence) on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the fields and the retrofit
returns the value levers to their prior prose form with no data effect. No schema/migration
to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- The computation contract is code (versioned, reviewable); `formulaId` + typed inputs +
  `onMissingEvidence` keep any generated number derived from cited facts, not invented.

## Known Gaps

- The pure evaluator functions (`formulaId` → function) and the structured extraction layer
  (typed vendor/enterprise facts feeding the inputs) are the next slice — this change ships
  the contract that forces them; the numbers are still narrated qualitatively in prompts
  until the evaluator + `source_value_levers` rows (carrying the derivation trace) land.
- Value-type + computation for the other archetypes' rule sets are not yet authored
  (fast-follow, parallelizable).
