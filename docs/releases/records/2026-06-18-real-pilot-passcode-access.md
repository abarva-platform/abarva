# 2026-06-18-real-pilot-passcode-access — Real Pilot Passcode Access

## Release ID

`2026-06-18-real-pilot-passcode-access`

## Status

`candidate`

## Plain-English Summary

The private sign-in path now matches the intended pilot model: approved real client/operator emails sign in with an access code, not a shared password plus access code. The app still mints a short-lived Clerk sign-in ticket only after the email is on the allowlist, the access code matches, and the Clerk user already exists.

## Layer Impact

- `global-control-lane`: Updates the shared sign-in form, demo-code API, crawl helper, and tenant email fallback routing.
- `internal-admin`: Protects the real pilot passcode emails from auth-cleanup scripts so existing Clerk users are not accidentally disabled.

## Client Applicability

- All clients: The password field is removed from the invite-code sign-in panel.
- Specific clients: Meridian, Lakeshore, First Capital, and SkyHarbor gain real-email passcode allowlist coverage for the pilot addresses already provisioned in Clerk.
- Internal only: The cleanup script keeps those pilot emails.
- Public/demo only: No public anonymous access changes.
- Feature flag: None.

Approved pilot passcode emails:

- Meridian Health: `kmysore@gmail.com`, `anand.sundaram@thesundaram.com`, `anand+meridian@thesundaram.com`, `anand.sundaram+meridian@thesundaram.com`
- Lakeshore Holdings: `surekha.durvasula@gmail.com`, `anandshp@gmail.com`, `anand+lakeshore@thesundaram.com`, `anand.sundaram+lakeshore@thesundaram.com`
- First Capital Financial: `admin@abarva.ai`, `anand+firstcapital@thesundaram.com`, `anand.sundaram+firstcapital@thesundaram.com`
- SkyHarbor Air: `anand@abarva.ai`, `anand+skyharbor@thesundaram.com`, `anand.sundaram+skyharbor@thesundaram.com`

## Changes Included

- `src/components/auth/DemoCodeSignIn.tsx`
- `src/app/api/auth/demo-code-sign-in/route.ts`
- `src/lib/auth/canonical-auth-roster.ts`
- `src/lib/auth/demo-code.ts`
- `src/lib/auth/access-routing.ts`
- `src/lib/client-config.ts`
- `src/lib/tenant/aliases.ts`
- `src/lib/crawl/persona-switcher.ts`
- `scripts/cleanup-auth-users.ts`
- `tests/e2e/primary-surfaces-smoke.spec.ts`
- `tests/e2e/primary-surfaces-tenant-matrix.spec.ts`
- `src/lib/__tests__/client-config-canonical.test.ts`
- `src/__tests__/integration/demo-code-sign-in-panel.test.tsx`
- `src/__tests__/integration/demo-code-sign-in-route.test.ts`

## QA / Validation

- Pass: `npx jest src/__tests__/integration/demo-code-sign-in-route.test.ts src/__tests__/integration/demo-code-sign-in-panel.test.tsx tests/unit/access-routing.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts --runInBand` — 77 tests passed.
- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`.
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`.
- Pass: focused `./node_modules/.bin/eslint` over changed auth, crawl, test, and cleanup files.
- Pass: `git diff --check`.
- Pass: CI on PR #3672 — ESLint, Routes/disclaimers, and Typecheck + reasoning-layer tests.
- Pass: ACR build `cadv` produced `acrabarvalab001.azurecr.io/abarva/web:real-pilot-passcode-30f4474c@sha256:c1ca871ba0b1b41d76046a36d1f47340dd9aee8e3bd59594c521d5f65d051e40`.
- Pass: ACA revision `ca-abarva-web-lab-eastus--0000109` revision-specific and public `/api/health` returned ok with Postgres/direct Postgres true.
- Watch: signed-in Lakeshore crawl initially passed auth but found tenant display text `Lakeshore Industries`; this record now includes the canonical display fix to render `Lakeshore Holdings`.

## Rollout Plan

Merge to the shared branch, build a new ACA image, deploy it to the lab web container app, smoke `/api/health`, then run signed-in production crawls against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR and redeploy the previous ACA image. Existing Clerk users and tenant data are not modified by this release.

## Audit Evidence

Candidate evidence will include PR URL, CI status, ACR build id, ACA revision, health response, and signed-in crawl artifacts.

## Known Gaps

The access code is still the existing deterministic private-code value unless the environment or a future email/SMS OTP service changes it. This release removes the password requirement and aligns the allowlist; it does not implement a new passcode-delivery service.
