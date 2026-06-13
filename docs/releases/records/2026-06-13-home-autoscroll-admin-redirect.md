# 2026-06-13-home-autoscroll-admin-redirect — Home shell scroll and admin bookmark redirect

## Release ID

`2026-06-13-home-autoscroll-admin-redirect`

## Status

`candidate`

## Plain-English Summary

The shared agent column no longer scrolls the whole page to the bottom when a surface loads with an empty conversation. Legacy `/home/admin` bookmarks now redirect to the canonical `/admin` route instead of landing on a missing page.

## Layer Impact

- `global-control-lane`: updates shared shell behavior and route redirects that apply across the product.

## Client Applicability

- All clients: yes, because the shell and route redirect are shared.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/shell/AgentColumn.tsx`
- `next.config.ts`

## QA / Validation

- pass: `npx eslint src/components/shell/AgentColumn.tsx next.config.ts`
- pass: `git diff --check`
- pending: `npm run release:check -- --base origin/main --head HEAD` after this record is finalized
- not-run: full GitHub CI, because the PR has not been published yet
- not-run: Azure lab browser verification, because the change has not been merged or deployed yet

## Rollout Plan

Merge to `main`, build a new Azure Container Apps lab image, deploy to `ca-abarva-web-lab-eastus`, and browser-check `/home` plus `/home/admin`.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA lab image. No migration or data change is included.

## Audit Evidence

- PR and CI evidence to be attached after publication.
- Browser evidence should show `/home` remains at the top on load and `/home/admin` redirects to `/admin`.

## Known Gaps

This candidate does not redesign the shared agent column, change any chat behavior, or alter admin authorization. It only prevents empty-thread mount scrolling from moving the outer page and keeps stale `/home/admin` bookmarks landing on the existing `/admin` surface.
