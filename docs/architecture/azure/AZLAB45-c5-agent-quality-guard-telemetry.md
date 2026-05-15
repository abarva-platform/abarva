# AZLAB45 - C5 Agent Quality Guard Telemetry

Status: implemented in repo  
Date: 2026-05-15  
Layer: C5 pilot success / L7 agent quality / L11 observability

## Why This Matters

AZLAB43 made the 50-case agent-quality corpus executable. AZLAB44 added Sentinel consistency guards. This slice makes those guard outcomes visible in the pilot success dashboard so they can be reviewed weekly instead of living only in logs.

The product principle: quality controls only matter if the founder and pilot team can see drift before a CXO does.

## What Landed

| Artifact | Purpose |
|---|---|
| `src/app/api/chat/agent/route.ts` | Records Sentinel voice / internal-consistency violations through the existing synthesis-violations telemetry path. |
| `src/lib/intelligence/synthesis/outputValidator.ts` | Adds telemetry categories for `sentinel-voice-drift` and `sentinel-internal-consistency`. |
| `src/lib/pilot-dashboard/aggregates.ts` | Adds `summarizeAgentQuality()` to roll up recent violation events by tenant. |
| `src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx` | Shows guarded turns, caught-violation rate, Sentinel consistency hits, and top violation types in Panel 2. |
| `src/lib/pilot-dashboard/__tests__/aggregates.test.ts` | Covers tenant-scoped guard telemetry rollup. |

## What The Dashboard Shows

Panel 2 now includes:

- guarded turns in the runtime telemetry window
- caught violation rate
- Sentinel internal-consistency hits
- violation types ranked by count

AZLAB46 follows this slice by backing `ViolationsBackend` with the durable
`agent_quality_violation_events` Postgres table. The in-memory recorder remains
the local fallback; Azure parallel run should use the durable table.

## Validation

```bash
npm run test:behaviors -- --testPathPatterns="pilot-dashboard|voice-doctrine/__tests__/sentinel"
npx eslint src/app/api/chat/agent/route.ts src/lib/intelligence/synthesis/outputValidator.ts src/lib/pilot-dashboard/aggregates.ts src/lib/pilot-dashboard/types.ts src/lib/pilot-dashboard/__tests__/aggregates.test.ts 'src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx'
npx tsc --noEmit -p tsconfig.json
```

## Next Step

Run the live L7 answer-quality baseline against Azure/prod and verify the C5
dashboard reads persisted tenant-level guard violation rates.
