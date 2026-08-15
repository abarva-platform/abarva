# 2026-08-15-source-optimize-lazy-ava-dock — Defer Optimize Contract chat dock

## Release ID

`2026-08-15-source-optimize-lazy-ava-dock`

## Status

`candidate`

## Plain-English Summary

Optimize Contract now renders the contract workflow first and mounts the full aVa chat dock only after the user opens the aVa launcher. This keeps the governed decision surface and stage rail immediately available while reducing the initial client-side work on a route that has shown intermittent browser stalls during verification.

## Layer Impact

- `global-control-lane`: Updates the shared Source Optimize Contract page shell behavior for all tenants.
- Products: Updates the Source Optimize Contract route presentation and chat-dock mounting behavior. The underlying contract optimization data model, opportunity calculations, approval gates, and value proof semantics are unchanged.

## Client Applicability

- All clients: Applies to any tenant using the Source Optimize Contract route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`: defers full `AgentDock` mounting until the lightweight aVa launcher is opened.
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`: proves initial render avoids mounting `AgentDock` and that aVa still receives selected-contract context after opening.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed: 3 suites, 40 tests.
- `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` passed.

## Rollout Plan

Merge through the protected repository PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Populated by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source/optimize?contractId=CTR-090&opportunityId=CTR-090%3Anegotiated-improvement`.

## Rollback Plan

Revert the PR. The route will return to mounting the full aVa dock on initial page render.

## Audit Evidence

- PR URL: To be added.
- CI / deploy run: To be added.
- Live smoke output: To be added after deployment.

## Known Gaps

Local tests prove the lazy-mount behavior. The intermittent browser stall requires live signed-in verification after deployment before this release can be called live-proven.
