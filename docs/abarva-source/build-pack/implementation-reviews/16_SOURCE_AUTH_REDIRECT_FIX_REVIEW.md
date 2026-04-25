# 16 Source Auth Redirect Fix Review

Date: 2026-04-25

Status: Implementation review for the narrow `/source` auth redirect repair. No Source UI, dashboard UI, API routes, model calls, upload/parsing, workflow engine, approval engine, artifact versioning, document export/import, vendor flow, or AI/RFP generation work was implemented.

## 1. Root Cause

Authenticated visual review of `/source` was blocked because signed-out navigation landed on Clerk's hosted default redirect page instead of returning to the AbarVa app.

The diagnostic found that `/source` was missing from the app-owned protected-route matcher in `src/proxy.ts`.

Before this fix:

- `/source` was not in `authRequiredRoutes`.
- Signed-out `/source` requests were not handled by the local `createSignInRedirect()` helper.
- `/source` fell through to Clerk's generic `auth.protect()` path.
- Clerk-hosted sign-in produced `redirect_url=.../source`, then returned to Clerk's `default-redirect` page instead of the app.

## 2. Files Changed

- `src/proxy.ts`
- `CYCLE_STATE.md`
- `docs/abarva-source/build-pack/implementation-reviews/16_SOURCE_AUTH_REDIRECT_FIX_REVIEW.md`

No other files were changed.

## 3. Exact Fix

Added Source routes to the explicit auth-required route matcher:

```ts
'/source(.*)',
```

under `authRequiredRoutes` in `src/proxy.ts`.

This aligns `/source` with `/home`, `/tower`, `/platform`, `/intelligence`, and other authenticated app-owned surfaces.

## 4. Expected Redirect Behavior

Expected signed-out behavior after this fix:

1. User opens `/source`.
2. `src/proxy.ts` matches `/source` through `authRequiredRoutes`.
3. Because the user is signed out, `createSignInRedirect()` sends the request to:

```txt
/sign-in?redirect=/source
```

4. After sign-in, the local sign-in flow should return to `/source` rather than Clerk-hosted `default-redirect`.

Expected signed-in behavior:

- Signed-in users can open `/source` directly.
- `/source` remains protected by app auth.
- External-only users still follow existing app route restrictions.

## 5. Sign-In Page Hardening Decision

The diagnostic also noted that `src/app/sign-in/[[...sign-in]]/page.tsx` only recognizes `redirect`, not Clerk's `redirect_url`.

This slice did not change the sign-in page because the required minimal fix is to keep `/source` on the app-owned `redirect` path. Supporting `redirect_url` safely should sanitize local-only redirect targets and is better handled as a separate hardening slice if needed.

## 6. Validation Results

Validation commands run:

```txt
npx eslint src/proxy.ts
npx tsc --noEmit --pretty false
npm run build
git diff --check
```

Results:

- `npx eslint src/proxy.ts`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

## 7. Risk Assessment

Low-risk change:

- The change adds `/source` to an existing authenticated route list.
- It does not alter Clerk provider configuration.
- It does not change role resolution.
- It does not change Source UI or Source data behavior.
- It does not change other route matchers.

Residual risks:

- Clerk dashboard redirect settings may still need verification for hosted sign-in, production domains, and local review origins.
- The sign-in page still does not handle `redirect_url`; this should be tracked separately if Clerk-hosted flows remain relevant.
- The fix handles authentication routing, not future Source authorization policy.

## 8. How To Test `/source`

Manual test after deployment or local dev server:

1. Open a fresh signed-out browser session.
2. Navigate to `/source`.
3. Confirm redirect goes to local `/sign-in?redirect=/source`, not Clerk-hosted `accounts.dev/sign-in?...`.
4. Sign in.
5. Confirm the browser lands on `/source`.
6. Confirm signed-in chrome renders and Source is active in navigation.
7. Repeat while already signed in by opening `/source` directly.
8. Confirm `/home`, `/platform`, `/tower`, and `/intelligence` still preserve their existing auth redirect behavior.

## 9. Out-Of-Scope Confirmation

This slice did not implement:

- Source UI changes
- dashboard UI changes
- event canvas
- chat UI
- API routes
- model calls
- upload/parsing
- scorecard UI
- artifact drawer UI
- value ledger UI
- workflow engine
- approval engine
- artifact versioning
- document export/import
- vendor flow
- AI/RFP generation
- `/programs`, `/preview`, or `/demo` work
- `ProgramSurface`
- `src/lib/programs/mock.ts`
