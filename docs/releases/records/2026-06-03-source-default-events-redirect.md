# 2026-06-03-source-default-events-redirect — Default `/source` to the Events view

## Release ID

`2026-06-03-source-default-events-redirect`

## Status

`candidate`

## Plain-English Summary

This change updates the default Source landing route so `/source` redirects to `/source/events` instead of `/source/queue`. The Events view is the current Source operating surface with Sentinel Source on the left and the sourcing workspace on the right, while Queue and Portfolio remain available from the sub-navigation.

## Layer Impact

- `global-control-lane`: shared Source route behavior changes for every signed-in tenant. The default landing target for `/source` is now the Events surface instead of the Queue surface.

## Client Applicability

- All clients: yes, for signed-in users who enter Source via `/source`
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/app/(maestro)/source/page.tsx`
  - change redirect target from `/source/queue` to `/source/events`
  - update the route comment to reflect the Events + Sentinel dock intent

## QA / Validation

- `git diff --check`
  - Passed
- `npm run release:check -- --base origin/main --head HEAD`
  - Passed
- Manual runtime verification is deferred to deploy because this repo requires real Clerk + DB credentials to render authenticated Source surfaces locally.

## Rollout Plan

Merge to `main` and let Vercel deploy production. After deploy, verify with `curl -sI https://app.abarva.ai/source | grep -i location` and confirm `location: /source/events`.

## Rollback Plan

Revert this commit or PR. The rollback is a single-file route redirect change with no schema or data implications.

## Audit Evidence

- This release record
- PR diff showing the redirect target change
- Post-deploy `curl -I` response or browser navigation proof for `/source`

## Known Gaps

- No local authenticated browser preview was started for this change because the redirect behavior can be verified more reliably after deploy on the real app surface.
