# Module Migration and Sunset Backlog Summary

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Current-State Baseline

PR #5679 remains the factual baseline: 131 persisted objects, with 72 retained operational, 38 promotion/link candidates, 16 shared-consumption projections, 5 archive items, and 0 immediate replace items.

## Key Interpretation

`replace = 0` means no persisted object is safe to remove today. It does not mean there are no paths to sunset. The path-level backlog separately tracks duplicate deliverable truth, direct context writeback, legacy source/mart construction, duplicated reporting logic, identity duplication, and telemetry gaps.

## Required Sequence

1. Merge the factual audit baseline only after approval.
2. Keep Healthcare execution separate until it certifies the Knowledge publication and consumption path.
3. Add business-event telemetry before module dual-run.
4. Build shared foundation: identity map, promotion outbox, publication lifecycle, projection registry, metric-definition contract, audit stream, reconciliation framework.
5. Migrate by wave with shadow reads, parity proof, rollback, and explicit destructive-change approval.
