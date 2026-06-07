# Supabase Sunset Proof - 02 Final Backup

Date: 2026-06-07  
Status: HOLD - final backup not yet captured  
Scope: Final Supabase backup and restore proof before pause/delete

## Gate verdict

Supabase is **not sunset-ready** until a final full Postgres dump, storage/object
export if applicable, checksum, backup location, and restore-test evidence exist.
No destructive Supabase action should occur from this document.

## Required backup evidence

| Control | Required evidence | Current evidence | Status |
| --- | --- | --- | --- |
| Full Postgres dump | Backup object path, dump format, timestamp, source project id/name, operator | Not recorded in this proof pack | BLOCKED |
| Supabase storage/object export | Bucket inventory and export path, or explicit proof that no Supabase storage buckets are used | Not recorded in this proof pack | BLOCKED |
| Backup checksum | SHA-256 or stronger checksum for each backup artifact | Not recorded in this proof pack | BLOCKED |
| Restore test | Temporary database restore log and validation query output, or approved exception documenting why restore was not run | Not recorded in this proof pack | BLOCKED |
| Secret hygiene | Logs show env names, hosts, artifact IDs, checksums, and counts only; no passwords, tokens, service keys, or signed URLs | Not recorded in this proof pack | BLOCKED |

## Backup record

Fill only after the final backup is complete.

| Field | Value |
| --- | --- |
| Supabase project id/name | `PENDING` |
| Freeze timestamp covered | `PENDING` |
| Backup timestamp UTC | `PENDING` |
| Postgres dump artifact location | `PENDING` |
| Postgres dump checksum | `PENDING` |
| Storage/object export location | `PENDING` |
| Storage/object export checksum | `PENDING` |
| Restore-test database | `PENDING` |
| Restore-test result | `PENDING` |
| Operator | `PENDING` |

## Safe command pattern

Use environment variables or secret references; do not echo connection strings.

```bash
# Full dump. Use a secret-backed SUPABASE_DATABASE_URL in the shell or job.
pg_dump "$SUPABASE_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "supabase-final-<timestamp>.dump"

# Checksum.
sha256sum "supabase-final-<timestamp>.dump" > "supabase-final-<timestamp>.dump.sha256"

# Restore test into a temporary database.
createdb "$TEMP_RESTORE_DATABASE_URL"
pg_restore \
  --dbname "$TEMP_RESTORE_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "supabase-final-<timestamp>.dump"
```

## Restore validation checklist

Run validation against the temporary restored database, not production.

- `clients` count matches the final backup source count.
- User/account identity tables restore and can be queried.
- Context records, facts, chunks, corpus, graph, Source, Moves, artifacts,
  templates, audits, and app state tables are present.
- Random spot-check hashes match source query output.
- No secret values appear in the restore logs.

## Blockers

1. Final full Postgres dump is not attached.
2. Supabase storage/object usage is not inventoried.
3. No checksum is recorded.
4. No restore-test or approved restore-test exception exists.
