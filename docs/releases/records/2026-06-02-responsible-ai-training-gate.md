# 2026-06-02-responsible-ai-training-gate — Responsible AI Training Gate

## Release ID

`2026-06-02-responsible-ai-training-gate`

## Status

`candidate`

## Plain-English Summary

Adds a required Responsible AI Use training gate before authenticated users enter the AbarVa app shell. Users must first accept the Responsible AI click-wrap acknowledgment, then complete a short training module that explains human accountability, evidence review, uncertainty escalation, and edit-before-commit expectations. Completion is recorded in an immutable per-client, per-user ledger.

## Layer Impact

`global-control-lane`: The Maestro app shell now checks the training ledger after the acknowledgment ledger and redirects users to `/responsible-ai/training` until the current training version is complete.

`client-data-lane`: Adds the `responsible_ai_training_completions` table for tenant-scoped completion evidence. The table uses `client_id`, RLS helpers when available, immutable app-role behavior, and one completion row per client, user, and training version.

## Client Applicability

- All clients: Applies to every authenticated app user once the migration is deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ai-liability/responsible-ai-training-copy.ts`
- `src/lib/ai-liability/responsible-ai-training.ts`
- `src/components/ai-liability/ResponsibleAiTrainingForm.tsx`
- `src/app/(public)/responsible-ai/training/page.tsx`
- `src/app/api/ai-liability/responsible-ai-training/route.ts`
- `src/app/(maestro)/layout.tsx`
- `src/lib/ai-liability/__tests__/responsible-ai-training.test.ts`
- `supabase/migrations/20260602173000_responsible_ai_training_completions.sql`

## QA / Validation

- Passed: `jest src/lib/ai-liability/__tests__/responsible-ai-training.test.ts --runInBand`
- Passed: `jest src/lib/ai-liability/__tests__/responsible-ai-acknowledgment.test.ts src/lib/ai-liability/__tests__/responsible-ai-training.test.ts --runInBand`
- Passed: scoped ESLint on the training service, copy constants, client form, route handler, page, Maestro layout, and focused test.
- Passed: `git diff --check`
- Blocked: `tsc --noEmit --pretty false` is blocked by an existing local dependency gap: `tests/accessibility/public-axe.spec.ts(1,24): Cannot find module '@axe-core/playwright' or its corresponding type declarations.`
- Not run locally: full `next build`; this temp worktree uses a validation-only `node_modules` symlink, and Turbopack rejects symlinked temp worktree dependency roots. CI/Vercel run with a clean install.

## Rollout Plan

Merge to `main`, deploy through the normal Vercel pipeline, and apply the migration through the data-plane migration workflow. Once active, users without the current training completion version are redirected to `/responsible-ai/training` before entering Maestro routes.

## Rollback Plan

Revert the PR to remove the app-shell redirect and training route/API. The migration creates an append-only audit ledger; rollback should leave the table in place unless a DBA-approved migration explicitly removes it after confirming no compliance evidence is needed.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2831
- CI: pending on PR #2831.
- Migration replay: pending on PR #2831 CI.
- Focused Jest: local pass.

## Known Gaps

The module is a completion gate, not a scored assessment. Annual re-acknowledgment and recurring retraining remain separate backlog items.
