# Packet 30 Phase 2C.2c — Program Origination Routes Parity Artifact

## Scope

Area group: pure read API routes under `src/app/api/v1/programs`.

Converted files:

- `src/app/api/v1/programs/route.ts`
- `src/app/api/v1/programs/originate/route.ts`
- `src/app/api/v1/programs/originate/from-thread/route.ts`
- `src/app/api/v1/programs/patterns/route.ts`
- Focused integration tests for route guards and create/origination contracts.

## Parity Pattern

This slice replaces route-local read-only Supabase query chains with the Packet
30 Azure read plane. It does not change program mutations, write adapters,
storage, uploads, schemas, or tenant data.

### Portfolio GET

Before:

```ts
const { supabase } = await getProgramsRouteSupabase('portfolio')
const programs = await getProgramPortfolio(ctx, { limit: 100, supabase })
```

After:

```ts
const programs = await getProgramPortfolio(ctx, { limit: 100 })
```

Parity notes:

- `requireTenancy()` remains the auth/tenant gate.
- Program portfolio reads now use the canonical read adapter selected inside
  `getProgramPortfolio`.
- Response shape remains `{ programs: ProgramSummary[] }`.

### Create POST Pattern Shape Lookup

Before:

```ts
supabase
  .from('engagement_topics')
  .select('title, canonical_shape_json, phase_playbook')
  .eq('topic_key', acceptedPatternKey)
  .maybeSingle()
```

After:

```ts
azureRead.maybeSingle({
  table: 'engagement_topics',
  columns: ['canonical_shape_json'],
  where: { topic_key: acceptedPatternKey },
})
```

Parity notes:

- Program creation still routes writes through `selectProgramsWriteAdapter`.
- Participant seeding, classifier decision logging, and Maestro flag writes are
  unchanged.
- Only the accepted-pattern shape read moved to the read plane.

### Origination SSE Catalog Enrichment

Before:

```ts
supabase
  .from('engagement_topics')
  .select('topic_key, title, canonical_shape_json, deployment_count, successful_deployment_count')
  .in('topic_key', keys)
```

After:

```ts
azureRead.select({
  table: 'engagement_topics',
  columns: ['topic_key', 'title', 'canonical_shape_json', 'deployment_count', 'successful_deployment_count'],
  where: { topic_key: { op: 'in', value: keys } },
})
```

Parity notes:

- Classifier input still uses the authenticated tenancy context.
- SSE event order and payload shape remain unchanged.

### From-Thread Origination

Before:

```ts
supabase.from('intelligence_threads').select(...).eq('id', threadId).eq('client_id', ctx.clientId).maybeSingle()
supabase.from('intelligence_thread_turns').select(...).eq('thread_id', threadId).order('index', ...).limit(10)
```

After:

```ts
azureRead.maybeSingle({ table: 'intelligence_threads', where: { id: threadId, client_id: ctx.clientId } })
azureRead.select({ table: 'intelligence_thread_turns', where: { thread_id: threadId }, orderBy: { column: 'index', direction: 'desc' }, limit: 10 })
```

Parity notes:

- Tenant isolation remains explicit on `intelligence_threads.client_id`.
- Crafted `clientId` request payloads remain ignored.
- Thread-not-found behavior remains HTTP 404.

### Pattern Library Browse

Before:

```ts
supabase
  .from('engagement_topics')
  .select(...)
  .in('promotion_state', ['pilot', 'mature'])
  .contains('industries', [industryFilter])
  .limit(100)
```

After:

```ts
azureRead.query(
  `SELECT ... FROM engagement_topics WHERE ... ORDER BY successful_deployment_count DESC NULLS LAST LIMIT 100`,
  params,
)
```

Parity notes:

- Auth remains tenancy-only; topics remain shared across clients.
- Client-side `client_id` injection attempts remain ignored.
- Archetype filtering stays in-process after the DB read, matching the prior
  route behavior.

## Census Delta

Start of this slice, after Phase 2C.2b:

- Runtime Supabase census: `155 files / 631 import-helper matches`
- Broad census: `311 files / 1470 broad matches`
- Current codemod inventory: `98 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `154 files / 628 import-helper matches`
- Broad census: `307 files / 1461 broad matches`
- Current codemod inventory: `94 READ_ONLY_SELECT`

Slice delta:

- `-1` runtime file with import-helper matches
- `-3` import-helper matches
- `-4` broad-match files
- `-9` broad matches
- `-4` READ_ONLY_SELECT candidates

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `154 files / 628 import-helper matches`
- Total Phase 2C reduction so far: `-22 files / -97 import-helper matches`

## Deferred Programs Residue

Remaining program route hits are intentionally split:

- `src/app/api/v1/programs/[programId]/generate/route.ts` has several
  generation-context reads and should be migrated as its own parity slice.
- `src/app/api/v1/programs/[programId]/module/[key]/route.ts` is a focused
  detail route and should be migrated separately.
- `src/app/api/v1/programs/[programId]/advance/route.ts` is mutation-adjacent
  despite its current read-only census classification.
- Legacy `src/app/api/programs/**` attachment/export/workspace routes include
  storage or upload semantics and stay out of this pure-read route slice.

## Validation

Local validation:

```text
npx jest src/__tests__/integration/programs/programs-origination-routes-guards.test.ts src/__tests__/integration/programs/programs-auth-mode-and-tenant-guards.test.ts src/__tests__/integration/programs/programs-create-route.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
```

Result: pass, 4 suites / 56 tests.

```text
npx eslint src/app/api/v1/programs/route.ts src/app/api/v1/programs/originate/route.ts src/app/api/v1/programs/originate/from-thread/route.ts src/app/api/v1/programs/patterns/route.ts src/__tests__/integration/programs/programs-auth-mode-and-tenant-guards.test.ts src/__tests__/integration/programs/programs-origination-routes-guards.test.ts src/__tests__/integration/programs/programs-create-route.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Result: pass. Census/inventory evidence updated in
`verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.

Full local typecheck remains blocked by pre-existing missing optional package
type declarations (`@azure/identity`, `@azure/storage-blob`,
`@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors
were emitted before those dependency-resolution failures.

## Rollback Plan

Rollback is file-local. If portfolio GET regresses, revert the `GET` block in
`src/app/api/v1/programs/route.ts`. If origination catalog enrichment regresses,
revert the relevant origination route. If pattern browse filtering regresses,
revert `src/app/api/v1/programs/patterns/route.ts`. If multiple route surfaces
regress, revert this merge commit and redeploy.
