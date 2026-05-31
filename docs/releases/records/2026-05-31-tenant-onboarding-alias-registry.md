# 2026-05-31-tenant-onboarding-alias-registry — Tenant Onboarding Alias Registry

## Release ID

`2026-05-31-tenant-onboarding-alias-registry`

## Status

`candidate`

## Plain-English Summary

The tenant onboarding script now writes new client aliases into the current `TENANT_ALIAS_PROFILES` registry instead of the removed active-client db-slug map. This restores the add-tenant behavior suite and keeps new tenants resolvable through the same tenant boundary used by the app.

## Layer Impact

- `global-control-lane`: Repairs internal tenant-onboarding automation and behavior coverage.
- `client-data-lane`: Affects future tenant setup metadata only; no existing tenant data changes.

## Client Applicability

- All clients: Existing tenants are unchanged.
- Specific clients: Future newly onboarded clients benefit from the repaired alias registration.
- Internal only: The script is an operator/developer onboarding tool.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updates `src/scripts/tenants/add-tenant.ts` to patch `src/lib/tenant/aliases.ts`.
- Updates `src/__tests__/behaviors/tenant-onboarding.test.ts` for `TENANT_ALIAS_PROFILES`.

## QA / Validation

- Pass: `npx jest src/__tests__/behaviors/tenant-onboarding.test.ts --runInBand`
- Pass: `npm run test:behaviors`
- Pass: `npx eslint src/scripts/tenants/add-tenant.ts src/__tests__/behaviors/tenant-onboarding.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Blocked then fixed: `npm run release:check -- --base origin/main --head HEAD` initially rejected pending QA labels and a thin Known Gaps note in this record; record updated and the gate was rerun.

## Rollout Plan

Merge to main. No migration or runtime feature flag is required.

## Rollback Plan

Revert the PR. The onboarding script would again target the removed registry and the behavior suite would fail until a replacement patch is applied.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2672
- CI checks on the PR.
- Local validation commands listed above.

## Known Gaps

No runtime tenant records are migrated by this patch. It repairs the local onboarding script and its behavior tests; any future tenant still needs the documented clients-table row, Clerk user provisioning, and seeded data package before real client users can operate in the workspace.
