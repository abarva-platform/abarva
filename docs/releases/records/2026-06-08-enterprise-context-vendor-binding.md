# 2026-06-08-enterprise-context-vendor-binding — Bind Intelligence Vendors to Enterprise Context

## Release ID

`2026-06-08-enterprise-context-vendor-binding`

## Status

`candidate`

## Plain-English Summary

The Intelligence Vendors stage can now use tenant Enterprise Context vendor, contract, renewal, and spend rows instead of showing an empty vendor panel for tenants whose broader Intelligence corpus is not yet seeded. The change also removes a misleading demo/substrate banner when Enterprise Context is already loaded, and fixes a Sentinel fact that hardcoded Meridian wording for every tenant.

## Layer Impact

- `client-data-lane`: Enterprise Context rows are normalized into vendor-spend rows that the Intelligence Vendors surface can render.
- `global-control-lane`: The Intelligence page chooses Enterprise Context-backed vendor rows before falling back to tenant-empty states. No Supabase fallback or legacy data plane is added.

## Client Applicability

- All clients: yes, when they have `enterprise_context_*` vendor/contract/spend records loaded.
- Specific clients: Lakeshore is the immediate target because browser QA showed Enterprise Context records/facts are visible but the Vendors tab still showed zero vendors.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`
  - Adds normalized `vendorSpendRows` derived from vendor/contracts, renewal calendar, and spend baseline records.
  - Keeps chunk-backed fallback explicit by returning no structured vendor rows when only chunks exist.
  - Replaces the hardcoded "Meridian" Sentinel instruction with the active tenant name.
- `src/components/intelligence-v3/IntelligenceV3Page.tsx`
  - Passes Enterprise Context vendor rows into the Vendors canvas.
  - Suppresses the demo/substrate warning when Enterprise Context evidence exists.
  - Uses an Enterprise Context opener for Sentinel when corpus Brief/Map are not yet seeded.
- Tests updated for the read model, dashboard fixture, and Intelligence vendor rendering.

## QA / Validation

- `npx jest src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx src/lib/pilot-dashboard/__tests__/aggregates.test.ts --runInBand`
  - Result: passed, 23 tests.
  - Note: Jest still prints duplicate manual mock warnings for existing markdown mocks; the tests pass.

## Rollout Plan

Merge to `main`, then deploy the Azure runtime from `main`. No migration is required. Existing Enterprise Context data becomes visible to the Intelligence Vendors stage automatically when the page reads the active tenant.

## Rollback Plan

Revert this PR. The Vendors stage will return to the prior behavior: tenants without a bound Intelligence corpus will show the empty vendor panel rather than Enterprise Context vendor rows.

## Audit Evidence

- Browser evidence before the fix:
  - `/Users/anand/Projects/nexus/reports/module-readiness-browser-2026-06-08-deep-run/`
  - `/Users/anand/Projects/nexus/reports/lakeshore-intelligence-tabs-2026-06-08/`
- Readiness report:
  - `/Users/anand/Projects/nexus/docs/build/lakeshore-module-readiness/2026-06-08-browser-readiness-report.md`
- Focused test command listed above.

## Known Gaps

Brief and Map still correctly show `CORPUS NOT YET SEEDED` until a tenant-specific Intelligence corpus payload exists. Art of Possible, Moves, Tower portfolio substrate, and Sentinel/Nexus answer QA remain separate follow-up lanes.

