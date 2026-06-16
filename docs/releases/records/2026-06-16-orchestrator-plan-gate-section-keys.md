# Release record — orchestrator plan gate: missing required-section key is advisory

## Release ID
2026-06-16-orchestrator-plan-gate-section-keys

## Status
Ready for deploy (ACA).

## Plain-English Summary
The Deliverable Intelligence Orchestrator's plan gate (`validateGenerationPlan`) hard-blocked any plan whose architect-produced section keys did not **exactly** match the brief's `requiredSections` keys. Because the architect is an LLM that names sections semantically (e.g. `program_objectives` vs `objectives`), this rejected **every** Moves deliverable at the plan stage — found live on app.abarva.ai: Program Charter blocked on `objectives`/`value_hypothesis`, Discovery Report blocked on `gaps`. A missing required-section **key** is now a **warning**, not a hard error. The section-count check and the post-render **quality gate** stay strict, so a genuinely thin or low-quality deliverable is still refused.

## Layer Impact
Lane: `global-control-lane` — shared deliverable-generation engine (the orchestrated path is the only Moves deliverable path after PR #3552). One check downgraded error→warning in `src/lib/deliverables/orchestrator/generation-plan.ts`, plus tests.

## Client Applicability
All clients. Every tenant generating Moves deliverables receives this; no tenant-specific behavior or feature gate.

## Changes Included
- `src/lib/deliverables/orchestrator/generation-plan.ts`: missing required-section key → warning (was a blocking error).
- `src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts`: updated + added tests for the new contract.
- This release record.

## QA / Validation
PASS — `npx jest src/lib/deliverables/orchestrator` → 76 passed. Added tests: (a) a missing required-section key warns but still blocks on a dropped client-to-complete item; (b) a plan covering enough sections but keying one differently than the brief now passes (the exact live failure). The plan gate still hard-blocks: citations to non-existent evidence, fabrication-risk sections, unplaced client-to-complete items, too-few sections overall. Live end-to-end re-verification on ACA: NOT-RUN yet (pending this deploy).

## Rollout Plan
Merge → `az acr build` web image → deploy ACA revision at 0% traffic → health-gate → shift traffic. No schema/data change (no migration).

## Rollback Plan
Revert this single behavior-only commit. No data or schema to unwind.

## Audit Evidence
Live screenshots of the plan-gate block ("Held back by the quality gate — plan omits required section 'objectives'/'value_hypothesis'/'gaps'") captured while verifying PR #3552 on revision `q203404585`. Test output (76 passed) recorded in CI on the PR.

## Known Gaps
The architect prompt could be tuned to emit the brief's exact section keys (would also clear the new warnings); deferred — the quality gate is the real backstop on the rendered document, so it is not required for correctness.
