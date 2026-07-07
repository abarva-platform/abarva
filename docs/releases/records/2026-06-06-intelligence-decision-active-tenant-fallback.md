# 2026-06-06-intelligence-decision-active-tenant-fallback — Intelligence Decision Tenant Fallback Guard

## Release ID

`2026-06-06-intelligence-decision-active-tenant-fallback`

## Status

`candidate`

## Plain-English Summary

The Intelligence "Which bet first" decision page no longer shows the Meridian reference decision surface when a real active tenant exists but does not yet have a supported function-pack binding. It now renders the honest onboarding/empty state for that tenant. This prevents Lakeshore and any other unbound active tenant from seeing another client's reference content as the active decision page.

## Layer Impact

- `global-control-lane`: changes shared Intelligence route behavior for all clients.
- `client-data-lane`: protects client-scoped context boundaries by failing closed when the active tenant is unbound.

## Client Applicability

- All clients: active tenants with no supported Intelligence decision binding now see the empty state instead of the Meridian reference.
- Specific clients: Lakeshore was the production proof case that exposed the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `src/lib/intelligence/decision-route-mode.ts`.
- Updated `src/app/(maestro)/intelligence/decision/page.tsx`.
- Added `src/lib/intelligence/__tests__/decision-route-mode.test.ts`.
- Follow-up hardening: the route now reads the App Router `searchParams.client` value and passes it into `getActiveClientRow(...)`, so explicit production URLs like `/intelligence/decision?client=lakeshore` resolve the requested tenant before applying the tenant-empty/reference-example guard.

## QA / Validation

- Pass: Focused Jest regression: `npx jest src/lib/intelligence/__tests__/decision-route-mode.test.ts --runInBand`.
- Pass: Focused lint: `npx eslint 'src/app/(maestro)/intelligence/decision/page.tsx' src/lib/intelligence/decision-route-mode.ts src/lib/intelligence/__tests__/decision-route-mode.test.ts --no-warn-ignored`.
- Pass: Release control: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: Diff hygiene: `git diff --check`.

## Rollout Plan

Merge to main and deploy normally through the production app pipeline. No migration or data backfill required.

## Rollback Plan

Revert the PR if the route needs to restore the prior reference-example behavior. No data rollback required.

## Audit Evidence

- Pre-fix production evidence: `reports/lakeshore-prod-artifact-deep-crawl/lakeshore-prod-artifact-deep-crawl-2026-06-06T04-23-18-018Z/README.md`.
- The captured Lakeshore CIO `/intelligence/decision` screenshot showed Meridian reference content.
- Follow-up production evidence: `reports/lakeshore-intelligence-decision-postfix/lakeshore-intelligence-decision-postfix-2026-06-06T04-52-04-143Z/README.md` and `reports/lakeshore-intelligence-decision-postfix/lakeshore-intelligence-decision-postfix-explicit-client-2026-06-06T04-52-32-260Z/README.md` showed the first guard was insufficient because the route still failed to honor `?client=lakeshore`.
- Regression test covers active unbound tenant fallback.
- Regression test covers client query-param extraction for string, repeated, and missing values.

## Known Gaps

This does not create a Lakeshore-specific Function Pack decision page. It prevents leakage and renders the honest onboarding state until Lakeshore's own supported decision binding exists.
