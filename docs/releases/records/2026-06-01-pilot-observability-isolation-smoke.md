# 2026-06-01-pilot-observability-isolation-smoke — Pilot Observability Isolation Smoke

## Release ID

`2026-06-01-pilot-observability-isolation-smoke`

## Status

`candidate`

## Plain-English Summary

This release completes the governed pilot private data-plane backlog scope by defining observability alerts, Azure spend guardrails, tenant isolation probes, the legal/data-use prerequisite pack, and the end-to-end smoke sequence for Apex Retail, Meridian Health, and SkyHarbor Air. It does not turn on runtime upload processing; it creates the tested contract QA and follow-on UI/API work must satisfy.

## Layer Impact

- `client-data-lane`: Defines the tenant-scoped controls and smoke evidence required before live client files are considered pilot-ready.
- `global-control-lane`: Adds typed admin contracts for alert thresholds, legal readiness, isolation probes, and smoke steps.

## Client Applicability

- All clients: The controls are generic and tenant-scoped.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are the required first QA set.
- Internal only: No AbarVa-only route changes.
- Public/demo only: None.
- Feature flag: No feature flag; this is an inert contract/docs/test slice.

## Changes Included

- `src/lib/admin/pilot-observability-isolation-smoke.ts`
- `src/lib/admin/__tests__/pilot-observability-isolation-smoke.test.ts`
- `docs/architecture/azure/PILOT-PRIVATE-DATA-PLANE-OBSERVABILITY-ISOLATION-SMOKE-2026-06-01.md`
- `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`
- `docs/build/PILOT_PRIVATE_DATA_PLANE_FULL_SCOPE_BACKLOG_2026-06-01.md`

## QA / Validation

- Passed: `npx jest src/lib/admin/__tests__/pilot-observability-isolation-smoke.test.ts --runInBand`
- Passed: `npx eslint src/lib/admin/pilot-observability-isolation-smoke.ts src/lib/admin/__tests__/pilot-observability-isolation-smoke.test.ts`
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `git diff --check origin/main...HEAD`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run: Browser smoke, because this slice defines the smoke contract but does not change runtime routes.

## Rollout Plan

Merge to `main` after green CI. Follow-on slices should wire these contracts into Setup Data Load Center readiness, observability alerts, automated cross-client probes, legal readiness gating, and browser/API/data-plane smoke automation.

## Rollback Plan

Revert the PR. There are no database migrations, production runtime routes, or environment changes in this slice.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2739
- CI checks: to be added after GitHub Actions completes.
- Contract test: `src/lib/admin/__tests__/pilot-observability-isolation-smoke.test.ts`
- Observability/isolation/smoke authority: `docs/architecture/azure/PILOT-PRIVATE-DATA-PLANE-OBSERVABILITY-ISOLATION-SMOKE-2026-06-01.md`
- Legal/data-use authority: `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`

## Known Gaps

Runtime automation remains follow-on work: alert pipeline wiring, browser login automation with real Clerk sessions, API probes against deployed environments, data-plane synthetic file runs, and production evidence capture for all three pilot clients.
