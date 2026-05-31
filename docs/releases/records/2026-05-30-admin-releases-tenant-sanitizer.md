# 2026-05-30-admin-releases-tenant-sanitizer — Tenant-Neutral Release Ledger

## Release ID

`2026-05-30-admin-releases-tenant-sanitizer`

## Status

`candidate`

## Plain-English Summary

The admin release ledger now redacts canonical tenant names and tenant key aliases before rendering markdown release records. This prevents a Meridian, SkyHarbor, First Capital, or other non-Apex admin route walk from seeing old Apex-specific commands or client names embedded in historical release notes.

## Layer Impact

`global-control-lane`: Updates the shared `/admin/releases` read-only surface and its markdown parser. No database, RLS, migration, notification, or write-path behavior changes.

## Client Applicability

All clients: yes, for the shared admin release ledger.

Specific clients: Apex Retail, Meridian Health, First Capital, Northstar Clinical, and SkyHarbor Air all receive the same tenant-neutral rendering behavior.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- `src/lib/admin/release-ledger.ts` extends parser-level sanitization from retired demo tenants to the five canonical tenant names, display aliases, and slug aliases.
- `src/lib/admin/__tests__/release-ledger.test.ts` adds a regression record containing `Apex Retail`, `--client-id apexretail`, `Meridian Health`, `SkyHarbor Air`, `First Capital`, and `Northstar` and verifies the parsed release view is tenant-neutral.

## QA / Validation

- `fail before fix`: Meridian production browser walk reached `/admin/releases` and failed on `--client-id apexretail` / Apex release-record text.
- `pass`: focused Jest for `src/lib/admin/__tests__/release-ledger.test.ts`.
- `pass`: focused ESLint for `src/lib/admin/release-ledger.ts` and `src/lib/admin/__tests__/release-ledger.test.ts`.
- `pass`: `npm run release:check`.
- `pass`: `git diff --check`.
- `not-run yet`: post-deploy production browser walk waits for this PR to merge and deploy.

## Rollout Plan

Merge to `main`; Vercel production deploy activates the parser-level redaction on `/admin/releases`. No migration or manual data operation is required.

## Rollback Plan

Revert the PR. Rollback restores the prior release-ledger rendering and does not require schema or data rollback.

## Audit Evidence

- Production Playwright finding on `/admin/releases`.
- Regression test in `src/lib/admin/__tests__/release-ledger.test.ts`.
- CI checks on the PR.

## Known Gaps

This sanitizes release-ledger display text. It does not rewrite historical markdown records on disk.
