# 2026-06-17-intelligence-patternid-dynamic — Force-dynamic on /intelligence/[patternId] to fix build crash

## Release ID

`2026-06-17-intelligence-patternid-dynamic`

## Status

`candidate`

## Plain-English Summary

The ACR builds `caaf` and `caag` (triggered by PRs #3594 and #3596) both failed with: `useSearchParams() should be wrapped in a suspense boundary at page "/intelligence/[patternId]"`. `IntelligencePatternDetailPage` calls `useSearchParams()` somewhere in its tree without a `<Suspense>` boundary, which prevents Next.js from statically pre-rendering the J0 pattern-detail pages during `next build`. Adding `export const dynamic = 'force-dynamic'` opts these pages out of static generation, which is correct — they are dead J0 code not linked from the product navigation.

## Layer Impact

- **global-control-lane**: One file changed (`src/app/intelligence/[patternId]/page.tsx`) — adds two export constants. No schema, migration, or data-plane change.

## Client Applicability

All clients — build failure is universal. These J0 pages are not feature-gated; they are simply dead routes left over from before the Context/Corpus Explorer.

## Changes Included

- `src/app/intelligence/[patternId]/page.tsx`: add `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`.

## QA / Validation

- `npx tsc --noEmit --skipLibCheck` passes
- `next build` must complete without the `useSearchParams` / prerender error on `/intelligence/[patternId]`
- After ACA deploy: `/intelligence` shows global nav (AppChrome); `/intelligence/t3-h01` still renders (dynamically) for any user who navigates there directly

## Rollout Plan

Merge to main → ACA image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration. No feature flag change.

## Rollback Plan

Revert this PR. The build failure returns but no data or user-visible feature is affected.

## Known Gaps

- The old J0 sub-routes (`[patternId]`, `patterns`, `topics`, etc.) are dead code and should be formally removed in a follow-up PR once confirmed unused in analytics.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `fix/intelligence-patternid-dynamic`
- ACR build logs `caaf`/`caag`: `⨯ useSearchParams() should be wrapped in a suspense boundary at page "/intelligence/[patternId]"`
