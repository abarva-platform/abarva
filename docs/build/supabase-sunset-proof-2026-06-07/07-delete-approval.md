# Supabase Sunset Proof - 07 Delete Approval

Date: 2026-06-07
Status: DELETED EXTERNALLY - proof updated after dashboard deletion
Scope: Retention, rollback, and post-delete evidence

## Gate verdict

Supabase deletion was performed externally through the Supabase dashboard after
the operator reported pre-delete proof. This document records the deletion and
remaining evidence gaps; it does not perform or approve any further destructive
action.

## Deletion approval record

| Field                           | Value                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| Final approval status           | Reported approved/performed outside this agent                                          |
| Final approver                  | External operator via Supabase dashboard                                                |
| Approval timestamp UTC          | Reported at 2026-06-07T05:06Z                                                           |
| Supabase project id/name        | `xtbymdryojmvoulaotce` / `abarva`                                                       |
| Supabase pause timestamp UTC    | Not recorded in this proof pack; dashboard showed read-only mode before deletion        |
| Supabase deletion timestamp UTC | Reported complete at 2026-06-07T05:06Z                                                  |
| Final backup location           | `/Users/anand/Downloads/abarva-supabase-native-pgdump-20260607-001/supabase-final.dump` |
| Final backup checksum           | `302ccb962614ac9a1ac6ab672838c06d1299aa181a1f0b13be943bf63f77ac8b`                      |
| Backup retention window         | Not recorded in this proof pack                                                         |
| Restore-test evidence           | Passed for AbarVa app/corpus data; Vault extension objects excluded                     |
| Rollback instructions location  | This proof pack and native dump path/checksum                                           |

## Required pre-delete conditions

| Condition                                                                     | Source file                 | Current status                                                                                                                        |
| ----------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Freeze timestamp recorded and Supabase writes blocked                         | `01-freeze-proof.md`        | PARTIAL - code-level runtime Supabase write proof passed; production freeze/log proof remains blocked                                 |
| Final backup, checksum, and restore-test evidence exist                       | `02-final-backup.md`        | PASS for operator-reported native dump and restore test; retention window still not recorded                                          |
| Azure parity table has no unexplained mismatch and checksum proof is attached | `03-azure-parity.csv`       | BLOCKED                                                                                                                               |
| Azure search/vector production proof and golden retrieval pass                | `04-search-vector-proof.md` | PARTIAL - six-tenant search verify/retrieval smoke passed on candidate image; Morgan Street/Northshore golden retrieval still missing |
| Azure-only production soak passes for 24-72 hours                             | `05-azure-only-soak.md`     | BLOCKED - candidate smoke passed, but 24-72 hour soak and Supabase zero-read/write logs are not complete                              |
| Supabase pause QA passes across core app surfaces                             | `06-pause-qa.md`            | SUPERSEDED by external deletion; post-delete Azure QA passed                                                                          |
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

`Supabase project abarva / xtbymdryojmvoulaotce was reported deleted via the Supabase dashboard at 2026-06-07T05:06Z.`

When approved, replace the line above with:

```text
Approved to delete Supabase project <project id/name> at <timestamp UTC>.
Approver: <name/role>.
Final backup checksum: <sha256>.
Retention window: <duration and storage location>.
```

## Blockers

Supabase has been deleted externally. Keep the native dump and checksum for
rollback/retention. Do not reintroduce Supabase fallback or point any runtime
back to Supabase.

## 2026-06-07 stop condition

Do not change DNS. Do not remove Vercel production. The Azure Container Apps
runtime passes public health, signed-in smoke QA, runtime DB proof, and log
deny-list checks after deletion. Remaining gaps: no 24-72 hour soak window is
recorded, Vercel env cleanup is unverified from this agent, Key Vault
Supabase-source secrets still exist but are unprojected, and Anthropic
Sentinel/Source migration remains separate in #3246.
