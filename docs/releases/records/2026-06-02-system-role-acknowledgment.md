# 2026-06-02-system-role-acknowledgment — Tenant Admin System Role Acknowledgment

## Release ID

`2026-06-02-system-role-acknowledgment`

## Status

`candidate`

## Plain-English Summary

Adds the tenant-admin/system-owner acknowledgment required for onboarding. Platform admins and tenant admins can sign an admin attestation that they own tenant scope, user access, connector setup, template and data-load permissions, and human review of AI-assisted outputs. The copy explicitly confirms data loading is limited to one client workspace only, with no cross-tenant loading.

## Layer Impact

`global-control-lane`: Adds `/admin/system-role-acknowledgment` and a POST API for recording the admin/system-owner acknowledgment. The page is protected by the existing admin shell and the API rechecks platform-admin or tenant-admin posture.

`client-data-lane`: Adds the `responsible_ai_system_role_acknowledgments` immutable ledger with `client_id`, user, text version, role scope, IP, user agent, source, and metadata evidence.

## Client Applicability

- All clients: Applies to tenant admins and platform admins for the active client workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ai-liability/system-role-acknowledgment-copy.ts`
- `src/lib/ai-liability/system-role-acknowledgment.ts`
- `src/lib/ai-liability/__tests__/system-role-acknowledgment.test.ts`
- `src/components/ai-liability/SystemRoleAcknowledgmentForm.tsx`
- `src/app/(maestro)/admin/system-role-acknowledgment/page.tsx`
- `src/app/api/ai-liability/system-role-acknowledgment/route.ts`
- `supabase/migrations/20260602183000_system_role_acknowledgments.sql`

## QA / Validation

- Passed: `jest src/lib/ai-liability/__tests__/system-role-acknowledgment.test.ts src/lib/ai-liability/__tests__/responsible-ai-acknowledgment.test.ts src/lib/ai-liability/__tests__/responsible-ai-training.test.ts --runInBand`
- Passed: scoped ESLint on the system role acknowledgment service, copy constants, focused test, client form, admin page, and API route.
- Blocked: `tsc --noEmit --pretty false` is blocked by the existing local dependency gap: `tests/accessibility/public-axe.spec.ts(1,24): Cannot find module '@axe-core/playwright' or its corresponding type declarations.`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run locally: full `next build`; this temp worktree uses a validation-only `node_modules` symlink, and Turbopack rejects symlinked temp worktree dependency roots. CI/Vercel run with a clean install.

## Rollout Plan

Merge to `main`, deploy through the normal Vercel pipeline, and apply the migration through the data-plane migration workflow. Admins can sign from `/admin/system-role-acknowledgment`.

## Rollback Plan

Revert the PR to remove the page/API and signing path. The immutable audit table should remain in place unless DBA/legal approve removal after confirming no attestation evidence is needed.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2834
- CI: pending on PR #2834.
- Migration replay: pending on PR #2834 CI.
- Focused Jest: local pass.

## Known Gaps

This creates the signing page and ledger. A later onboarding-flow slice can force redirect unsigned tenant admins during first-time setup.
