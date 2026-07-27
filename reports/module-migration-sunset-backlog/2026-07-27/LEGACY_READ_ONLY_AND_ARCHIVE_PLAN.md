# Legacy Read-Only and Archive Plan

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Read-Only Entry Criteria

A legacy path can become read-only only after new reads are primary, parity has passed, rollback is tested, and business-event telemetry confirms writes have moved.

## Archive Requirements

- Immutable snapshot or export with digest.
- Source migration wave and approval reference.
- Retention owner.
- Restore procedure.
- Reader list and dormant-path telemetry.

## Do Not Archive When

- A writer is still active.
- A consumer lacks parity proof.
- Tenant isolation has not been proven.
- Any material metric or artifact export diverges.
