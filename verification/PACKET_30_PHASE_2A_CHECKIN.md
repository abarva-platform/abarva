# Packet 30 Phase 2A Check-In

Date: 2026-05-28
Branch: `codex/arch-consolidation-phase-2-data-plane`
Scope: Azure runtime read boundary, warn-only Supabase import census, no runtime callsite migration.

## 1. Adapter Parity Test Results

Commands:

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
- Coverage includes typed raw `SELECT`, read-only SQL rejection, identifier-safe structured selects, `maybeSingle`, missing optional table fallback, and Azure URL fallback behavior.
- Runtime Supabase census: pass/warn, non-blocking.
- Current warn-only baseline:
  - 182 runtime files with Supabase import/helper matches.
  - 762 Supabase import/helper matches.
  - 330 runtime files with broad matches, including `.from(` query-builder usage.
  - 1,705 broad matches.
- Local full TypeScript check: blocked by missing optional package type declarations already present in this worktree (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). The Phase 2A adapter-specific type error found during this check was fixed before commit; no `azureRead.ts` error remains in the final run.

## 2. Phase 2B Callsite Inventory

Phase 2B should migrate the critical demo path first. Proposed files in scope:

### Intelligence / Tenant Context

- `src/app/api/intelligence/ask/route.ts`
- `src/lib/tenant/resolveTenant.ts`
- `src/lib/intelligence/ask/session-memory.ts`
- `src/lib/intelligence/ask/retrievers/vendor.ts`
- `src/lib/intelligence/ask/retrievers/pattern.ts`
- `src/lib/intelligence/ask/retrievers/knowledge.ts`
- `src/lib/knowledge/tenant-enterprise-context.ts`

### Program Origination / Moves

- `src/app/api/programs/origination-draft/route.ts`
- `src/app/api/programs/origination-submit/route.ts`
- `src/lib/programs/origination-drafts.ts`
- `src/lib/programs/origination-submit.ts`

### Source Demo Path

- `src/lib/source/queries.ts`
- `src/lib/source/value-chain.ts`
- `src/lib/data-plane/read-adapters/sourceEventsReadAdapter.ts`
- `src/app/api/v1/source/events/[eventId]/approve/route.ts`
- `src/app/api/v1/source/[eventId]/stage/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`

### Tower Demo Path

- `src/app/(maestro)/tower/page.tsx`
- `src/lib/tower/aggregate.ts`
- `src/lib/data-plane/read-adapters/towerPageReadAdapter.ts`
- `src/lib/data-plane/read-adapters/towerAggregateReadAdapter.ts`
- `src/lib/data-plane/read-adapters/towerSubstrateReadAdapter.ts`

## 3. Rolling Release Plan

1. Convert `resolveTenant.ts` from `getServerSupabase` to `azureRead` first, because it is a bounded client-row lookup and directly supports the Phase 1 tenant fix.
2. Convert Intelligence session-memory reads/writes only after adding matching Azure write boundary support or confirming the existing transaction write adapter is sufficient.
3. Convert Source/Tower read adapters next, preserving their existing adapter selectors and tests.
4. Convert Program origination drafts last in Phase 2B because it has write behavior and was the route that previously surfaced 403 risk.
5. After each sub-slice: focused Jest, ESLint on touched files, production smoke against `app.abarva.ai`, and import-census delta.

## 4. Rollback Plan

- Phase 2A rollback: revert the Azure read boundary / census PR. No runtime callsites depend on it yet.
- Phase 2B rollback: each sub-slice must be its own PR. Revert the failing sub-slice only, redeploy, and rerun the same production smoke.
- Do not enable blocking import enforcement until Phase 2D.

## 5. Go / No-Go For Phase 2B

Go after Phase 2A PR is green and merged.

No-go conditions:

- `azureRead` tests fail in CI.
- Warn-only census cannot run in CI.
- Production readiness gate fails for reasons introduced by Phase 2A.
