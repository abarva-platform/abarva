# 2026-06-17 Intelligence Author Force-Dynamic — unblock the production build

## Release ID

`2026-06-17-intelligence-author-force-dynamic`

## Status

`candidate`

## Plain-English Summary

Unblocks the production image build. `next build` failed while prerendering `/intelligence/author`: the route's client component calls `useSearchParams()`, which bails out of static client-side rendering, and the page already reads the active client per-request — so it must not be statically prerendered. Adding `export const dynamic = 'force-dynamic'` renders it on demand, matching every sibling intelligence route (`map`, `brief`, `context-demo`, `[patternId]`) that already does this. No behavior change for users; it only changes when the page is rendered (per-request vs build-time).

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** UI/route config — one line on `src/app/intelligence/author/page.tsx`. No data-plane, schema, provider, or API change.

## Client Applicability

- **All clients:** Yes — it restores the ability to build and deploy the app; the `/intelligence/author` route renders dynamically as the sibling routes already do.
- **Feature flag:** None.

## Changes Included

- `src/app/intelligence/author/page.tsx` — add `export const dynamic = 'force-dynamic'`.

## QA / Validation

- Root cause from the failed ACR build (`next build`): `useSearchParams() should be wrapped in a suspense boundary at page "/intelligence/author"` → `Error occurred prerendering page "/intelligence/author"` → build exit 1.
- Sibling routes (`map`, `brief`, `context-demo`, `[patternId]`) already set `force-dynamic`; this aligns `author` with that convention.
- Verification: the subsequent `az acr build` completes (the prerender step no longer runs for this route).

## Rollout Plan

Merge to `main` (squash), then `az acr build` → ACA web revision + worker job image. No migration, no flag.

## Rollback Plan

Revert the one-line change; the build returns to its failing state, so rollback is only meaningful alongside reverting whatever reintroduces the static-prerender path.

## Audit Evidence

- PR: (to attach on open)
- Build: the ACR build that previously failed on `/intelligence/author` now succeeds.

## Known Gaps

- Other routes that read per-request data but lack `force-dynamic` could hit the same prerender bailout if they add `useSearchParams`; a lint rule or shared layout default would prevent recurrence. Out of scope here.
