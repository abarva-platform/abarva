# Packet 30 Phase 2C.2a — Program Helper Reads Parity Artifact

## Scope

Area group: pure read helpers under `src/lib/programs`.

Converted files:

- `src/lib/programs/approval-person-resolver.ts`
- `src/lib/programs/evidence-context.ts`
- `src/lib/programs/board-artifacts/load-move-business-case-input.ts`
- `src/lib/programs/db-phase-queries.ts`
- Focused tests for each converted helper.

## Parity Pattern

The slice replaces read-only Supabase query chains with the Packet 30 Azure read
plane. It does not change program mutation routes, write adapters, attachment
storage, or route handlers.

### Approval Person Display

Before:

```ts
supabase
  .from('persons')
  .select('id, name, role')
  .in('id', ids)
```

After:

```ts
azureRead.select({
  table: 'persons',
  columns: ['id', 'name', 'role'],
  where: { id: { op: 'in', value: ids } },
})
```

Parity notes:

- ID trimming and deduplication remain unchanged.
- Query failure still returns an empty display map and logs the failure.

### Program Evidence Prompt Context

Before:

```ts
supabase
  .from('program_evidence_items')
  .select('id, title, evidence_type, summary, extracted_text, extracted_structured, created_at')
  .eq('program_id', programId)
  .order('created_at', { ascending: false })
  .limit(limit)
```

After:

```ts
azureRead.select({
  table: 'program_evidence_items',
  columns: ['id', 'title', 'evidence_type', 'summary', 'extracted_text', 'extracted_structured', 'created_at'],
  where: { program_id: programId },
  orderBy: { column: 'created_at', direction: 'desc' },
  limit,
})
```

Parity notes:

- `canReadProgram(ctx, programId)` remains the first gate.
- Output formatting and "do not say empty ledger" instruction are unchanged.

### Move Business Case Input

Before:

```ts
supabase.from('clients').select('key, name, industry_code').eq('id', program.clientId).maybeSingle()
supabase.from('engagements').select('baseline_metrics').eq('id', moveId).maybeSingle()
```

After:

```ts
azureRead.maybeSingle({
  table: 'clients',
  columns: ['key', 'name', 'industry_code'],
  where: { id: program.clientId },
})
azureRead.maybeSingle({
  table: 'engagements',
  columns: ['baseline_metrics'],
  where: { id: moveId },
})
```

Parity notes:

- The RBAC/tenant-scoped parent lookup remains `getProgramById(ctx, moveId)`.
- Client row or baseline metric read failure still results in honest null
  metadata rather than cross-tenant fallback.

### Engagement Phase Data

Before:

```ts
supabase
  .from('engagements')
  .select('..., program_milestones(...), program_risks(...)')
  .eq('id', engagementId)
```

After:

```ts
Promise.all([
  azureRead.maybeSingle({ table: 'engagements', ... }),
  azureRead.select({ table: 'program_milestones', where: { engagement_id: engagementId } }),
  azureRead.select({ table: 'program_risks', where: { engagement_id: engagementId } }),
])
```

Parity notes:

- Optional `clientUUID` is still added to the `engagements` predicate.
- `canReadProgram` still gates when tenancy context is supplied.
- Evidence, phase approvals, modules, deliverables, program evidence, and audit
  rows preserve their original filters, ordering, and limits.
- The old FK-expanded Supabase select is decomposed into explicit read-plane
  queries, which makes tenant/filter behavior easier to audit.

## Census Delta

Start of this slice, after Phase 2C.1b:

- Runtime Supabase census: `160 files / 661 import-helper matches`
- Broad census: `314 files / 1544 broad matches`
- Current codemod inventory: `103 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `156 files / 649 import-helper matches`
- Broad census: `311 files / 1519 broad matches`
- Current codemod inventory: `99 READ_ONLY_SELECT`

Slice delta:

- `-4` runtime files with import-helper matches
- `-12` import-helper matches
- `-3` broad-match files
- `-25` broad matches
- `-4` READ_ONLY_SELECT candidates

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `156 files / 649 import-helper matches`
- Total Phase 2C reduction so far: `-20 files / -76 import-helper matches`

## Deferred Programs Residue

The remaining programs hits are intentionally split into later PRs:

- `src/lib/programs/transformers.ts` is large and high-density; migrate as its
  own transformer parity slice.
- Program route handlers under `src/app/api/v1/programs/**` and
  `src/app/api/programs/**` remain for route-level parity slices.
- Upload, attachment, and risk mutation paths remain for mixed read/write or
  storage-adjacent phases.

## Validation

Local validation:

```text
npx jest src/lib/programs/__tests__/approval-person-resolver.test.ts src/lib/programs/__tests__/evidence-context.test.ts src/lib/programs/board-artifacts/load-move-business-case-input.test.ts src/lib/programs/__tests__/db-phase-queries.test.ts --runInBand
```

Result: pass, 4 suites / 8 tests.

```text
npx eslint src/lib/programs/approval-person-resolver.ts src/lib/programs/__tests__/approval-person-resolver.test.ts src/lib/programs/evidence-context.ts src/lib/programs/__tests__/evidence-context.test.ts src/lib/programs/board-artifacts/load-move-business-case-input.ts src/lib/programs/board-artifacts/load-move-business-case-input.test.ts src/lib/programs/db-phase-queries.ts src/lib/programs/__tests__/db-phase-queries.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Result: pass. Census/inventory evidence updated in
`verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.

## Rollback Plan

Rollback is file-local. If a helper regresses, revert that helper and its test.
If phase aggregation regresses, first revert `src/lib/programs/db-phase-queries.ts`
and redeploy; it is the widest behavior surface in this slice.
