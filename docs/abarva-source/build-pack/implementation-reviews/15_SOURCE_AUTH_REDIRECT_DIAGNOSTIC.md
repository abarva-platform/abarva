# 15 Source Auth Redirect Diagnostic

Date: 2026-04-25

Status: Diagnostic only. No app code, Source UI, dashboard UI, API routes, model calls, upload/parsing, workflow engine, approval engine, vendor flow, or AI/RFP generation work was implemented.

## 1. What Happened

An authenticated/manual visual review of `/source` could not reach the AbarVa app after sign-in. The browser landed on Clerk's hosted default post-sign-in page instead:

- Observed URL: `boss-griffon-61.accounts.dev/default-redirect`
- Observed page: `Welcome, Anand. You are signed in. Now, it's time to connect Clerk to your application.`

Prior `/source` review attempts also showed unauthenticated navigation being sent to Clerk-hosted sign-in URLs such as:

- `https://boss-griffon-61.accounts.dev/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3025%2Fsource`
- `https://actual-ox-3.accounts.dev/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3028%2Fsource`

That means the review was blocked at the authentication return step, not by the Source dashboard rendering itself.

## 2. Likely Root Cause

The most likely root cause is a combination of app-code routing and Clerk dashboard redirect configuration:

1. `/source` is not included in the app's explicit `authRequiredRoutes` matcher in `src/proxy.ts`.
2. Because `/source` is not public, unauthenticated `/source` requests fall through to Clerk's generic `auth.protect()` path instead of the app's custom local sign-in redirect helper.
3. The generic Clerk-hosted flow uses Clerk's `redirect_url` behavior and currently returns to the Clerk-hosted `default-redirect` page rather than the AbarVa app.
4. The local sign-in page only reads a `redirect` query parameter, not Clerk's `redirect_url` query parameter, so it would not preserve `/source` if the flow reaches `/sign-in?redirect_url=...`.

Relevant app-code evidence:

- `src/proxy.ts` defines `authRequiredRoutes` for `/home`, `/tower`, `/platform`, `/intelligence`, and other routes, but not `/source`.
- `src/proxy.ts` only calls the custom `createSignInRedirect()` helper for routes matched by `authRequiredRoutes`.
- `src/proxy.ts` then calls `auth.protect()` for all non-public routes, which is the path `/source` currently takes when signed out.
- `src/app/sign-in/[[...sign-in]]/page.tsx` accepts only `{ redirect?: string }` and falls back to `/auth-redirect`.
- `src/components/auth/SignInShell.tsx` passes the computed value into Clerk's `<SignIn forceRedirectUrl={redirectUrl} />`.
- `src/app/layout.tsx` sets `signInForceRedirectUrl="/auth-redirect"` and `signUpForceRedirectUrl="/auth-redirect"`, which is intentional for central role-based routing but can obscure the originally requested path unless the local sign-in route preserves it.

## 3. Files / Config Inspected

Inspected:

- `src/proxy.ts`
- `src/app/layout.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/components/auth/SignInShell.tsx`
- `src/components/auth/DemoCodeSignIn.tsx`
- `src/app/auth-redirect/page.tsx`
- `src/lib/auth/access-routing.ts`
- `src/app/(maestro)/layout.tsx`
- `src/components/chrome/AppChrome.tsx`
- `src/components/chrome/ClientChrome.tsx`
- `src/app/(maestro)/source/page.tsx`
- `next.config.ts`
- prior Source dashboard review packets documenting Clerk redirects

Not inspected:

- Clerk dashboard settings, because they are not stored in the repo.
- Local secret environment files. No secrets were read.

## 4. App Code Or Clerk Dashboard Config?

This appears to be both, with the immediate visible failure depending on the path used:

- App-code issue: `/source` is missing from the explicit protected-route matcher that uses the app-owned `/sign-in?redirect=...` path.
- App-code issue: the local sign-in route does not recognize Clerk's `redirect_url` query parameter.
- Clerk dashboard/config issue: Clerk-hosted sign-in is returning to `accounts.dev/default-redirect`, which usually indicates the Clerk application redirect URLs / application URL / allowed redirect origins are not configured to return to the AbarVa app for this environment.

The safest conclusion is:

The app should not rely on the generic Clerk-hosted default redirect path for `/source`; `/source` should enter the same app-owned sign-in redirect flow as other protected routes, and Clerk dashboard redirect settings should also be checked.

## 5. Minimal Safe Fix Recommendation

Recommended minimal app-code fix, not applied in this diagnostic:

1. Add Source routes to the explicit protected route matcher in `src/proxy.ts`:

```ts
'/source(.*)',
```

under `authRequiredRoutes`.

Why this is safe:

- It aligns `/source` with `/home`, `/tower`, `/platform`, and `/intelligence`.
- It makes signed-out `/source` requests use the existing app-owned `createSignInRedirect()` helper.
- It should redirect unauthenticated `/source` to `/sign-in?redirect=/source` rather than Clerk-hosted `accounts.dev/sign-in?redirect_url=...`.
- It does not change Source UI, dashboard behavior, model behavior, API routes, uploads, or workflow state.

Recommended follow-up hardening, also not applied:

2. Update `src/app/sign-in/[[...sign-in]]/page.tsx` to accept both `redirect` and `redirect_url`, then choose the safe local path:

```ts
const redirectUrl = params.redirect || params.redirect_url || '/auth-redirect'
```

This would make the app tolerant of both its own `redirect` parameter and Clerk's `redirect_url` parameter.

3. Verify Clerk dashboard settings for the active environment:

- Application home URL / production URL should point at the AbarVa app domain.
- Allowed redirect URLs should include the active app domain and local development origins used for review.
- Post-sign-in fallback/default redirect should not remain Clerk's hosted `default-redirect` page.

## 6. Is `/source` Itself Likely Working After Auth?

Yes, `/source` itself is likely working after an authenticated app session exists.

Evidence:

- `src/app/(maestro)/source/page.tsx` exists and renders `AbarVaSourceDashboard` inside `SourceFoundationShell`.
- `next.config.ts` does not redirect `/source` away from the app.
- Prior dashboard implementation and review work confirmed the route compiles and uses seeded Source dashboard data.
- The observed failure happens before the dashboard can render: Clerk sign-in returns to `accounts.dev/default-redirect` instead of the AbarVa app.

Caveat:

If a signed-in user is routed through `/auth-redirect`, the current role-based resolver may send them to `/home?client=...` rather than back to `/source`. That is intentional central routing today, but it means "sign in from `/source` and return to `/source`" depends on preserving the requested redirect through the local `/sign-in?redirect=/source` flow.

## 7. How To Test After Fix

After the app-code and Clerk-dashboard redirect settings are fixed:

1. Open a fresh signed-out browser session.
2. Navigate directly to `/source`.
3. Confirm the app redirects to local `/sign-in?redirect=/source`, not `accounts.dev/sign-in?...`.
4. Sign in.
5. Confirm the browser lands on `/source`.
6. Confirm the signed-in chrome renders and Source is active in navigation.
7. Open `/source` again in a signed-in session and confirm it renders without sign-in redirect.
8. Repeat on the deployed app domain and on the local review origin.
9. Repeat with a user role expected to access Source, and with an external-only role expected to be blocked or routed away.

Optional regression checks:

- `/home` still redirects signed-out users to local `/sign-in?redirect=/home`.
- `/platform` still redirects signed-out users to local `/sign-in?redirect=/platform`.
- `/auth-redirect` still resolves normal post-login role routing.
- Sign-out still returns to `/`.

## 8. Risks

- Adding `/source(.*)` to `authRequiredRoutes` is low-risk, but it changes the unauthenticated entry path for every Source route from Clerk generic protect to app-owned sign-in redirect.
- Preserving `redirect_url` requires sanitizing redirects to local paths only; do not accept arbitrary external redirect targets.
- Clerk dashboard settings may still be wrong even after the app-code fix, especially for hosted sign-in, local preview origins, or production domains.
- `/auth-redirect` currently resolves role-based home destinations and does not preserve a requested Source destination.
- If Source should be restricted by role later, this fix only handles authentication, not Source authorization policy.

## 9. Do Not Implement Unless Explicitly Approved

No fix was applied in this diagnostic.

Do not implement the recommended changes until explicitly approved. The next safe implementation slice would be a focused auth redirect repair that changes only:

- `src/proxy.ts`
- optionally `src/app/sign-in/[[...sign-in]]/page.tsx`

That slice should not include Source UI, dashboard UI, API routes, model calls, upload/parsing, event canvas, scorecard UI, artifact drawer UI, value ledger UI, workflow engine, approval engine, vendor flow, AI/RFP generation, `/programs`, `/preview`, or `/demo` work.
