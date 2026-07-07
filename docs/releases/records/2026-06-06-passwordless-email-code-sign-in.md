# 2026-06-06-passwordless-email-code-sign-in — Email-Code Sign-In Default

## Release ID

`2026-06-06-passwordless-email-code-sign-in`

## Status

`candidate`

## Plain-English Summary

The default AbarVa sign-in screen now asks invited users for their email address and sends a Clerk one-time email code. It no longer starts with Clerk's password screen. The older private invite password/code flow remains available only as an explicit fallback route.

## Layer Impact

- `global-control-lane`: Changes the shared authentication entry surface for all invited client and operator identities.
- `internal-admin`: Supports Anand's single-tenant operator alias model without introducing a tenant switcher.

## Client Applicability

- All clients: Invited identities now see email-code-first sign-in by default.
- Specific clients: Apex, Meridian/PHS, SkyHarbor, Lakeshore, First Capital, and Northstar operator aliases remain single-tenant by email identity.
- Internal only: The legacy password/private-code fallback remains available through explicit sign-in mode only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/components/auth/EmailCodeSignIn.tsx`.
- Updated `src/components/auth/SignInShell.tsx` so email-code sign-in is the default.
- Updated `src/app/sign-in/[[...sign-in]]/page.tsx` to select email-code mode unless an explicit fallback mode is requested.
- Added focused component coverage for the email-code path.

## QA / Validation

- `npx jest src/__tests__/integration/sign-in-shell.test.tsx src/__tests__/integration/email-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-panel.test.tsx --runInBand` passed: 3 suites, 9 tests.
- `npx eslint src/components/auth/EmailCodeSignIn.tsx src/components/auth/SignInShell.tsx 'src/app/sign-in/[[...sign-in]]/page.tsx' src/__tests__/integration/email-code-sign-in-panel.test.tsx src/__tests__/integration/sign-in-shell.test.tsx` passed.
- `npm run release:check -- --base origin/main --head HEAD` passed.
- `git diff --check` passed.
- `npx tsc --noEmit --pretty false` remains blocked by existing missing optional packages: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to main, deploy through the `nexus` Vercel production project, then verify `https://app.abarva.ai/sign-in` shows the email-code screen and does not ask for a password by default.

## Rollback Plan

Revert this PR to restore Clerk's stock password sign-in default. The explicit fallback password/private-code route remains unchanged, so rollback does not require data migration.

## Audit Evidence

- PR URL: pending.
- CI status: pending.
- Production deployment: pending.
- Live smoke: pending.

## Known Gaps

The successful one-time-code delivery depends on Clerk's email-code first-factor being enabled for invited accounts in the active Clerk instance. The UI now reports a clear setup error if Clerk does not offer the email-code factor.
