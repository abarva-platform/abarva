# 2026-05-30-admin-setup-isolation-fix — Admin Setup Isolation Fix

## Release ID

`2026-05-30-admin-setup-isolation-fix`

## Status

`candidate`

## Plain-English Summary

Fixes three admin/setup QA findings from the 2026-05-30 tenant isolation pass: `/admin/setup` now resolves back to the canonical `/admin` setup control plane, Production Readiness editorial copy names the active tenant instead of hardcoding Apex Retail, and Data Trust unlock-preview citation examples no longer expose Apex-specific sample citations to other tenants.

## Layer Impact

`global-control-lane`: shared admin/setup control-plane route behavior and deterministic admin copy now apply consistently across tenant contexts.

`internal-admin`: the Setup/Admin operator experience is safer for founder, steward, and tenant-admin QA because compatibility routes and visible copy no longer create false cross-tenant signals.

## Client Applicability

- All clients: applies to every tenant that can access `/admin`, `/setup`, `/admin/setup`, `/admin/data-trust`, or `/admin/production-readiness`.
- Specific clients: Apex Retail, SkyHarbor Air, and Meridian Health System were the directly tested isolation set.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `/admin/setup` as a thin redirect alias to `/admin`.
- Replaced the hardcoded Apex Retail Production Readiness editorial sentence with active tenant display-name substitution.
- Added canonical tenant display names for deterministic admin agent context slugs.
- Replaced Apex-specific Data Trust unlock-preview citation examples with tenant-neutral examples.
- Added regression tests for admin editorial tenant isolation and setup route alias behavior.
- Tightened the Setup vocabulary schema test so unlock-preview citations cannot contain Apex-specific labels.

## QA / Validation

- `npx eslint src/lib/agent/context-bundle.ts src/lib/agent/editorial.ts src/lib/admin/setup-vocab.ts src/lib/agent/__tests__/admin-editorial-tenant-isolation.test.ts src/lib/admin/__tests__/setup-vocab.test.ts src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts 'src/app/(maestro)/admin/setup/page.tsx'` — passed.
- `npx jest src/lib/agent/__tests__/admin-editorial-tenant-isolation.test.ts src/lib/admin/__tests__/setup-vocab.test.ts src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts --runInBand` — passed, 48 tests.
- `node reports/admin-setup-isolation-smoke.mjs` — passed locally against `npm run dev` with real Clerk credentials. Apex Retail, SkyHarbor Air, and Meridian Health System each logged in, visited `/admin/setup`, `/admin/data-trust`, and `/admin/production-readiness`, saw no forbidden tenant names, logged out, and verified `/admin` redirected to sign-in.

## Rollout Plan

Merge to `main`; Vercel deploys the updated admin route and deterministic copy with the normal production deployment flow. No migration or manual data operation is required.

## Rollback Plan

Revert the PR. Rollback restores the previous `/admin/setup` 404 and Apex-specific deterministic copy. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local validation: focused eslint and focused Jest listed above.
- Local browser smoke: `docs/build/2026-05-30-admin-setup-isolation-smoke.json`.
- HTML QA report that motivated the fix: `/private/tmp/nexus-admin-setup-qa-2026-05-30/reports/admin-setup-e2e-2026-05-30.html`.

## Known Gaps

No known gap remains for the three findings covered by this release: `/admin/setup` no longer 404s, the tested admin pages no longer show forbidden Apex/SkyHarbor/Meridian labels across the three tenant sessions, and logout isolation held in the browser smoke. This release does not change the broader local data-plane fallback behavior; the dev server still logs Azure/Postgres DNS fallback warnings when the primary lab host is unreachable.
