# 2026-08-15-source-optimize-strategy-packet — Source Optimize Strategy Packet

## Release ID

`2026-08-15-source-optimize-strategy-packet`

## Status

`candidate`

## Plain-English Summary

Source Optimize now makes the vendor-outreach strategy packet visible before the approval request is created and persists the same packet into the governed approval request payload. The packet states the target ask, value basis, evidence basis, and approval guardrails so an approval does not become a generic workflow click.

## Layer Impact

- Release lane: `global-control-lane`
- Product: Updates the Source Optimize contract page approval panel to display the strategy packet that will be approved.
- Canonical projections: Extends the existing workflow action writer to persist the packet inside the approval request payload. No schema or data migration is included.

## Client Applicability

- All clients: Applies to tenants with the Source Optimize workflow enabled and governed opportunity rows available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source access policy and route availability continue to govern access.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/lib/source/data-model/contract-optimization-workflow-actions.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand`
- PASS: `npx eslint src/lib/source/data-model/contract-optimization-workflow-actions.ts src/components/source/SourceOptimizeContractPage.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx 'src/app/api/source/optimize/contract/[contractId]/workflow/route.ts' 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts'`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- BLOCKED UNTIL DEPLOYMENT: Live signed-in proof is required after ACA deployment before calling the change live-proven.

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

Revert the PR and allow the repo-owned ACA main deploy workflow to redeploy the previous Source Optimize UI and workflow action behavior. No schema rollback is needed.

## Audit Evidence

To be filled by the PR, validation output, ACA deploy evidence, and signed-in browser proof.

## Known Gaps

This does not generate negotiation artifacts, contact a supplier, or record realized value. Finance/Tower confirmation remains the only proof path for realized value.
