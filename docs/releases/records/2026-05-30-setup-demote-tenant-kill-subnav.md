# 2026-05-30-setup-demote-tenant-kill-subnav — Setup/Admin: demote /admin/tenant, kill SubNavStrip

## Release ID

`2026-05-30-setup-demote-tenant-kill-subnav`

## Status

`candidate`

## Plain-English Summary

The Setup/Admin surface now uses a single sub-navigation pattern. Tenant
admins see one canonical sidebar (AdminSidebar) and a Snowflake-style
horizontal tab strip directly below the page header on the routes that
warrant tabs — there is no second 5-tab strip lurking on /admin/audit,
/admin/policies, or /admin/connectors/* anymore. The standalone
/admin/tenant page is demoted to a "Tenant" tab inside /admin Overview;
the legacy URL 301-redirects to `/admin?tab=tenant` so any existing
links keep working.

## Layer Impact

- **runtime-app-lane** · Route layout: deletes the legacy 5-tab
  `SUB_NAV_ITEMS` SubNavStrip from the Setup/Admin surface, rewraps
  /admin/audit, /admin/policies, and the two /admin/connectors/[id]
  sub-routes in AdminCanonShellV2, and introduces AdminOverviewTabs
  (Overview · Tenant) at the top of /admin. No data-layer changes; no
  schema changes.
- **qa-validation-lane** · Adds a hygiene test that fails if anything
  under `src/components/setup/**` or `src/app/(maestro)/admin/**`
  re-introduces `SubNavStrip` or `SUB_NAV_ITEMS`. Updates the existing
  setup-w6 governance test to assert the demoted-tenant contract
  instead of the standalone tenant route. Updates
  admin-routes-resolve to include `/admin/tenant` in the dead-route
  set.

## Client Applicability

- All clients: All admins on every canonical tenant (Apex Retail,
  Meridian Health, First Capital, Northstar Clinical, Skyharbor Air)
  see the consolidated Setup IA. No feature flag.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Modified:

- `src/app/(maestro)/admin/page.tsx` — now reads `?tab=tenant`,
  renders `AdminOverviewTabs` strip + swaps body content between
  `HomeOverviewV2` (default) and `AdminTenantTab`.
- `src/app/(maestro)/admin/audit/page.tsx` — wraps `SetupAuditPage`
  in `AdminCanonShellV2` + `AgentRail`; preserves Wave 1 PR-6
  `?source=` filter forwarding.
- `src/app/(maestro)/admin/policies/page.tsx` — wraps
  `SetupPoliciesPage` in `AdminCanonShellV2` + `AgentRail`.
- `src/app/(maestro)/admin/connectors/[connectorId]/page.tsx` —
  wraps `ConnectorDetailPage` in `AdminCanonShellV2`.
- `src/app/(maestro)/admin/connectors/[connectorId]/reconnect/page.tsx` —
  wraps `ConnectorReconnectPage` in `AdminCanonShellV2`.
- `src/components/setup/SetupAuditPage.tsx` — content-only; drops
  internal `AppShell`/`SubNavStrip`/`AgentColumn` and the inline
  `SUB_NAV_ITEMS` array. Keeps PR-6 `filterSource` plumbing.
- `src/components/setup/SetupPoliciesPage.tsx` — content-only; same
  treatment as SetupAuditPage.
- `src/components/setup/ConnectorDetailPage.tsx` — content-only.
- `src/components/setup/ConnectorReconnectPage.tsx` — content-only.
- `src/components/shell/CommandPalette.tsx` — updates
  `'Setup · Tenant'` command palette entry to `/admin?tab=tenant`.
- `src/lib/crawl/persona-switcher.ts` — updates `admin-setup`
  persona path to `/admin?tab=tenant`.
- `src/lib/routes/registry.ts` — `admin-tenant` route pattern
  updated to `/admin?tab=tenant`; comment explains the demotion.
- `src/proxy.ts` — adds `'/admin/tenant': '/admin?tab=tenant'` to
  `adminRouteConsolidationMap`. Adjusts `homeToAdminMap` entry
  `/home/tenant-profile` → `/admin?tab=tenant` (was `/admin/tenant`).
  Hardens the `homeToAdminMap` redirect handler to merge query params
  cleanly when the target string itself contains `?`.
- `src/__tests__/hygiene/admin-routes-resolve.test.ts` — adds
  `/admin/tenant` to the `DEAD_ADMIN_ROUTES` set so panel/sidebar
  references that re-introduce it fail this guard.
- `src/__tests__/hygiene/shell-v2-mode-layout.test.ts` — drops the
  `SetupTenantPage.tsx` and `SetupConnectorsPage.tsx` entries from
  the surface-files lists (the files are deleted).
- `src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts` —
  removes `SetupConnectorsPage` from the canonical-shell symbol list.
- `src/__tests__/integration/setup/setup-w6-policies-governance.test.ts` —
  replaces the "keep tenant route wired" assertion with one asserting
  the standalone route is deleted and `/admin?tab=tenant` is wired
  via `AdminOverviewTabs` + `AdminTenantTab` + proxy redirect.

Added:

- `src/components/admin/AdminOverviewTabs.tsx` — the new canonical
  Setup sub-nav (Overview · Tenant tabs) directly below the
  /admin page header.
- `src/components/admin/AdminTenantTab.tsx` — tenant
  configuration content surfaced as the `?tab=tenant` body inside
  /admin Overview.
- `src/components/admin/__tests__/no-sub-nav-strip.test.ts` — hygiene
  guard: fails if anything in `src/components/setup/**` or
  `src/app/(maestro)/admin/**` re-introduces `SubNavStrip` or
  `SUB_NAV_ITEMS`.

Deleted:

- `src/app/(maestro)/admin/tenant/page.tsx` — demoted; the URL
  301-redirects to `/admin?tab=tenant`.
- `src/components/setup/SetupTenantPage.tsx` — content migrated to
  `AdminTenantTab`.
- `src/components/setup/SetupConnectorsPage.tsx` — dead code; the
  canonical `/admin/connectors` server component does not import it.

## QA / Validation

- `npx eslint src/` → 0 errors, 154 warnings (pre-existing).
- `npx tsc --noEmit` → clean.
- `npm run test:nav` → 26/26 pass.
- `npm run test:behaviors` → 69/74 pass; 5 failures are pre-existing
  `tenant-onboarding` add-tenant scripted edits unrelated to this PR.
- `npx jest src/components/admin/__tests__/ src/__tests__/hygiene/admin-routes-resolve.test.ts src/__tests__/integration/setup/setup-w6-policies-governance.test.ts src/components/setup/__tests__/`
  → all PR-3 / Setup hygiene tests pass.
- Hygiene Gate · Integrity · Lint · Production Readiness · Reasoning
  Layer Guard · Release Control Gate · Vercel x2 — PR CI pending.

## Rollout Plan

Merge to `main`. Vercel preview + production deploys handle the
route changes (no migration, no Azure work, no env var changes).
No feature flag.

## Rollback Plan

`git revert <merge commit>` and re-deploy. There is no schema or
data migration in this PR, so rollback is purely a code revert. The
proxy redirect change is also revert-safe (legacy `/admin/tenant`
would re-render the standalone route, which is fine because the
SetupTenantPage component would also come back via the revert).

## Audit Evidence

- Spine doc: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §2 IA
  and §5.3 IA recommendation, §5.5 "What gets deleted / merged /
  demoted" — the verdict commissioned this work.
- Hygiene guard: `src/components/admin/__tests__/no-sub-nav-strip.test.ts`
  fails fast on regression.
- PR URL: filled in at PR creation.
- CI run: filled in at PR creation.
- Vercel preview deploy: filled in at PR creation.

## Known Gaps

- The `AdminTenantTab` body still pulls from the
  `TENANT_FIXTURE` constant (Apex Retail Group) rather than the
  active client. The component accepts an optional `config` prop
  so this can be threaded once Trust Spine plumbs per-tenant
  configuration through the broker (Wave 2 follow-up).
- The Snowflake-style tab strip currently exposes only two tabs
  (Overview · Tenant). Future tabs (e.g. "Isolation", per
  verdict §5.3 Governance group) should be added to
  `AdminOverviewTabs.TABS` rather than spawning a new IA pattern.
