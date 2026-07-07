# 2026-06-17 Plan Sanitizer — deterministic plan repair before the gate

## Release ID

`2026-06-17-plan-sanitizer`

## Status

`candidate`

## Plain-English Summary

Makes board-grade generation actually reliable. The architect pass (an LLM) persistently invents citation numbers that don't exist in the evidence (e.g. cites [16]/[17]/[27] when only 12 items exist) and marks sections as fact-bearing without grounding them — and explicit prompt instructions do not stop it, so the plan gate blocked roughly 3 of 4 runs. This adds a deterministic repair step that runs right before the gate: it drops every citation not present in the evidence bundle (they would be broken references anyway) and downgrades any now-ungrounded fact-bearing section to `expert_template` (standard framing, no client facts). The plan gate still runs afterward and still rejects genuinely deficient plans (too few sections, unhandled client-to-complete items) — this only removes the LLM's invalid-citation / ungrounded-section noise. Also corrects the prior architect-prompt fix, which referenced a non-existent grounding mode (`expert_generic` → the valid `expert_template`).

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Runtime orchestration — new `sanitizeGenerationPlan` in `src/lib/deliverables/orchestrator/generation-plan.ts`, called from `runDeliverableOrchestration` before `validateGenerationPlan`; the architect prompt's grounding-mode keyword corrected in `prompt-builder.ts`. No schema/data-plane/contract change. The anti-fabrication gate is unchanged.

## Client Applicability

- **All clients:** Yes — every tenant generating board-grade deliverables; the plan gate previously blocked a large fraction of runs for everyone.
- **Feature flag:** None.

## Changes Included

- `src/lib/deliverables/orchestrator/generation-plan.ts` — new `sanitizeGenerationPlan` (drop invalid citations; downgrade ungrounded governed_facts/mixed sections to `expert_template`; prune invalid evidenceMapping entries).
- `src/lib/deliverables/orchestrator/orchestrator.ts` — call `sanitizeGenerationPlan(plan, req)` after `extractJson` and before `validateGenerationPlan`.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — `expert_generic` → `expert_template` (valid enum) in the architect plan-validity rules.
- `src/lib/deliverables/orchestrator/__tests__/generation-plan.test.ts` — new unit tests for the sanitizer.
- `src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts` — the plan-gate-block test now uses a genuinely thin plan (the invalid-citation path is now repaired, covered by the unit test).
- `src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts` — assertion updated to `expert_template`.

## QA / Validation

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/`: 89/89 (12 suites), incl. new sanitizer unit tests.
- **PASS** — `npx tsc --noEmit`: no errors in the changed files.
- **Live evidence (before fix):** SkyHarbor Move `7416481a` blocked at the plan gate on ~3 of 4 runs with `cites [16]/[17]/[27] which is not in the governed evidence bundle` and `section "X" is mixed but cites no evidence…`, all with `retrievedEvidence: 12`. Prompt instructions (PR #3604) did not stop the LLM.
- **Post-deploy verification (to attach):** re-run the charter; expect the plan gate to pass consistently and the run to reach `succeeded` with an exported DOCX.

## Rollout Plan

Merge to `main` (squash). Rebuild the web image via `az acr build`; bump the durable worker job image (the caller) and roll the web revision. No migration, no flag.

## Rollback Plan

Re-point the worker job + web revision to the prior image tag. The anti-fabrication gate still protects either way; rollback only restores the intermittent block.

## Audit Evidence

- PR: (to attach on open)
- CI: jest + tsc output above
- ACA: new worker job image tag + web revision (to attach after deploy)
- Live: re-runs of Move `7416481a` passing the plan gate and exporting a DOCX.

## Known Gaps

- Downgrading an ungrounded section to `expert_template` means that section ships as standard framing without client facts; the draft passes still flag genuinely missing facts as `[EVIDENCE MISSING]`/`[CLIENT TO COMPLETE]`. If a section truly required a client fact, the gap surfaces in the body, not as a hard block — acceptable, and arguably preferable to blocking the whole deliverable.
