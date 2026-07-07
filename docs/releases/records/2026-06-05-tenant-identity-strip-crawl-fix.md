# 2026-06-05-tenant-identity-strip-crawl-fix — Tenant Identity Strip Crawl Fix

## Release ID

`2026-06-05-tenant-identity-strip-crawl-fix`

## Status

`candidate`

## Plain-English Summary

Standalone authenticated pages now show the active client name in the page body, not only in surrounding navigation. This closes a production-crawl P1 where Tower Portfolio Value, Tower Onboarding, and Home Queue could render useful content without a visible tenant identity string for the browser crawler or a rushed CXO reviewer.

## Layer Impact

`global-control-lane`: Shared authenticated application surfaces now include a reusable tenant identity strip.

`client-data-lane`: No client data, loader data, private schemas, ingestion runs, or static seed facts changed.

## Client Applicability

- All clients: Yes. The strip uses the existing active-client resolver, so Apex Retail Group, Meridian Health System, First Capital, SkyHarbor Air, and future clients render through the same canonical tenant path.
- Specific clients: Not limited to one client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/components/tenant/TenantIdentityStrip.tsx`.
- Added tenant identity strips to `/tower/portfolio`, `/tower/onboard`, and `/home/queue`.
- Added server-render unit coverage for canonical tenant rendering and an honest unavailable state.

## QA / Validation

- PASS: `npx jest src/components/tenant/__tests__/TenantIdentityStrip.test.tsx src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`.
- PASS: Scoped ESLint on the new component, test, and changed route files.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- Pending until merge: production post-deploy crawl should remove recurring `tenant-identity` findings for `tower-portfolio`, `tower-onboard`, and `home-queue`.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment and post-deploy crawl. No manual data operation is required.

## Rollback Plan

Revert this PR. The affected pages will return to their prior layout without changing any client data or ingestion state.

## Audit Evidence

- Prior production crawl artifact `26998634559` showed 16 P1 tenant-identity findings, including the three surfaces changed here for Meridian and recurring equivalent surfaces for Apex/SkyHarbor.
- PR URL and CI checks after this record is attached to the PR.

## Known Gaps

This release does not address hard-question citation-depth P1 findings, generic admin release-ledger copy, or P2 visual-canon findings.
