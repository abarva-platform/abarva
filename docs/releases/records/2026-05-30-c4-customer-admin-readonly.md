# 2026-05-30-c4-customer-admin-readonly — C4 Phase 1A Customer Admin

## Release ID

`2026-05-30-c4-customer-admin-readonly`

## Status

`candidate`

## Plain-English Summary

Adds a customer-admin workspace at `/admin/customer` where tenant administrators can inspect their own tenant's users, recent audit activity, AI egress events, usage/cost metadata, and substrate inventory without any edit, invite, sync, delete, or export actions.

## Layer Impact

- `global-control-lane`: Adds the `/admin/customer` route and Setup/Admin sidebar entry.
- `client-data-lane`: Composes existing tenant-scoped admin adapters, setup substrate broker data, and the AI egress audit ledger through server-side tenant resolution. No schema, RLS, seed, or migration changes.
- `security-control-lane`: Keeps the page tenant-pinned through the existing Setup auth gate, `requireTenancy`, and customer-admin policy check; every AI egress row is filtered again by the resolved tenant client id before rendering.

## Client Applicability

All clients: yes, where the signed-in user has customer-admin policy for the active tenant.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- Route: `/admin/customer`
- Read model: `src/lib/admin/customer-admin-read-model.ts`
- Navigation: `Customer Admin` entry in the Setup/Admin sidebar
- Tests: customer-admin read-only, RBAC, and tenant isolation helpers

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/customer-admin-read-model.test.ts --runInBand`
- PASS: `npx eslint 'src/app/(maestro)/admin/customer/page.tsx' src/lib/admin/customer-admin-read-model.ts src/lib/admin/__tests__/customer-admin-read-model.test.ts src/lib/admin/admin-shell-config.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`. No database migration, RLS change, feature flag, or manual data backfill is required. Vercel production deploy picks up the route through the normal application deployment.

## Rollback Plan

Revert the PR. Because this is route/read-model/navigation only and introduces no schema or data mutations, rollback is a standard code revert and redeploy.

## Audit Evidence

- PR URL: pending
- CI: pending
- Production deployment: pending normal post-merge deploy
- Local validation: pending

## Known Gaps

Phase 1A intentionally does not add live mutation controls. Cost is shown only when provider metadata records cost fields; the current `ai_egress_audit` schema has no first-class billing column. Some admin adapters still fall back to deterministic fixtures or honest empty states when live backing tables are absent.
