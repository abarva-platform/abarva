# Packet 30 Phase 2C.2d — Program Module Route Parity Artifact

## Scope

Area group: program API detail route reads.

Converted files:

- `src/app/api/v1/programs/[programId]/module/[key]/route.ts`
- Focused integration coverage in
  `src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts`

## Parity Pattern

This slice moves the module workspace GET route's read-only deliverable lookups
from a route-local Supabase chain to the Packet 30 Azure read plane. The route
still gates on `requireTenancy()`, still verifies program access through
`getProgramById()`, and still resolves module state through `getModuleState()`.

Before:

```ts
const { supabase } = await getProgramsRouteSupabase('program_read');
const program = await getProgramById(ctx, programId, { supabase });
const modules = await getModuleState(ctx, programId, { supabase });
const { data: delivRow } = await supabase
  .from('deliverables_v2')
  .select('id, status, current_version, title, updated_at')
  .eq('engagement_id', programId)
  .eq('deliverable_type_key', key)
  .maybeSingle();
```

After:

```ts
const program = await getProgramById(ctx, programId);
const modules = await getModuleState(ctx, programId);
const deliverable = await azureRead.maybeSingle({
  table: 'deliverables_v2',
  columns: ['id', 'status', 'current_version', 'title', 'updated_at'],
  where: { engagement_id: programId, deliverable_type_key: key },
});
```

Latest-version lookup also moved to `azureRead.maybeSingle()` with
`ORDER BY version DESC LIMIT 1` semantics through the Azure read helper.

## Behavior Preserved

- Missing or foreign programs still return HTTP 404 via `getProgramById()`.
- No-membership tenancy failures still return the existing tenancy error
  response.
- Missing module keys still return `{ error: 'module_not_found' }`.
- Response shape remains `{ module, draftContent, provenanceMap }`.
- Module status mapping remains unchanged.
- The route still exposes no POST handler.

## Census Delta

Start of this slice, after Phase 2C.2c:

- Runtime Supabase census: `154 files / 628 import-helper matches`
- Broad census: `307 files / 1461 broad matches`
- Current codemod inventory: `94 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `154 files / 628 import-helper matches`
- Broad census: `306 files / 1459 broad matches`
- Current codemod inventory: `93 READ_ONLY_SELECT`

Slice delta:

- `0` runtime files with import-helper matches
- `0` import-helper matches
- `-1` broad-match file
- `-2` broad matches
- `-1` READ_ONLY_SELECT candidate

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `154 files / 628 import-helper matches`
- Total Phase 2C reduction so far: `-22 files / -97 import-helper matches`

## Validation

Local validation:

```text
npx jest src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
```

Result: pass, 2 suites / 36 tests.

```text
npx eslint src/app/api/v1/programs/[programId]/module/[key]/route.ts src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Result: pass/warn as expected for the still-open Phase 2C backlog. The target
module route was removed from `CODEMOD_INVENTORY.*`.

```text
git diff --check
npm run release:check -- --base origin/main --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Diff whitespace check: pass.
- Release control gate: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`,
  `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors were emitted before
  those dependency-resolution failures.

## Rollback Plan

Rollback is file-local. Revert
`src/app/api/v1/programs/[programId]/module/[key]/route.ts`,
`src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts`,
the two `2c2d` evidence files, and the generated inventory update. No database
migration, production data operation, or feature flag is involved.

## Deferred Programs Residue

- `src/app/api/v1/programs/[programId]/generate/route.ts` remains a dedicated
  future generation-route read slice.
- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts` remains a future
  read/mutation-adjacent route slice because it validates and touches threads.
- Upload/storage and mutation-heavy program routes remain out of this pure
  module-detail route slice.
