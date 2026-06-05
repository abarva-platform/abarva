# 2026-06-05-signed-in-page-gating — Signed-In Page Gating

## Release ID

`2026-06-05-signed-in-page-gating`

## Status

`candidate`

## Plain-English Summary

Signed-out visitors now see only the high-level AbarVa landing/sign-in surface. Detailed product, architecture, training, trust, contact, status, subprocessors, and demo explainer pages are no longer public browseable pages; they require a signed-in session unless they are explicit auth/onboarding checkpoints or machine health/webhook probes.

## Layer Impact

`global-control-lane`: Tightens proxy public-route exposure for the shared app so detailed pages fall through to Clerk protection when the visitor is not signed in.

`public-demo`: Narrows the public marketing surface to the root landing page, sign-in/signed-out flows, invite/auth handoff, and required public machine probes.

## Client Applicability

- All clients: Applies to every deployed workspace and signed-out visitor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Public route exposure changes; authenticated app content is unchanged.
- Feature flag: None.

## Changes Included

- `src/proxy.ts`: Removes public matcher entries for detail pages and keeps only the Responsible AI acknowledgement/training checkpoints public at proxy level.
- `src/components/public-site/TopNav.tsx`: Sends request-access CTA to sign-in.
- `src/components/public-site/Footer.tsx`: Replaces public trust links with private-workspace trust posture copy.
- `src/app/(public)/page.tsx`: Sends landing-page request-access CTAs to sign-in.
- `src/components/marketing/LoggedOutLandingPage.tsx`: Sends signed-out request-access CTAs to sign-in.
- `src/components/marketing/MarketingNav.tsx` and `src/components/marketing/site.tsx`: Align default CTA target to sign-in.
- `src/app/(public)/sitemap.xml/route.ts`: Stops advertising private detail pages in the public sitemap.
- Tests updated for proxy route classification and public smoke lists.

## QA / Validation

- PASS: `npx jest src/__tests__/unit/proxy-public-routes.test.ts tests/public-site/shell.test.ts --runInBand` — 2 suites passed, 23 tests passed.
- PASS: `npx eslint src/proxy.ts src/components/public-site/TopNav.tsx src/components/public-site/Footer.tsx src/app/(public)/page.tsx src/components/marketing/LoggedOutLandingPage.tsx src/components/marketing/MarketingNav.tsx src/components/marketing/site.tsx src/app/(public)/sitemap.xml/route.ts src/__tests__/unit/proxy-public-routes.test.ts tests/accessibility/public-axe.spec.ts tests/browser-matrix/public-surface-smoke.spec.ts tests/public-site/shell.test.ts`
- PASS: `npm run release:check -- --base origin/main --head HEAD` — Release Control Gate passed; Pilot Data Loader Gate passed.

## Rollout Plan

Merge to `main` and deploy normally. No database migration or feature flag is required.

## Rollback Plan

Revert this release commit to restore the previous public matcher entries, public sitemap entries, and public trust/contact CTAs.

## Audit Evidence

- PR and CI checks for this release candidate.
- Proxy route test output showing detail pages are no longer public route matches.
- Browser/accessibility smoke lists showing only root, sign-in, and signed-out surfaces are treated as public HTML pages.

## Known Gaps

Live browser verification still needs a deployed preview or local Clerk-enabled session to prove anonymous redirects end at sign-in and signed-in users can still access the detail pages.
