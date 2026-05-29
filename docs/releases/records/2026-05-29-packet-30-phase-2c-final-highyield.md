# 2026-05-29-packet-30-phase-2c-final-highyield

## Release ID

`2026-05-29-packet-30-phase-2c-final-highyield`

## Status

`candidate`

## Plain-English Summary

This release removes the remaining easy runtime dependency on the old
Supabase-named server helper. Database reads and writes now go through the
Postgres-compatible data-plane helper in 37 more files. The only meaningful
runtime helper residue left is storage/binary upload and download code, which
needs its own storage-adapter decision instead of a blind rename.

## Layer Impact

- App control lane: data-access cleanup for runtime application code.
- Data plane: helper routing only; no schema or data migration.
- Storage lane: explicitly excluded and left unchanged for Phase 2D.

## Client Applicability

- All clients: yes. These are shared runtime DB helpers used by all canonical
  tenants when the associated surfaces are used.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Migrates 37 runtime files from `@/lib/supabase-server` to
  `@/lib/data-plane/postgresCompat`.
- Splits a few DB-only operations away from storage-boundary files while leaving
  the actual `.storage.from(...)` calls untouched.
- Reduces the runtime helper census from `47 files / 186 matches` to
  `10 files / 29 matches`.

## QA / Validation

- PASS: `npm run audit:runtime-supabase-imports`
- PASS: `node scripts/codemods/phase-2c-supabase-read-inventory.mjs`
- PASS: focused Jest matched suites, `2` suites / `11` tests.
- PASS: focused ESLint over changed runtime files.
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Class D auto-merge after CI green during business hours. Deploy to production
and run live `/api/health` plus I9 industry-isolation smoke before continuing to
Phase 2D.

## Rollback Plan

Rollback is per file:

1. Restore the import from `@/lib/supabase-server`.
2. Replace the Azure fluent helper call with `getServerSupabase()`.
3. Re-run the focused test and census commands above.

No database rollback is required because this release has no migration or data
mutation.

## Audit Evidence

- `verification/packet-30-phase-2c/2c4-final-highyield-parity.md`
- `verification/packet-30-phase-2c/2c4-final-highyield-census.json`
- `verification/packet-30-phase-2c/2c4-final-highyield-codemod-report.json`
- `verification/packet-30-phase-2c/2c4-final-highyield-inventory.json`
- `verification/packet-30-phase-2c/2c4-final-highyield-inventory.md`

## Known Gaps

- `29` helper matches remain by design. They are concentrated in storage/binary
  paths plus the compatibility export and are queued for Phase 2D storage guard
  enforcement.
