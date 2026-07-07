# 2026-06-02-responsible-ai-acknowledgment - First-login Responsible AI click-wrap

## Release ID

`2026-06-02-responsible-ai-acknowledgment`

## Status

`candidate`

## Plain-English Summary

Adds the T212 Responsible AI first-login acknowledgment. Signed-in Maestro app users are redirected to an acknowledgment page until the current Responsible AI text version is accepted for their active client. Acceptance is recorded in an immutable per-tenant, per-user ledger with timestamp, Clerk user id, client id, IP address, user agent, text version, and consent text.

## Layer Impact

- `global-control-lane`: Adds a cross-app access gate for signed-in Maestro surfaces.
- Data plane: Adds `responsible_ai_acknowledgments` as an append-only/client-scoped evidence ledger.
- AI liability controls: Adds the click-wrap copy, storage contract, API route, and UI.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `responsible_ai_acknowledgments` migration with tenant RLS policies and immutable update/delete guard.
- Added Responsible AI acknowledgment service contract and tests.
- Added a pure shared copy/version module so the client form does not import server-only Clerk/Postgres code.
- Added `/responsible-ai/acknowledgment` page and client-side accept form.
- Added `POST /api/ai-liability/responsible-ai-acknowledgment`.
- Added a Maestro layout gate that redirects users until the current text version is recorded.

## QA / Validation

- Passed: `npx jest src/lib/ai-liability/__tests__/responsible-ai-acknowledgment.test.ts --runInBand`
- Passed: `npx eslint src/lib/ai-liability/responsible-ai-acknowledgment.ts src/lib/ai-liability/responsible-ai-acknowledgment-copy.ts src/lib/ai-liability/__tests__/responsible-ai-acknowledgment.test.ts src/components/ai-liability/ResponsibleAiAcknowledgmentForm.tsx src/app/'(public)'/responsible-ai/acknowledgment/page.tsx src/app/api/ai-liability/responsible-ai-acknowledgment/route.ts src/app/'(maestro)'/layout.tsx`
- Passed: `git diff --check`
- Blocked: `./node_modules/.bin/tsc --noEmit --pretty false` stops on the existing repo dependency gap `tests/accessibility/public-axe.spec.ts(1,24): Cannot find module '@axe-core/playwright'`.
- Blocked locally: `npm run build` cannot run from this temp worktree because Turbopack rejects the symlinked `node_modules` path; CI runs with a real install and remains the build authority.
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and deploy through the normal Vercel production path. The migration must be applied with the rest of the release so the gate can record acceptance evidence.

## Rollback Plan

Revert the PR. If the migration has already been applied, retain the ledger table for audit history; the app will stop enforcing the gate after rollback.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Local validation: pending.

## Known Gaps

T213 annual re-acknowledgment and T214 required training remain separate backlog items.
