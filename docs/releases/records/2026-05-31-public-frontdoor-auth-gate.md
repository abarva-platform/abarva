# 2026-05-31-public-frontdoor-auth-gate - Public Front Door Auth Gate

## Release ID

`2026-05-31-public-frontdoor-auth-gate`

## Status

`candidate`

## Plain-English Summary

This release tightens the unauthenticated AbarVa surface so public visitors see a concise marketing front door and contact path only. Product, Learn-style, architecture, intelligence, pattern, demo, investor, and training routes now require sign-in before showing deeper product or methodology content.

## Layer Impact

- `global-control-lane`: updates shared unauthenticated routing, public navigation, and marketing surfaces before client selection.
- `client-data-lane`: no tenant data, context, schema, or private data-plane behavior changes.
- `qa-validation-lane`: adds public-shell contract coverage and route-smoke evidence for protected IP-heavy pages.

## Client Applicability

- All clients: authenticated users keep access to their existing app surfaces after login.
- Specific clients: none.
- Internal only: none.
- Public/demo only: affects unauthenticated visitors to `app.abarva.ai`.
- Feature flag: none.

## Changes Included

- `src/proxy.ts` public-route allowlist and auth-required route patterns.
- `src/components/marketing/LoggedOutLandingPage.tsx` public landing content and visual system.
- `src/components/marketing/MarketingNav.tsx`, `src/components/marketing/site.tsx`, `src/components/public-site/TopNav.tsx`, and `src/components/public-site/Footer.tsx` logged-out navigation cleanup.
- `public/marketing/ai-success-platform-boardroom.png` generated marketing visual.
- `src/components/auth/DemoCodeSignIn.tsx` logo image sizing cleanup.
- Public-shell test expectations updated in `tests/public-site/shell.test.ts`.

## QA / Validation

- `npx eslint src/proxy.ts src/components/marketing/LoggedOutLandingPage.tsx src/components/marketing/MarketingNav.tsx src/components/marketing/site.tsx src/components/public-site/TopNav.tsx src/components/public-site/Footer.tsx src/components/auth/DemoCodeSignIn.tsx tests/public-site/shell.test.ts` passed.
- `npx jest tests/public-site/shell.test.ts --runInBand` passed: 13 tests.
- `git diff --check` passed.
- Local route smoke passed:
  - `/` public.
  - `/contact` public.
  - `/product`, `/architecture`, `/patterns`, `/intelligence`, and `/training/how-to-create-a-move.html` redirect to `/sign-in?redirect=...`.
- Local screenshot captured at `/tmp/abarva-public-frontdoor-clean-worktree.png`.

## Rollout Plan

Merge to `main`, allow the Vercel production deployment to complete, confirm the production alias points to the new deployment, and smoke `https://app.abarva.ai` plus the newly protected routes.

## Rollback Plan

Revert the release PR or roll Vercel back to the prior production deployment. No database migrations or data-plane changes are included.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2658
- Production deployment ID: to be added after production deployment.
- Live smoke artifact: to be captured after production deployment.

## Known Gaps

Development mode currently reports an existing `not-found.tsx` console overlay when probing some redirected routes; the route behavior itself is correct and production smoke is the authoritative check.
