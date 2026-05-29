# Packet 30 Phase 2C.1 — Admin/App Route Reads Parity

## Scope

This bulk codemod slice moves 17 read-only route/page callsites off the legacy
`supabase-server` helper name and onto the explicit Postgres/Azure read-fluent
client in `src/lib/data-plane/postgresCompat.ts`.

The slice also renames the underlying compatibility helper from
`getServerSupabase()` to `getAzureReadFluentClient()` while retaining
`src/lib/supabase-server.ts` as a backward-compatible alias for callsites not in
this PR.

No schema, migrations, storage calls, write adapters, Clerk calls, or tenant
authorization logic change.

## Files Migrated

| File | Query shape preserved |
|---|---|
| `src/app/api/admin/users/provision/route.ts` | `engagements` and `engagement_participants` read-before-write checks |
| `src/app/api/admin/quarantine/[id]/hard-delete/route.ts` | `sensitive_upload_audit` tenancy/state lookup |
| `src/app/api/admin/quarantine/[id]/release/route.ts` | `sensitive_upload_audit` tenancy/state lookup |
| `src/app/api/admin/seed-clerk-metadata/route.ts` | `persons` graph-node lookup for demo user metadata |
| `src/app/api/engage/[engagementId]/turn/route.ts` | `engagements` read for turn execution |
| `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts` | `source_event_artifact_states` lookup |
| `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/status/route.ts` | `source_events` + `source_event_artifact_states` status lookup |
| `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts` | `source_events` + gate criterion state lookup |
| `src/app/api/v1/source/[eventId]/stage/route.ts` | `source_events` stage lookup |
| `src/app/api/v1/source/events/[eventId]/approve/route.ts` | `source_events` approval lookup |
| `src/app/(maestro)/engagements/[engagementId]/page.tsx` | engagement deliverable/contradiction reads |
| `src/app/(maestro)/engagements/[engagementId]/deliverables/[deliverableId]/page.tsx` | deliverable version/type reads |
| `src/app/(maestro)/engagements/[engagementId]/charter/page.tsx` | charter deliverable reads |
| `src/app/(maestro)/engagements/[engagementId]/deliverables/page.tsx` | deliverable list reads |
| `src/app/(maestro)/engagements/[engagementId]/turns/page.tsx` | turns reads |
| `src/app/(maestro)/evidence-ledger/page.tsx` | evidence ledger reads |
| `src/app/sponsor/page.tsx` | sponsor engagement reads |

## Sample Diff Pattern

```diff
-import { getServerSupabase } from '@/lib/supabase-server';
+import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';

-const sb = getServerSupabase();
+const sb = getAzureReadFluentClient();
```

The fluent query chains remain the same:

```ts
const { data, error } = await sb
  .from('source_events')
  .select('id, client_id, status')
  .eq('id', eventId)
  .maybeSingle();
```

## Census Delta

Baseline after Phase 2C.3c:

```text
140 files / 582 import-helper matches
294 files / 1383 broad matches
```

After this slice:

```text
123 files / 530 import-helper matches
294 files / 1331 broad matches
```

Delta:

```text
-17 files with import-helper matches
-52 import-helper matches
  0 files with broad matches
-52 broad matches
```

Bulk acceptance progress:

```text
52 / 553 required import-helper reductions = 9.4%
```

## Validation

```text
node scripts/codemods/phase-2c-apply-read-fluent.mjs --groups=api_routes,app_routes,admin --max-files=100 --dry-run --output=verification/packet-30-phase-2c/2c1-admin-app-route-codemod-report.json
```

Result: PASS, 17/17 would apply, 0 skips.

```text
node scripts/codemods/phase-2c-apply-read-fluent.mjs --groups=api_routes,app_routes,admin --max-files=100 --output=verification/packet-30-phase-2c/2c1-admin-app-route-codemod-report.json
```

Result: PASS, 17/17 applied, 0 skips.

```text
npm run audit:runtime-supabase-imports
```

Result: PASS in warn mode, with the census delta above.

```text
git diff --name-only --diff-filter=ACM | rg '\.(ts|tsx|js|mjs)$' | xargs npx eslint
```

Result: PASS.

## Rollback

Per-file rollback is mechanical: replace
`getAzureReadFluentClient` with `getServerSupabase` and restore the import from
`@/lib/supabase-server` for the affected file. The central
`src/lib/supabase-server.ts` compatibility alias remains available during
Phase 2C, so each file can be rolled back independently without a database
rollback.
