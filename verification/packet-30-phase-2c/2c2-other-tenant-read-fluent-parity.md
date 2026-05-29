# Packet 30 Phase 2C.2 — Other Tenant-Scoped Read-Fluent Parity

## Scope

This bulk codemod slice moves 38 read-only library callsites off the legacy
`supabase-server` helper path and onto the explicit Postgres/Azure read-fluent
client in `src/lib/data-plane/postgresCompat.ts`.

The slice is runtime-read only. It does not change schema, migrations, write
adapters, storage writes, Clerk session handling, tenant authorization checks,
or query predicates.

## Files Migrated

| File                                                                       | Read shape preserved                            |
| -------------------------------------------------------------------------- | ----------------------------------------------- |
| `src/lib/db/team.ts`                                                       | team membership and engagement membership reads |
| `src/lib/intelligence/library.ts`                                          | intelligence library reads                      |
| `src/lib/intelligence/canonical/runtime-pattern-index.ts`                  | runtime pattern index reads                     |
| `src/lib/knowledge/tenant-data/supabase-adapter.ts`                        | tenant data adapter reads                       |
| `src/lib/knowledge/tenant-data/graph-traversal.ts`                         | tenant graph traversal reads                    |
| `src/lib/data-plane/read-adapters/atlasRepositoryReadAdapter.ts`           | Atlas repository read adapter                   |
| `src/lib/executive-profiles/loadExecutiveProfile.ts`                       | executive profile reads                         |
| `src/lib/data-plane/read-adapters/towerAggregateReadAdapter.ts`            | Tower aggregate read adapter                    |
| `src/lib/data-plane/read-adapters/intelligenceCorpusReadAdapter.ts`        | intelligence corpus read adapter                |
| `src/lib/atlas/tower-grounding.ts`                                         | Tower grounding reads                           |
| `src/lib/data-plane/read-adapters/enterpriseSummaryReadAdapter.ts`         | enterprise summary read adapter                 |
| `src/lib/data-plane/read-adapters/sourceEventsReadAdapter.ts`              | Source events read adapter                      |
| `src/lib/data-plane/read-adapters/towerPageReadAdapter.ts`                 | Tower page read adapter                         |
| `src/lib/data-plane/read-adapters/towerSubstrateReadAdapter.ts`            | Tower substrate read adapter                    |
| `src/lib/data-plane/read-adapters/intelligenceStagesReadAdapter.ts`        | intelligence stages read adapter                |
| `src/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter.ts`     | Source canvas substrate read adapter            |
| `src/lib/data-plane/read-adapters/supabaseReadAdapter.ts`                  | generic read adapter compatibility reads        |
| `src/lib/graph/cross-client.ts`                                            | cross-client graph reads                        |
| `src/lib/auth/maestro.ts`                                                  | Maestro auth/person reads                       |
| `src/lib/auth/program-access-policy.ts`                                    | program access policy reads                     |
| `src/lib/auth/source-access-policy.ts`                                     | Source access policy reads                      |
| `src/lib/data-plane/read-adapters/homeAttentionReadAdapter.ts`             | home attention read adapter                     |
| `src/lib/data-plane/read-adapters/sourcingWorkItemsReadAdapter.ts`         | sourcing work items read adapter                |
| `src/lib/data-plane/read-adapters/vipProfileReadAdapter.ts`                | VIP profile read adapter                        |
| `src/lib/data-plane/read-adapters/intelligenceVendorsReadAdapter.ts`       | intelligence vendors read adapter               |
| `src/lib/data-plane/read-adapters/programsReadAdapter.ts`                  | programs read adapter                           |
| `src/lib/data-plane/read-adapters/strategicMovesPreferencesReadAdapter.ts` | strategic moves preferences read adapter        |
| `src/lib/enterprise-context/intelligence-read-model.ts`                    | enterprise intelligence read model              |
| `src/lib/data-plane/read-adapters/expertReviewsReadAdapter.ts`             | expert reviews read adapter                     |
| `src/lib/data-plane/read-adapters/outcomeLedgerReadAdapter.ts`             | outcome ledger read adapter                     |
| `src/lib/data-plane/read-adapters/turnTraceReadAdapter.ts`                 | turn trace read adapter                         |
| `src/lib/engagements/list-summary.ts`                                      | engagement summary reads                        |
| `src/lib/nexus/sessionContext.ts`                                          | Nexus session context reads                     |
| `src/lib/agent/prompts/_shared/user-context.ts`                            | agent user-context reads                        |
| `src/lib/auth/current-user.ts`                                             | current-user person reads                       |
| `src/lib/data-plane/read-adapters/sourceDecisionQueueReadAdapter.ts`       | Source decision queue read adapter              |
| `src/lib/nexus/specialists/value.ts`                                       | value specialist reads                          |
| `src/lib/agent/userContext.ts`                                             | agent user context reads                        |

## Sample Diff Pattern

```diff
-import { getServerSupabase } from '@/lib/supabase-server';
+import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';

-const sb = getServerSupabase();
+const sb = getAzureReadFluentClient();
```

For adapter factories that still use the historical `SupabaseClient` type alias,
the type now comes from `postgresCompat` instead of the old compatibility file:

```diff
-import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
-import { getServerSupabase } from '@/lib/supabase-server';
+import {
+  getAzureReadFluentClient,
+  type PostgresCompatClient as SupabaseClient,
+} from '@/lib/data-plane/postgresCompat';
```

The fluent query chains remain unchanged.

## Census Delta

Start of this slice:

```text
123 files / 530 import-helper matches
294 files / 1331 broad matches
```

After this slice:

```text
85 files / 386 import-helper matches
294 files / 1188 broad matches
```

Delta:

```text
-38 files with import-helper matches
-144 import-helper matches
  0 files with broad matches
-144 broad matches
```

Bulk acceptance progress after Phase 2C.1 plus this slice:

```text
196 / 553 required import-helper reductions = 35.4%
```

## Validation

```text
node scripts/codemods/phase-2c-apply-read-fluent.mjs --max-files=100
```

Result: PASS, 38/39 candidates applied, 1 skip
(`src/lib/programs/queries.ts`, no legacy helper import).

```text
perl mechanical type-import cleanup on changed files
```

Result: PASS, `PostgresCompatClient` type imports now come directly from
`src/lib/data-plane/postgresCompat.ts` where applicable.

```text
npm run audit:runtime-supabase-imports
```

Result: PASS in warn mode, with the census delta above.

## Rollback

Per-file rollback is mechanical:

1. Replace `getAzureReadFluentClient` with `getServerSupabase`.
2. Replace imports from `@/lib/data-plane/postgresCompat` with
   `@/lib/supabase-server` for the affected file.
3. If the file uses the historical `SupabaseClient` alias, restore the type
   import from `@/lib/supabase-server`.
4. Re-run focused ESLint on the reverted file.

The central compatibility alias remains available during Phase 2C, so each file
can be rolled back independently without a database rollback.
