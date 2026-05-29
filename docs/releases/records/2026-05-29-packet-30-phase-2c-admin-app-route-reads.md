# 2026-05-29-packet-30-phase-2c-admin-app-route-reads — Admin/App Route Reads

## Release ID

`2026-05-29-packet-30-phase-2c-admin-app-route-reads`

## Status

`candidate`

## Plain-English Summary

This release executes the first bulk Phase 2C codemod. It moves 17 route/page
read callsites from the legacy `getServerSupabase` helper name to the explicit
Azure/Postgres read-fluent client name, preserving the same fluent query chains
and tenant/auth checks.

## Layer Impact

- read-data-plane: admin, engagement, sponsor, and Source route/page reads use
  the explicit Postgres/Azure read-fluent client.
- app-control-lane: no navigation, UI copy, or route behavior changes.
- write-data-plane: no write adapter behavior changes; existing write adapters
  remain the write source of truth.
- tenant isolation: tenant checks are preserved at the existing callsites.
- schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. These are shared runtime routes/pages and apply to all
  canonical tenants when those surfaces are used.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/codemods/phase-2c-apply-read-fluent.mjs`
- `src/lib/data-plane/postgresCompat.ts`
- `src/lib/supabase-server.ts`
- 17 route/page read callsites listed in
  `verification/packet-30-phase-2c/2c1-admin-app-route-reads-parity.md`
- `verification/packet-30-phase-2c/2c1-admin-app-route-codemod-report.json`
- `verification/packet-30-phase-2c/2c1-admin-app-route-reads-census.json`
- `verification/packet-30-phase-2c/2c1-admin-app-route-reads-parity.md`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## QA / Validation

- PASS: AST-aware codemod dry run, 17/17 would apply, 0 skips.
- PASS: AST-aware codemod apply run, 17/17 applied, 0 skips.
- PASS: focused ESLint on changed runtime and codemod files.
- PASS: runtime Supabase import census in warn mode.
- PENDING UNTIL MERGE: Vercel rolling production release and universal
  5-tenant smoke.
- BLOCKED OUTSIDE THIS PR: full local `tsc` remains blocked by the existing
  optional dependency resolution debt tracked in backlog Section 10.4.

## Census Delta

- Start: `140 files / 582 import-helper matches`
- End: `123 files / 530 import-helper matches`
- Delta: `-17 files / -52 import-helper matches`
- Bulk acceptance progress: `52 / 553 = 9.4%`

## Rollout Plan

Merge after PR checks pass. Use the normal Vercel Git integration and verify
the rolling release per Packet 30 §5.7:

1. 10%: verify production health and no runtime error spike.
2. 50%: repeat production health and spot route smoke.
3. 100%: run universal 5-tenant smoke per Packet 31 §4.4.

## Rollback Plan

Revert the merge commit to restore the previous helper naming for all 17
files. No database rollback is required.

## Per-File Rollback Path

For any affected file, rollback is independent and mechanical:

1. Replace `getAzureReadFluentClient` with `getServerSupabase`.
2. Replace the import from `@/lib/data-plane/postgresCompat` with
   `@/lib/supabase-server`.
3. Re-run focused ESLint on that file.

Affected files:

- `src/app/api/admin/users/provision/route.ts`
- `src/app/api/admin/quarantine/[id]/hard-delete/route.ts`
- `src/app/api/admin/quarantine/[id]/release/route.ts`
- `src/app/api/admin/seed-clerk-metadata/route.ts`
- `src/app/api/engage/[engagementId]/turn/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/status/route.ts`
- `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`
- `src/app/api/v1/source/[eventId]/stage/route.ts`
- `src/app/api/v1/source/events/[eventId]/approve/route.ts`
- `src/app/(maestro)/engagements/[engagementId]/page.tsx`
- `src/app/(maestro)/engagements/[engagementId]/deliverables/[deliverableId]/page.tsx`
- `src/app/(maestro)/engagements/[engagementId]/charter/page.tsx`
- `src/app/(maestro)/engagements/[engagementId]/deliverables/page.tsx`
- `src/app/(maestro)/engagements/[engagementId]/turns/page.tsx`
- `src/app/(maestro)/evidence-ledger/page.tsx`
- `src/app/sponsor/page.tsx`

## Audit Evidence

- `verification/packet-30-phase-2c/2c1-admin-app-route-reads-parity.md`
- `verification/packet-30-phase-2c/2c1-admin-app-route-reads-census.json`
- `verification/packet-30-phase-2c/2c1-admin-app-route-codemod-report.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## Known Gaps

Packet 30 Phase 2C remains open. The runtime import-helper census is now
`123 files / 530 matches`; acceptance requires the three bulk PRs to reduce the
allowlist below 30, then Phase 2D guard enforcement follows separately.
