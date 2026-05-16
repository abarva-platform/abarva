# AZLAB59 - L9 Postgres Disruption Smoke

Status: wired; live Azure run passed  
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

## Live Azure Evidence

| Item | Value |
| --- | --- |
| Date | 2026-05-16 |
| Container App | `ca-abarva-web-lab-eastus` |
| Revision | `ca-abarva-web-lab-eastus--r28-postgres-disruption` |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-postgres-disruption-20260516-r28` |
| Image digest | `sha256:0ae0bf213f8a4e5a2bca7c9e7a3a06ed493ce35a17b0f4bafb84d9e03bc1bac4` |
| Health | `/api/health` returned `ok=true`, `postgres=true`, `direct_postgres=true`, `neo4j=skipped` |
| Connectivity | `/api/health/azure-connectivity` returned `pass`, run id `azconn-20260516140756` |
| Postgres disruption smoke | `pass`, HTTP `503`, protected-read-only message detected, raw error leakage not detected |
| Report artifact | `/tmp/azure-l9-postgres-disruption-r28.json` |

Live smoke summary:

```json
{
  "status": "pass",
  "checks": [
    { "name": "http_503_degraded", "pass": true },
    { "name": "event_contract", "pass": true },
    { "name": "tenant_data_not_changed", "pass": true },
    { "name": "protected_read_only_message", "pass": true },
    { "name": "no_raw_error_leakage", "pass": true }
  ]
}
```

Implementation note: the first r27 live run returned a Clerk redirect because
the new route had not been added to `PUBLIC_ROUTE_PATTERNS`. PR #2064 added the
middleware exemption and the proxy unit test; r28 is the first passing live
revision.

## Current L9 State

| Failure mode | Evidence |
| --- | --- |
| Service Bus poison message | AZLAB40 dry-run drill. |
| Service Bus mixed good + poison batch | AZLAB51 live Azure pass. |
| Model provider overload | AZLAB58 live Azure pass on r26. |
| Postgres disruption | AZLAB59 live Azure pass on r28. |
| PITR restore timing | Restore drill still pending. |
