# 2026-05-31-public-frontdoor-visual-upgrade - Public Front Door Visual Upgrade

## Release ID

`2026-05-31-public-frontdoor-visual-upgrade`

## Status

`candidate`

## Plain-English Summary

This release upgrades the logged-out public AbarVa page from a boxed hero layout to a full-width, cinematic AI Success Platform landing page. The public surface now uses the stronger executive-workshop dashboard visual, an AbarVa-branded AI success metrics overlay, a richer outcome/value story, and broader below-the-fold sections that explain AbarVa's decision operating system without exposing private product IP.

## Layer Impact

- `global-control-lane`: updates the shared unauthenticated marketing page used before sign-in.
- `client-data-lane`: no tenant data, context, schema, or private data-plane behavior changes.
- `qa-validation-lane`: requires focused component lint, production build, and public-route smoke after deployment.

## Client Applicability

- All clients: no authenticated app behavior change.
- Specific clients: none.
- Internal only: none.
- Public/demo only: affects unauthenticated visitors to `app.abarva.ai`.
- Feature flag: none.

## Changes Included

- `src/components/marketing/LoggedOutLandingPage.tsx` full-width hero and product-story redesign.
- Full-bleed use of `public/marketing/ai-success-platform-boardroom.png` as the executive dashboard visual.
- AbarVa-branded dashboard overlay with value, failure-mode, move-readiness, and value-tracking signals.

## QA / Validation

- Passed: `npx eslint src/components/marketing/LoggedOutLandingPage.tsx`.
- Passed: `git diff --check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`.
- Passed: `npm run build`.
- Passed: local browser screenshot smoke for desktop and mobile public home.
- Passed: local browser screenshot smoke after adding the high-level decision capability constellation and AbarVa success-metrics overlay.
- Not run yet: production smoke.

## Rollout Plan

Merge to `main`, wait for Vercel production deployment, confirm `https://app.abarva.ai` points to the new deployment, and smoke the logged-out home page plus protected route redirects.

## Rollback Plan

Revert this release PR or roll Vercel back to the previous production deployment. No database migrations are included.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2666
- Production deployment ID: to be added after production deployment.
- Local smoke artifacts: `/tmp/abarva-frontdoor-boardroom-dashboard-desktop-v3.png`, `/tmp/abarva-frontdoor-boardroom-dashboard-mobile-v3.png`.
- Production smoke artifact: to be captured after deployment.

## Known Gaps

This release intentionally improves the public visual/storytelling layer only. It does not expose additional product methodology, client primers, corpus depth reports, training pages, or authenticated module details to unauthenticated visitors.
