# 2026-05-30-c6-observability-foundation — C6 Phase 1 Observability Foundation

## Release ID

`2026-05-30-c6-observability-foundation`

## Status

`candidate`

## Plain-English Summary

This release adds a small structured logging foundation for production observability. The first wired alert records blocked cross-tenant program write attempts with the active tenant and requested tenant in the log payload before any model or tool execution can run.

## Layer Impact

- `global-control-lane`: Adds shared structured logging helpers and wires one existing tenant-safety guard in the agent route.
- `client-data-lane`: No schema, RLS, seed, retrieval, or database connection changes.

## Client Applicability

- All clients: The logging helper is shared infrastructure.
- Specific clients: None.
- Internal only: Tenant-bleed alert logs are operator-facing observability.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/lib/observability/structured-logger.ts`.
- Added `src/lib/observability/tenant-bleed-alerts.ts`.
- Wired `/api/chat/agent` cross-tenant write refusals to emit `tenant_bleed_attempt_blocked` structured warning logs.
- Added focused Jest coverage for structured tenant-context logs and the simulated tenant-bleed alert path.

## QA / Validation

- PASS: `npx jest src/lib/observability/__tests__/structured-logger.test.ts src/lib/observability/__tests__/tenant-bleed-alerts.test.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts`
- PASS: `npx eslint src/lib/observability/structured-logger.ts src/lib/observability/tenant-bleed-alerts.ts src/lib/observability/__tests__/structured-logger.test.ts src/lib/observability/__tests__/tenant-bleed-alerts.test.ts src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`. The change becomes active on the next normal application deployment. No database migration or manual runbook is required.

## Rollback Plan

Revert the PR. This removes the helper and the single route call site; tenant write refusal behavior remains covered by the existing guardrail if only the observability call is reverted.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Focused local test output: three Jest suites passed, 27 tests passed; TypeScript typecheck passed after the helper typing fix.
- Release record: this file.

## Known Gaps

- This is Phase 1 only: it logs the blocked tenant-bleed alert path but does not yet forward alerts to PagerDuty, SIEM, PostHog, App Insights, or a persistent audit table.
