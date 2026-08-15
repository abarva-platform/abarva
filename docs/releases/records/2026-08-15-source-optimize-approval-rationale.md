# 2026-08-15-source-optimize-approval-rationale — Source Optimize Approval Rationale Gate

## Release ID

`2026-08-15-source-optimize-approval-rationale`

## Status

`candidate`

## Plain-English Summary

Source Optimize workflow actions now require a written rationale before changing approval, outcome, or Finance/Tower handoff state. This prevents a strategy approval, send-back, negotiated-outcome record, or value-proof handoff from becoming an unaudited button click.

## Layer Impact

- Release lane: `global-control-lane`
- Product: Updates the Source Optimize contract page action panel to require a rationale before submitting governed workflow actions.
- Canonical projections: Tightens the existing Source Optimize workflow action writer. No schema or data migration is included.

## Client Applicability

- All clients: Applies to tenants with Source Optimize enabled and governed optimization workflow rows available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source access policy and route availability continue to govern access.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/lib/source/data-model/contract-optimization-workflow-actions.ts`
- `src/app/api/source/optimize/contract/[contractId]/workflow/route.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`
- `src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand`
- PASS: `npx eslint src/lib/source/data-model/contract-optimization-workflow-actions.ts src/components/source/SourceOptimizeContractPage.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx 'src/app/api/source/optimize/contract/[contractId]/workflow/route.ts' 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts'`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- NOT RUN YET: Live signed-in proof is required after ACA deployment before calling the change live-proven.

## Rollout Plan

Merge through a protected PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured from the main ACA deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to redeploy the previous Source Optimize workflow action behavior. No schema rollback is needed.

## Audit Evidence

To be filled by validation output, PR URL, ACA deploy evidence, and signed-in browser proof.

## Known Gaps

This does not create supplier communications, negotiation artifacts, or realized-value proof. Missing evidence remains missing, and Finance/Tower remains the proof path for realized value.
