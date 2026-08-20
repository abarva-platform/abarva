# 2026-08-20-charter-prose-floor — Charter Prose Floor Calibration

## Release ID

`2026-08-20-charter-prose-floor`

## Status

`candidate`

## Plain-English Summary

The Move Charter prose-only quality gate now uses an explicit prose floor for table-led charters. The Charter still targets a concise executive body and still blocks excessive prose, but required decision, scope, and discovery-preparation tables can carry structured content without forcing the prose floor to match the older whole-body calibration.

## Layer Impact

Layer 4 / Products (`global-control-lane`): affects Strategic Moves Charter quality validation only. It does not change tenant data, canonical data, retrieval, migrations, or runtime configuration.

## Client Applicability

- All clients: Strategic Moves Charter generations use the calibrated prose floor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/shared/artifact-contracts.ts` adds a Charter `minProseWords` contract.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` uses that floor when Charter prose-only counting is active.
- Targeted tests assert the shared contract and resolved quality bar remain aligned.

## QA / Validation

- PASS — Targeted quality-bar and Charter reconciliation tests:
  `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/shared/__tests__/charter-contract-reconciliation.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts`
- PASS — ESLint:
  `npx eslint src/lib/deliverables/shared/artifact-contracts.ts src/lib/deliverables/orchestrator/quality-bar-registry.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/shared/__tests__/charter-contract-reconciliation.test.ts`
- PASS — TypeScript:
  `npx tsc --noEmit`
- PASS — Release control:
  `npm run release:check`
- NOT RUN — Live Move P1 Charter generation re-run after merge/deploy.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. After deployment, re-run the signed-in P1 Charter generation for the live Move proof.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, P1 Charter generation/readback.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, CI/check output, ACA deploy run, and signed-in P1 Charter generation proof.

## Known Gaps

This only calibrates the Charter prose floor. It does not add agent-ready evidence to the Move or approve any phase gate.
