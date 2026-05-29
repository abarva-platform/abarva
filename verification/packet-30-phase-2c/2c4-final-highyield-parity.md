# Packet 30 Phase 2C.4 Final High-Yield Runtime Helper Cleanup

Generated: 2026-05-29

## Scope

This slice moves the remaining high-yield non-storage runtime callsites away from
`@/lib/supabase-server` and onto the Postgres-compatible data-plane helper in
`@/lib/data-plane/postgresCompat`.

Storage-touching upload/download routes are intentionally left for the storage
adapter slice because they still call `.storage.from(...)` and require an
explicit byte-persistence decision.

## Census Delta

| Metric | Start | End | Delta |
|---|---:|---:|---:|
| Files with helper imports | 47 | 10 | -37 |
| Helper matches | 186 | 29 | -157 |

Acceptance target was helper matches `<30`; this slice ends at `29`.

## Parity Notes

- Non-storage DB reads/writes continue to use the same Supabase-compatible
  fluent surface: `.from(...).select(...)`, `.insert(...)`, `.update(...)`,
  `.delete(...)`, `.upsert(...)`, `.eq(...)`, `.single()`, and `.maybeSingle()`.
- `getAzureWriteFluentClient()` and `getAzureReadFluentClient()` both return the
  Postgres-compatible fluent client backed by the data-plane session.
- Storage codepaths are unchanged in this PR. Remaining helper matches are the
  explicit storage boundary to be handled in Phase 2D.

## Remaining Helper Matches

The remaining `29` matches are concentrated in storage/binary paths plus the
legacy compatibility module:

- Source artifact upload/download/generate routes.
- Program attachment upload/download/extract routes.
- Tower upload route.
- `src/lib/supabase-server.ts` compatibility export.

## Rollback

Per-file rollback is mechanical:

1. Replace `getAzureWriteFluentClient()` or `getAzureReadFluentClient()` with
   `getServerSupabase()`.
2. Replace the `@/lib/data-plane/postgresCompat` import with
   `@/lib/supabase-server`.
3. Re-run the focused tests and `npm run audit:runtime-supabase-imports`.
