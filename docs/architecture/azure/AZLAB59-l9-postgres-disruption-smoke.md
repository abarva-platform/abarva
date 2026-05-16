# AZLAB59 - L9 Postgres Disruption Smoke

Status: wired; live Azure run pending after next image deploy  
Layer: L9 - Resilience / DR

## Purpose

The lab already proves Azure connectivity while Postgres is healthy. The next
cutover question is what the app tells an operator or CXO when the Postgres path
is impaired.

AZLAB59 adds a guarded, non-mutating disruption drill that verifies the expected
failure shape without detaching the private endpoint during normal lab work.

## What Changed

| Artifact | Purpose |
| --- | --- |
| `src/app/api/health/postgres-disruption/route.ts` | Protected drill endpoint that returns the Postgres-degraded contract. |
| `scripts/resilience/postgres-disruption-smoke.mjs` | Operator smoke that calls the endpoint and asserts the degradation shape. |
| `npm run azure:postgres-disruption:smoke` | Package command for dry-run, CI, or Azure lab execution. |

## Guard Model

The drill is inert unless the caller supplies one of the guarded health headers:

```text
x-abarva-l9-postgres-drill-token: <token>
x-abarva-health-token: <token>
```

The token must match one of:

1. `L9_POSTGRES_DRILL_TOKEN`
2. `AZURE_CONNECTIVITY_HEALTH_TOKEN`
3. `INTERNAL_HEALTH_TOKEN`

In production, missing or incorrect token returns `404` so the drill is not
discoverable as an operator control.

## Expected Degradation Contract

The response is intentionally HTTP `503`, but it must be structured and safe:

```json
{
  "event": "postgres_disruption_drill",
  "status": "degraded",
  "ok": false,
  "checks": {
    "postgres": false,
    "direct_postgres": false,
    "read_model": "degraded"
  },
  "degradation": {
    "mode": "protected_read_only",
    "dataChanged": false,
    "retry": "safe_to_retry_same_surface"
  },
  "error": "postgres_unavailable"
}
```

The user-facing message must say:

- AbarVa is temporarily in protected read-only mode.
- Tenant data has not been changed.
- Retrying from the same surface is safe.

The response must not leak:

- connection strings
- `DATABASE_URL`
- driver internals such as `node_modules/pg`
- raw network errors such as `ECONNREFUSED`, `ENOTFOUND`, or `ETIMEDOUT`
- stack traces

## Operator Commands

Dry run:

```bash
npm run azure:postgres-disruption:smoke -- --dry-run
```

Live Azure:

```bash
BASE='https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io'
TOKEN=$(az containerapp secret show \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --secret-name azure-connectivity-health-token \
  --query value -o tsv)

npm run azure:postgres-disruption:smoke -- \
  --base-url "$BASE" \
  --token "$TOKEN"
```

## Cutover Gate

Pass criteria:

- Unauthorized production request returns `404`.
- Authorized drill returns HTTP `503`.
- Response contract has `event=postgres_disruption_drill` and `status=degraded`.
- `degradation.dataChanged=false`.
- Message includes protected read-only mode and tenant-data-not-changed language.
- Raw driver/network/secret details are absent.

## Current L9 State

| Failure mode | Evidence |
| --- | --- |
| Service Bus poison message | AZLAB40 dry-run drill. |
| Service Bus mixed good + poison batch | AZLAB51 live Azure pass. |
| Model provider overload | AZLAB58 live Azure pass on r26. |
| Postgres disruption | AZLAB59 wired; live Azure run pending after next image deploy. |
| PITR restore timing | Restore drill still pending. |
