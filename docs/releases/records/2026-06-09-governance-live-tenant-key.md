# 2026-06-09-governance-live-tenant-key — Align governance jobs to live client schema

## Release ID

`2026-06-09-governance-live-tenant-key`

## Status

`candidate`

## Plain-English Summary

The governance inventory and readiness backfill jobs now resolve client IDs from the live Azure `clients.tenant_key` field, with `slug` as a compatibility fallback. This prevents tenant-scoped context from being misreported as missing when the live database does not have the legacy `clients.key` column.

## Layer Impact

- `client-data-lane`: Corrects the tenant-to-client ID mapping used by governance inventory and readiness sidecar population.
- `internal-admin`: Improves private operator job accuracy for live Azure governance reports.

## Client Applicability

- All clients: Yes, the scanner/backfill now maps all canonical tenants using the live schema.
- Specific clients: Apex, Meridian, Northstar, First Capital, SkyHarbor, Lakeshore where present.
- Internal only: Yes, this changes governance operator scripts.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/governance/inventory-scan.ts`
- `src/scripts/governance/readiness-backfill.ts`

## QA / Validation

- `pass` — `git diff --check`
- `pass` — `npm run validate:context-corpus`
- `pass` — `npx jest src/lib/governance --runInBand`
- `pass` — `npx tsc --noEmit --pretty false --incremental false`
- `blocked until merge` — live Azure operator job rerun for inventory, dry-run readiness, commit readiness, and tenant coverage.

## Rollout Plan

Merge to `main`, build a new Azure Container Registry image, update the private operator job, and rerun governance inventory/readiness/coverage against the private Azure/Postgres database.

## Rollback Plan

Revert this script change. The migration is additive and not part of this release. If a backfill has run, the sidecar can be safely re-run idempotently after the mapping fix or dropped via the documented reverse SQL.

## Audit Evidence

- PR URL and merge commit.
- Live ACA operator job logs showing canonical tenants resolving to nonzero rows where data exists.

## Known Gaps

Some source stores may still require per-table tenant-column mapping where they do not use `client_id`; those are reported as probe errors rather than silently omitted.
