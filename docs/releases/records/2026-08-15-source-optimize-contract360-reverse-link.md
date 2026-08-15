# 2026-08-15-source-optimize-contract360-reverse-link — Optimize Contract Reverse Deep Link

## Release ID

`2026-08-15-source-optimize-contract360-reverse-link`

## Status

`live-proven`

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
- Live signed-in browser proof passed after deploy.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then verify the live selected-contract round trip with a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not used by this release.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:1e1e982cab2197a335a3b991c090eff5ae1875e29a68684088691f91f7276f94`.
- ACA runtime invariant: Passed on revision
  `ca-abarva-web-lab-eastus--m8dac6271` with 100% traffic.
- Worker image invariant: Required delivery worker jobs read back on the same
  deployed digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to publish the previous behavior. No schema, data, feature flag, or migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6358.
- Merge commit: `8dac627114da003bb0678ff9f08724c08466b041`.
- Repo-owned ACA deploy run: `31885345436`.
- ACA runtime invariant proof: revision `ca-abarva-web-lab-eastus--m8dac6271`,
  image `acrabarvalab001.azurecr.io/abarva/web@sha256:1e1e982cab2197a335a3b991c090eff5ae1875e29a68684088691f91f7276f94`,
  100% traffic.
- Signed-in browser proof: `/source/optimize?contractId=CTR-090` rendered the
  selected-contract Optimize page; the `Source workspace` link resolved to
  `/source/preview/workspace?contractId=CTR-090`; clicking it opened the
  selected Contract 360 workspace with the same contract context.

## Known Gaps

None known for this narrow navigation fix. This release does not change Contract 360 data quality, calculation traceability, or optimization workflow semantics.
