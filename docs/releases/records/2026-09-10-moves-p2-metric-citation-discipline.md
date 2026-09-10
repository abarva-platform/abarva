# 2026-09-10-moves-p2-metric-citation-discipline — Moves Discovery Metric Citation Discipline

## Release ID

`2026-09-10-moves-p2-metric-citation-discipline`

## Status

`candidate`

## Plain-English Summary

Moves discovery diagnostics now give the generation model a stronger instruction for metric-heavy prose: every numeric, date, currency, percentage, range, ratio, approximate, or derived metric sentence must include a citation in that same sentence or be explicitly marked as an assumption, missing evidence, or client input. This preserves the existing quality gate and reduces avoidable blocked runs caused by uncited metric language.

## Layer Impact

Release lane: `global-control-lane`.

Products: Moves generation prompts are tightened for discovery diagnostics and root-cause worksheets. This affects shared product behavior for all clients using Moves generation.

Context/corpus governance: Existing citation and evidence-honesty requirements are made explicit in the authoring prompt. No policy relaxation is included.

## Client Applicability

- All clients: Applies to Moves discovery/root-cause deliverable generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts`
- `src/lib/deliverables/strategic-moves-artifact-standard.ts`
- `src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts`
- `src/lib/deliverables/__tests__/visual-and-prompt.test.ts`

## QA / Validation

- Passed: `npx eslint src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/strategic-moves-artifact-standard.ts src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts`
- Passed: `npx jest src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts -t "P2 discovery section prompt requires same-sentence citations" --runInBand`
- Passed: `npx jest src/lib/deliverables/__tests__/visual-and-prompt.test.ts -t "P2 diagnostic prompt requires handoffs" --runInBand`

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main deploy workflow. Resume the governed synthetic Moves smoke after the runtime invariant passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned deploy workflow only
- Approved image digest: Captured by deployment evidence after merge
- ACA runtime invariant: Required before live proof
- Worker image invariant: Required before live proof
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Revert this prompt-only change and redeploy through the same ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

Inspect the pull request, scoped test output, release-check output, ACA deployment evidence, runtime-invariant proof, and resumed synthetic Moves smoke report.

## Known Gaps

This change reduces avoidable generation blocks but does not weaken the downstream quality gate. A model can still be blocked if it ignores citation or assumption requirements.
