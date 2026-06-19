# 2026-06-19-restore-clerk-sign-in - Restore Clerk Sign-In

## Release ID

`2026-06-19-restore-clerk-sign-in`

## Status

`deployed-lab`

## Plain-English Summary

This release restores the signed-out `/sign-in` experience to a Clerk-backed email-code flow. The custom AbarVa demo form that asked for email, password, and a static access code has been removed from the route, and the public demo-code ticket API has been removed from the unauthenticated route allowlist.

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

- `src/app/sign-in/[[...sign-in]]/page.tsx`: renders the restored email-code sign-in shell, preserving redirect handling for already signed-in sessions.
- `src/components/auth/EmailCodeSignIn.tsx`: adds a Clerk-backed email-code-only sign-in form with no password field and no static access code.
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
- Partial deployed finding before this follow-up: generic Clerk `<SignIn />` removed the static access-code form but still exposed a password field because the Clerk instance has password enabled.
- Pass: ACR build `cafv` built and pushed `acrabarvalab001.azurecr.io/abarva/web:prod-lab-command-center-d90275eef`; this interim image was superseded because browser QA found the generic Clerk widget still exposed a password field.
- Pass: ACR build `cafw` built and pushed `acrabarvalab001.azurecr.io/abarva/web:prod-lab-command-center-bbb10a069`, digest `sha256:a45969504104d2398a3a802e890cc047570a1ec48ee19a604e5a673367fa4a7f`.
- Pass: ACA revision `ca-abarva-web-lab-eastus--0000120` is `Healthy` / `Running` and receives 100% traffic.
- Pass: `https://app.abarva.ai/api/health` returned `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`.
- Pass: unauthenticated browser QA for `/sign-in` showed exactly one email input (`Enter your email address`) and `Send code`; it did not show password text, `Password from invite`, `Access code`, or `424242`.
- Pass: functional browser QA with `anand.sundaram+firstcapital@thesundaram.com` clicked `Send code` and advanced to the `Enter email code` / `Verify code` step with no error.

## Rollout Plan

Built a new production-lab image from committed HEAD `bbb10a069`, pushed it to ACR, updated the Azure Container Apps lab web app, waited for healthy revision `ca-abarva-web-lab-eastus--0000120`, shifted traffic to 100%, and ran unauthenticated browser verification against `https://app.abarva.ai/sign-in`.

## Rollback Plan

Shift Azure Container Apps traffic back to the previous healthy revision. No database rollback or data-plane rollback is required.

## Audit Evidence

- Source diff for `/sign-in`, proxy public routes, and deleted custom demo-code auth files.
- Local build and release check listed above.
- Image tag: `acrabarvalab001.azurecr.io/abarva/web:prod-lab-command-center-bbb10a069`
- Image digest: `sha256:a45969504104d2398a3a802e890cc047570a1ec48ee19a604e5a673367fa4a7f`
- ACR build run: `cafw`
- ACA revision: `ca-abarva-web-lab-eastus--0000120`
- ACA traffic: 100% on `ca-abarva-web-lab-eastus--0000120`
- Browser QA: `/sign-in` email-only first step and code-entry second step verified on 2026-06-19.

## Known Gaps

None known for the sign-in rollback. Existing demo/invite documentation may still mention historical static demo codes and should be cleaned in a separate documentation pass.
