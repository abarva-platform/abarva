# 2026-05-29-packet-30-phase-2c-program-phase-gate-route — Phase 2C.2h Program Phase-Gate Route

## Release ID

`2026-05-29-packet-30-phase-2c-program-phase-gate-route`

## Status

`candidate`

## Plain-English Summary

This release removes the direct Supabase engagement lookup from the legacy
program phase-gate route. The lookup that resolves a seed `graph_node_id` to an
engagement row now uses the Packet 30 read plane. Phase advancement writes,
durable audit logging, permission checks, and local ledger behavior are
unchanged.

## Layer Impact

- data-plane-lane: phase-gate engagement lookup now uses the Azure read plane.
- runtime-app-lane: `/api/programs/phase-gate` auth, permission checks,
  preconditions, write adapter call, audit-log write, and response shape are
  preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared phase-gate route is universal across tenant-scoped
  program surfaces.
- Specific clients: none.
- Internal only: API read-path internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed `getServerSupabase()` from
  `src/app/api/programs/phase-gate/route.ts`.
- Replaced the `engagements` lookup by `graph_node_id` with
  `azureRead.maybeSingle()`.
- Kept phase advancement on `selectProgramsWriteAdapter()`.
- Kept durable audit logging on `writeProgramAuditLog()`.
- Added focused route coverage proving the read-plane lookup still feeds the
  same write/audit side effects.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added `verification/packet-30-phase-2c/2c2h-program-phase-gate-route-parity.md`.
- Added `verification/packet-30-phase-2c/2c2h-program-phase-gate-route-census.json`.

## QA / Validation

Validation performed:

```text
npx jest --runTestsByPath src/app/api/programs/phase-gate/__tests__/route.test.ts --runInBand
npx eslint src/app/api/programs/phase-gate/route.ts src/app/api/programs/phase-gate/__tests__/route.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Results:

- Focused Jest: pass, 1 suite / 1 test.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from
  `151 files / 617 import-helper matches` to
  `150 files / 614 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `90` to `89`.
- Release control gate: pass.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file
  errors were emitted.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the route read-plane change. No database migration or
manual data operation is required.

Post-deploy smoke target:

- `/api/programs/phase-gate` from an authenticated tenant session.

## Rollback Plan

Rollback is file-local. Revert the phase-gate route, its focused test file, the
two `2c2h` evidence files, and the generated inventory update. If the route
regresses in production, revert this merge commit and restore the previous
production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2h-program-phase-gate-route-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2h-program-phase-gate-route-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- The phase-gate route remains mutation-adjacent by design.
- Program attachment routes remain storage-backed and out of this focused
  read-seam cleanup.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
