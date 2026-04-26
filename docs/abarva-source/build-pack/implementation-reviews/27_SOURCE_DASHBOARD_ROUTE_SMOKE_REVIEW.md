# Source Dashboard Route Smoke Review

Date: 2026-04-26
Status: code complete
Branch: `codex/source-dashboard-route-smoke`

## Purpose

Add deterministic route/component smoke coverage for the `/source` dashboard and the merged agent mission preview without adding model calls, upload/parsing, API dependency, chat UI, or broader Source workflow surfaces.

## Files Changed

- `src/__tests__/integration/source/source-dashboard-route-smoke.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/27_SOURCE_DASHBOARD_ROUTE_SMOKE_REVIEW.md`
- `docs/build/production-readiness.json`

## Coverage Added

The new smoke test covers:

- `AbarVaSourceDashboard` server-rendering from seeded Source dashboard data.
- The `/source` page module rendering through `SourceDashboardPage`.
- The mission preview path producing deterministic mission report data from the seeded Data and AI sourcing event.
- The current top mission remaining `Steward - Stage gate check required`.
- Module hygiene guardrails for no model imports, no API route dependency, no fetch calls, no upload/parsing helpers, and no `/programs`, `/preview`, or `/demo` imports.

## Route/Auth Limitation

This is not a live authenticated browser route smoke.

The test renders the route module and dashboard component directly in Node. That is the right deterministic coverage for this slice because the authenticated `/source` route is still protected by Clerk/proxy behavior and authenticated screenshot validation remains unavailable in the Codex environment.

## Production Readiness Impact

`docs/build/production-readiness.json` was updated conservatively:

- Source / Outsourcing `route_smoke` moved from `not_automated` to `partial`.
- Source integration-test evidence now includes the dashboard route/component smoke test.
- Validation / QA route-smoke evidence now records this Source-specific deterministic route/component smoke coverage.

No component was marked `pilot_ready`, `full_flow_ready`, or `production_ready`.

Still blocked:

- authenticated live Source route smoke,
- authenticated screenshot review,
- persona crawler execution,
- upload/evidence pipeline,
- persistence,
- model-assisted Source runtime,
- full Source workflow UI.

## Validation Results

Passed:

```bash
npx jest src/__tests__/integration/source/source-dashboard-route-smoke.test.ts --runInBand
npx eslint src/__tests__/integration/source/source-dashboard-route-smoke.test.ts src/components/source/AbarVaSourceDashboard.tsx src/lib/source/agent-mission-report.ts
npx tsc --noEmit --pretty false
npm run build
git diff --check
node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('production-readiness.json parses')"
```

Attempted optional check:

```bash
npm run build -- --webpack
```

Result: failed on an existing base issue outside this Source slice. Next.js rejected an arbitrary export in `src/app/api/admin/production-readiness/route.ts` named `PRODUCTION_READINESS_NO_STORE_HEADERS`. That admin route file is outside the approved Source route-smoke scope, so this slice did not modify it.

## Explicitly Out Of Scope

- No model calls.
- No Claude/OpenAI calls.
- No chat UI.
- No upload/parsing implementation.
- No event canvas expansion.
- No scorecard UI.
- No artifact drawer UI.
- No value ledger UI.
- No vendor flow.
- No AI/RFP generation.
- No workflow engine.
- No approval engine.
- No artifact versioning.
- No document export/import.
- No `/programs`, `/preview`, or `/demo` work.
