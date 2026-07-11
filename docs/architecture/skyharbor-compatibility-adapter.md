# SkyHarbor Compatibility Adapter

Status: dry-run compatibility snapshot.

This adapter inventories the SkyHarbor existing-tenant upgrade candidate and turns it into a reviewable snapshot. It is not an active tenant promotion path.

## Inputs

- Existing SkyHarbor candidate source package under `datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710`.
- Generated candidate manifest.
- Candidate target-layer CSV files.
- Derived Move findings and golden-question scorecards.

## What It Proves

The snapshot proves that AbarVa can inspect an existing-tenant candidate package and preserve:

- source-file inventory,
- row-count coverage,
- candidate evidence signals,
- non-claim guardrails,
- known gaps,
- module-readiness blockers,
- promotion controls.

## What It Does Not Prove

It does not prove:

- production DB writes,
- active tenant access-layer promotion,
- module runtime consumption,
- live answer quality,
- realized outcome value,
- client-approved SkyHarbor production facts.

## Command

```bash
npm run audit:skyharbor-compatibility-snapshot
```

The command writes a report under `reports/skyharbor-compatibility-snapshot`.
