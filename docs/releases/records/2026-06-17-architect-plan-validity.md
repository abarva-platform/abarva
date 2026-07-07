# 2026-06-17 Architect Plan Validity — reliable plan-gate pass

## Release ID

`2026-06-17-architect-plan-validity`

## Status

`candidate`

## Plain-English Summary

Makes board-grade deliverable generation reliable instead of an intermittent ~1-in-4 success. The first pass (Artifact Architect) is an LLM that designs the document plan; a downstream plan gate auto-rejects any plan that cites an evidence number that doesn't exist, or marks a section as fact-bearing ("governed_facts"/"mixed") without grounding it. The architect prompt never stated those rules, so the model freelanced — citing `[17]` when only 12 evidence items exist, or marking "risks"/"recommendation" as fact-bearing with nothing to back them — and the gate (correctly) blocked the run. This change writes the gate's exact rules into the architect prompt, including the precise list of valid citation numbers for this run, so the architect produces a gate-valid plan deterministically.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Runtime prompt construction — `buildPassPrompt`'s `architect` case in `src/lib/deliverables/orchestrator/prompt-builder.ts`. No schema/data-plane/contract change; the plan gate itself is unchanged (still the enforcer — this just helps the architect satisfy it).

## Client Applicability

- **All clients:** Yes — every tenant generating board-grade deliverables. The plan gate blocked a large fraction of runs for everyone; this lifts the pass rate without weakening the anti-fabrication gate.
- **Feature flag:** None.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts` — architect prompt now includes a "PLAN VALIDITY RULES" block: the exact valid citation numbers ([1]..[N] for the run's evidence), a ban on inventing numbers, the requirement that any governed_facts/mixed section carry evidence/assumption/placeholder, and a steer to use expert_generic when a section can't be grounded.
- `src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts` — added regression tests (valid-citation list present; no-evidence case).

## QA / Validation

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/` (83 → now 85 with new cases; model-caller suite 4/4).
- **PASS** — `npx tsc --noEmit`: no errors in the changed file.
- **Live evidence (before fix):** SkyHarbor Move `7416481a` blocked at the plan gate on 3 of 4 runs — `cites [17] which is not in the governed evidence bundle` (run 5fe4a2f6), `section "risks" is mixed but cites no evidence…` (36bafef4 first pass), `section "recommendation" is mixed but cites no evidence…` (b528f98f) — all with `retrievedEvidence: 12`.
- **Post-deploy verification (to attach):** re-run the charter several times; expect the plan gate to pass consistently and the run to reach `succeeded` with an exported DOCX.

## Rollout Plan

Merge to `main` (squash). Rebuild the web image via `az acr build`; bump the durable worker job image (the caller) and roll the web revision. No migration, no flag.

## Rollback Plan

Re-point the worker job + web revision to the prior image tag. The plan gate still protects against fabrication either way; rollback only restores the lower (intermittent) pass rate.

## Audit Evidence

- PR: (to attach on open)
- CI: jest + tsc output above
- ACA: new worker job image tag + web revision (to attach after deploy)
- Live: re-runs of Move `7416481a` passing the plan gate and exporting a DOCX.

## Known Gaps

- This raises the architect's plan-validity reliability via prompting; it does not make it 100%. If a residual failure rate remains, a deterministic post-process could repair an out-of-range citation or downgrade an ungrounded section to expert_generic before the gate. Out of scope here.
