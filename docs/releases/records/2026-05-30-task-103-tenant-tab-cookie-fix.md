# 2026-05-30-task-103-tenant-tab-cookie-fix — Tenant Tab Honors Active Tenant

## Release ID

`2026-05-30-task-103-tenant-tab-cookie-fix`

## Status

`candidate`

## Plain-English Summary

The `/admin?tab=tenant` page now renders the tenant resolved for the current request instead of falling back to the old Apex Retail demo fixture. This closes the production browser finding where Meridian could load `/admin` correctly, then see Apex Retail text on the Tenant tab.

## Layer Impact

`global-control-lane`: Shared admin route rendering changes for the canonical `/admin` surface. No schema, RLS, migration, notification, or data-plane write path changes.

## Client Applicability

All clients: yes, for the shared admin tenant tab.

Specific clients: Apex Retail, Meridian Health, First Capital, Northstar Clinical, and SkyHarbor Air all receive the same route behavior.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/page.tsx` now builds a `TenantConfig` from `resolveAdminTenant()` / active client context and passes it to `AdminTenantTab`.
- `src/components/admin/__tests__/AdminTenantTab.test.tsx` adds a regression check that a Meridian config does not render Apex fallback text.
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part4.ts` removes an invalid `officeAddress` field from one `PatternSeed` object. This is a compile-only cleanup for an upstream mainline type error that blocked CI.

## QA / Validation

- `pass`: focused ESLint completed for `src/app/(maestro)/admin/page.tsx`, `src/components/admin/AdminTenantTab.tsx`, and `src/components/admin/__tests__/AdminTenantTab.test.tsx`.
- `pass`: focused Jest completed for `AdminTenantTab.test.tsx`, `TenantSwitcher.test.tsx`, and `resolveTenant.test.ts`; 16 tests passed.
- `pass`: `git diff --check` completed with no whitespace errors.
- `pass`: isolated seed file typecheck completed with `npx tsc --noEmit --pretty false --target ES2022 --module NodeNext --moduleResolution NodeNext src/scripts/seed/seed-banking-dom05-consumer-lending-part4.ts`.
- `blocked locally`: full `npx tsc --noEmit --pretty false` is blocked in this worktree by missing optional Azure/PPTX packages (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). The CI runner previously reached the seed-file error, so the invalid `officeAddress` cleanup is covered by the next CI run.
- `fail before fix`: production browser walk reproduced the issue on `https://app.abarva.ai/admin?tab=tenant`; Meridian session rendered `Apex Retail Group Locked` and `apex-retail`.
- `not-run yet`: post-deploy production browser walk waits for this PR to merge and deploy.
- `pass`: the existing production env mitigation was applied separately: `ABARVA_PG_POOL_MAX=5` and `ABARVA_TENANT_RESOLVE_TRACE=1` on the linked `nexus` Vercel production project, followed by a production redeploy.

## Rollout Plan

Merge to `main`; Vercel production deploy activates the server-rendered tenant tab fix. No migration or manual data operation is required.

## Rollback Plan

Revert the PR. The rollback restores the previous tenant-tab fallback behavior and does not require schema or data rollback.

## Audit Evidence

- Regression source: production Playwright walk for Meridian on `/admin?tab=tenant`.
- Release record: this file.
- Test evidence: focused Jest / ESLint output on the PR.

## Known Gaps

This fixes the tenant tab body. It does not remove the diagnostic `ABARVA_TENANT_RESOLVE_TRACE=1`; turn that env var off after the switcher path is stable and logs have confirmed the resolver source.
