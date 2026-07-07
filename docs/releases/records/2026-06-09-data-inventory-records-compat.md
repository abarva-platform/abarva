# 2026-06-09-data-inventory-records-compat — Data Inventory Records Compatibility

## Release ID

`2026-06-09-data-inventory-records-compat`

## Status

`candidate`

## Plain-English Summary

Adds an idempotent Azure/Postgres compatibility migration for the setup/current-state data inventory tables that runtime pages already expect. This addresses the live SkyHarbor log error where current-state record lookups failed because `data_inventory_records` did not exist.

## Layer Impact

- `client-data-lane`: Adds missing setup/current-state substrate tables and partitions when an Azure environment does not already have them.
- `global-control-lane`: Protects shared runtime lookup paths that read current-state records for Intelligence, Moves, Source, Tower, and Discovery/Diagnose readiness.

## Client Applicability

- All clients: Yes, the migration is global and idempotent.
- Specific clients: SkyHarbor is the immediate observed failure case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260609165000_data_inventory_records_compatibility.sql`
- Contract test: `src/lib/admin/__tests__/data-inventory-records-compat-migration.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/data-inventory-records-compat-migration.test.ts --runInBand`.
- PASS: `npx eslint src/lib/admin/__tests__/data-inventory-records-compat-migration.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN: CI migration replay before PR creation.

## Rollout Plan

Merge to `main`, then apply pending migrations in the Azure private runtime with `npm run db:migrate`. After the migration is applied, retest the SkyHarbor Move and P2 Discovery/Diagnose current-state lookups that were failing with `relation "data_inventory_records" does not exist`.

## Rollback Plan

This migration is additive and idempotent. If a rollback is required before data is written, drop the newly created compatibility tables and partitions. If data has been written, do not drop tables without first exporting tenant-scoped records and confirming no runtime path depends on them.

## Audit Evidence

- PR URL and CI run once opened.
- Fresh Postgres migration replay CI gate.
- Azure migration command output from `npm run db:migrate`.
- ACA logs before/after showing the absence of the `data_inventory_records` missing-relation error.
- Browser retest of SkyHarbor current-state / Discovery readiness flow.

## Known Gaps

- This does not load SkyHarbor current-state records by itself; it restores the table substrate so governed loaders and runtime lookups can work.
- This does not fix the minor UI staleness where gate criteria refresh only after reload.
- This does not fix the separate SkyHarbor Moves metadata leak that displays `APEX RETAIL GROUP` in card/detail metadata.
