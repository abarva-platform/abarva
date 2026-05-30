# 2026-05-30-marketing-nav-prefetch-hotfix — Marketing Nav Prefetch Hotfix

## Release ID

`2026-05-30-marketing-nav-prefetch-hotfix`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor demo capture found a console error on `/home` caused by automatic link prefetching. The marketing navigation tried to prefetch `/architecture`; Clerk redirected that background request to its sign-in domain, which the browser correctly blocked with a CORS error. This hotfix disables automatic prefetching for marketing-nav links so navigation still works when clicked, but background auth redirects no longer pollute demo capture.

## Layer Impact

- `runtime-app-lane`: Removes a browser console failure from `/home` during authenticated demo capture.
- `navigation-lane`: Marketing navigation links continue to navigate normally on click, but no longer prefetch in the background.
- `qa-validation-lane`: Adds focused lint validation and requires Packet 29 capture rerun after deploy.
- `data-plane-lane`: No data, schema, tenant, or AI behavior change.

## Client Applicability

- All clients: Yes. Shared navigation behavior changes globally.
- Specific clients: SkyHarbor exposed the issue during Phase 6 demo capture.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Sets `prefetch={false}` on internal links rendered by `src/components/marketing/MarketingNav.tsx`.

## QA / Validation

- PASS: `npx eslint src/components/marketing/MarketingNav.tsx`.
- PENDING: PR CI.
- PENDING: Production deploy after merge.
- PENDING: SkyHarbor demo capture rerun after production deploy.

## Rollout Plan

Merge after CI passes, deploy to Vercel production, then rerun Packet 29 SkyHarbor demo capture against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR. The only behavior restored would be automatic marketing-link prefetch.

## Audit Evidence

- Pre-fix demo capture failure: `/private/tmp/nexus-phase6-fast-concise/audit-artifacts/skyharbor-demo-capture-2026-05-30T08-50/skyharbor-demo-capture.json`.
- Pre-fix HTML report: `/private/tmp/nexus-phase6-fast-concise/audit-artifacts/skyharbor-demo-capture-2026-05-30T08-50/SKYHARBOR_DEMO_CAPTURE_REPORT.html`.

## Known Gaps

Phase 6 certification remains pending until the post-deploy demo capture rerun is clean.
