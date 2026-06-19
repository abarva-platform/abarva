# 2026-06-19-restore-clerk-sign-in - Restore Clerk Sign-In

## Release ID

`2026-06-19-restore-clerk-sign-in`

## Status

`validated-local`

## Plain-English Summary

This release restores the signed-out `/sign-in` experience to Clerk's built-in sign-in flow. The custom AbarVa demo form that asked for email, password, and a static access code has been removed from the route, and the public demo-code ticket API has been removed from the unauthenticated route allowlist.

## Layer Impact

- `global-control-lane`: changes shared authentication entry behavior for all signed-out visitors.
- `internal-admin`: no setup/admin behavior changes.
- `client-data-lane`: no data-plane, corpus, tenant, or retrieval changes.

## Client Applicability

- All clients: receive the restored Clerk sign-in surface at `/sign-in`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/sign-in/[[...sign-in]]/page.tsx`: renders Clerk's `<SignIn />` component again, preserving redirect handling for already signed-in sessions.
- `src/components/auth/SignInShell.tsx`: removed custom sign-in shell.
- `src/components/auth/DemoCodeSignIn.tsx`: removed custom password/access-code form.
- `src/app/api/auth/demo-code-sign-in/route.ts`: removed custom unauthenticated demo-code ticket endpoint.
- `src/proxy.ts`: removed `/api/auth/demo-code-sign-in(.*)` from public route patterns.
- Auth-focused tests updated to assert the demo-code endpoint is no longer public.
- `src/__tests__/integration/source/source-authenticated-route-smoke.test.ts`: refreshed one stale Source landing assertion to match the existing `/source` to `/source/queue` redirect while preserving the auth-boundary check touched by this release.

## QA / Validation

- Pass: `npx eslint 'src/app/sign-in/[[...sign-in]]/page.tsx' src/proxy.ts src/__tests__/unit/proxy-public-routes.test.ts src/__tests__/integration/source/source-authenticated-route-smoke.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npx jest src/__tests__/unit/proxy-public-routes.test.ts --runInBand`
- Pass: `npx jest src/__tests__/integration/source/source-authenticated-route-smoke.test.ts --runInBand`
- Pass: `npm run build`
- Pass: `npm run release:check`
- Observed: Jest emits existing duplicate manual mock warnings for markdown mocks and local Source DB missing-env console messages; assertions pass.
- Pending: deployed unauthenticated browser verification that `/sign-in` shows Clerk sign-in and does not show `Password from invite`, `Access code`, or `424242`.

## Rollout Plan

Build a new production-lab image from the committed release candidate, push it to ACR, update the Azure Container Apps lab web app, wait for a healthy revision, shift traffic to the new revision, and run unauthenticated browser verification against `https://app.abarva.ai/sign-in`.

## Rollback Plan

Shift Azure Container Apps traffic back to the previous healthy revision. No database rollback or data-plane rollback is required.

## Audit Evidence

- Source diff for `/sign-in`, proxy public routes, and deleted custom demo-code auth files.
- Local build and release check listed above.
- ACR build, ACA revision, and browser verification output to be added after deploy.

## Known Gaps

None known for the sign-in rollback. Existing demo/invite documentation may still mention historical static demo codes and should be cleaned in a separate documentation pass.
