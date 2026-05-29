# Packet 30 Phase 2C.2f — Program Generate Route Parity Artifact

## Scope

Area group: program generation API route reads.

Converted files:

- `src/app/api/v1/programs/[programId]/generate/route.ts`
- Focused integration coverage in
  `src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts`

## Parity Pattern

This slice removes route-local Supabase reads from the program generate POST.
The route remains write-adjacent because it drafts deliverables after LLM
generation, but `draftModuleDeliverable()` stays unchanged in
`src/lib/programs/nexus.ts`. Only generation-context reads changed.

Before:

```ts
const { supabase } = await getProgramsRouteSupabase('mutation');
const program = await getProgramById(ctx, programId, { supabase });
const modules = await getModuleState(ctx, programId, { supabase });
const sb = getServerSupabase();
const { data: patternMatch } = await sb
  .from('pattern_match_logs')
  .select('pattern_key')
  .eq('engagement_id', programId)
  .eq('acted_upon', true)
  .maybeSingle();
```

After:

```ts
const program = await getProgramById(ctx, programId);
const modules = await getModuleState(ctx, programId);
const patternMatch = await azureRead.maybeSingle({
  table: 'pattern_match_logs',
  columns: ['pattern_key'],
  where: { engagement_id: programId, acted_upon: true },
  orderBy: { column: 'acted_upon_at', direction: 'desc' },
});
```

## Behavior Preserved

- Tenancy still gates through `requireTenancy()`.
- Foreign or unreadable programs still return HTTP 404 through
  `getProgramById()`.
- Request validation, phase bounds, deliverable type fallback, and title
  fallback are unchanged.
- Tenant context assembly, phase-pack formatting, prompt assembly, LLM
  streaming, and saved response semantics remain unchanged.
- Deliverable writes still go through `draftModuleDeliverable()`.
- No database schema, migration, seed, storage, or egress behavior changes.

## Census Delta

Start of this slice, after Phase 2C.2e:

- Runtime Supabase census: `153 files / 626 import-helper matches`
- Broad census: `305 files / 1456 broad matches`
- Current codemod inventory: `92 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `152 files / 620 import-helper matches`
- Broad census: `304 files / 1445 broad matches`
- Current codemod inventory: `91 READ_ONLY_SELECT`

Slice delta:

- `-1` runtime file with import-helper matches
- `-6` import-helper matches
- `-1` broad-match file
- `-11` broad matches
- `-1` READ_ONLY_SELECT candidate

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `152 files / 620 import-helper matches`
- Total Phase 2C reduction so far: `-24 files / -105 import-helper matches`

## Validation

Local validation:

```text
npx jest src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
```

Result: pass, 2 suites / 29 tests.

```text
npx eslint src/app/api/v1/programs/[programId]/generate/route.ts src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Result: pass/warn as expected for the still-open Phase 2C backlog. The target
generate route was removed from `CODEMOD_INVENTORY.*`.

```text
git diff --check
npm run release:check -- --base origin/main --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Diff whitespace check: pass.
- Release control gate: pass.
- Full local typecheck: blocked by pre-existing repo issues outside the touched
  files: duplicate helper implementation in
  `src/__tests__/integration/demo-code-sign-in-route.test.ts` and missing
  optional package type declarations (`@azure/identity`,
  `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`,
  `@resvg/resvg-js`). No touched-file errors remain.

## Rollback Plan

Rollback is file-local. Revert
`src/app/api/v1/programs/[programId]/generate/route.ts`, the focused test file,
the two `2c2f` evidence files, and the generated inventory update. No database
migration, production data operation, or feature flag is involved.

## Deferred Programs Residue

- `src/app/api/v1/programs/[programId]/advance/route.ts` remains
  mutation-adjacent despite its current read-only census classification.
- Upload/storage and mutation-heavy program routes remain out of this focused
  generate-route read slice.
