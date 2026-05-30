# 2026-05-30-section9-apex-crawl-followup — Section 9 Apex Crawl Follow-up

## Release ID

`2026-05-30-section9-apex-crawl-followup`

## Status

`candidate`

## Plain-English Summary

This release fixes the remaining hard failures from the post-#2526 Apex Retail
production crawl. The Admin Audit page was crashing because a server route
called a helper exported from a client-marked component. The release makes the
audit content server-safe. It also adds canonical redirects for seven Tower
index URLs that were still returning 404 during the crawl.

## Layer Impact

- `runtime-app-lane`: Restores `/admin/audit` render and prevents Tower dead
  index routes.
- `admin-control-lane`: Keeps the Admin Audit source filter server-callable.
- `tower-lane`: Routes legacy/detail-less Tower indexes to canonical Tower
  surfaces.
- `data-plane-lane`: No database mutation.

## Client Applicability

- All clients: Yes. These are route/render fixes.
- Specific clients: First verified through the Apex Retail Section 9 crawl.
- Feature flag: None.

## Changes Included

- `src/components/setup/SetupAuditPage.tsx`
- `src/app/(maestro)/tower/activity/page.tsx`
- `src/app/(maestro)/tower/outcomes/page.tsx`
- `src/app/(maestro)/tower/preview/page.tsx`
- `src/app/(maestro)/tower/projects/page.tsx`
- `src/app/(maestro)/tower/staff-aug/page.tsx`
- `src/app/(maestro)/tower/tech-stack/page.tsx`
- `src/app/(maestro)/tower/volumetrics/page.tsx`

## QA / Validation

- PASS: `npx jest src/components/setup/__tests__/SetupAuditPage.filter.test.ts --runInBand`
- PASS: `npx eslint src/components/setup/SetupAuditPage.tsx src/app/'(maestro)'/tower/activity/page.tsx src/app/'(maestro)'/tower/outcomes/page.tsx src/app/'(maestro)'/tower/preview/page.tsx src/app/'(maestro)'/tower/projects/page.tsx src/app/'(maestro)'/tower/staff-aug/page.tsx src/app/'(maestro)'/tower/tech-stack/page.tsx src/app/'(maestro)'/tower/volumetrics/page.tsx`
- PASS: `npx prettier --check src/components/setup/SetupAuditPage.tsx src/app/'(maestro)'/tower/activity/page.tsx src/app/'(maestro)'/tower/outcomes/page.tsx src/app/'(maestro)'/tower/preview/page.tsx src/app/'(maestro)'/tower/projects/page.tsx src/app/'(maestro)'/tower/staff-aug/page.tsx src/app/'(maestro)'/tower/tech-stack/page.tsx src/app/'(maestro)'/tower/volumetrics/page.tsx docs/releases/records/2026-05-30-section9-apex-crawl-followup.md`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run build`
- PASS: `git diff --check`
- PENDING: production Apex crawl rerun after merge/deploy.

## Rollout Plan

Merge after CI is green. Let Vercel deploy production from main, then rerun the
Apex Section 9 crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR. If `/admin/audit` regresses, restore the server-safe helper
boundary. If Tower dead routes return, restore the redirect pages.

## Audit Evidence

- Pre-fix production crawl:
  `audit-artifacts/comprehensive-crawl-2026-05-30/apex-retail/post-2526-production-rerun/FULL_MODULE_STRESS_TEST_REPORT.html`
- Vercel runtime error: `isAuditSourceFilter()` was invoked from the server
  while exported by a client-marked component.

## Known Gaps

The post-#2526 crawl still reports tenant-reference policy findings on
educational/marketing/internal pages. This PR fixes only hard status failures:
`/admin/audit` 500 and Tower 404 index routes.
