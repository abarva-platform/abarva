# 2026-06-09-remove-product-route-root-signin — Remove /product page; root → sign-in

## Release ID
`2026-06-09-remove-product-route-root-signin`

## Status
`candidate`

## Plain-English Summary
Two changes to the application-domain entry experience:
1. **Removed the `/product` marketing page.** The "Product" link was already pulled
   from the signed-in top bar (PR #3372); this deletes the route itself so the page
   no longer exists. There is no in-app product page to replace it — signed-in users
   are already inside the product.
2. **`app.abarva.ai/` now routes to authentication.** Signed-out visitors are
   redirected straight to the Clerk sign-in flow (`/sign-in`) instead of the marketing
   landing page. Signed-in users continue to be redirected into the app (Home/Tower/
   etc.) exactly as before — no change to that path. The post-sign-out marketing page
   still lives at `/signed-out`.

## Layer Impact
- **global-control-lane**: root route behavior + removal of one public marketing route
  in the shared shell. No data-plane, schema, or tenant-scoped change.

## Client Applicability
- All clients (shared shell). No tenant-specific behavior.

## Changes Included
- `src/app/page.tsx` — signed-out branch now `redirect('/sign-in')` (was the marketing
  landing); removed the now-unused `LoggedOutLandingPage` import. Signed-in redirect
  unchanged.
- `src/app/(public)/product/page.tsx` — **deleted** (route removed).
- `src/components/chrome/MaestroChrome.tsx` — dropped the now-dead `/product` shell-prefix.
- `src/__tests__/integration/product/product-page-contract.test.ts` — **deleted**
  (tested the removed page).

## Known Follow-ups (not in this PR)
- The product component tree (`src/components/product/ProductMarketingPage.tsx`,
  `ProductPage.tsx`, `ProductDiagrams.tsx`, `src/lib/product/product-page-content.ts`)
  is now orphaned dead code (no importer) and can be deleted in a follow-up.
- `app-rail-home-nav.test.ts` and `marketing-nav-dropdowns.test.tsx` assert a
  superseded nav contract and already fail on `main` independent of this change; a
  separate test-rehab pass will bring them to the current contract.

## QA / Validation
**Result: pass (changed files).**
- `tsc --noEmit` → 0 errors in changed files.
- Confirmed no runtime `<Link href="/product">` remains on `main` (only the deleted
  route and a harmless telemetry classifier referenced it).
- Confirmed `src/app/(public)/product` is gone and `/sign-in` route is present.
- Post-deploy: verify an unauthenticated request to `/` 307-redirects to `/sign-in`,
  and signed-in `/` still lands in the app.

## Rollout Plan
Merge to `main`; ships with the normal Azure control-lane deploy. No migration.

## Rollback Plan
Revert this commit (restores the `/product` route and the marketing landing at root).
Single-commit revert; no data implications.

## Audit Evidence
- PR + squash-merge SHA on `main`; Azure revision + image tag recorded in the deploy step.
