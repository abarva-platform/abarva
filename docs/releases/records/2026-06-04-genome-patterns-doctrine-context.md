# 2026-06-04-genome-patterns-doctrine-context — Genome Patterns Doctrine Context

## Release ID

`2026-06-04-genome-patterns-doctrine-context`

## Status

`candidate`

## Plain-English Summary

This release gives the Intelligence corpus a governed place to store richer decision doctrine for healthcare modernization patterns. Existing pattern rows keep working as-is; new or refined corpus rows can now carry the rule, triggers, evidence, anti-patterns, decision artifacts, graph relationships, intended personas, specificity, and confidence that the healthcare hardening run needs.

## Layer Impact

- `client-data-lane`: Adds an additive JSONB column to the global `genome_patterns` substrate and updates the corpus loader that writes authored pattern packs.
- `internal-admin`: Improves the internal loader path used by corpus operators. It does not change buyer-facing app routes by itself.

## Client Applicability

- All clients: The schema is global and backward-compatible for all existing `genome_patterns` rows.
- Specific clients: The immediate use is the healthcare modernization/CPO hardening run for Meridian-oriented healthcare corpus work.
- Internal only: Loader enhancement is operator-facing.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/3030
- Migration: `supabase/migrations/20260604193000_genome_patterns_doctrine_context.sql`
- Loader: `scripts/corpus/load-authored-genome-seeds.ts`
- Test: `scripts/corpus/__tests__/load-authored-genome-seeds.test.ts`
- Handoff addendum: `docs/build/codex-handoff/2026-06-04-HEALTHCARE_HARDEN_BRIEF_ADDENDUM_v2.md`

## QA / Validation

- Pass: `npx jest scripts/corpus/__tests__/load-authored-genome-seeds.test.ts --runInBand` — 1 suite / 2 tests passed. The unit test covers both legacy TypeScript seed arrays and new JSONL rows with all 13 doctrine fields preserved in the captured `genome_patterns` upsert payload.
- Pass: `npx eslint scripts/corpus/load-authored-genome-seeds.ts scripts/corpus/__tests__/load-authored-genome-seeds.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not-run: live Azure/Postgres migration apply. The migration is additive and is expected to replay in CI; production apply should happen after merge and before running the healthcare modernization loader.

## Rollout Plan

Merge to main through PR review/CI, then apply the additive Azure/Postgres migration before running the healthcare modernization loader. The column defaults to `{}` for legacy rows, so existing corpus reads continue to work before any rich doctrine data is loaded.

## Rollback Plan

Fast application rollback is `gh pr revert <PR_NUMBER>`. If the schema must be rolled back manually, run:

```sql
DROP INDEX IF EXISTS idx_genome_patterns_doctrine_context;
ALTER TABLE genome_patterns DROP COLUMN IF EXISTS doctrine_context;
NOTIFY pgrst, 'reload schema';
```

Because this is additive, rollback does not require rewriting existing classification data in `genome_patterns.data`.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3030
- CI run: pending
- Migration replay / drift check: pending
- Local unit-test output: `npx jest scripts/corpus/__tests__/load-authored-genome-seeds.test.ts --runInBand` passed on 2026-06-04.

## Known Gaps

This release only creates the storage and loader path. It does not generate or load the ~630 healthcare modernization patterns; that resumes in the next wave after this substrate-alignment PR lands.
