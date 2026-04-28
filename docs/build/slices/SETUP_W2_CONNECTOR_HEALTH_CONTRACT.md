# SETUP W2 Connector Health Contract

Date: 2026-04-28
Branch: `setup/w2-connector-health-read-model`
Scope: deterministic connector-health contract hardening

## Objective

Strengthen the existing ADM6 connector-health read model so it exposes the canonical Setup `ConnectorHealth` primitive fields called out in `docs/build/SETUP_BUILD_SPEC.md`:

| Field | Meaning |
|---|---|
| `integrationClass` | Connector taxonomy such as `T-MS-GRAPH`, `T-SAP`, `T-RSS`, or `T-CUSTOM`. |
| `lastAuthenticatedAt` | Last deterministic auth-success timestamp, or `null` for unavailable/unconfigured connectors. |
| `lastSuccessfulPullAt` | Last deterministic successful pull timestamp, or `null`. |
| `pullLatencyMs` | Deterministic pull latency, or `null` when no pull is valid. |
| `piiFilterActive` | Whether the seeded connector health contract claims PII filtering is active. |
| `scopeActive` | Data classes currently in connector scope. |

## Boundary

This slice does not add live connector calls, OAuth, API-key handling, secrets, Supabase writes, or UI behavior. It only makes the deterministic read model match the contract future Setup and Tower waves can consume.

## QA

```bash
npx jest src/__tests__/integration/admin/connector-health-read-model.test.ts --runInBand
npx eslint --max-warnings=0 src/lib/admin/connector-health-read-model.ts src/__tests__/integration/admin/connector-health-read-model.test.ts
output=$(npx tsc --noEmit --pretty false 2>&1); filtered=$(printf '%s\n' "$output" | grep -v '\.next/types/validator.ts' || true); if [ -n "$filtered" ]; then printf '%s\n' "$filtered"; exit 1; fi
git diff --check
```

## Exit criteria

The connector-health read model remains deterministic, every snapshot exposes the canonical health primitive fields, and not-configured connectors do not claim auth, pull, latency, or active scope.
