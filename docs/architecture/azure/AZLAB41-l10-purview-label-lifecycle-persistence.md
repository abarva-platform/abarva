# AZLAB41 - L10 Purview Label Lifecycle Persistence

Date: 2026-05-15  
Status: implemented, unit-tested  
Layer: L10 compliance / audit trail

## Why This Exists

Once Microsoft Purview classifies an uploaded artifact, that classification must remain part of the audit lifecycle. A release or hard-delete action should not create a child audit row that loses the original sensitivity evidence.

Before this slice, `release()` and `hardDelete()` copied tenant, file, hash, and storage fields from the parent quarantine row, but did not copy `purview_reached` or `purview_labels`. That would weaken the SOC2/infosec narrative: the original row had the labels, but the lifecycle row did not.

## What Changed

| Area | Change |
|---|---|
| Supabase data source | Parent lookup now selects `purview_reached` and `purview_labels`. |
| Release lifecycle row | Copies `purview_reached` and `purview_labels` from the parent row. |
| Hard-delete lifecycle row | Copies `purview_reached` and `purview_labels` from the parent row. |
| Unit tests | Assert both lifecycle actions preserve representative Purview/AbarVa labels. |

## Files

| File | Purpose |
|---|---|
| `src/lib/security/quarantine-audit-supabase.ts` | Preserves labels into lifecycle rows. |
| `src/lib/security/__tests__/quarantine-audit-supabase.test.ts` | Regression coverage for release and hard-delete preservation. |

## Control Statement

For sensitive upload evidence, lifecycle actions are append-only and classification-preserving:

- original ingest row remains unchanged
- release / hard-delete writes a new child row through `parent_id`
- child row carries the same `purview_reached` and `purview_labels`
- reviewer identity and release/hard-delete note are added on the child row

## Validation

```bash
npm run test:behaviors -- --testPathPatterns=quarantine-audit-supabase
npx tsc --noEmit -p tsconfig.json
npx eslint src/lib/security/quarantine-audit-supabase.ts src/lib/security/__tests__/quarantine-audit-supabase.test.ts
git diff --check
```

## Remaining L10 Work

| Remaining control | Why |
|---|---|
| Monthly scheduled evidence-pack export | Turns ad hoc SOC2 export into recurring evidence. |
| Live Purview fixture | Inserts a Purview-classified row in Azure Postgres and validates lifecycle persistence live. |
| Broader admin-action export | Adds non-upload admin actions to the evidence cadence. |
