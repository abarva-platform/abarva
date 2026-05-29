# Packet 30 Phase 2C.2g — Program Content Export Route Parity Artifact

## Scope

Area group: legacy program deliverable content export API route reads.

Converted files:

- `src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts`
- Focused route coverage in
  `src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts`

## Parity Pattern

This slice removes route-local Supabase reads from the content-export GET
route. The route is read-only before rendering; HTML, DOCX, and XLSX rendering
logic stays in the same file and is unchanged except for removing an unused
local variable in the DOCX renderer.

Before:

```ts
const sb = getServerSupabase();
const { data: delivRow, error: delivErr } = await sb
  .from('deliverables_v2')
  .select('id, engagement_id, deliverable_type_key, title')
  .eq('id', deliverableId)
  .eq('engagement_id', programId)
  .maybeSingle();
```

After:

```ts
const deliverable = await azureRead.maybeSingle({
  table: 'deliverables_v2',
  columns: ['id', 'engagement_id', 'deliverable_type_key', 'title'],
  where: { id: deliverableId, engagement_id: programId },
});
```

## Behavior Preserved

- Tenancy still gates through `requireTenancy()`.
- Missing route params still return HTTP 400.
- Invalid `format` values still return HTTP 400.
- Missing deliverable still returns HTTP 404.
- Empty latest content still returns HTTP 404 with `no_content`.
- HTML, DOCX, and XLSX rendering semantics and response headers are preserved.
- No database schema, migration, seed, storage, or write behavior changes.

## Census Delta

Start of this slice, after Phase 2C.2f:

- Runtime Supabase census: `152 files / 620 import-helper matches`
- Broad census: `304 files / 1445 broad matches`
- Current codemod inventory: `91 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `151 files / 617 import-helper matches`
- Broad census: `303 files / 1440 broad matches`
- Current codemod inventory: `90 READ_ONLY_SELECT`

Slice delta:

- `-1` runtime file with import-helper matches
- `-3` import-helper matches
- `-1` broad-match file
- `-5` broad matches
- `-1` READ_ONLY_SELECT candidate

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `151 files / 617 import-helper matches`
- Total Phase 2C reduction so far: `-25 files / -108 import-helper matches`

## Validation

Local validation:

```text
npx jest --runTestsByPath src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts --runInBand
```

Result: pass, 1 suite / 2 tests.

```text
npx eslint src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Result: pass/warn as expected for the still-open Phase 2C backlog. The target
content-export route was removed from `CODEMOD_INVENTORY.*`.

```text
git diff --check
npm run release:check -- --base origin/main --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Diff whitespace check: pass.
- Release control gate: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file
  errors were emitted.

## Rollback Plan

Rollback is file-local. Revert
`src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts`,
the focused test file, the two `2c2g` evidence files, and the generated
inventory update. No database migration, production data operation, or feature
flag is involved.

## Deferred Programs Residue

- `src/app/api/programs/phase-gate/route.ts` remains write-adjacent because it
  advances phase state and writes audit logs.
- Program attachment routes remain storage-backed and out of this read-only
  content-export slice.
- Program work-item, milestone, risk, approval, execute, and Nexus mutation
  routes remain separate mixed read/write slices.
