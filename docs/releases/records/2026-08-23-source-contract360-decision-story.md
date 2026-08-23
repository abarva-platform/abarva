# 2026-08-23-source-contract360-decision-story — Contract 360 Decision Story

## Release ID

`2026-08-23-source-contract360-decision-story`

## Status

`candidate`

## Plain-English Summary

Contract 360 now separates optimization action triggers from supporting context and evidence gates. The opening story explains why a contract is in the optimization queue without treating distant renewal timing, spend variance, or missing evidence as confirmed savings or urgency.

## Layer Impact

- Release lane: `global-control-lane`.
- Product layer: Updates the Source Contract 360 decision story and Optimize handoff copy.
- Canonical projection model: Adds a reason role to the existing contract optimization fit reasons so downstream UI and aVa context can distinguish action triggers, supporting context, and evidence gates.

## Client Applicability

- All clients: Applies to Source Contract 360 surfaces using the shared contract optimization spine.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/contract-optimization-spine.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- Targeted Source and Contract 360 tests covering reason roles and executive story copy.

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts --runInBand` — passed.
- `npx jest --runTestsByPath "src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx" --runInBand` — passed.
- `npx jest --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed.
- `npx eslint src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/contract-optimization-spine.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx'` — passed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge to `main` through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared Product/Lab web image. No data migration, tenant-data mutation, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live runtime rollout.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned ACA workflow after merge.
- ACA runtime invariant: Must be proved by the deploy workflow before calling the change live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required before claiming the deployed UI is live-proven.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the previous shared Source behavior. No database rollback is required.

## Audit Evidence

- PR URL and merge SHA after review.
- CI and release-check output.
- Repo-owned ACA deploy workflow run after merge.
- Signed-in Contract 360 browser proof before calling live-proven.

## Known Gaps

- This release does not mutate Source data, create new opportunity calculations, or change Optimize workflow gates.
- Live signed-in proof is still required after deploy.
