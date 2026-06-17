# 2026-06-17-intelligence-j0-remove-static-params — Remove generateStaticParams from all J0 dynamic pages

## Release ID

`2026-06-17-intelligence-j0-remove-static-params`

## Status

`candidate`

## Plain-English Summary

Successive build fixes (#3596 layout restore, #3598 layout force-dynamic, #3597/#3601 page-level force-dynamic) all failed because Next.js 16 processes `generateStaticParams()` regardless of any `dynamic = 'force-dynamic'` setting on either the page or its parent layout. The only reliable fix is to remove `generateStaticParams()` from the 6 J0 dynamic-param pages entirely. Without it, those routes are treated as fully dynamic (rendered per request, not pre-rendered) and `next build` never attempts static generation for them.

## Layer Impact

- **global-control-lane**: 6 files changed — `generateStaticParams()` removed from `[patternId]`, `contradictions/[contradictionId]`, `failure-modes/[slug]`, `signals/[signalId]`, `solutions/[solutionId]`, `topics/[topicId]`. Also cleans up unused `getKnown*Ids` imports and a stale `// generateStaticParams() pre-renders…` comment. No schema, migration, or data-plane change.

## Client Applicability

All clients — build failure is universal.

## Changes Included

- `src/app/intelligence/[patternId]/page.tsx`: remove `generateStaticParams` + `getKnownPatternIds` import + stale `force-dynamic` exports from PR #3597
- `src/app/intelligence/contradictions/[contradictionId]/page.tsx`: remove `generateStaticParams` + `getKnownContradictionIds` import
- `src/app/intelligence/failure-modes/[slug]/page.tsx`: remove `generateStaticParams` (imports retained — `J0_FAILURE_MODE_CARDS` used in render)
- `src/app/intelligence/signals/[signalId]/page.tsx`: remove `generateStaticParams` + `getKnownSignalIds` import
- `src/app/intelligence/solutions/[solutionId]/page.tsx`: remove `generateStaticParams` + `getKnownSolutionIds` import
- `src/app/intelligence/topics/[topicId]/page.tsx`: remove `generateStaticParams` + stale comment (imports retained — `J1_TOPICS`/`J0_FAILURE_MODE_CARDS` used in render)

## QA / Validation

- `npx tsc --noEmit --skipLibCheck` passes
- `next build` completes without any prerender error on J0 routes
- After ACA deploy: `/intelligence` shows global nav; J0 paths render dynamically on direct access

## Rollout Plan

Merge to main → ACA image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration.

## Rollback Plan

Revert this PR. Build failures return; no user data affected.

## Known Gaps

- The 6 pages and the rest of the J0 subtree are dead code. PostHog traffic audit → formal retirement PR deferred.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `fix/intelligence-j0-remove-static-params`
- ACR build failures: caaf (#3594), caag (#3596), caai (#3598/#3601) — all `useSearchParams` + prerender crash on successive J0 routes
