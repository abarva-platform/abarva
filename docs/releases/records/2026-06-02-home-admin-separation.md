# 2026-06-02-home-admin-separation — Restore Home As Workspace Landing

## Release ID

`2026-06-02-home-admin-separation`

## Status

`candidate`

## Plain-English Summary

Home is now separated from Setup/Admin. The top navigation sends users to `/home`, where they see a read-only impact insights cockpit with a polished signal-map visual, decisions that need human attention, value/risk movement, and ready outputs. Setup, users, connectors, templates, policies, data loads, and related operator controls remain under `/admin`.

## Layer Impact

- `global-control-lane`: Changes shared navigation and route behavior for signed-in users.
- App routing: Restores `/home` as a real page and preserves legacy redirects from retired Home admin aliases to their canonical `/admin` destinations.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/app/(maestro)/home/page.tsx` backed by `ImpactInsightsHome`.
- Added a Home copy contract test that prevents setup/admin/data-load/template/corpus-readiness language from returning to the Home component.
- Expanded `/admin` into an Admin Control Center with entry cards for users/access, data loads, connectors, templates, approvals, audit, production readiness, and releases.
- Updated top navigation metadata so Home points to `/home`, not `/admin`.
- Stopped middleware from redirecting bare `/home` to `/admin`.
- Removed `/home` admin-alias route files for connectors, data trust, agent readiness, and configuration.
- Kept legacy redirects for those old URLs so persisted links continue to land under `/admin`.

## QA / Validation

- Passed: `npx jest src/components/shell/__tests__/topbar-nav-home-admin.test.ts --runInBand`
- Passed: `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts' --runInBand`
- Passed: `npx jest src/components/home/__tests__/ImpactInsightsHome.copy.test.ts --runInBand`
- Passed: `npx jest src/components/shell/__tests__/topbar-nav-home-admin.test.ts src/components/home/__tests__/ImpactInsightsHome.copy.test.ts --runInBand`
- Passed: `npx jest src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts src/__tests__/integration/setup/setup-w6-policies-governance.test.ts --runInBand`
- Passed: `npx eslint src/components/home/ImpactInsightsHome.tsx src/app/'(maestro)'/home/page.tsx src/app/'(maestro)'/admin/page.tsx src/components/shell/topbar-nav-items.ts src/lib/home/top-nav-items.ts src/proxy.ts src/components/shell/__tests__/topbar-nav-home-admin.test.ts src/app/'(maestro)'/home/__tests__/no-readmin-reexports.test.ts src/components/home/__tests__/ImpactInsightsHome.copy.test.ts`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Blocked by local dependency gap: `./node_modules/.bin/tsc --noEmit --pretty false` fails before app code on `tests/accessibility/public-axe.spec.ts(1,24): Cannot find module '@axe-core/playwright'`.

## Rollout Plan

Merge to main and deploy through the normal Vercel production path. The route change is immediate: `/home` serves Home, while legacy setup/admin aliases under `/home/*` redirect to `/admin/*`.

## Rollback Plan

Revert the PR. That restores the previous behavior where Home navigation lands on `/admin` and bare `/home` redirects to `/admin`.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2828
- CI checks: pending.
- Local validation: complete except for the known local `@axe-core/playwright` typecheck dependency gap.

## Known Gaps

Authenticated download routes, private data-plane loading, and the deeper template/schema clarification workflow remain separate backlog slices. This release establishes the navigational and experience boundary first.
