# Packet 30 Phase 2C.3 — Mixed Write-Fluent Parity

## Scope

This bulk slice moves mixed read/write DB callsites from the legacy
`supabase-server` helper path to the explicit Postgres/Azure write-fluent
client in `src/lib/data-plane/postgresCompat.ts`.

The slice deliberately excludes object-storage byte movement and storage-backed
parsers. It touches DB row reads/writes only.

## Runtime Files Migrated

| Area | Files | Notes |
|---|---:|---|
| `src/lib/db` | 4 | engagement, person, relationship-note, turn DB helpers |
| `src/lib/programs` | 16 | program mutations, approval, governance, audit, attachments, exports, auth-mode helper |
| `src/lib/source` | 4 | Source value-chain, artifact registry, pricing DAO, text parser |
| `src/lib/data-plane/write-adapters` | 14 | DB-only write adapter seam modules |
| `src/lib/data-plane/postgresCompat.ts` | 1 | adds `getAzureWriteFluentClient()` alias |

Total runtime files migrated: 38.

## Helper Semantics

`getAzureWriteFluentClient()` returns the same Postgres-compatible fluent client
as the read helper, but the name is explicit for mixed read/write callsites.
This keeps DB writes out of a helper named "Read" while still retiring the
legacy Supabase helper path.

## Sample Diff Pattern

```diff
-import { getServerSupabase } from '@/lib/supabase-server';
+import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

-const sb = getServerSupabase();
+const sb = getAzureWriteFluentClient();
```

Where modules used the historical `SupabaseClient` alias:

```diff
-import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
-import { getServerSupabase } from '@/lib/supabase-server';
+import {
+  getAzureWriteFluentClient,
+  type PostgresCompatClient as SupabaseClient,
+} from '@/lib/data-plane/postgresCompat';
```

## Census Delta

Start of this slice:

```text
85 files / 386 import-helper matches
294 files / 1187 broad matches
```

After this slice:

```text
47 files / 186 import-helper matches
293 files / 987 broad matches
```

Delta:

```text
-38 files with import-helper matches
-200 import-helper matches
  0 files with broad matches
-200 broad matches
```

Bulk acceptance progress after Phase 2C.1, 2C.2, and this slice:

```text
396 / 553 required import-helper reductions = 71.6%
```

## Validation

```text
npm run audit:runtime-supabase-imports
```

Result: PASS in warn mode, with the census delta above.

```text
git diff --name-only --diff-filter=ACM | rg '\.(ts|tsx|js|mjs)$' | xargs npx eslint
```

Result: PASS.

```text
npx jest <focused write-adapter/program/source suites> --runInBand
```

Result: PASS, 19 suites, 243 tests.

```text
git diff --check
```

Result: PASS.

## Test Seam Updates

Tests for migrated modules now mock `@/lib/data-plane/postgresCompat` and
`getAzureWriteFluentClient()` directly. Tests for modules intentionally left on
the legacy path, such as storage-backed Source queries, continue to mock
`@/lib/supabase-server`.

## Rollback

Per-file rollback is mechanical:

1. Replace `getAzureWriteFluentClient` with `getServerSupabase`.
2. Replace imports from `@/lib/data-plane/postgresCompat` with
   `@/lib/supabase-server`.
3. Restore `PostgresCompatClient` type imports from `@/lib/supabase-server` if
   the file used the historical `SupabaseClient` alias.
4. Re-run focused ESLint and the focused suite for that file's area.

No database rollback is required.
