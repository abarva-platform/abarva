# 2026-05-29-packet-30-phase-2c-api-read-bundle — Phase 2C.3a API Read Bundle

## Release ID

`2026-05-29-packet-30-phase-2c-api-read-bundle`

## Status

`candidate`

## Plain-English Summary

This release removes direct Supabase reads from two small GET-only API routes:
the public health check and the knowledge chunk lookup endpoint. Both now use
the Packet 30 read plane for database reads while preserving response shapes and
fallback behavior.

## Layer Impact

- data-plane-lane: health liveness and knowledge chunk reads now use the Azure
  read plane.
- runtime-app-lane: `/api/health` and `/api/knowledge/chunk` response shapes
  are preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared API read surfaces.
- Specific clients: none.
- Internal only: health and knowledge read-path internals; user-facing behavior
  should be unchanged.
- Public/demo only: `/api/health` remains public liveness.
- Feature flag: none.

## Changes Included

- Removed `getServerSupabase()` from `src/app/api/health/route.ts`.
- Replaced the primary health Postgres probe with `azureRead.query()`.
- Removed `getServerSupabase()` from `src/app/api/knowledge/chunk/route.ts`.
- Replaced `pinecone_id` lookup with an `azureRead.query()` SQL join.
- Replaced `source_key` and chunk lookups with `azureRead.maybeSingle()` and
  `azureRead.select()`.
- Added focused route coverage for health and knowledge chunk lookups.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added `verification/packet-30-phase-2c/2c3a-api-read-bundle-parity.md`.
- Added `verification/packet-30-phase-2c/2c3a-api-read-bundle-census.json`.

## QA / Validation

Validation performed:

```text
npx jest --runTestsByPath src/app/api/health/__tests__/route.test.ts src/app/api/knowledge/chunk/__tests__/route.test.ts --runInBand
npx eslint src/app/api/health/route.ts src/app/api/health/__tests__/route.test.ts src/app/api/knowledge/chunk/route.ts src/app/api/knowledge/chunk/__tests__/route.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Results:

- Focused Jest: pass, 2 suites / 3 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from
  `150 files / 614 import-helper matches` to
  `148 files / 608 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `89` to `87`.
- Release control gate: pass.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file
  errors were emitted.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the read-plane change. No database migration or manual
data operation is required.

Post-deploy smoke targets:

- `/api/health`
- `/api/knowledge/chunk` with a known source key or pinecone id from an
  authenticated/internal context.

## Rollback Plan

Rollback is file-local. Revert the two route files, the two focused test files,
the two `2c3a` evidence files, and the generated inventory update. If either
route regresses in production, revert this merge commit and restore the previous
production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c3a-api-read-bundle-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c3a-api-read-bundle-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- Admin quarantine, Source API, app-route, and lib-level read residues remain
  for subsequent Phase 2C.3 slices.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
