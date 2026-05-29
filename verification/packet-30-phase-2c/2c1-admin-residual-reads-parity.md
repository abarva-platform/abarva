# Packet 30 Phase 2C.1b — Admin Residual Reads Parity Artifact

## Scope

Area group: residual admin pure reads after Phase 2C.1a customer reads.

Converted files:

- `src/lib/admin/setup-data-broker.ts`
- `src/lib/admin/ai-initiatives/detail-queries.ts`
- `src/lib/admin/overview-data.ts`
- `src/app/(maestro)/admin/atlas/traces/page.tsx`
- `src/app/(maestro)/admin/programs/approvals/page.tsx`
- `src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx`
- `src/app/api/admin/programs/approvals/route.ts`
- Focused tests for the converted helpers and route.

## Parity Pattern

The slice replaces remaining admin read-only Supabase query chains with the
Packet 30 Azure read plane. Tenant predicates, row projections, ordering, limits,
and fail-soft behavior are preserved.

### Setup Inventory Broker

Before:

```ts
supabase
  .from('data_inventory_segments')
  .select('segment_id, segment_name, family_number, ...')
  .eq('tenant_key', brokerTenantKey)
  .order('family_number')
```

After:

```ts
azureRead.select({
  table: 'data_inventory_segments',
  columns: ['segment_id', 'segment_name', 'family_number', ...],
  where: { tenant_key: brokerTenantKey },
  orderBy: { column: 'family_number', direction: 'asc' },
})
```

Parity notes:

- `tenant_key` remains the tenant boundary for segment, audit, ingestion-run,
  record, signal, and chunk-stat reads.
- The setup overview still returns `null` when the live substrate is
  unreachable or empty, so authored fixture fallback behavior is unchanged.
- Segment detail preserves partial-success behavior: if either rollup or record
  read succeeds, the page still renders the available half.

### AI Initiative Detail And Overview

Before:

```ts
supabase
  .from('ai_initiative_kpis')
  .select('kpi_name, kpi_unit, quarter, ...')
  .eq('initiative_id', initiativeId)
  .order('quarter', { ascending: true })
```

After:

```ts
azureRead.select({
  table: 'ai_initiative_kpis',
  columns: ['kpi_name', 'kpi_unit', 'quarter', ...],
  where: { initiative_id: initiativeId },
  orderBy: { column: 'quarter', direction: 'asc' },
})
```

Parity notes:

- `getInitiativeDetail` still first resolves the initiative through
  `listInitiativesForClient(clientId)`, preserving the tenant-scoped parent
  lookup before child rows load.
- Admin overview keeps fail-soft counts: if engagement or source-event reads
  fail, counts return zero and the page remains renderable.

### Admin Pages And Admin Approvals API

Before:

```ts
supabase
  .from('program_approval_requests')
  .select('request_status')
  .eq('tenant_key', tenantKey)
  .in('request_status', ['approved', 'rejected'])
  .gte('decided_at', sinceIso)
```

After:

```ts
azureRead.select({
  table: 'program_approval_requests',
  columns: ['request_status'],
  where: {
    tenant_key: tenantKey,
    request_status: { op: 'in', value: ['approved', 'rejected'] },
    decided_at: { op: 'gte', value: sinceIso },
  },
})
```

Parity notes:

- `/admin/programs/approvals` and `GET /api/admin/programs/approvals` preserve
  the same seven-day decided count window.
- `/platform/admin/pilot/[tenantKey]` still resolves `clients.id` from
  `tenant_key` before loading engagement/headline data.
- `/admin/atlas/traces` preserves filters for tenant, prompt version, fallback
  state, prompt-version listing, tenant listing, and trace detail lookup.

## Census Delta

Start of this slice, after Phase 2C.1a:

- Runtime Supabase census: `167 files / 688 import-helper matches`
- Broad census: `320 files / 1592 broad matches`
- Current codemod inventory: `110 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `160 files / 661 import-helper matches`
- Broad census: `314 files / 1544 broad matches`
- Current codemod inventory: `103 READ_ONLY_SELECT`

Slice delta:

- `-7` runtime files with import-helper matches
- `-27` import-helper matches
- `-6` broad-match files
- `-48` broad matches
- `-7` READ_ONLY_SELECT candidates

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `160 files / 661 import-helper matches`
- Total Phase 2C reduction so far: `-16 files / -64 import-helper matches`

## Deferred Admin Residue

The remaining admin-looking Supabase imports are intentionally not converted in
this pure-read PR:

- `src/app/api/admin/users/provision/route.ts` — POST route with Clerk side
  effects and data-plane writes; handle in mixed read/write phase.
- `src/app/api/admin/quarantine/[id]/release/route.ts` — POST route with
  lifecycle write; handle in mixed read/write phase.
- `src/app/api/admin/quarantine/[id]/hard-delete/route.ts` — POST route with
  lifecycle write; handle in mixed read/write phase.
- `src/app/api/admin/seed-clerk-metadata/route.ts` — POST route with Clerk side
  effects; handle in mixed read/write or retire as admin utility.
- `src/app/(maestro)/admin/onboarding/[session]/confirm/page.tsx` — onboarding
  compatibility path; keep for manual/storage-adjacent review.

## Validation

Local validation:

```text
npx jest src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/ai-initiatives/queries.test.ts src/lib/admin/ai-initiatives/detail-queries.test.ts src/lib/admin/overview-data.test.ts src/app/api/admin/programs/approvals/__tests__/route.test.ts --runInBand
```

Result: pass, 5 suites / 33 tests.

```text
npx eslint src/lib/admin/setup-data-broker.ts src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/ai-initiatives/detail-queries.ts src/lib/admin/ai-initiatives/detail-queries.test.ts src/lib/admin/overview-data.ts src/lib/admin/overview-data.test.ts 'src/app/(maestro)/admin/atlas/traces/page.tsx' 'src/app/(maestro)/admin/programs/approvals/page.tsx' 'src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx' src/app/api/admin/programs/approvals/route.ts src/app/api/admin/programs/approvals/__tests__/route.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Result: pass. Census/inventory evidence updated in
`verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.

Known local typecheck note:

- `npx tsc --noEmit --pretty false` remains blocked by pre-existing optional
  package type declarations (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file
  errors were emitted before those dependency-resolution failures.

## Rollback Plan

Rollback is file-local. If any converted admin surface regresses, revert the
corresponding file listed in Scope and redeploy. If multiple surfaces regress,
revert the merge commit and restore the previous production deployment.
