# 2026-06-17-intelligence-j0-force-dynamic — Force-dynamic on entire J0 intelligence subtree

## Release ID

`2026-06-17-intelligence-j0-force-dynamic`

## Status

`candidate`

## Plain-English Summary

ACR builds caaf/caag/caai each crashed on a different dead J0 sub-route (`[patternId]`, then `author`) with the same error: `useSearchParams() should be wrapped in a suspense boundary`. Rather than patching 17 pages individually, this PR adds `export const dynamic = 'force-dynamic'` to `src/app/intelligence/layout.tsx`, which in Next.js App Router propagates to all child routes. The J0 subtree has no linked entry points in product navigation and should not be statically pre-rendered.

## Layer Impact

- **global-control-lane**: One file changed (`src/app/intelligence/layout.tsx`) — adds two export constants. The live Context/Corpus Explorer (`(maestro)/intelligence/page.tsx`) is unaffected. No schema, migration, or data-plane change.

## Client Applicability

All clients — build failure is universal.

## Changes Included

- `src/app/intelligence/layout.tsx`: add `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`.

## QA / Validation

- `npx tsc --noEmit --skipLibCheck` passes
- `next build` completes without any `useSearchParams` / prerender error on J0 routes
- After ACA deploy: `/intelligence` shows global nav; old J0 paths still render dynamically if hit directly

## Rollout Plan

Merge to main → ACA image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration. No feature flag change.

## Rollback Plan

Revert this PR. Build failures return; no user-visible feature affected.

## Known Gaps

- The 17 old J0 pages remain as dead code. Formal retirement deferred to a follow-up cleanup PR once PostHog confirms zero traffic to these paths.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `fix/intelligence-j0-force-dynamic`
- ACR build logs: `useSearchParams() should be wrapped in a suspense boundary at page "/intelligence/[patternId]"` and `"/intelligence/author"`
