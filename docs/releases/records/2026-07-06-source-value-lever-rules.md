# 2026-07-06-source-value-lever-rules — ValueLeverRule layer: the qualitative→quantitative bridge

## Release ID

`2026-07-06-source-value-lever-rules`

## Status

`candidate`

## Plain-English Summary

Adds the `ValueLeverRule` structure — the layer that turns an archetype's qualitative
traps into **computable value rows**. Each rule is deterministic advisor knowledge (a
versioned code constant, not free LLM prose) that declares: what to watch, the evidence it
needs, the trigger, the **$ basis**, the RFP clause it drives, its evaluation + BAFO
impact, and the executive implication. One rule threads the whole chain — evidence request
→ RFP clause → response exhibit → scorecard hook → BAFO ask → decision-brief insight →
value-lever row → aVa answer.

This slice ships the type + field on `SourceEventArchetype`, the reference rule set for
**AMS** (enhancement/change-order leakage, volume-band flex-down, productivity credits,
retained-cost, SLA economics, transition risk), and the wiring so those levers — with their
value basis, BAFO ask, and executive implication — are injected into the deliverable
prompts, always with the claim discipline (range + confidence band, never a bare guaranteed
number). The remaining 9 archetypes' rule sets are a fast-follow.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients. Adds an optional
  `valueLeverRules` field to the archetype contract (code constants), the AMS rule set, and a
  value-levers block in `buildArchetypeAdvisoryBlock` so the rules reach d01/d09/d11/d24
  prompts. No data, schema, seed, or migration. Archetypes without rules yet render exactly
  as before (the section is omitted).

## Client Applicability

- All clients: yes (AMS-classified events now carry the value levers; others unchanged until
  their rule sets are authored)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/archetypes/types.ts` — new `ValueLeverCategory` + `ValueLeverRule` types;
  optional `valueLeverRules` on `SourceEventArchetype`.
- `src/lib/source/archetypes/registry.ts` — 6 AMS `valueLeverRules` (the reference set;
  `AMS.ENHANCEMENT_LEAKAGE` is the worked example).
- `src/lib/source/agent-generation/archetype-advisory.ts` — renders the value-levers block
  (basis + BAFO ask + executive implication + confidence) with the range/caveat discipline.
- `src/lib/source/agent-generation/__tests__/archetype-advisory.test.ts` — value-lever
  rendering + omission tests.

## QA / Validation

- `npx jest src/lib/source/{agent-generation,archetypes}` → **17 suites / 117 tests pass**. **pass.**
- `npx tsc --noEmit` (full project, exit-code gated) → **0 source errors**. **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Not live-proven: value-lever content in a real AMS deliverable needs a signed-in
  walkthrough (folded into the Lakeshore value-case proof). **verify on deploy.**

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
- Live signed-in proof required: yes — verify an AMS event's deliverables carry the value
  levers (with range/confidence) on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the field, the AMS rules, and the
prompt block returns the advisory to traps/levers-only with no data effect. No
schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- Value-lever rules are code constants (versioned, reviewable); `valueBasis` + `triggerLogic`
  keep any generated number grounded, not invented.

## Known Gaps

- Rule sets for the other 9 archetypes are not yet authored (fast-follow; parallelizable like
  the archetypes were).
- The value rows are surfaced qualitatively in prompts; the persisted `source_value_levers`
  table + the computed savings waterfall (the value-case aggregate) remain deferred until
  cross-event/portfolio tracking is wanted — per the data-model decision, per-event value
  visibility needs no new schema.
