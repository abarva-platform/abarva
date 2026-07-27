# Module Migration and Sunset Backlog Summary

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Current-State Baseline

PR #5679 remains the factual baseline: 131 persisted objects, with 72 retained operational, 38 promotion/link candidates, 16 shared-consumption projections, 5 archive items, and 0 immediate replace items.

## Key Interpretation

`replace = 0` means no persisted object is safe to remove today. It does not mean there are no paths to sunset. The path-level backlog separately tracks duplicate deliverable truth, direct context writeback, legacy source/mart construction, duplicated reporting logic, identity duplication, and telemetry gaps.

Canonical object families in this package are provisional until live row profiling, tenant/RLS inspection, lineage validation, and publication-framework proof are complete. Rows that cannot be safely classified from static DDL use `to_be_mapped_after_live_profile` and `mapping_confidence=unresolved`.

## Count Reconciliation

No audited persisted object disappeared between the 131-row inventory and the 129-row migration backlog.

- Audited persisted objects: 131.
- Archive-only objects excluded from migration backlog rows: 5.
- Audited persisted objects represented in migration backlog rows: 126.
- Wave 0 shared-foundation prerequisite rows added: 3.
- Total migration backlog rows: 129.

The net difference of 2 is arithmetic from excluding 5 archive-only objects and adding 3 non-persisted foundation prerequisites, not two missing audit records.

## Projection Catalog Scope

The shared consumption projection catalog records the current persisted-object projection candidates discovered by this static audit. The current 16 candidates are Tower-shaped because they are the existing persisted objects discovered in the audit. Source and Moves target projections, such as moves portfolio, decision register, value realization, source event summary, vendor comparison, contract exposure, and transition commitments, belong to the later Module Integration Target Plan.

## Required Sequence

1. Merge the factual audit baseline only after approval.
2. Keep Healthcare execution separate until it certifies the Knowledge publication and consumption path.
3. Add business-event telemetry before module dual-run.
4. Build shared foundation: identity map, promotion outbox, publication lifecycle, projection registry, metric-definition contract, audit stream, reconciliation framework.
5. Migrate by wave with shadow reads, parity proof, rollback, and explicit destructive-change approval.
