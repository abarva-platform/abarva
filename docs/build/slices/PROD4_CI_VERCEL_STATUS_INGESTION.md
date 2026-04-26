# PROD4 GitHub / Vercel Status Ingestion MVP

Status: code_complete
Owner: Steward
Date: 2026-04-26

## What Changed

PROD4 introduces the first deterministic, side-effect-free deployment-status ingestion surface for the platform Admin Production Readiness Tracker:

- New module `src/lib/admin/deployment-status-ingestion.ts` exposes the canonical types `DeploymentStatusProvider`, `DeploymentCheckStatus`, `DeploymentStatusResult`, `DeploymentStatusSource`, `DeploymentStatusError`, `ProductionReadinessDeploymentSignal`, and the helpers `buildDeploymentStatusUnavailable`, `getDeploymentStatusResults`, `getDeploymentStatusSources`, `summarizeDeploymentStatus`, and `mergeDeploymentStatusIntoReadinessView`.
- New API route `GET /api/admin/production-readiness/deployment-status` returns the rolled-up `ProductionReadinessDeploymentSignal` JSON shape with `Cache-Control: no-store, no-cache, must-revalidate` and `Pragma: no-cache` headers.
- New integration test at `src/__tests__/integration/admin/deployment-status-ingestion.test.ts` covers env-driven availability, V1 honesty (no fake `live`), determinism, no-secret-exposure, no-store cache directive, and module hygiene (no anthropic / openai / Date.now / Math.random / new Date / external fetch / forbidden surface imports).

## Why V1 Is Honest, Not Real-Time

PROD3 surfaced an internal no-store API for the readiness manifest but explicitly deferred GitHub and Vercel status ingestion. PROD4 is the first half of that deferred work: it wires the *contract* (types, route, test) without performing any external call. The `liveStatus` field deliberately never takes the value `live` in V1.

The module detects the canonical env vars `GITHUB_STATUS_TOKEN` and `VERCEL_STATUS_TOKEN` via `process.env` presence checks only. When tokens are absent, the module returns `liveStatus: 'unavailable'` with a clear message. When tokens are present, the module returns `liveStatus: 'configured'` and an explicit message that PROD4 V1 does not yet poll provider APIs.

## What V1 Does Not Do

- No call to `api.github.com`.
- No call to `api.vercel.com`.
- No model invocation (Anthropic / OpenAI / any provider).
- No auth rewrite.
- No persistence, no migrations, no DB read.
- No reading, returning, logging, or stringifying of token values.
- No promotion of any production-readiness component.

## Determinism Guarantees

- `generatedAt` is sourced from `process.env.PROD4_FIXED_GENERATED_AT` when present; otherwise falls back to a fixed constant. Neither `new Date()` nor `Date.now()` is invoked in this module or its route.
- Every emitted result carries `createdFrom: 'deterministic_deployment_status_ingestion_seed'`.
- `source` is always `'github_vercel_optional'`.
- Output is identical across calls when env is fixed.

## Signal Shape

The aggregate signal returned by `summarizeDeploymentStatus(results)` and the API route:

```
{
  generatedAt: string;
  source: 'github_vercel_optional';
  liveStatus: 'unavailable' | 'configured' | 'error';
  message: string;
  results: ReadonlyArray<DeploymentStatusResult>;
  sources: ReadonlyArray<DeploymentStatusSource>;
  createdFrom: 'deterministic_deployment_status_ingestion_seed';
}
```

Per-provider `DeploymentStatusResult`:

```
{
  provider: 'github' | 'vercel';
  liveStatus: 'unavailable' | 'configured' | 'error';
  checkStatus: 'success' | 'failure' | 'in_progress' | 'queued' | 'cancelled' | 'skipped' | 'unknown';
  checkedAt: string | null;
  generatedAt: string;
  source: 'github_vercel_optional';
  message: string;
  error: { code: 'token_missing' | 'token_invalid' | 'ingestion_disabled' | 'unknown'; message: string } | null;
  createdFrom: 'deterministic_deployment_status_ingestion_seed';
}
```

## Validation

Required validation:

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/deployment-status-ingestion.test.ts`
- `npm run build`

## Future PROD5+

Out of scope for PROD4 and reserved for a subsequent slice:

- Real polling of GitHub Actions check runs.
- Real polling of Vercel deployments and check states.
- Deploy-event ingestion and replay.
- Production observability hookup.
- Promotion of `production_deployment` once external signals are reviewed.

## Explicitly Out Of Scope

- No real GitHub API integration.
- No real Vercel API integration.
- No model calls.
- No auth changes.
- No migrations.
- No tracker promotion.
- No exposure of token values anywhere in the runtime, response, logs, or tests.
