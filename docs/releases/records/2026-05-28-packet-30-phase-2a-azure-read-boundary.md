# 2026-05-28-packet-30-phase-2a-azure-read-boundary — Packet 30 Phase 2A Azure Read Boundary

## Release ID

`2026-05-28-packet-30-phase-2a-azure-read-boundary`

## Status

`candidate`

## Plain-English Summary

This release executes the approved Packet 30 Phase 2A split. It adds a canonical Azure runtime read boundary and a warn-only CI census for remaining Supabase runtime imports. It does not migrate runtime callsites yet; Phase 2B will use this boundary to move the critical demo path in smaller, testable slices.

## Layer Impact

- data-plane-lane: adds `src/lib/data-plane/azureRead.ts` as the canonical Azure read helper for future runtime migrations.
- ci-governance-lane: adds a warn-only runtime Supabase import census to the production-readiness workflow.
- verification-lane: records the Phase 2A check-in and runtime Supabase baseline counts.
- runtime-app-lane: no callsite behavior changes in this release.
- client-data-lane: no schema changes and no data-plane writes.

## Client Applicability

- All clients: future runtime reads will migrate through the same Azure read boundary.
- SkyHarbor, Apex, Meridian, Northstar, First Capital: no behavior changes in Phase 2A.
- Internal only: warn-only CI baseline and migration tracking.
- Feature flag: not applicable.

## Changes Included

- `src/lib/data-plane/azureRead.ts`
- `src/lib/data-plane/__tests__/azure-read.test.ts`
- `scripts/audit/runtime-supabase-import-census.mjs`
- `verification/RUNTIME_SUPABASE_IMPORT_BASELINE.md`
- `verification/PACKET_30_PHASE_2_DATA_PLANE_AUDIT.md`
- `verification/PACKET_30_PHASE_2A_CHECKIN.md`
- `package.json`
- `.github/workflows/production-readiness-gate.yml`

## QA / Validation

Validation performed:

```text
npx jest src/lib/data-plane/__tests__/azure-read.test.ts src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts --runInBand
npx eslint src/lib/data-plane/azureRead.ts src/lib/data-plane/__tests__/azure-read.test.ts scripts/audit/runtime-supabase-import-census.mjs
node scripts/audit/runtime-supabase-import-census.mjs
npm run release:check -- --base origin/main --head HEAD
git diff --check
npx tsc --noEmit --pretty false
```

Results:

- Azure read boundary tests: pass, 2 suites passed, 9 tests passed.
- Focused ESLint: pass.
- Release control gate: pass.
- Diff whitespace check: pass.
- Runtime Supabase census: pass/warn, non-blocking.
- Current baseline: 182 runtime files with Supabase import/helper matches; 762 import/helper matches; 330 runtime files with broad matches; 1,705 broad matches.
- Local full TypeScript check: blocked by missing optional dependency type declarations already present in this worktree (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). A Phase 2A adapter generic typing issue surfaced by this check was fixed; the final run has no `azureRead.ts` errors.

## Rollout Plan

Merge after CI is green. No production behavior change is expected because no runtime callsite consumes `azureRead` yet. Production deployment may occur through normal main deployment, but no post-deploy product smoke is required for Phase 2A beyond confirming the deployment completes if Vercel deploys the merge.

## Rollback Plan

Revert the PR. There are no migrations, data writes, or runtime callsite dependencies to roll back.

## Audit Evidence

- Phase 2 data-plane audit: `verification/PACKET_30_PHASE_2_DATA_PLANE_AUDIT.md`
- Phase 2A check-in: `verification/PACKET_30_PHASE_2A_CHECKIN.md`
- Runtime Supabase baseline: `verification/RUNTIME_SUPABASE_IMPORT_BASELINE.md`
- New adapter tests cover typed reads, read-only enforcement, identifier safety, missing optional table fallback, and session URL fallback behavior.

## Known Gaps

- Supabase runtime imports are still present by design. Phase 2A sets the boundary and warn-only census; Phase 2B/2C will burn down callsites; Phase 2D will enforce zero imports.
- `azureRead` is read-only. Runtime write migration remains separate and must use transaction-safe write helpers.
