# 2026-08-22-move-p3-decision-clarity — Moves P3 Decision Clarity Guard

## Release ID

`2026-08-22-move-p3-decision-clarity`

## Status

`candidate`

## Plain-English Summary

Moves design-phase deliverables now preserve an explicit phase decision in the rendered recommendation when the model produces a long but non-decisive synthesis. This keeps the quality gate strict while preventing a clear saved operator decision from being softened into generic sponsor-review language.

## Layer Impact

Layer 4 Products: Updates the Moves deliverable assembly and quality contract for generated artifacts. No canonical data model, tenant intake, registry, graph substrate, migration, or data-plane loader changes are included.

## Client Applicability

- All clients: Moves users who generate P3 target architecture artifacts.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Moves deliverable assembly now accepts a synthesized recommendation only when it is both substantive and decision-led.
- Moves deliverable assembly can derive the recommendation from the artifact's recommendation section when that section contains the explicit decision.
- The quality contract recognizes an explicit choice as a first-screen decision signal.
- Focused regression tests cover the P3 decision-section fallback and the quality-gate decision signal.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/quality/__tests__/assess-deliverable.test.ts --runInBand` — pass.
- `npx eslint src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/quality/deliverable-quality-contract.ts src/lib/deliverables/quality/__tests__/assess-deliverable.test.ts` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Moves generation flow before claiming client-visible behavior.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in Moves generation proof after deployment.

## Known Gaps

This change does not approve or regenerate any specific artifact by itself. It only fixes the decision clarity assembly rule used by subsequent generation runs.
