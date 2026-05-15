# AZLAB46 - L7 Durable Agent Quality Telemetry

Status: implemented in repo  
Date: 2026-05-15  
Layer: L7 agent quality / C5 pilot dashboard / L11 observability

## Why This Matters

AZLAB45 made Sentinel consistency guard outcomes visible in the C5 pilot dashboard, but the source was still the process-local in-memory recorder. That is not enough for Azure parallel run: Container Apps can scale out, restart, or roll revisions, and the evidence must survive all of that.

This slice makes guard telemetry durable in Azure Postgres while preserving the local in-memory fallback for development.

## What Landed

| Artifact | Purpose |
|---|---|
| `supabase/migrations/20260515210000_agent_quality_violation_events.sql` | Creates the append-only `agent_quality_violation_events` table with tenant key, violation types, violation JSON, response length, timestamp, indexes, and RLS. |
| `src/lib/intelligence/synthesis/violationsSupabaseBackend.ts` | Implements the `ViolationsBackend` contract against Supabase/Postgres and exposes a tenant-scoped list function for the dashboard. |
| `src/app/api/chat/agent/route.ts` | Enables the Supabase backend when service-role env is available and `AGENT_QUALITY_VIOLATIONS_PERSIST !== 'false'`. |
| `src/lib/pilot-dashboard/aggregates.ts` | Reads persisted guard telemetry first; falls back to in-memory telemetry with an explicit banner when persistence is unavailable. |
| `src/lib/intelligence/synthesis/__tests__/violationsSupabaseBackend.test.ts` | Covers insert mapping, insert failure, tenant-scoped listing, and env-based enablement. |
| `src/lib/intelligence/synthesis/__tests__/violationsMigration.test.ts` | Guards the migration contract: table, tenant key, JSON payload, RLS, and authenticated read policy. |

## Data Shape

`agent_quality_violation_events` stores one row per recorded agent turn:

| Column | Meaning |
|---|---|
| `id` | Recorder-generated stable event id. |
| `event_timestamp` | Time the app recorded the turn. |
| `tenant_client_key` | Tenant scope used by RLS and dashboard filters. |
| `violation_count` | `0` for clean turns, `>0` when one or more guards fired. |
| `violation_types` | Distinct guard/validator types for fast rollups. |
| `violations` | Full violation details as JSONB. |
| `response_length` | Normalizer for violation rates. |

## Security Posture

Authenticated users can read only their tenant's rows through `can_read_tenant_by_key(tenant_client_key)`. Writes are performed by service-role application code. No client-side insert path is exposed.

## Operational Notes

The runtime enables durable writes only when both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present. Set `AGENT_QUALITY_VIOLATIONS_PERSIST=false` to force in-memory mode during isolated local tests.

The C5 dashboard is honest about state:

- persisted query succeeds: dashboard shows durable tenant rollup
- persistence env missing: info banner and in-memory fallback
- persistence query fails: warning banner and in-memory fallback

## Validation

```bash
npm run test:behaviors -- --testPathPatterns="synthesis/__tests__/violations|pilot-dashboard"
npx eslint src/app/api/chat/agent/route.ts src/lib/intelligence/synthesis/violationsSupabaseBackend.ts src/lib/intelligence/synthesis/__tests__/violationsSupabaseBackend.test.ts src/lib/intelligence/synthesis/__tests__/violationsMigration.test.ts src/lib/pilot-dashboard/aggregates.ts
npx tsc --noEmit -p tsconfig.json
```

## Next Step

Run the L7 live answer runner against Azure/prod, store the first scored baseline artifact, and verify the dashboard reads persisted guard telemetry from Azure Postgres.
