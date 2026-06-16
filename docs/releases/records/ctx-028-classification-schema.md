# ctx-028 — Context classification columns, insight engine tables, and read-views

## Release ID

`2026-06-16-ctx-028-classification-schema`

## Status

`candidate`

## Plain-English Summary

This release adds structural classification metadata to existing context records so the L2 insight engine can segment, filter, and score them by IT domain and business function. It also creates two new tables — `context_insights` (where rule-evaluated insights land) and `significance_rules` (the configurable rule registry) — and seeds six starter rules covering renewal risk, adoption gaps, SLA degradation, untrustworthy claims, conflicting facts, and value-coverage holes. Four SQL read-views give insight rules a stable, pre-filtered lens into vendor renewals, the application inventory, dimension coverage statistics, and the triage queue of records awaiting classification. The `lifecycle_state` constraint on `enterprise_context_records` is widened to allow a `review` state, enabling records to sit in a human-review holding area before being promoted to `active`.

## Layer Impact

- **Lane:** `client-data-lane`
- **Schema:** Additive only. `ALTER TABLE ADD COLUMN IF NOT EXISTS` on `enterprise_context_records`; two new tables; four new views; three new indexes. No existing column is altered or removed.
- **TypeScript types:** New type aliases and interfaces exported from `src/lib/context-ingestion/types.ts`. Purely additive — no existing exports changed.
- **Runtime:** No runtime call-sites added in this PR. The schema and types are the substrate; the L2 engine that queries them ships separately.

## Client Applicability

- All clients: yes — the migration is not tenant-specific and applies to the shared schema.
- Feature flag: not required (additive schema, no new runtime behaviour exposed yet).

## Changes Included

- `supabase/migrations/20260616180000_context_classification_and_insights.sql` — full migration (classification columns, constraint widen, indexes, `context_insights`, `significance_rules`, seed data, RLS, read-views).
- `src/lib/context-ingestion/types.ts` — `DomainSegment`, `BusinessFunction`, `Criticality`, `ClassificationSource`, `InsightLifecycleState`, `InsightMateriality`, `ContextInsight`, `SignificanceRule` type exports added.

## QA / Validation

- `npx tsc --noEmit` — passes with zero new errors (two pre-existing optional-package errors from `@azure-rest/ai-document-intelligence` and `@axe-core/playwright` are present before and after this change).
- Migration is idempotent: `ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`.
- All new columns on `enterprise_context_records` are either nullable or carry safe defaults (`classification_source` defaults to `'OPERATOR_CONFIRMED'`), so no existing rows are invalidated.
- `lifecycle_state` CHECK is broadened (adds `'review'`); no existing valid value is removed.
- RLS on new tables mirrors the pattern in `20260514100000_enterprise_context_layer.sql` — service role full access, authenticated read via `can_read_tenant_by_key`, write via `can_write_tenant_by_key`. `significance_rules` is a global config table so authenticated reads are open and authenticated writes are blocked (service-role only).

## Rollout Plan

1. Squash-merge PR to `main`.
2. Run `npm run db:migrate` via the ACA operator job (image-override pattern against private VNet Postgres).
3. No feature flag needed — new columns/tables/views are invisible until the L2 engine call-sites land.
4. PostgREST reload is triggered by `NOTIFY pgrst, 'reload schema'` inside the migration transaction.

## Rollback Plan

- Schema additions are fully reversible: `DROP TABLE IF EXISTS context_insights; DROP TABLE IF EXISTS significance_rules; DROP VIEW IF EXISTS v_context_vendor_renewals; ...` plus `ALTER TABLE enterprise_context_records DROP COLUMN IF EXISTS domain_segment, DROP COLUMN IF EXISTS business_function, DROP COLUMN IF EXISTS criticality, DROP COLUMN IF EXISTS classification_source;` and re-narrowing the `lifecycle_state` CHECK.
- No existing data is modified, so rollback carries no data-loss risk.
- If `review` rows exist in `enterprise_context_records` at rollback time, the constraint re-narrow will fail — those rows must be set to `active` or `inactive` first.

## Audit Evidence

- PR: opened against `main` from branch `feat/ctx-028-classification-schema`.
- `npx tsc --noEmit` output: 3 pre-existing errors, 0 new errors.
- Migration file: `supabase/migrations/20260616180000_context_classification_and_insights.sql`.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — run before push.

## Known Gaps

- No L2 engine call-sites wired yet; `context_insights` will remain empty until the engine ships.
- `significance_rules.tenant_key` is absent (the table is global config), so the RLS `can_read_tenant_by_key` loop policy is immediately overridden with `USING (true)` for reads and `USING (false)` for writes — this is intentional and noted in the migration comment.
- Read-views are not RLS-guarded themselves; they inherit the RLS of the underlying `enterprise_context_records` table because they query it directly and views run with the caller's security context.
