# 2026-06-17-intelligence-nav-restore-v2 — Restore intelligence/layout.tsx to fix build prerender failure

## Release ID

`2026-06-17-intelligence-nav-restore-v2`

## Status

`candidate`

## Plain-English Summary

PR #3594 deleted `src/app/intelligence/layout.tsx` (a passthrough), which broke `next build`: the old J0 pattern-detail pages (`/intelligence/[patternId]`) lost their layout boundary and began inheriting the root app layout, which initialises Clerk auth. Clerk auth calls fail during static prerender, crashing the ACR build. This PR restores the layout as an explicit passthrough with a comment explaining why it must remain until the old J0 sub-routes are retired.

## Layer Impact

- **global-control-lane**: One file restored (`src/app/intelligence/layout.tsx`). No schema, migration, or data-plane change. The Context/Corpus Explorer main page remains at `(maestro)/intelligence/page.tsx` as moved by #3594.

## Client Applicability

All clients — build failure is universal. Fix unblocks the ACA deploy that was broken by #3594.

## Changes Included

- `src/app/intelligence/layout.tsx` → **restored** with an explanatory comment documenting the Clerk-prerender boundary constraint.

## QA / Validation

- `npx tsc --noEmit --skipLibCheck` passes
- `next build` must complete without the "Export encountered an error on /intelligence/[patternId]/page" prerender failure
- After ACA deploy: `/intelligence` shows global nav (AppChrome via maestro); `/intelligence/t3-h01` still renders the old pattern detail page without Clerk crash

## Rollout Plan

Merge to main → ACA image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration. No feature flag change.

## Rollback Plan

Revert this PR. The build failure returns but no data is lost.

## Known Gaps

- The old J0 sub-routes (`[patternId]`, `patterns`, `topics`, etc.) are dead code from the pre-Explorer era and are not linked from the product. They should be formally removed in a follow-up PR once confirmed unused.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `fix/intelligence-nav-restore-v2`
- ACR build `caaf` failure log: "Export encountered an error on /intelligence/[patternId]/page: /intelligence/t3-h01"
- Root cause: `getActiveClientRow()` + `IntelligencePatternDetailPage` fail under the Clerk-initialising root layout during static generation
