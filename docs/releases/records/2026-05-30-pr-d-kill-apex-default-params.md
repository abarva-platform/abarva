# 2026-05-30-pr-d-kill-apex-default-params — PR-D Apex-leak elimination (Layers 3 + 4)

## Release ID

`2026-05-30-pr-d-kill-apex-default-params`

## Status

`candidate`

## Plain-English Summary

Four admin page-view builders and nine admin data-adapter fixture helpers used to silently default `tenantSlug` to `'apex-retail'`. That meant any new caller that forgot to pass the active tenant would silently render Apex data — the same root cause behind the Layer 3 + 4 Apex-leak trapdoors. PR-D removes every such default. The tenant slug (and tenant display name, on production-readiness) is now a required argument. TypeScript will refuse to compile any caller that forgets to thread the real tenant.

## Layer Impact

- `runtime-app-lane` — security hardening: closes the Layer 3 + 4 silent-default trapdoors that allowed cross-tenant Apex data to surface when callers omitted the tenant argument. No behavior change for any caller that was already threading the correct tenant; compile-time failure for any caller that was not.

## Client Applicability

- All clients: yes
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

Page-view builders — default param removed (tenantSlug + tenantName now required):

- `src/lib/admin/production-readiness-page-view.ts` — `buildProductionReadinessPageView(tenantSlug, tenantName)` (no defaults)
- `src/lib/admin/connectors-page-view.ts` — `buildConnectorsPageView(tenantSlug)` (no default)
- `src/lib/admin/users-access-page-view.ts` — `buildUsersAccessPageView(tenantSlug)` (no default)
- `src/lib/admin/architecture-page-view.ts` — `buildArchitecturePageView(tenantSlug)` (no default); module-level `DEFAULT_TENANT_SLUG` constant removed; the `'apex-retail'` literal is now scoped (renamed `APEX_FIXTURE_SLUG`) to the four legacy synchronous fixture exports (`ARCHITECTURE_PLANES`, `PLANE_COMPONENTS`, `AZURE_SERVICES`, `AZURE_TARGET_ARCHITECTURE`) that are deliberately Apex projections for pre-DATA9 import sites.

Admin data adapters — default param removed on the `*Fixture` helpers:

- `src/lib/admin/data/admin-production-readiness-adapter.ts` — `getAdminProductionReadinessFixture(tenantSlug)`
- `src/lib/admin/data/admin-blockers-adapter.ts` — `getAdminBlockersFixture(tenantSlug)`
- `src/lib/admin/data/admin-connectors-adapter.ts` — `getAdminConnectorsFixture(tenantSlug)`
- `src/lib/admin/data/admin-overview-adapter.ts` — `getAdminOverviewFixture(tenantSlug)`
- `src/lib/admin/data/admin-users-adapter.ts` — `getAdminUsersFixture(tenantSlug)`
- `src/lib/admin/data/admin-audit-log-adapter.ts` — `getAdminAuditEventsFixture(tenantSlug)`
- `src/lib/admin/data/admin-datasets-adapter.ts` — `getAdminDatasetsFixture(tenantSlug)`
- `src/lib/admin/data/admin-agent-readiness-adapter.ts` — `getAdminAgentReadinessFixture(tenantSlug)`
- `src/lib/admin/data/admin-setup-progress-adapter.ts` — `getAdminSetupProgressFixture(tenantSlug)`

Caller fixes (all in tests — no app-tier caller relied on the default):

- `src/__tests__/integration/admin/admin-data3-users-access-wired.test.ts`
- `src/__tests__/integration/admin/admin-data4-connectors-wired.test.ts`
- `src/__tests__/integration/admin/admin11-users-access-depth.test.ts`
- `src/__tests__/integration/admin/admin13-connectors-depth.test.ts`
- `src/__tests__/integration/admin/admin16-production-readiness-depth.test.ts`
- `src/__tests__/integration/admin/production-readiness-page-view.test.ts`
- `src/__tests__/integration/admin/wave3-pr5-production-readiness-2tabs.test.ts`
- `src/lib/admin/__tests__/production-readiness-pr9.test.ts`

Total: ~20 test call sites updated to pass `'apex-retail'` (and `'Apex Retail Group'` where applicable) explicitly.

New hygiene test:

- `src/lib/admin/__tests__/no-apex-default-params.test.ts` — walks every `.ts` file under `src/lib/admin/`, fails CI if any function signature reintroduces `= 'apex-retail'` or `= 'Apex Retail<...>'`. Skips the `data/fixtures/` directory where `=== 'apex-retail'` equality checks are intentional and skips the test file itself.

## QA / Validation

- PASS `npx tsc --noEmit` — would compile-error if any caller missed the now-required argument.
- PASS `npx eslint src/lib/admin` — no lint regressions.
- PASS `npx jest src/lib/admin/__tests__` — including the new hygiene test, which finds zero offenders.

## Rollout Plan

Merge to `main` → Vercel production deploy picks up automatically on next deploy. No migration, no flag, no runbook step.

## Rollback Plan

`git revert` the PR. The defaults reappear; existing tests continue to pass (the test caller updates are no-ops under the previous signature). No data-plane state to undo.

## Audit Evidence

- Audit spec: `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §2 Layers 3+4 and §6 F2.
- PR diff (this PR).
- CI run on the PR.
- Production Vercel deployment URL after merge.

## Known Gaps

None known. The remaining `=== 'apex-retail'` comparisons inside `src/lib/admin/data/fixtures/` are deliberate Apex-only fixture conditionals (the fixtures exist to model the Apex demo tenant in offline mode) and are not silent defaults — they require the caller to have already supplied a tenant slug. The four legacy synchronous fixture exports in `architecture-page-view.ts` are explicitly scoped to Apex via `APEX_FIXTURE_SLUG` and remain that way for back-compat with pre-DATA9 import sites; new code should call the async `buildArchitecturePageView(tenantSlug)` instead.
