# Module Cutover and Rollback Plan

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Cutover Sequence

`ACTIVE -> DUAL_RUN -> NEW_READ_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED`

## Rollback

- Revert consumer flags to the domain read path.
- Mark published projection rows superseded rather than deleting them.
- Stop outbox processing if publication quality fails.
- Preserve identity links and audit history unless a reversal record is approved.

## Cutover Evidence

- Signed-in screen/API/export proof.
- aVa answer regression.
- Metric parity report.
- Tenant isolation proof.
- Business-event telemetry coverage.
- Rollback command and owner.
