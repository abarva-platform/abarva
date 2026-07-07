# 2026-06-01-pilot-private-data-plane-foundation — Pilot Private Data Plane Foundation

## Release ID

`2026-06-01-pilot-private-data-plane-foundation`

## Status

`candidate`

## Plain-English Summary

Creates the first governed pilot data-load surface at `/admin/setup`. Admins now
see a Data Load Center that explains the rehearsal path from SSO and role-gated
access through landing-zone upload, sensitive-data quarantine, processing,
validation, approval, and availability to AbarVa assistants. The page also
exposes the dimension/template explorer from the existing context-ingestion
registry and enterprise-context Day One template manifests.

## Layer Impact

- `internal-admin`: Adds the admin-facing Setup Data Load Center route and
  sidebar entry.
- `client-data-lane`: Defines the private data-plane rehearsal read model using
  existing Azure landing-zone, sensitive-upload guard, validation, and template
  sources. No schema migration or live customer data write is introduced.
- `global-control-lane`: Shared admin navigation now includes the Data Loads
  entry for clients with admin access.

## Client Applicability

- All clients: `/admin/setup` is available wherever the Setup/Admin shell is
  available and is tenant-resolved through `resolveAdminTenant()`.
- Specific clients: Apex Retail and Meridian bind to existing Day One manifests;
  First Capital remains visible in manifest coverage; SkyHarbor shows no Day One
  manifest rather than borrowing another client manifest.
- Internal only: Yes, this is an admin control-plane surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/admin/setup/page.tsx` now renders a native Setup Data Load
  Center instead of redirecting to `/admin`.
- `src/components/admin/SetupDataLoadCenter.tsx` adds the first-viewport admin
  shell for rehearsal gates, diagnostics, manifest coverage, and template
  explorer.
- `src/lib/admin/setup-data-load-center.ts` composes the page model from
  existing ingestion, upload guard, context registry, validation engine, and
  enterprise-context template sources.
- `src/lib/admin/admin-shell-config.ts` adds the discoverable Data Loads sidebar
  entry.
- `src/lib/routes/registry.ts` registers `/admin/setup` as the native Setup Data
  Loads route while `/setup` remains the compatibility bridge to `/admin`.
- `docs/build/PILOT_PRIVATE_DATA_PLANE_FULL_SCOPE_BACKLOG_2026-06-01.md`
  records the next required full-scope mini-wave T353-T368.
- Tests added/updated for the read model, route source, and admin nav locks.

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/setup-data-load-center.test.ts src/app/'(maestro)'/admin/setup/__tests__/page-source.test.ts src/__tests__/integration/admin/admin-nav-six-panels.test.ts src/__tests__/integration/admin/admin-shell-v2.test.ts --runInBand`
- PASS: `npx eslint src/lib/admin/setup-data-load-center.ts src/components/admin/SetupDataLoadCenter.tsx src/app/'(maestro)'/admin/setup/page.tsx src/lib/admin/admin-shell-config.ts src/components/admin/AdminCanonShellV2.tsx src/lib/admin/__tests__/setup-data-load-center.test.ts src/app/'(maestro)'/admin/setup/__tests__/page-source.test.ts`
- PASS: `git diff --check`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npx jest src/__tests__/hygiene/admin-routes-resolve.test.ts --runInBand`
- PASS after route-registry update: `npx jest src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts --runInBand`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after green CI. The page becomes active through the normal Vercel
production deployment for the Next.js app. No Azure resource creation, database
migration, queue deploy, or feature flag is required for this first foundation
slice.

## Rollback Plan

Revert the PR. Rollback restores `/admin/setup` to its prior alias behavior and
removes the Data Loads sidebar entry. No data rollback is required because this
slice does not write customer data or apply migrations.

## Audit Evidence

- PR URL and CI run once opened.
- Local Jest, ESLint, diff, and release-check output.
- Source files listed in Changes Included.
- T341-T343 workbook rows from `ABARVA_PILOT_READINESS_PLAN.xlsx`.

## Known Gaps

The full pilot private data-plane is not yet complete. The next governed
execution wave is captured in
`docs/build/PILOT_PRIVATE_DATA_PLANE_FULL_SCOPE_BACKLOG_2026-06-01.md` and must
cover Azure provisioning, SSO/SCIM role mapping, durable ingestion schema,
idempotency, template versioning, preview-before-commit, rollback/unload,
malware scanning, encryption/key policy, retention/deletion, audit export,
observability/cost guardrails, tenant isolation tests, legal/data-use policy,
processing service choices, and end-to-end pilot smoke evidence.
