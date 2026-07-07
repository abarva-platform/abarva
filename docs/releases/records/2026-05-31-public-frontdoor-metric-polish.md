# 2026-05-31-public-frontdoor-metric-polish — Public Front Door Metric Polish

## Release ID

`2026-05-31-public-frontdoor-metric-polish`

## Status

`candidate`

## Plain-English Summary

This release polishes the logged-out public AbarVa hero dashboard so the right-side visual reads as a powerful value command panel instead of a cramped metric grid. The panel now highlights value protected, failure exposure, decision readiness, proof trail, and the AbarVa lifecycle without overflowing copy or unclear blank status boxes.

## Layer Impact

- `global-control-lane`: updates the shared unauthenticated marketing page used before sign-in.
- `client-data-lane`: no tenant data, context, schema, or private data-plane behavior changes.
- `qa-validation-lane`: requires focused lint, production build, and public-route smoke after deployment.

## Client Applicability

- All clients: no authenticated app behavior change.
- Specific clients: none.
- Internal only: none.
- Public/demo only: affects unauthenticated visitors to `app.abarva.ai`.
- Feature flag: none.

## Changes Included

- `src/components/marketing/LoggedOutLandingPage.tsx` hero dashboard polish.
- Replaces the cramped three-card metric row with a larger value panel, readable signal rows, and a clearer lifecycle strip.

## QA / Validation

- Pass: focused ESLint for `src/components/marketing/LoggedOutLandingPage.tsx`.
- Pass: `git diff --check`.
- Pass: release gate after this record was added.
- Pass: production build.
- Pass: local desktop and mobile screenshot smoke.
- Not run yet: production smoke after merge and deploy.

## Rollout Plan

Merge to `main`, wait for Vercel production deployment, confirm `https://app.abarva.ai` points to the new deployment, and smoke the logged-out home page plus protected route redirects.

## Rollback Plan

Revert this release PR or roll Vercel back to the previous production deployment. No database migrations are included.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2676
- Production deployment ID: to be added after production deployment.
- Local smoke artifacts: `/tmp/abarva-frontdoor-value-command-panel-desktop.png`, `/tmp/abarva-frontdoor-value-command-panel-mobile.png`.
- Production smoke artifact: to be captured after deployment.

## Known Gaps

This release only polishes the public hero dashboard storytelling. The values shown are illustrative public marketing signals, not live customer-specific financial calculations, and authenticated Tower value models remain the source of truth for client-specific savings, redirected spend, and outcome proof.
