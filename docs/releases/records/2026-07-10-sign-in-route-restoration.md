# 2026-07-10-sign-in-route-restoration — Restore Public Sign-In Route

## Release ID

`2026-07-10-sign-in-route-restoration`

## Status

`candidate`

## Plain-English Summary

Restores `https://app.abarva.ai/sign-in` as the actual login surface. The live route was redirecting signed-out users back to `/`, which made it impossible to reach the login page from the public site, invite links, or account-switch links. Anonymous users now see the existing AbarVa sign-in shell; signed-in users still route through the normal post-sign-in resolver. The public request-access modal also now surfaces the server's validation message instead of hiding it behind a generic failure.

## Layer Impact

- `global-control-lane`: Fixes the shared authentication entry route for all tenants and operators.
- `public-demo`: Public marketing CTAs and invite links that point to `/sign-in` can reach the login surface again.

## Client Applicability

- All clients: Yes, all tenants use the shared `app.abarva.ai/sign-in` route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/sign-in/[[...sign-in]]/page.tsx`: renders `SignInShell` for anonymous users instead of redirecting to `/`.
- `src/components/marketing/LoggedOutLandingPage.tsx`: shows API validation errors such as `Please use your work email.` instead of a generic failure.
- `src/__tests__/integration/sign-in-route-contract.test.ts`: prevents the sign-in route from regressing into a marketing-page bounce.

## QA / Validation

- `Fail` before fix: live probe `GET https://app.abarva.ai/sign-in` returned `307 Location: /` while signed out.
- `Pass`: `npm test -- --runTestsByPath src/__tests__/integration/sign-in-route-contract.test.ts --runInBand`.
- `Pass`: `npx eslint 'src/app/sign-in/[[...sign-in]]/page.tsx' src/__tests__/integration/sign-in-route-contract.test.ts`.
- `Pass`: `npx eslint src/components/marketing/LoggedOutLandingPage.tsx`.
- `Pass`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- `Pass`: `npm run release:check`.
- `Blocked / unrelated`: the broader existing `sign-in-shell.test.tsx` suite still expects legacy demo-code mode to expose password/access-code fields immediately; current shell renders email-code first. This route fix does not change that component behavior.
- `Not run` until ACA deployment: live `/sign-in` smoke test showing `200`, rendered sign-in UI, and no redirect to `/`.

## Rollout Plan

Open PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned web image to `ca-abarva-web-lab-eastus`. After traffic shifts, verify the ACA runtime invariant and run the live signed-out `/sign-in` smoke test.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA deployment.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Main deploy workflow managed.
- Feature/env flag update path: None.
- Live signed-in proof required: Signed-out login-page proof required; signed-in auth redirect behavior remains unchanged.

## Rollback Plan

Revert this PR and redeploy the previous healthy digest through the ACA main deploy workflow. Operationally, `/access` can remain a temporary login workaround while rollback/deploy completes.

## Audit Evidence

- Live pre-fix curl headers showing `HTTP/2 307` and `location: /` for `/sign-in`.
- PR URL: pending.
- CI run: pending.
- ACA deployment evidence: pending.
- Live smoke screenshot/headers: pending.

## Known Gaps

No known product gaps in this fix. The route restores the existing sign-in shell rather than changing Clerk configuration, login methods, user provisioning, tenant assignment, or post-login routing. Live acceptance remains pending until the merged SHA is deployed through ACA and `/sign-in` is browser-verified while signed out.
