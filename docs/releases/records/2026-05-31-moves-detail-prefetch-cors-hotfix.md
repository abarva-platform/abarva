# 2026-05-31-moves-detail-prefetch-cors-hotfix - Moves Detail Prefetch CORS Hotfix

## Release ID

`2026-05-31-moves-detail-prefetch-cors-hotfix`

## Status

`candidate`

## Plain-English Summary

This release prevents the Strategic Moves list from background-prefetching protected Move detail pages. The prior behavior could emit a browser console CORS error when Next.js prefetched a protected RSC route that Clerk redirected through its sign-in origin.

## Layer Impact

- `global-control-lane`: changes shared Strategic Moves navigation behavior for protected detail links without changing the user-visible destination.
- `client-data-lane`: no data, schema, tenant, or private data-plane change.
- `qa-validation-lane`: targets the post-deploy crawl P0 on `apexretail` / `apex-cio` / `moves-list`.

## Client Applicability

- All clients: yes, for authenticated Strategic Moves list links.
- Specific clients: Apex surfaced the post-deploy crawl repro.
- Internal only: none.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `prefetch={false}` to Strategic Moves list links that navigate to `/strategic-moves/[moveId]`.

## QA / Validation

- Passed: `npx eslint src/components/strategic-moves/StrategicMovesHomeClient.tsx`.
- Passed: `git diff --check`.
- Not run yet: post-merge production crawl; this is required after Vercel production deployment.

## Rollout Plan

Merge to `main`, wait for Vercel production deployment, then rerun post-deploy crawl or a targeted authenticated Moves-list browser smoke.

## Rollback Plan

Revert this release PR. No database migrations are included.

## Audit Evidence

- Triggering failed crawl: https://github.com/anandsundaram-hash/abarva/actions/runs/26712824647
- Failed crawl artifact: https://github.com/anandsundaram-hash/abarva/actions/runs/26712824647/artifacts/7316843952
- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2659

## Known Gaps

The broader P1 crawl backlog remains out of scope for this hotfix.
