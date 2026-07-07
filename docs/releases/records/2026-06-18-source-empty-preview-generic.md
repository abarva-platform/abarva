# 2026-06-18-source-empty-preview-generic — Source Empty Preview Tenant-Neutral Label

## Release ID

`2026-06-18-source-empty-preview-generic`

## Status

`candidate`

## Plain-English Summary

The Source portfolio empty-state preview now labels itself as a generic sample. This reinforces that the preview rows are illustrative and tenant-neutral, so empty tenants do not appear to carry another client's sourcing context.

## Layer Impact

`global-control-lane`: updates shared Source UI copy for all tenants. No schema, data-plane, ingestion, or retrieval behavior changes.

## Client Applicability

- All clients: Source portfolio empty state receives the tenant-neutral sample label.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/portfolio/PortfolioEmptyState.tsx`
- `src/components/source/__tests__/PortfolioEmptyStatePreview.test.ts`

## QA / Validation

- Pass: `npx eslint src/components/source/portfolio/PortfolioEmptyState.tsx src/components/source/__tests__/PortfolioEmptyStatePreview.test.ts`
- Pass: `npm test -- --runTestsByPath src/components/source/__tests__/PortfolioEmptyStatePreview.test.ts --runInBand`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pending: PR CI and ACA deploy.

## Rollout Plan

Merge to `main`; the standard Azure Container Apps main deployment builds and shifts traffic after the production health check.

## Rollback Plan

Revert the UI copy/test commit and redeploy through the standard ACA workflow. No data rollback is required.

## Audit Evidence

- Local validation commands and CI run URLs will be attached in the PR.
- Post-deploy crawl should no longer report tenant-specific Source preview leakage for empty Source portfolios.

## Known Gaps

This does not change real Source event data. It only makes the empty-state preview explicitly generic and forces a fresh UI bundle through deploy.
