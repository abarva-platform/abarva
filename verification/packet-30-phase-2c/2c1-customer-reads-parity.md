# Packet 30 Phase 2C.1a — Customer Reads Parity Artifact

## Scope

Area group: customer-facing Source + Admin read helpers.

Converted files:

- `src/lib/source/adapters/apex-retail-adapter.ts`
- `src/lib/source/__tests__/apex-retail-adapter.test.ts`
- `src/lib/admin/data/admin-db-helpers.ts`
- `src/lib/admin/data/admin-audit-log-adapter.ts`
- `src/lib/admin/data/admin-blockers-adapter.ts`
- `src/lib/admin/data/admin-connectors-adapter.ts`
- `src/lib/admin/data/admin-datasets-adapter.ts`
- `src/lib/admin/data/admin-overview-adapter.ts`
- `src/lib/admin/data/admin-production-readiness-adapter.ts`
- `src/lib/admin/data/admin-setup-progress-adapter.ts`
- `src/lib/agent/context-bundle.ts`
- `src/lib/agent/context-bundle-live.ts`
- Admin page-view imports that now use the server-only live context helper

## Parity Pattern

The slice replaces read-only Supabase query chains with `azureRead` calls.
Returned row projections, tenant predicates, ordering, optional filters, and
fail/throw behavior are preserved.

### Source live context

Before:

```ts
supabase
  .from('source_events')
  .select('id,event_code,event_name,...')
  .eq('client_key', APEX_RETAIL_CLIENT_KEY)
  .neq('lifecycle_state', 'archived')
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

After:

```ts
azureRead.query(
  `SELECT id, event_code, event_name, ...
     FROM source_events
    WHERE client_key = $1
      AND lifecycle_state <> 'archived'
    ORDER BY updated_at DESC
    LIMIT 1`,
  [APEX_RETAIL_CLIENT_KEY],
)
```

Parity notes:

- Tenant filter remains `client_key = APEX_RETAIL_CLIENT_KEY`.
- Archived rows remain excluded.
- Result ordering remains newest `updated_at`.
- `eventId` still filters by `id` for UUIDs and by `event_code` otherwise.

### Admin list reads

Before:

```ts
supabase
  .from('admin_blockers')
  .select('id, title, severity, affected_scope, ...')
  .eq('client_id', clientId)
  .order('opened_at', { ascending: false })
```

After:

```ts
azureRead.query(
  `SELECT id, title, severity, affected_scope, ...
     FROM admin_blockers
    WHERE client_id = $1
    ORDER BY opened_at DESC`,
  [clientId],
)
```

Parity notes:

- `requireClientId(tenantSlug)` remains the shared tenant boundary.
- Existing fixture-mode behavior is unchanged.
- Optional filters (`status`, `category`, `since`, `limit`) remain explicit
  SQL predicates/limits with positional parameters.

### Admin count reads

Before:

```ts
supabase
  .from('admin_blockers')
  .select('id', { count: 'exact', head: true })
  .eq('client_id', clientId)
  .in('status', ['open', 'in_progress'])
```

After:

```ts
azureRead.count({
  table: 'admin_blockers',
  where: {
    client_id: clientId,
    status: { op: 'in', value: ['open', 'in_progress'] },
  },
})
```

Parity notes:

- Counts remain exact table counts for the same predicates.
- The admin overview composer still receives scalar counts, not row arrays.

## Validation

Local validation:

- `npx jest src/lib/source/__tests__/apex-retail-adapter.test.ts src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/__tests__/overview-composer.test.ts src/lib/admin/__tests__/production-readiness-pr9.test.ts src/__tests__/integration/admin/data11-live-adapters.test.ts --runInBand`
  - Result: pass, 5 suites / 53 tests.
- `npx eslint src/lib/agent/context-bundle.ts src/lib/agent/context-bundle-live.ts src/lib/admin/build-progress-page-view.ts src/lib/admin/architecture-page-view.ts src/lib/admin/overview-page-view.ts src/lib/admin/connectors-page-view.ts src/lib/admin/production-readiness-page-view.ts src/lib/admin/users-access-page-view.ts src/__tests__/integration/admin/data11-live-adapters.test.ts src/lib/admin/data/admin-audit-log-adapter.ts src/lib/admin/data/admin-blockers-adapter.ts src/lib/admin/data/admin-connectors-adapter.ts src/lib/admin/data/admin-datasets-adapter.ts src/lib/admin/data/admin-db-helpers.ts src/lib/admin/data/admin-overview-adapter.ts src/lib/admin/data/admin-production-readiness-adapter.ts src/lib/admin/data/admin-setup-progress-adapter.ts src/lib/source/adapters/apex-retail-adapter.ts src/lib/source/__tests__/apex-retail-adapter.test.ts`
  - Result: pass.
- `node scripts/audit/runtime-supabase-import-census.mjs`
  - Baseline from 2C.0: 176 files / 725 import-helper matches.
  - After this slice: 167 files / 688 import-helper matches.

Known local typecheck note:

- `npx tsc --noEmit --pretty false` is blocked by pre-existing missing local
  optional packages (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched file errors
  were emitted before those dependency-resolution failures.
- `npm run build` is blocked locally by the known Turbopack symlink panic in
  this temporary worktree (`node_modules` points outside the filesystem root).
  Vercel preview build remains the authoritative build gate.
