# 2026-06-02-annual-ai-reacknowledgment — Annual Responsible AI Re-Acknowledgment

## Release ID

`2026-06-02-annual-ai-reacknowledgment`

## Status

`candidate`

## Plain-English Summary

Adds the annual renewal requirement for the Responsible AI click-wrap acknowledgment. A user who accepted the current text version remains clear for 365 days. After that window, AbarVa routes the user back through the Responsible AI acknowledgment flow and records a new immutable annual-cycle row instead of overwriting the original acceptance evidence.

## Layer Impact

`global-control-lane`: The acknowledgment status now distinguishes current, missing, expired, and storage-unavailable states. Expired acknowledgments require the user to renew before entering the Maestro app shell.

`client-data-lane`: Adds an `acknowledgment_cycle` key to `responsible_ai_acknowledgments` and changes uniqueness to client, user, text version, and cycle so annual renewal rows can be stored immutably.

## Client Applicability

- All clients: Applies to every authenticated app user subject to the Responsible AI acknowledgment gate.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ai-liability/responsible-ai-acknowledgment-copy.ts`
- `src/lib/ai-liability/responsible-ai-acknowledgment.ts`
- `src/lib/ai-liability/__tests__/responsible-ai-acknowledgment.test.ts`
- `src/components/ai-liability/ResponsibleAiAcknowledgmentForm.tsx`
- `src/app/(public)/responsible-ai/acknowledgment/page.tsx`
- `supabase/migrations/20260602180000_responsible_ai_acknowledgment_cycles.sql`

## QA / Validation

- Passed: `jest src/lib/ai-liability/__tests__/responsible-ai-acknowledgment.test.ts src/lib/ai-liability/__tests__/responsible-ai-training.test.ts --runInBand`
- Passed: scoped ESLint on the acknowledgment service, copy constants, focused test, client form, and acknowledgment page.
- Blocked: `tsc --noEmit --pretty false` is blocked by the existing local dependency gap: `tests/accessibility/public-axe.spec.ts(1,24): Cannot find module '@axe-core/playwright' or its corresponding type declarations.`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run locally: full `next build`; this temp worktree uses a validation-only `node_modules` symlink, and Turbopack rejects symlinked temp worktree dependency roots. CI/Vercel run with a clean install.

## Rollout Plan

Merge to `main`, deploy through the normal Vercel pipeline, and apply the migration through the data-plane migration workflow. Existing acknowledgment rows receive the `initial` cycle key; future annual renewal rows use `annual-YYYY`.

## Rollback Plan

Revert the PR to remove the annual-expiration check from the app. The migration expands the immutable audit ledger; rollback should leave the column/index in place unless a DBA-approved migration removes them after confirming audit evidence requirements.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2833
- CI: pending on PR #2833.
- Migration replay: pending on PR #2833 CI.
- Focused Jest: local pass.

## Known Gaps

This implements annual click-wrap renewal only. Recurring training renewal remains separate from the current T214 completion gate.
