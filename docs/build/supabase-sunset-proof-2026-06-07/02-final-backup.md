# Supabase Sunset Proof - 02 Final Backup

Date: 2026-06-07
Status: HOLD - final backup not yet captured
Scope: Final Supabase backup and restore proof before pause/delete

## Gate verdict

Supabase is **not sunset-ready** until a final full Postgres dump, storage/object
export if applicable, checksum, backup location, and restore-test evidence exist.
No destructive Supabase action should occur from this document.

## Required backup evidence

| Control                        | Required evidence                                                                                                        | Current evidence                                                                                                              | Status  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| Full Postgres dump             | Backup object path, dump format, timestamp, source project id/name, operator                                             | Native `pg_dump` completed locally at `/Users/anand/Downloads/abarva-supabase-native-pgdump-20260607-001/supabase-final.dump` | PASS    |
| Supabase storage/object export | Bucket inventory and export path, or explicit proof that no Supabase storage buckets are used                            | Not recorded in this proof pack                                                                                               | BLOCKED |
| Backup checksum                | SHA-256 or stronger checksum for each backup artifact                                                                    | Native dump SHA-256 `302ccb962614ac9a1ac6ab672838c06d1299aa181a1f0b13be943bf63f77ac8b`                                        | PASS    |
| Restore test                   | Temporary database restore log and validation query output, or approved exception documenting why restore was not run    | Restore test passed for AbarVa app/corpus data; only Supabase-managed Vault extension objects excluded                        | PASS    |
| Secret hygiene                 | Logs show env names, hosts, artifact IDs, checksums, and counts only; no passwords, tokens, service keys, or signed URLs | Not recorded in this proof pack                                                                                               | BLOCKED |

## Backup record

Fill only after the final backup is complete.

| Field                           | Value                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Supabase project id/name        | `xtbymdryojmvoulaotce` / `abarva`                                                                                                   |
| Freeze timestamp covered        | Dashboard showed read-only mode before deletion; exact freeze timestamp not recorded here                                           |
| Backup timestamp UTC            | 2026-06-07                                                                                                                          |
| Postgres dump artifact location | `/Users/anand/Downloads/abarva-supabase-native-pgdump-20260607-001/supabase-final.dump`                                             |
| Postgres dump checksum          | `302ccb962614ac9a1ac6ab672838c06d1299aa181a1f0b13be943bf63f77ac8b`                                                                  |
| Storage/object export location  | `PENDING`                                                                                                                           |
| Storage/object export checksum  | `PENDING`                                                                                                                           |
| Restore-test database           | Operator local restore test                                                                                                         |
| Restore-test result             | Passed: `publicTables=341`, `clientsRows=9`, `enterpriseContextChunksRows=15847`, `corpusPatternsRows=8987`; Vault objects excluded |
| Operator                        | External operator                                                                                                                   |

## Local execution attempt

Captured from branch `cursor/supabase-sunset-proof-96c4` on 2026-06-07 at
`02:24 UTC`.

| Check                                                                     | Result        | Impact                                                                                                          |
| ------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| `command -v pg_dump`                                                      | NOT AVAILABLE | This machine cannot take the required final Postgres dump.                                                      |
| `command -v psql`                                                         | NOT AVAILABLE | This machine cannot run a local restore-test with standard Postgres CLI tooling.                                |
| `SUPABASE_DATABASE_URL` / `SOURCE_DATABASE_URL` / `DATABASE_URL` presence | NOT AVAILABLE | No source database URL is available in this shell; no backup can be taken without an approved secret reference. |

This is not an approved restore-test exception. The final backup gate remains
blocked until an operator runs the dump and restore-test from an approved
environment with Postgres tooling and secret-backed connection strings.

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

## Remaining blockers

1. Supabase storage/object usage is not inventoried in this proof pack.
2. Backup retention window is not recorded in this proof pack.
3. Restore-test transcript is operator-reported but not attached as raw logs.

## 2026-06-07 Azure operator attempt

| Check                                | Result                                                                                       | Impact                                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `job-supa-final-eus` configuration   | Present; references Key Vault secret `source-postgres-database-url` as `SOURCE_DATABASE_URL` | A preconfigured Azure-hosted backup path exists.                                                                                         |
| Start `job-supa-final-eus`           | PASS after role refresh                                                                      | Execution `job-supa-final-eus-6kbty9s` ran on candidate image.                                                                           |
| Azure runtime Key Vault access       | PASS                                                                                         | Active app managed identity can obtain a Key Vault token and can reach secret `source-postgres-database-url` without printing the value. |
| Azure runtime `pg_dump` availability | FAIL                                                                                         | Active app runtime does not include `pg_dump`, so it cannot produce the required full Postgres dump from `az containerapp exec`.         |

## 2026-06-07 supa-final run

| Field              | Value                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| Execution          | `job-supa-final-eus-6kbty9s`                                                         |
| Image              | `acrabarvalab001.azurecr.io/abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix` |
| Export result      | PARTIAL PASS: 337 table JSONL exports, schema export, and manifest written           |
| Blob root          | `supabase-final-backups/supabase-final-20260607-001`                                 |
| Blob count         | 339 blobs under the backup root                                                      |
| Manifest           | Present                                                                              |
| Freeze result      | FAIL: `cannot execute ALTER DATABASE in a read-only transaction`                     |
| Overall job status | Failed because freeze result was not `frozen`                                        |

This export is useful final-backup evidence but does not fully satisfy the
original native full Postgres dump/restore-test gate. A restore-test has not
been run.

## 2026-06-07 merged-main supa-final rerun

| Field             | Value                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execution         | `job-supa-final-eus-0k0143f`                                                                                                                                                                                      |
| Image             | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41`                                                                                                                                            |
| Execution status  | Failed                                                                                                                                                                                                            |
| Observed progress | Exported multiple large tables including `corpus_patterns`, `corpus_telemetry`, `enterprise_context_chunk_queue`, `enterprise_context_chunks`, `engagements`, and related tables with per-table SHA-256 log lines |
| Manifest re-read  | Blocked during evidence capture because Container Apps exec returned 404 for revision `0000051`; local storage data-plane listing remains blocked by storage network rules                                        |

The merged-main JSONL rerun did not close the final backup/freeze job gate, but
the operator later completed a native `pg_dump` and restore-test outside this
agent. See the backup record above for the native dump path, checksum, and
restore counts.
