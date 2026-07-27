# Module Dual-Run Reconciliation Plan

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Dual-Run Rule

Every consumer cutover must compare old module reads with new canonical/projection reads under the same tenant, time period, filters, and user path.

## Required Reconciliation Dimensions

- Row count and object count.
- Tenant fence.
- Local ID to canonical ID map.
- Source lineage and evidence refs.
- Metric period, unit, formula version, and basis.
- Headline values and material thresholds.
- aVa answer packet fields.
- Export and dashboard visual parity.

## Go / No-Go

No consumer switches to new reads until parity is accepted, rollback is tested, and business-event telemetry proves the old path can be observed during the read-only window.
