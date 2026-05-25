# 2026-05-24-ai-egress-clerk-user-id — AI Egress Clerk User ID Hotfix

## Release ID

`2026-05-24-ai-egress-clerk-user-id`

## Status

`candidate`

## Plain-English Summary

Production Intelligence Ask failed during Foundation Fix convergence because `ai_egress_audit.user_id` was typed as UUID while the authenticated app writes Clerk user ids like `user_...`. This hotfix changes the egress audit ledger column to text so model-call audit rows can be written and the agent response can complete.

## Layer Impact

`ai-egress-control-lane`: Preserves the Clerk subject in audit rows and removes a production write-time type mismatch.

`client-data-lane`: Adds an additive Supabase migration that converts existing UUID values to text and accepts future Clerk ids.

## Client Applicability

- All clients: yes, any authenticated model call writing `ai_egress_audit`.
- Specific clients: Apex verification was the first failing path observed.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260525020500_ai_egress_audit_user_id_text.sql`
- Contract test: `src/lib/integrations/ai-egress/__tests__/ai-egress-migration.test.ts`

## QA / Validation

- `npx jest src/lib/integrations/ai-egress/__tests__/ai-egress-migration.test.ts --runInBand` — passed locally.
- `git diff --check` — passed locally.

## Rollout Plan

Merge to main, allow the migration replay gate to pass, and deploy. Production verification should then rerun the Apex Intelligence Ask probe that previously failed with `invalid input syntax for type uuid`.

## Rollback Plan

Reverting the app is not required because this is a database compatibility fix. A rollback would require converting `user_id` back to UUID and would reintroduce the Clerk-id failure, so it should only happen if all callers stop writing Clerk subjects.

## Audit Evidence

The convergence probe before this fix returned `[synthesis error: AI egress audit write failed: invalid input syntax for type uuid: "user_..."]`.

## Known Gaps

This fixes audit persistence only; it does not change provider cost metadata capture.
