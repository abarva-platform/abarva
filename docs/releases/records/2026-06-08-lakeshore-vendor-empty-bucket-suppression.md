# 2026-06-08-lakeshore-vendor-empty-bucket-suppression — Lakeshore Vendor Empty Bucket Suppression

## Release ID

`2026-06-08-lakeshore-vendor-empty-bucket-suppression`

## Status

`candidate`

## Plain-English Summary

The Intelligence Vendors surface no longer shows empty vendor-spend categories as `$0.0M`. Lakeshore had real vendor contracts and spend loaded, but one standard category had no vendors and made the page look partially unbound. The page now shows only categories that actually have vendor rows.

## Layer Impact

- `global-control-lane`: shared Intelligence Vendors UI behavior changes for all tenants.
- `client-data-lane`: Lakeshore is the acceptance tenant because the issue appeared while validating its loaded vendor records.

## Client Applicability

- All clients: receive the safer empty-category rendering.
- Specific clients: Lakeshore Holdings is the verified acceptance target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; follows the existing authenticated Intelligence surface.

## Changes Included

- `src/components/intelligence-v3/VendorsCxoCanvas.tsx`: suppresses empty vendor-spend categories before rendering category cards and drilldown filters.
- `src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx`: asserts Lakeshore vendor rows do not render `$0.0M`.
- PR: to be filled after creation.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx --runInBand`
- PASS: `npx eslint src/components/intelligence-v3/VendorsCxoCanvas.tsx src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx`
- PASS: `git diff --check`
- Planned post-merge: Azure Container Apps rebuild/deploy by pinned digest and signed-in Lakeshore browser QA against `/intelligence?client=lakeshore#vendors`.

## Rollout Plan

Merge to main, build a new ACR image from main, deploy to Azure Container Apps by immutable digest, wait for the new revision to be Provisioned/Running, then shift 100% traffic to the new revision.

## Rollback Plan

Revert this PR and redeploy the previous known-good Azure image digest. The rollback is visual only and does not alter tenant records, loaders, search indexes, or database schema.

## Audit Evidence

- Browser QA artifacts: `reports/azure-main-20260608-bc73d655-postdeploy/`.
- Azure deployment evidence will be added to the same report folder after merge/deploy.
- PR URL and merge commit will be recorded after creation.

## Known Gaps

The broader Lakeshore module-readiness pass still needs final signed-in browser QA after this patch is deployed. Art of Possible, Moves substrate, Tower substrate, Sentinel/Nexus CXO answer QA, and deeper industry-corpus usage remain separately tracked module-readiness gaps.
