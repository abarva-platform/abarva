# 2026-09-05-source-approval-ledger-restore — Source Approval Ledger Restore

## Release ID

`2026-09-05-source-approval-ledger-restore`

## Status

`candidate`

## Plain-English Summary

Restores the append-only Source event approval ledger table required by the Source stage approval writer. Stage approval updates continue to record the event state change and the approval receipt in one transaction, preserving the audit trail expected by the approval gate.

## Layer Impact

Release lane: `client-data-lane` for the additive schema restoration, plus `global-control-lane` for the shared Source approval route that already depends on this table.

Layer 3: restores the persisted approval receipt object tied to Source events.

Layer 4: unblocks the Source stage approval API path that appends an approval receipt after an authorized approval decision.

## Client Applicability

- All clients: Source events that use the stage approval workflow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260905120000_source_event_approval_ledger_restore.sql`
- Test: `src/__tests__/integration/source/source-event-approval-ledger-restore-migration.test.ts`

## QA / Validation

Candidate validation:

- Focused migration structure test must pass.
- Static destructive-SQL guard must pass.
- Release check must pass.

Runtime validation after rollout:

- Run the governed migration workflow preflight against the private database lane.
- Apply the migration through the approved migration runner.
- Re-run the Source stage approval action in a signed-in session and confirm the approval receipt is written without a missing-relation error.

## Rollout Plan

Merge the PR to main, let the repo-owned Azure Container Apps deploy workflow publish the current application image, then apply the additive migration through the approved migration runner. The schema change is additive and idempotent.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: captured by the ACA main deploy workflow.
- ACA runtime invariant: verify after deploy if the web runtime changes.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source approval action must complete without the missing-relation error.

## Rollback Plan

The migration is additive. If the web change is rolled back, the restored ledger table can remain in place because existing approval code expects it and the table is tenant-scoped through the parent event. Dropping the table would require a separate destructive-change approval and is not part of this rollback.

## Audit Evidence

- PR URL.
- Focused migration test output.
- Migration dry-run/apply output.
- ACA deploy run and runtime invariant if web runtime changes.
- Signed-in Source approval proof.

## Known Gaps

Live migration apply and signed-in proof are required before marking this release `released`.
