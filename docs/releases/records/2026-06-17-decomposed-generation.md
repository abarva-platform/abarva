# 2026-06-17 Decomposed Deliverable Generation — per-section fan-out, no truncation

## Release ID
`2026-06-17-decomposed-generation`

## Status
`candidate`

## Plain-English Summary
Replaces the monolithic deliverable generation (one Claude call drafting/rewriting/rendering the whole
document) with a decomposed map-reduce: the architect plan's sections are each drafted in their own
bounded-parallel call, each section's uncited figures are deterministically tagged, a single synthesis call
produces the document-level fields (recommendation, risk/issues/dependencies table, client-to-complete
checklist), and the final document is assembled in code. Because no single call carries the whole document,
truncation is structurally impossible and total length scales with the number of sections — the engine can
now produce arbitrarily long board-grade artifacts (50–100+ sections) instead of hitting the per-call output
ceiling that blocked the monolithic version at the quality gate.

## Layer Impact
- **Lane:** `global-control-lane`
- **Layer:** Runtime — the Deliverable Intelligence Orchestrator (`orchestrator.ts` passes 3–6 replaced),
  new `section-generation.ts` helpers, two new prompt passes (`section_draft`, `synthesis`) + token budgets.
  Architect → plan gate → sanitizer and the quality gate are unchanged. No schema/data-plane change. Anthropic
  audited egress + streaming unchanged.

## Client Applicability
- **All clients:** Yes — every tenant generating board-grade deliverables; this is how generation completes
  cleanly at any length.
- **Feature flag:** None (replaces the generation internals; same inputs/outputs contract).

## Changes Included
- `src/lib/deliverables/orchestrator/section-generation.ts` — new: `mapWithConcurrency`, `repairUncitedFigures`
  (mirrors the quality gate's exact factLike/supported regexes), `buildSourceRegister`, `assembleDeliverable`.
- `src/lib/deliverables/orchestrator/orchestrator.ts` — passes 3–6 replaced with per-section fan-out
  (`ABARVA_DOCGEN_SECTION_CONCURRENCY`, default 5) → citation-repair → synthesis → assemble in code.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — `section_draft` + `synthesis` prompts + schema hints.
- `src/lib/deliverables/orchestrator/types.ts` + `src/lib/ai/document-generation-policy.ts` — new pass types +
  per-section token budgets (section_draft 12k/16k/24k, synthesis 6k/8k/12k by profile).
- Tests: new `section-generation.test.ts`; `orchestrator.test.ts` + `model-caller.test.ts` updated to the new
  architect + N×section_draft + synthesis flow.

## QA / Validation
- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/`: 93/93 (13 suites), incl. new helper tests +
  the full decomposed loop passing the plan + quality gates.
- **PASS** — `npx tsc --noEmit`: no new errors. `npx eslint` on changed files: clean.
- **Post-deploy verification (to attach):** generate the Charter on SkyHarbor `7416481a`; expect `succeeded` +
  DOCX, 0 unsupported claims, no truncation, reliably across 2–3 runs — the result the monolithic version could
  not reach.

## Rollout Plan
Merge to `main` (squash). `az acr build`; bump the durable worker job image (the generation caller) + roll the
web revision; deactivate idle revisions. No migration, no flag.

## Rollback Plan
Re-point the worker job + web revision to the prior image tag — restores monolithic generation (which blocks at
the quality gate on truncation for long documents). No data to unwind.

## Audit Evidence
- PR: (to attach)
- CI: jest + tsc + eslint output above
- ACA: new worker job image tag + web revision (to attach after deploy)
- Live: SkyHarbor `7416481a` Charter reaching `succeeded` + a DOCX in the cabinet.

## Known Gaps
- Per-section calls share the global concurrency cap; very large section counts run in batches (by design).
- The synthesis pass produces the structured doc-level tables/checklist; if it returns none for a deliverable
  that genuinely has gaps, the assembler falls back to the request's own client-complete items so the gate's
  "gaps but no checklist" rule never trips spuriously.
