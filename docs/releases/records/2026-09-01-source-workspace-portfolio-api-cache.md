# 2026-09-01-source-workspace-portfolio-api-cache - Source Workspace Portfolio API Cache

## Release ID

`2026-09-01-source-workspace-portfolio-api-cache`

## Status

`candidate`

## Plain-English Summary

The Source workspace portfolio endpoint now coalesces repeated reads for the same authorized account scope, as-of date, and provider for a short window. The page still authorizes every request before reading cached data, and browser caches are disabled.

## Layer Impact

Layer 4 PRODUCTS: Source workspace read behavior changes only at the product API boundary.

Lane: `global-control-lane`.

No canonical data, ingestion, projections, account-scoped rows, or evidence records are changed.

## Client Applicability

- All clients: Yes, for the Source workspace portfolio API route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing provider override behavior remains unchanged.

## Changes Included

- `src/app/api/source/workspace/portfolio/route.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts'` passed.

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Verified by the deploy workflow.
- Worker image invariant: Verified by the deploy workflow.
- Feature/env flag update path: No change.
- Live signed-in proof required: Yes, verify Source workspace request timing, repeated-request cache behavior, and cross-account data isolation.

## Rollback Plan

Revert the route cache change and redeploy through the same Azure Container Apps main workflow.

## Audit Evidence

Review the pull request, CI checks, Azure Container Apps deployment run, and post-deploy Source workspace proof bundle.

## Known Gaps

The cache improves repeated reads and coalesces concurrent requests. It does not replace deeper API slimming or per-tab lazy loading.
