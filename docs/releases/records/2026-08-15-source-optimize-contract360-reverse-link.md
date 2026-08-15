# 2026-08-15-source-optimize-contract360-reverse-link — Optimize Contract Reverse Deep Link

## Release ID

`2026-08-15-source-optimize-contract360-reverse-link`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract header now returns a selected-contract user to that contract's Source workspace detail view instead of dropping them on the portfolio canvas. This keeps the review loop anchored to the same governed contract context.

## Layer Impact

- Release lane: `global-control-lane`.
- PRODUCTS: Updates Source Optimize navigation only. The selected contract id is carried into the Source workspace URL.
- CANONICAL MODEL: No change. The same governed Source read models remain authoritative.

## Client Applicability

- All clients: Source users working through Optimize Contract with a selected contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Optimize header builds the Source workspace link with `contractId` when a contract is selected.
- Unit coverage asserts the selected-contract reverse link.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` passed.
- `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` passed.
- `git diff --check` passed.
- Live signed-in browser proof pending after deploy.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then verify the live selected-contract round trip with a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not used by this release.
- Approved image digest: Pending repo-owned deploy workflow.
- ACA runtime invariant: Pending after deploy.
- Worker image invariant: Pending after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to publish the previous behavior. No schema, data, feature flag, or migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Repo-owned ACA deploy run: Pending.
- ACA runtime invariant proof: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

None known for this narrow navigation fix. This release does not change Contract 360 data quality, calculation traceability, or optimization workflow semantics.
