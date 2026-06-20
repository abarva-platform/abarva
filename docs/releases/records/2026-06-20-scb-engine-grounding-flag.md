# 2026-06-20-scb-engine-grounding-flag — Expert-grounding helper + Intelligence shared-engine flag

## Release ID

`2026-06-20-scb-engine-grounding-flag`

## Status

`candidate`

## Plain-English Summary

Foundation for wiring the Consilium expert faculty into the live Intelligence "Ask". Adds (1) a pure `summonExpertsForQuery` helper that routes a question to the right expert(s) and builds a prompt-ready grounding block from their authored content (scope, planning-range benchmarks, AI plays, honest odds, hedge language), and (2) a default-OFF feature flag `scb_shared_engine_intelligence` (tenant opt-in) that will gate the live wiring. **Additive and dormant — the helper has no call site yet and the flag is off for every tenant, so no client behavior changes.**

## Layer Impact

- **global-control-lane (additive, dormant):** a new pure helper module + one new feature-flag definition (default off, `includeTenants: []`). No runtime route imports the helper yet; the flag changes nothing until flipped per tenant.

## Client Applicability

- All clients: No runtime change — helper dormant, flag off everywhere.
- Specific clients: None.
- Internal only: Yes — build-time helper + flag for later wiring.
- Public/demo only: None.
- Feature flag: `scb_shared_engine_intelligence` added, default OFF (`includeTenants: []`).

## Changes Included

- `src/lib/intelligence/answer/expert-grounding.ts` — `summonExpertsForQuery()` (router + registry → experts + grounding block).
- `src/lib/features/registry.ts` — `scb_shared_engine_intelligence` flag (default off).

## QA / Validation

Validation: Pass. `tsc --noEmit` clean on the new/edited files; runtime test confirms the grounding block carries real authored content (e.g. revenue-cycle "95–99%", named AI plays, honest odds, hedge language), the flag is default-off for a sample tenant, and an unmatched query yields an empty block. Automated unit tests: not-run in this record (covered by the inline runtime check; a jest test can follow with the route wiring).

## Rollout Plan

Merge to `main`. No runtime rollout — dormant helper + default-off flag. The live route injection + per-tenant flag flip + deploy is a later, separate change.

## Deployment Authority

Not applicable — additive build-time code with no runtime call sites; the flag is off everywhere so it cannot change behavior.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: flag added default-off; flipping per tenant is a later change with its own proof.
- Live signed-in proof required: No (nothing wired).

## Rollback Plan

Revert the PR — no runtime call sites; removing the flag definition is safe because nothing consumes it yet.

## Known Gaps

- The route injection (call `summonExpertsForQuery` in the ask path when the flag is on, inject the block into the synthesizer, surface contributing experts) is the next change.
- Deploy + per-tenant flip + signed-in proof are deferred (the demo step).
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-engine-grounding` → `main`.
- CI: `npm run release:check`, `tsc` clean, grounding runtime-test output in PR description.
