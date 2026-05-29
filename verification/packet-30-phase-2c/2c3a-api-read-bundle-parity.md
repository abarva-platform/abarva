# Packet 30 Phase 2C.3a — API Read Bundle Parity Artifact

## Scope

Area group: small API read routes outside the program migration cluster.

Converted files:

- `src/app/api/health/route.ts`
- `src/app/api/knowledge/chunk/route.ts`
- Focused route coverage in:
  - `src/app/api/health/__tests__/route.test.ts`
  - `src/app/api/knowledge/chunk/__tests__/route.test.ts`

## Parity Pattern

This slice removes route-local Supabase reads from two GET-only API surfaces.
The health route still reports the same `postgres`, `direct_postgres`, and
`neo4j` status shape; only the primary Postgres liveness probe now uses
`azureRead`. The knowledge chunk route still supports both `pinecone_id` and
`source_key` lookups; only the data access path moved to `azureRead`.

Before:

```ts
await getServerSupabase().from('engagements').select('id').limit(1);
```

After:

```ts
await azureRead.query('SELECT id FROM engagements LIMIT 1');
```

Before:

```ts
const sb = getServerSupabase();
await sb.from('knowledge_chunks').select(...).eq(...).maybeSingle();
```

After:

```ts
await azureRead.query(...);
await azureRead.maybeSingle(...);
await azureRead.select(...);
```

## Behavior Preserved

- `/api/health` remains public and no-store.
- `/api/health` still masks raw errors in production.
- Direct Postgres and Neo4j optional probes are unchanged.
- `/api/knowledge/chunk` still requires either `source_key` or `pinecone_id`.
- `pinecone_id` lookup still returns source metadata and chunk attribution.
- `source_key` lookup still returns metadata-only fallback when no chunk has
  been ingested.
- No database schema, migration, seed, storage, auth, or write behavior changes.

## Census Delta

Start of this slice, after Phase 2C.2h:

- Runtime Supabase census: `150 files / 614 import-helper matches`
- Broad census: `303 files / 1436 broad matches`
- Current codemod inventory: `89 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `148 files / 608 import-helper matches`
- Broad census: `301 files / 1426 broad matches`
- Current codemod inventory: `87 READ_ONLY_SELECT`

Slice delta:

- `-2` runtime files with import-helper matches
- `-6` import-helper matches
- `-2` broad-match files
- `-10` broad matches
- `-2` READ_ONLY_SELECT candidates

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `148 files / 608 import-helper matches`
- Total Phase 2C reduction so far: `-28 files / -117 import-helper matches`

## Validation

Local validation:

```text
npx jest --runTestsByPath src/app/api/health/__tests__/route.test.ts src/app/api/knowledge/chunk/__tests__/route.test.ts --runInBand
```

Result: pass, 2 suites / 3 tests.

```text
npx eslint src/app/api/health/route.ts src/app/api/health/__tests__/route.test.ts src/app/api/knowledge/chunk/route.ts src/app/api/knowledge/chunk/__tests__/route.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Result: pass/warn as expected for the still-open Phase 2C backlog. Both target
routes were removed from `CODEMOD_INVENTORY.*`.

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

Rollback is file-local. Revert the two route files, the two focused test files,
the two `2c3a` evidence files, and the generated inventory update. No database
migration, production data operation, or feature flag is involved.

## Deferred Residue

- Admin quarantine routes remain mutation-adjacent despite read-only
  classifications.
- Source API routes remain for a dedicated Source read-plane slice.
- Remaining lib-level read adapters require broader coordination with Phase 2D
  guard enforcement.
