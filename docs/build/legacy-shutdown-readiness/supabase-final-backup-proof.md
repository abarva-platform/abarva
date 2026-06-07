# Supabase Final Backup Proof - Retirement Readiness

Date: 2026-06-07

Status: BLOCKED. A useful historical JSONL export exists, but the final
backup/restore gate is not green.

## Backup evidence currently available

| Field | Value |
| --- | --- |
| Historical export run id | `supabase-final-20260607-001` |
| Historical execution | `job-supa-final-eus-6kbty9s` |
| Blob account | `stabarvaprivatedplab001` |
| Blob container | `context-drops` |
| Blob root | `supabase-final-backups/supabase-final-20260607-001/` |
| Manifest | `supabase-final-backups/supabase-final-20260607-001/manifest.json` |
| Exported tables | 337 public tables |
| Blob count | 339 blobs under the backup root |
| Per-table checksums | Present historically in the manifest/upload logs |
| Freeze result | Failed: `cannot execute ALTER DATABASE in a read-only transaction` |
| Supabase pause/delete | Not performed |

The historical export is useful evidence and should be retained, but it is not
enough for deletion readiness.

## Fresh backup proof attempted in this run

No fresh backup or restore-test was run from this shell.

Reasons:

- `pg_dump` is not installed in this environment.
- `psql` is not installed in this environment.
- Direct Key Vault access to `source-postgres-database-url` returned HTTP 403.
- The current Container Apps job list does not include a reusable
  `job-supa-final-eus` definition.
- Destructive or pause-equivalent actions were explicitly out of bounds unless
  all proof gates were green and Anand approved deletion in this same run.

## Missing controls

| Required control | Status | Required next action |
| --- | --- | --- |
| Final native Postgres dump or approved equivalent | BLOCKED | Run `pg_dump` from an approved private/operator environment, or document an approved JSONL-based equivalent with restore-test coverage. |
| Backup checksum | PARTIAL | Historical per-table SHA-256 values exist; attach current manifest and a single artifact checksum if using a native dump. |
| Restore-test | BLOCKED | Restore into a temporary database and inspect schema plus row counts from the restored artifact. |
| Supabase storage/object export | BLOCKED | Inventory buckets and export objects with checksums, or prove storage is unused for required production rollback. |
| Retention period | BLOCKED | Record how long the final backup/export will be retained before irreversible deletion. |
| Rollback option | BLOCKED | Document exact restore path and who can execute it. |

## Restore-test minimum checklist

Run this against a temporary restore target, not production:

1. Restore the final backup artifact.
2. Inspect schema existence for context, corpus, Source, Move, artifact,
   identity, audit, and app-state tables.
3. Compare restored row counts to the final backup manifest.
4. Spot-check row hashes for required non-zero tables.
5. Confirm no secret values appear in logs.
6. Record the temporary restore database, execution id, command transcript, and
   disposal timestamp.

## Gate 6 verdict

Gate 6 is blocked. The historical JSONL/table export should be preserved, but
Supabase cannot be deleted until final backup, storage inventory/export, restore
verification, retention, and rollback evidence are complete.
