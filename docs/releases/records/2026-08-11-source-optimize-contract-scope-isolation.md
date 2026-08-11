# 2026-08-11-source-optimize-contract-scope-isolation — Source Optimize Contract Scope Isolation

## Release ID

`2026-08-11-source-optimize-contract-scope-isolation`

## Status

`candidate`

## Plain-English Summary

The Source Optimize Contract page now keeps persisted opportunity child rows scoped to the selected contract. Evidence, calculations, valuations, requirements, and finance realization rows are read through the selected contract's opportunity spine so a different contract in the same dataset cannot appear in the selected contract's evidence request board.

## Layer Impact

Release lane: `global-control-lane`.

Canonical model / Source read model: persisted commercial opportunity rows remain the source of truth, but child table reads now join back to the selected opportunity contract before rendering.

Products: Source Optimize Contract receives safer evidence-readiness and value-proof data. No workflow semantics, tenant mappings, or source-system adapters change.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Optimize Contract persisted opportunity spine.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed.
- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed.
- `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deployment workflow builds and deploys the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: GitHub Actions workflow only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Optimize Contract selected-contract evidence board.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deployment workflow to redeploy the previous reader behavior. No migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6160
- CI/deploy run: To be added after merge and deploy.
- Live proof: Verify selected-contract evidence requirements do not include another contract's baseline conflict text.

## Known Gaps

This release does not redesign the Optimize workflow or change opportunity scoring. It only fixes selected-contract scoping for persisted opportunity child reads.
