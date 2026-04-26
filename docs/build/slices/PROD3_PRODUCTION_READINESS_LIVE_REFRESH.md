# PROD3 Production Readiness Live Refresh MVP

Status: code_complete
Owner: Steward
Date: 2026-04-26

## What Changed

PROD3 adds a V1 live refresh path for the platform Admin Production Readiness page:

- `GET /api/admin/production-readiness` returns the current production readiness manifest and derived view.
- The API response includes request-time metadata: `generatedAt`, `source`, `refreshMode`, `liveCiStatus`, and an explicit note.
- The API route sends no-store/no-cache headers.
- The page renders a client live panel that polls the API on an interval and provides a manual Refresh button.
- The server-rendered manifest remains the fallback if the API refresh fails.

## Why The Previous Page Was Not Real-Time

The page rendered a deterministic read model directly during server rendering. That made the tracker dependable and reviewable, but it did not provide an in-page refresh loop. Users had to reload the page, and deployment/build caching could make it unclear whether they were seeing the latest manifest snapshot.

PROD3 does not turn the tracker into a full monitoring system. It only creates a no-store internal refresh path so the browser can request the latest server-side manifest view without a full page reload.

## What V1 Live Refresh Means

V1 live refresh means:

- The browser polls the internal admin API.
- The API rebuilds the production readiness view from `docs/build/production-readiness.json` at request time.
- The page shows the last refreshed timestamp and refresh state.
- The user can manually refresh.
- The UI labels CI/Vercel status as unavailable unless a future integration is explicitly configured.

The readiness score remains deterministic. Polling does not promote any component and does not change readiness gates by itself.

## What Is Still Not Real-Time

The following are still not real-time in PROD3:

- GitHub checks.
- Vercel deployments.
- DB-backed readiness.
- Route smoke execution.
- Persona crawler execution.
- Security scan execution.
- Production observability.
- Deployment event ingestion.

The tracker may mention CI, Vercel, route smoke, and persona crawler as future readiness inputs, but PROD3 does not ingest those systems.

## Future PROD4

PROD4 should add secure CI/deployment ingestion only after the token and audit model is approved.

Likely PROD4 scope:

- GitHub/Vercel CI status ingestion.
- Secure server-side tokens.
- Deploy event polling.
- Production observability integration.
- Clear separation between local deterministic manifest state and live external system status.
- Tests proving no secrets are exposed to the browser.

## Validation

Required validation:

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/production-readiness-live-refresh.test.ts`
- `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts`
- `npm run build`

## Explicitly Out Of Scope

- No GitHub API integration.
- No Vercel API integration.
- No database-backed readiness.
- No route-smoke execution.
- No persona crawler.
- No model calls.
- No auth rewrite.
- No migrations.
- No Source UI or Source runtime changes.
