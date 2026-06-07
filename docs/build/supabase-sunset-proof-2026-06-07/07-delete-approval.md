# Supabase Sunset Proof - 07 Delete Approval

Date: 2026-06-07
Status: DELETED - dashboard deletion recorded after incomplete gate sequence
Scope: Retention, rollback, and explicit approval before Supabase deletion

## Gate verdict

The former Supabase project `abarva` / `xtbymdryojmvoulaotce` has been deleted
through the Supabase dashboard. This document no longer functions as a pre-delete
approval gate for that project; it records the deletion event and the evidence
gaps that remained open when the event was reported.

## Deletion approval record

| Field                           | Value                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| Final approval status           | `DELETED VIA DASHBOARD - APPROVAL ARTIFACT NOT ATTACHED`                                       |
| Final approver                  | `PENDING`                                                                                     |
| Approval timestamp UTC          | `PENDING`                                                                                     |
| Supabase project id/name        | `abarva` / `xtbymdryojmvoulaotce`                                                             |
| Supabase pause timestamp UTC    | `NOT RECORDED BEFORE DELETION`                                                                |
| Supabase deletion timestamp UTC | `2026-06-07 - exact dashboard timestamp not attached`                                         |
| Final backup location           | `supabase-final-backups/supabase-final-20260607-001` in Azure Blob `context-drops`             |
| Final backup checksum           | `Per-table SHA-256 values in manifest/table logs; no single native pg_dump checksum attached` |
| Backup retention window         | `PENDING`                                                                                     |
| Restore-test evidence           | `PENDING`                                                                                     |
| Rollback instructions location  | `docs/runbooks/supabase-to-azure-decommission.md`                                             |

## Required pre-delete conditions

| Condition                                                                     | Source file                 | Current status                                                                                                                        |
| ----------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Freeze timestamp recorded and Supabase writes blocked                         | `01-freeze-proof.md`        | PARTIAL - code-level runtime Supabase write proof passed; production freeze/log proof remains blocked                                 |
| Final backup, checksum, and restore-test evidence exist                       | `02-final-backup.md`        | BLOCKED                                                                                                                               |
| Azure parity table has no unexplained mismatch and checksum proof is attached | `03-azure-parity.csv`       | BLOCKED                                                                                                                               |
| Azure search/vector production proof and golden retrieval pass                | `04-search-vector-proof.md` | PARTIAL - six-tenant search verify/retrieval smoke passed on candidate image; Morgan Street/Northshore golden retrieval still missing |
| Azure-only production soak passes for 24-72 hours                             | `05-azure-only-soak.md`     | BLOCKED - candidate smoke passed, but 24-72 hour soak and Supabase zero-read/write logs are not complete                              |
| Supabase pause QA passes across core app surfaces                             | `06-pause-qa.md`            | BLOCKED                                                                                                                               |
| Backup retention and rollback instructions are approved                       | This file                   | BLOCKED                                                                                                                               |

## Rollback instructions

Because the source project has been deleted, rollback must not require the
original Supabase project to exist. Any rollback drill must record the precise
path:

1. How to restore the final Supabase Postgres dump into a temporary database.
2. How to rehydrate any Supabase storage/object content if used.
3. How to point an emergency runtime back to restored data if explicitly
   approved.
4. How to re-run Azure parity and search/vector rebuild after restore.
5. Who can approve rollback and where that approval is recorded.

Rollback must not depend on deleted-only metadata. Keep the backup checksum,
project id/name, and restore commands outside the deleted Supabase project.
Do not point runtime configuration back to `xtbymdryojmvoulaotce`.

## Retention requirement

Keep the final backup for the agreed retention window. Do not shorten the
retention window without explicit approval from the same approval path used for
deletion.

## Final approval statement

`RECORDED - Supabase project abarva / xtbymdryojmvoulaotce was deleted through the dashboard on 2026-06-07; explicit approval artifact, pause QA, restore-test evidence, and retention window remain pending.`

When approved, replace the line above with:

```text
Approved to delete Supabase project <project id/name> at <timestamp UTC>.
Approver: <name/role>.
Final backup checksum: <sha256>.
Retention window: <duration and storage location>.
```

## Remaining evidence gaps

- Explicit approval artifact is not attached.
- Pause-before-delete QA was not recorded.
- Native `pg_dump`/restore-test evidence is not attached.
- Backup retention window is not recorded.
- Supabase can no longer remain available for rollback because the project was
  deleted.

## 2026-06-07 stop condition update

Supabase deletion has already occurred through the dashboard. Do not change DNS
or remove Vercel production as part of this record. The merged-main Azure
Container Apps revision passed public health, signed-in smoke QA, runtime DB
proof, Anthropic proof, and six-tenant Search retrieval smoke, but no 24-72 hour
soak has run, Supabase zero-read/write logs are not attached, native
`pg_dump`/restore-test evidence is incomplete, `supa-final` still failed
overall, and explicit deletion approval is not recorded.
