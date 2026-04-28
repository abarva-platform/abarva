# ADMIN-DATA10 — Admin Tables Migrations + Apex/Meridian Seed

## Metadata
- ID: ADMIN-DATA10
- Title: Admin tables migrations + seed for Apex Retail + Meridian Bank
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: sql
- Dependencies: ADMIN-DATA2 (adapter contracts)
- Estimated complexity: XL

## Purpose
Ship the 7 new admin tables specced in ADMIN-DATA1 audit Section 3, plus seed SQL for Apex Retail and Meridian Bank tenants so the demo continues to render the same content after switching from fixture to live mode. After this lands, `ADMIN_DATA_MODE=live` is functional.

## Context
Per ADMIN-DATA1 audit Section 3, the new tables are:
1. `admin_connectors`
2. `admin_datasets`
3. `admin_dataset_approvals`
4. `admin_dataset_quality`
5. `admin_blockers`
6. `admin_audit_log`
7. `admin_setup_progress`

All are tenant-scoped via `client_id REFERENCES clients(id)`, RLS-enabled service-role-only. Migration filenames follow the existing `YYYYMMDDHHMMSS_<name>.sql` convention. Seed SQL ports today's hardcoded `APEX_DETAIL_SEEDS` etc. to live row inserts.

## Target state
- 7 new migration files at `supabase/migrations/<timestamp>_admin_<table>.sql`.
- Seed SQL block (in 1 migration or `supabase/seed.sql` extension) for Apex Retail (~6 connectors, ~12 datasets, ~3 approvals, ~5 blockers, ~10 audit events, 6 setup steps) and Meridian Bank (similar).
- Migration drift check passes.
- Adapters in fixture mode unchanged; live mode now functional.

## Allowed files
- `supabase/migrations/<timestamp>_admin_connectors.sql` (new)
- `supabase/migrations/<timestamp>_admin_datasets.sql` (new)
- `supabase/migrations/<timestamp>_admin_dataset_approvals.sql` (new)
- `supabase/migrations/<timestamp>_admin_dataset_quality.sql` (new)
- `supabase/migrations/<timestamp>_admin_blockers.sql` (new)
- `supabase/migrations/<timestamp>_admin_audit_log.sql` (new)
- `supabase/migrations/<timestamp>_admin_setup_progress.sql` (new)
- `supabase/migrations/<timestamp>_admin_demo_seed.sql` (new — Apex + Meridian seed)
- `docs/build/slices/ADMIN-DATA10_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/**` — no app code (adapters already shipped in DATA2)
- Any pre-existing migration file
- `package.json`

## Implementation scope
1. Write 7 migration files using DDL from ADMIN-DATA1 audit Section 3.
2. Each migration: `BEGIN`, `CREATE TABLE IF NOT EXISTS`, indexes, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `NOTIFY pgrst`, `COMMIT`.
3. Write demo seed migration: `INSERT INTO admin_connectors ...` for Apex's 6 connectors mirroring `APEX_DETAIL_SEEDS`; same for Meridian; and for `admin_datasets`, `admin_blockers`, `admin_setup_progress`, sample `admin_audit_log` events.
4. Run `npm run db:migrate` against local Supabase, verify migrations succeed.
5. Run `npm run db:seed` (if applicable) and verify counts match expectation.
6. Run migration drift check.
7. Run a smoke test of each adapter against live DB to verify shape parity.

## Tests
- New: `src/lib/admin/__tests__/data/admin-connectors-adapter.live.test.ts` — live-mode integration tests against test DB.
- Existing fixture-mode tests must continue to pass.

## Validation
```bash
npm run db:migrate
npm run db:seed
npm test -- src/lib/admin/__tests__/data
ADMIN_DATA_MODE=live npm test -- src/lib/admin/__tests__/data/admin-connectors-adapter.live.test.ts
bash scripts/integration/migration_drift.sh  # if exists
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. 7 migration files + 1 seed migration ship.
2. All 7 tables exist post-migrate with correct schema, indexes, RLS, policies.
3. Apex Retail seed produces row counts matching today's hardcoded constants.
4. Meridian Bank seed similarly.
5. `ADMIN_DATA_MODE=live` produces identical adapter output to fixture mode for the demo tenants.
6. Migration drift check passes.
7. No app code touched.

## Risks
- Migration ordering: tables reference `clients` and `persons`, both in earlier migrations. CHECK ordering with sequential timestamps.
- Seed data drift from page-view constants → DATA13 regression test.
- Demo `clients.id` lookup at seed time → use `(SELECT id FROM clients WHERE name = 'Apex Retail')` subqueries; idempotent.
- RLS may block service role on new tables — mirror existing `service_role_all_*` policy template.

## Founder review
After merge, run `npm run db:migrate && npm run db:seed`. Visit `/admin/connectors?tenant=apex-retail` with `ADMIN_DATA_MODE=live` — content matches fixture mode (parity).
