# 2026-05-30 · Vercel config consolidation

## Release ID
`2026-05-30-vercel-config-consolidation`

## Status
candidate

## Plain-English Summary
Production Git deployments were erroring before build output because the repository had both Vercel configuration methods at the root: `vercel.ts` and `vercel.json`. Vercel refuses to deploy when both are present. This release keeps `vercel.ts` as the canonical configuration because it owns the production build command and migration gate, moves the notification cron schedule into `vercel.ts`, and removes `vercel.json`.

## Layer Impact
- `infrastructure-lane`: restores Vercel production deploy compatibility by using one configuration method.
- `runtime-app-lane`: cron registration is preserved for `/api/cron/notifications-tick`.
- `data-plane-lane`: no schema or data changes.

## Client Applicability
- All clients: yes. Failed Vercel production deployments block every tenant from receiving merged product fixes.
- Specific clients: none.
- Internal only: no. This affects production deployment and cron registration.
- Public/demo only: no.

## Changes Included
- `vercel.ts` now includes the 1-minute notification cron schedule.
- `vercel.json` removed to eliminate the multiple-config deployment error.
- Release-control now treats `vercel.ts` and `vercel.json` as release-relevant files, so future Vercel config changes require a release record.

## QA / Validation
- PASS: `npx eslint vercel.ts`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `vercel deploy --prod --yes --force --logs --skip-domain` built successfully from `vercel.ts`; validation deployment `dpl_Gkb6CLELikMpZVNKkWgUVHD7g56P` reached `READY`.
- PASS: `vercel inspect dpl_Gkb6CLELikMpZVNKkWgUVHD7g56P --format=json` confirmed `readyState=READY`.
- BLOCKED: direct smoke against the unaliased validation deployment returned Vercel 401 protection, expected for the deployment URL. Production alias smoke must happen after merge/promote.
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked by pre-existing missing optional dependencies: `@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan
- Merge to main after green CI.
- Vercel production deploy should build from `vercel.ts`.
- Verify `app.abarva.ai` points to the new ready deployment.
- Run/confirm the post-deploy crawl against the production alias.

## Rollback Plan
- Revert this PR to restore `vercel.json`. That would also restore the multiple-config deploy failure while both files exist, so rollback should only happen with a replacement Vercel configuration plan.

## Audit Evidence
- `vercel deploy --prod --yes --force --logs` failed locally with: `Multiple config files found: vercel.json, vercel.ts. Please use only one configuration method.`
- Recent Vercel Git deployments for both `nexus` and `abarva` showed `Error` with zero useful build output while `app.abarva.ai` remained pinned to the older ready deployment `dpl_GxNH6gJpswj55si59t9hxkUps5bA`.

## Known Gaps
- This fixes configuration selection only. Any subsequent build/runtime error surfaced after Vercel starts building from `vercel.ts` must be triaged separately.
