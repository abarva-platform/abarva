# AZLAB47 - L7 Agent Quality Telemetry Smoke

Status: implemented in repo  
Date: 2026-05-15  
Layer: L7 agent quality / L4 tenant isolation / L11 observability

## Why This Matters

AZLAB46 created the durable `agent_quality_violation_events` backend. This slice adds the operational proof that the table works in Azure Postgres and respects tenant boundaries.

The goal is small but important: before running the full 50-question live answer baseline, prove the table can accept guard telemetry and that one tenant cannot read another tenant's guard events.

## What Landed

| Artifact | Purpose |
|---|---|
| `src/scripts/agent-quality-telemetry-smoke.ts` | Direct Postgres smoke: table/index presence, service insert/read, authenticated same-tenant read, authenticated cross-tenant denial. |
| `package.json` | Adds `npm run azure:agent-quality:telemetry-smoke`. |
| `.github/workflows/azure-l7-agent-quality-telemetry-smoke.yml` | Manual GitHub Action for Azure lab DB using `AZURE_LAB_DATABASE_URL`. |

## Run Modes

Dry-run plan:

```bash
npm run azure:agent-quality:telemetry-smoke -- --dry-run
```

Transactional smoke, default rollback:

```bash
AGENT_QUALITY_DATABASE_URL="$AZURE_LAB_DATABASE_URL" \
  npm run azure:agent-quality:telemetry-smoke -- \
  --tenant-key apex-retail \
  --other-tenant-key meridian-health
```

Durable evidence row:

```bash
AGENT_QUALITY_DATABASE_URL="$AZURE_LAB_DATABASE_URL" \
  npm run azure:agent-quality:telemetry-smoke -- \
  --tenant-key apex-retail \
  --other-tenant-key meridian-health \
  --commit-fixture
```

## Pass Criteria

The smoke returns `status: "pass"` only if:

- `agent_quality_violation_events` exists
- both telemetry indexes exist
- service-side insert/read returns the fixture row
- authenticated same-tenant RLS read returns the fixture row
- authenticated other-tenant RLS read returns zero rows

## Next Step

Run this workflow against the Azure lab database after the AZLAB46 migration is applied, then run the L7 live answer runner and confirm C5 shows persisted guard counts.
