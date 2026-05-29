# 2026-05-29-packet-30-phase-2c-mixed-write-fluent — Mixed DB Write-Fluent Cleanup

## Release ID

`2026-05-29-packet-30-phase-2c-mixed-write-fluent`

## Status

`candidate`

## Plain-English Summary

This release accelerates Packet 30 Phase 2C by moving 38 mixed read/write DB
runtime files from the legacy Supabase helper path to an explicit
Azure/Postgres write-fluent helper. It keeps storage-backed paths out of scope
and updates the affected tests to mock the new helper path directly.

## Layer Impact

- read-data-plane: mixed DB modules no longer import the legacy helper for read
  chains.
- write-data-plane: DB row writes now use the explicit Postgres/Azure
  write-fluent compatibility helper.
- app-control-lane: no navigation, copy, UI, route contract, or auth-mode
  behavior changes.
- object-storage lane: intentionally untouched.
- schema/migration lane: no schema or migration changes.
- tenant isolation: existing tenant predicates and tenancy assertions are
  preserved.

## Client Applicability

- All clients: yes. These are shared runtime DB helpers and write adapters used
  by all canonical tenants when the associated surfaces are used.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `getAzureWriteFluentClient()` in `src/lib/data-plane/postgresCompat.ts`.
- Migrates 38 runtime DB files listed in
  `verification/packet-30-phase-2c/2c3-mixed-write-fluent-parity.md`.
- Updates focused tests for migrated modules to mock
  `@/lib/data-plane/postgresCompat`.
- Adds:
  - `verification/packet-30-phase-2c/2c3-mixed-write-fluent-parity.md`
  - `verification/packet-30-phase-2c/2c3-mixed-write-fluent-census.json`
  - `verification/packet-30-phase-2c/2c3-mixed-db-program-source-write-fluent-codemod-report.json`
  - `verification/packet-30-phase-2c/2c3-write-adapters-codemod-report.json`

## QA / Validation

- PASS: runtime Supabase import census in warn mode.
- PASS: focused ESLint on changed runtime and test files.
- PASS: focused Jest, 19 suites / 243 tests.
- PASS: `git diff --check`.
- PENDING UNTIL MERGE: Vercel rolling production release and universal
  5-tenant smoke.

## Census Delta

- Start: `85 files / 386 import-helper matches`
- End: `47 files / 186 import-helper matches`
- Delta: `-38 files / -200 import-helper matches`
- Bulk acceptance progress: `396 / 553 = 71.6%`

## Rollout Plan

Merge after PR checks pass. Use the normal Vercel Git integration and verify
the rolling release per Packet 30 §5.7:

1. 10%: verify production health and no runtime error spike.
2. 50%: repeat production health and spot route smoke.
3. 100%: run universal 5-tenant smoke per Packet 31 §4.4.

## Rollback Plan

Revert the merge commit to restore the previous helper path for all migrated
files. No database rollback is required.

## Per-File Rollback Path

For any affected file, rollback is independent and mechanical:

1. Replace `getAzureWriteFluentClient` with `getServerSupabase`.
2. Replace the import from `@/lib/data-plane/postgresCompat` with
   `@/lib/supabase-server`.
3. Restore `PostgresCompatClient` type imports from `@/lib/supabase-server` if
   the file used the historical `SupabaseClient` alias.
4. Re-run focused ESLint and the relevant focused Jest suite.

Affected files are listed in
`verification/packet-30-phase-2c/2c3-mixed-write-fluent-parity.md`.

## Audit Evidence

- `verification/packet-30-phase-2c/2c3-mixed-write-fluent-parity.md`
- `verification/packet-30-phase-2c/2c3-mixed-write-fluent-census.json`
- `verification/packet-30-phase-2c/2c3-mixed-db-program-source-write-fluent-codemod-report.json`
- `verification/packet-30-phase-2c/2c3-write-adapters-codemod-report.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## Known Gaps

Packet 30 Phase 2C remains open. The runtime import-helper census is now
`47 files / 186 matches`; acceptance requires the follow-on bulk slices to
reduce the allowlist below 30, then Phase 2D guard enforcement follows
separately.
