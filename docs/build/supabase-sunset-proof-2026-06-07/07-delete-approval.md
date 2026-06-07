# Supabase Sunset Proof - 07 Delete Approval

Date: 2026-06-07
Status: HOLD - deletion not approved
Scope: Retention, rollback, and explicit approval before Supabase deletion

## Gate verdict

Do **not** delete Supabase from this proof pack. Deletion is allowed only after
all prior gates pass, the final backup retention window is agreed and recorded,
rollback instructions are preserved, Supabase has been paused and QA has passed,
and an explicit final approver authorizes deletion.

## Deletion approval record

Fill only after every prior file in this proof pack is PASS.

| Field                           | Value          |
| ------------------------------- | -------------- |
| Final approval status           | `NOT APPROVED` |
| Final approver                  | `PENDING`      |
| Approval timestamp UTC          | `PENDING`      |
| Supabase project id/name        | `PENDING`      |
| Supabase pause timestamp UTC    | `PENDING`      |
| Supabase deletion timestamp UTC | `PENDING`      |
| Final backup location           | `PENDING`      |
| Final backup checksum           | `PENDING`      |
| Backup retention window         | `PENDING`      |
| Restore-test evidence           | `PENDING`      |
| Rollback instructions location  | `PENDING`      |

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

Before deletion approval, record the precise rollback path:

1. How to restore the final Supabase Postgres dump into a temporary database.
2. How to rehydrate any Supabase storage/object content if used.
3. How to point an emergency runtime back to restored data if explicitly
   approved.
4. How to re-run Azure parity and search/vector rebuild after restore.
5. Who can approve rollback and where that approval is recorded.

Rollback must not depend on deleted-only metadata. Keep the backup checksum,
project id/name, and restore commands outside the deleted Supabase project.

## Retention requirement

Keep the final backup for the agreed retention window. Do not shorten the
retention window without explicit approval from the same approval path used for
deletion.

## Final approval statement

`PENDING - Supabase deletion is not approved.`

When approved, replace the line above with:

```text
Approved to delete Supabase project <project id/name> at <timestamp UTC>.
Approver: <name/role>.
Final backup checksum: <sha256>.
Retention window: <duration and storage location>.
```

## Blockers

All sunset gates are currently blocked or partial. Supabase must remain available
for rollback until the proof pack is completed and explicit deletion approval is
recorded.

## 2026-06-07 stop condition

Do not pause or delete Supabase. Do not change DNS. Do not remove Vercel
production. The merged-main Azure Container Apps revision now passes public
health, signed-in smoke QA, runtime DB proof, Anthropic proof, and six-tenant
Search retrieval smoke, but no 24-72 hour soak has run, Supabase
zero-read/write logs are not attached, native `pg_dump`/restore-test evidence is
incomplete, `supa-final` still failed overall, and explicit deletion approval is
not recorded.
