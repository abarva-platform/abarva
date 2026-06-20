# 2026-06-20-home-v2-asset-hotfix — Home v2 Asset Delivery Hotfix

## Release ID

`2026-06-20-home-v2-asset-hotfix`

## Status

`candidate`

## Plain-English Summary

This hotfix removes the Home v2 production 404s caught by the post-deploy crawl. The Home v2 frame now rewrites its bundled font references to stable public `/home-v2/` URLs, and the historical `/brand/abarva-logo-inverse.svg` URL is restored as a compatibility asset for embedded frames that still reference it.

## Layer Impact

- `global-control-lane`: shared authenticated `/home` frame asset delivery for all clients.
- `client-data-lane`: no data schema, tenant data, ingestion, retrieval, or migration change.

## Client Applicability

- All clients: applies anywhere the shared Home v2 frame is rendered.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `/api/home/v2-frame` rewrites relative Home v2 `.woff2` references to `/home-v2/*.woff2`.
- Restores `public/brand/abarva-logo-inverse.svg` as a compatibility path backed by the canonical dark nav logo asset.
- Adds focused integration coverage for the stable Home v2 asset paths.
- Scales the composite disclaimer and pattern-observation integrity tests so they assert the full canonical route catalog while rendering representative pattern samples after the W2.1 manifest expansion.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/__tests__/integration/home/home-v2-all-client-binding.test.ts`.
- Pass: `npx eslint src/app/api/home/v2-frame/route.ts src/__tests__/integration/home/home-v2-all-client-binding.test.ts`.
- Pass: `npm run integrity:disclaimers`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: local static smoke on `http://localhost:3010/brand/abarva-logo-inverse.svg` and `http://localhost:3010/home-v2/66b91e1c-3307-4323-ad3c-d9ae23547cb4.woff2` returned `200 OK`.
- Blocked locally: `/api/home/v2-frame` requires a signed-in Clerk session and returned the expected signed-out middleware response.
- Pending: post-deploy signed-in crawl rerun for `skyharbor-cto` on `home`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the image. No data migration, DNS change, feature flag, or environment-variable rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: repo-owned deploy workflow only.
- Approved image digest: captured by the main deploy workflow after merge.
- ACA runtime invariant: deploy workflow must verify template image, traffic revision image, and active revision image agree.
- Worker image invariant: deploy workflow must keep worker jobs on the approved image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, post-deploy crawl for the Home surface must be clean of these asset 404s.

## Rollback Plan

Revert the hotfix PR and redeploy the previous approved main image. Since no data or schema migration is included, rollback is code/assets only.

## Audit Evidence

- Failed post-deploy crawl run `27880909828` reported `/brand/abarva-logo-inverse.svg` and `/api/home/*.woff2` 404s on SkyHarbor Home.
- PR URL and merge commit.
- Focused test output.
- Release gate output.
- Post-deploy crawl rerun output.

## Known Gaps

This hotfix only addresses the P0 Home asset 404s. The existing crawl P1s for missing demo auth users and hard-question citation depth are tracked separately and are not changed here.
