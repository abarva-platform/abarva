# 2026-06-04-model-card-public-route — Model Card Public Route Contract

## Release ID

`2026-06-04-model-card-public-route`

## Status

`candidate`

## Plain-English Summary

The public model card is now explicitly treated as a public trust page at the proxy layer. The existing public route contract for `/product` and `/how-it-works` is also aligned with the proxy matcher. This prevents authenticated app shells and crawl harnesses from seeing Clerk sign-in redirects when Next.js prefetches public marketing or trust pages.

## Layer Impact

- `global-control-lane`: Updates shared proxy route classification for one public trust page.
- Public trust surface: Keeps the model card reachable without application sign-in, matching how it is linked from the public footer and AI trust page.
- Public marketing surface: Keeps `/product` and `/how-it-works` reachable without application sign-in, matching the existing route contract tests.

## Client Applicability

- All clients: Authenticated shells no longer produce cross-origin Clerk redirect console noise when public marketing or trust pages are prefetched.
- Public/demo only: The model card, product overview, and How It Works pages remain public artifacts.
- Feature flag: None.

## Changes Included

- `src/proxy.ts`: adds `/model-card(.*)`, `/product(.*)`, and `/how-it-works(.*)` to `PUBLIC_ROUTE_PATTERNS`; removes `/product(.*)` and `/how-it-works(.*)` from auth-required route patterns.
- `src/__tests__/unit/proxy-public-routes.test.ts`: pins `/model-card` as public and not auth-required.

## QA / Validation

- PASS: Targeted unit test `npx jest src/__tests__/unit/proxy-public-routes.test.ts --runInBand` completed with 12/12 tests passing. Jest emitted existing duplicate manual mock warnings, but the suite passed.
- PASS: Typecheck `npx tsc --noEmit --pretty false` completed cleanly.
- PASS: Release gate `npm run release:check -- --base origin/main --head HEAD` completed cleanly.
- PASS: Targeted ESLint `npx eslint src/proxy.ts src/__tests__/unit/proxy-public-routes.test.ts` completed cleanly.
- PASS: Whitespace audit `git diff --check` completed cleanly.

## Rollout Plan

Merge to `main`, deploy to Vercel production, then rerun the post-deploy crawl that previously reported a `/model-card` Clerk redirect console error.

## Rollback Plan

Revert the PR. Rollback only re-protects `/model-card`; no data or schema changes are involved.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production deployment: pending.
- Post-deploy crawl rerun: pending.

## Known Gaps

No functional gaps are known for the route classification change. This PR does not itself prove the production crawl is clean; the post-deploy crawl must be rerun after merge and production deploy because the original failure happened only in the deployed authenticated browser crawl.
