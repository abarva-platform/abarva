# 2026-05-29-packet-30-phase-2c-other-tenant-read-fluent — Other Tenant-Scoped Read-Fluent Cleanup

## Release ID

`2026-05-29-packet-30-phase-2c-other-tenant-read-fluent`

## Status

`candidate`

## Plain-English Summary

This release executes the next bulk Phase 2C codemod slice. It moves 38
read-only library callsites from the legacy Supabase helper path to the explicit
Azure/Postgres read-fluent client while preserving existing query chains,
tenant predicates, and authorization checks.

## Layer Impact

- read-data-plane: shared tenant-scoped read libraries and read adapters now use
  the explicit Postgres/Azure read-fluent client.
- app-control-lane: no navigation, copy, route, or UI behavior changes.
- write-data-plane: no write adapter behavior changes.
- tenant isolation: existing tenant filters and access-policy checks are
  preserved at the migrated callsites.
- schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. These are shared runtime read helpers and apply to all five
  canonical tenants when the associated surfaces are used.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- 38 runtime read files listed in
  `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-parity.md`
- 2 focused tests updated to mock the new `postgresCompat` read-fluent path
- `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-codemod-report.json`
- `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-census.json`
- `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-parity.md`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## QA / Validation

- PASS: Next.js 16 route-handler guidance reviewed before route/runtime work.
- PASS: dependency install in clean worktree with `npm ci --ignore-scripts`.
- PASS: AST-aware codemod apply run, 38/39 candidates applied, 1 expected skip.
- PASS: mechanical type-import cleanup from compatibility alias to
  `postgresCompat`.
- PASS: Prettier on changed runtime and evidence files.
- PASS: focused ESLint on changed runtime files.
- PASS: runtime Supabase import census in warn mode.
- PENDING UNTIL MERGE: Vercel rolling production release and universal
  5-tenant smoke.

## Census Delta

- Start: `123 files / 530 import-helper matches`
- End: `85 files / 386 import-helper matches`
- Delta: `-38 files / -144 import-helper matches`
- Bulk acceptance progress: `196 / 553 = 35.4%`

## Rollout Plan

Merge after PR checks pass. Use the normal Vercel Git integration and verify
the rolling release per Packet 30 §5.7:

1. 10%: verify production health and no runtime error spike.
2. 50%: repeat production health and spot route smoke.
3. 100%: run universal 5-tenant smoke per Packet 31 §4.4.

## Rollback Plan

Revert the merge commit to restore the previous helper path for all 38 files.
No database rollback is required.

## Per-File Rollback Path

For any affected file, rollback is independent and mechanical:

1. Replace `getAzureReadFluentClient` with `getServerSupabase`.
2. Replace the import from `@/lib/data-plane/postgresCompat` with
   `@/lib/supabase-server`.
3. Restore `PostgresCompatClient` type imports from `@/lib/supabase-server` if
   the file used the historical `SupabaseClient` alias.
4. Re-run focused ESLint on that file.

Affected files are listed in
`verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-parity.md`.

## Audit Evidence

- `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-parity.md`
- `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-census.json`
- `verification/packet-30-phase-2c/2c2-other-tenant-read-fluent-codemod-report.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## Known Gaps

Packet 30 Phase 2C remains open. The runtime import-helper census is now
`85 files / 386 matches`; acceptance requires the three bulk PRs to reduce the
allowlist below 30, then Phase 2D guard enforcement follows separately.
