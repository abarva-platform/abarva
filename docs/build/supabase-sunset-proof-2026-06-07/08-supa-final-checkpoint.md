# Supabase Sunset Proof - 08 Supa Final Checkpoint

Date: 2026-06-07
Status: CHECKPOINT RECORDED - `job-supa-final-eus` may run

## Job

`job-supa-final-eus`

## Purpose

Run the Azure-hosted final Supabase export job after the candidate image refresh.
The job uses Key Vault secret `source-postgres-database-url` as
`SOURCE_DATABASE_URL` and uploads table exports/manifests to Azure Blob.

## Important behavior

The current job command attempts a reversible freeze after export:

```sql
alter database "<source database>" set default_transaction_read_only = on;
```

and records the reversible SQL:

```sql
alter database "<source database>" reset default_transaction_read_only;
```

This is **not** a Supabase pause and **not** a Supabase delete. It may affect
legacy Supabase writes if it succeeds, so this checkpoint is recorded before
running it.

## Guardrails

- Do not print secrets.
- Do not pause Supabase.
- Do not delete Supabase.
- Do not change DNS.
- Do not remove Vercel production.

## Execution record

| Field         | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Execution     | `job-supa-final-eus-6kbty9s`                                                   |
| Status        | Failed overall because freeze step failed                                      |
| Backup root   | `supabase-final-backups/supabase-final-20260607-001`                           |
| Manifest      | Present at `supabase-final-backups/supabase-final-20260607-001/manifest.json`  |
| Table exports | 337 tables exported; 339 blobs under backup root including manifest and schema |
| Freeze status | Failed: `cannot execute ALTER DATABASE in a read-only transaction`             |

## Manifest summary

Captured from Azure runtime using managed identity; no secret values printed.

| Field            | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Run id           | `supabase-final-20260607-001`                              |
| Produced at      | `2026-06-07T03:24:48.764Z`                                 |
| Source database  | `postgres`                                                 |
| Source host      | `2600:1f16:1cd0:3340:5045:e4a8:5ea:a161/128`               |
| Blob root        | `supabase-final-backups/supabase-final-20260607-001`       |
| Table count      | 337                                                        |
| Freeze requested | `true`                                                     |
| Freeze result    | `failed`                                                   |
| Freeze error     | `cannot execute ALTER DATABASE in a read-only transaction` |

The final export artifacts exist, but the job returned failed because the
reversible freeze step did not complete. This is not a Supabase pause or delete.

## Merged-main rerun

| Field               | Value                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execution           | `job-supa-final-eus-0k0143f`                                                                                                                          |
| Image               | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41`                                                                                |
| Status              | Failed                                                                                                                                                |
| Observed progress   | Table exports continued through large tables including `enterprise_context_chunks` and `engagements`; per-table SHA-256 upload log lines were emitted |
| Final manifest read | Not captured for this rerun because Container Apps exec returned 404 during the post-run evidence read                                                |

The merged-main rerun did not close the final backup/freeze gate.
