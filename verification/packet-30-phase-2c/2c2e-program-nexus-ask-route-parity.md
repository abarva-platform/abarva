# Packet 30 Phase 2C.2e — Program Nexus Ask Route Parity Artifact

## Scope

Area group: program Nexus ask API route reads.

Converted files:

- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`
- Focused integration coverage in
  `src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts`

## Parity Pattern

This slice removes route-local Supabase reads from the program Nexus ask POST.
The route remains mutation-adjacent because it creates or touches program
threads, but those write helpers stay in `src/lib/programs/nexus.ts`. Only the
explicit read seams changed.

Before:

```ts
const { supabase } = await getProgramsRouteSupabase('mutation');
const program = await getProgramById(ctx, programId, { supabase });
const { data } = await supabase
  .from('program_threads')
  .select('id, engagement_id, user_id')
  .eq('id', threadId)
  .maybeSingle();
```

After:

```ts
const program = await getProgramById(ctx, programId);
const thread = await azureRead.maybeSingle({
  table: 'program_threads',
  columns: ['user_id'],
  where: { id: threadId, engagement_id: programId },
});
```

## Behavior Preserved

- Tenancy still gates through `requireTenancy()`.
- Foreign or unreadable programs still return HTTP 404 through
  `getProgramById()`.
- Existing-thread reuse still requires the same user and program.
- New-thread creation still calls `createThread()`.
- Context assembly, canonical pattern search, Nexus synthesis, SSE event shape,
  and `touchThread()` remain unchanged.
- No database schema, migration, seed, storage, or egress behavior changes.

## Census Delta

Start of this slice, after Phase 2C.2d:

- Runtime Supabase census: `154 files / 628 import-helper matches`
- Broad census: `306 files / 1459 broad matches`
- Current codemod inventory: `93 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `153 files / 626 import-helper matches`
- Broad census: `305 files / 1456 broad matches`
- Current codemod inventory: `92 READ_ONLY_SELECT`

Slice delta:

- `-1` runtime file with import-helper matches
- `-2` import-helper matches
- `-1` broad-match file
- `-3` broad matches
- `-1` READ_ONLY_SELECT candidate

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `153 files / 626 import-helper matches`
- Total Phase 2C reduction so far: `-23 files / -99 import-helper matches`

## Validation

Local validation:

```text
npx jest src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts src/__tests__/integration/programs-nexus-ask-route.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
```

Result: pass, 3 suites / 45 tests.

```text
npx eslint src/app/api/v1/programs/[programId]/nexus/ask/route.ts src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts src/__tests__/integration/programs-nexus-ask-route.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Result: pass/warn as expected for the still-open Phase 2C backlog. The target
Nexus ask route was removed from `CODEMOD_INVENTORY.*`.

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
`src/app/api/v1/programs/[programId]/nexus/ask/route.ts`,
`src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts`,
the two `2c2e` evidence files, and the generated inventory update. No database
migration, production data operation, or feature flag is involved.

## Deferred Programs Residue

- `src/app/api/v1/programs/[programId]/generate/route.ts` remains as a
  dedicated future generation-route read slice.
- `src/app/api/v1/programs/[programId]/advance/route.ts` remains
  mutation-adjacent despite its current read-only census classification.
- Upload/storage and mutation-heavy program routes remain out of this focused
  Nexus ask read slice.
