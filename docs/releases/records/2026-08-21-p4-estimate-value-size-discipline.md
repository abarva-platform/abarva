# 2026-08-21-p4-estimate-value-size-discipline — P4 Estimate And Value Size Discipline

## Release ID

`2026-08-21-p4-estimate-value-size-discipline`

## Status

`candidate`

## Plain-English Summary

P4 estimate and value-plan deliverables now use fixed, compact structures with explicit section budgets. The financial-model path is corrected to produce an input register when finance-grade inputs are absent instead of asking the model to fill a synthetic model with realistic-looking numbers. The Tower measurement plan is also constrained to a compact measurement contract rather than a second business case.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves generated deliverable planning is corrected for P4 estimate and value artifacts. The change affects generated artifact shape and quality-gate passability only; it does not create, modify, or load tenant data.

## Client Applicability

- All clients: Strategic Moves P4 generated deliverables.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`
- `src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts`
- `src/lib/programs/deliverable-registry.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts --runInBand`
- PASS: `npx eslint src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/programs/deliverable-registry.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- PENDING: Live signed-in P4 rerun proof after deploy.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming runtime proof.
- Worker image invariant: Required after deploy before claiming runtime proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Re-run affected P4 generation and confirm the estimate/value artifacts no longer block on size while preserving evidence gates.

## Rollback Plan

Revert the PR. P4 estimate and value artifacts return to the prior open-ended generation structure.

## Audit Evidence

- PR URL: TBD.
- Local validation: TBD.
- Post-merge deploy run and runtime invariant proof: TBD.
- Signed-in Move rerun proof: TBD.

## Known Gaps

This change does not approve any implementation budget, annual savings, ROI, NPV, payback, or target-value claim. P4 value claims remain blocked until governed finance-grade inputs are present and cited or explicitly approved as assumptions.
