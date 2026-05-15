# AbarVa Azure Lab App Parallel Runtime Smoke

Status: deployed to `abarva-lab-sub` on 2026-05-15
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`
Data posture: synthetic/no-client-data only

## Purpose

This stage proves the real AbarVa Next.js runtime can boot in Azure Container Apps while reading `DATABASE_URL` from Azure Key Vault and reaching the private Azure Postgres control database.

It is a parallel-run smoke, not the full data-layer cutover. Many application paths still use the Supabase REST client, and the health route now exposes that distinction explicitly:

- `postgres` means the existing Supabase server client path is reachable.
- `direct_postgres` means the Node runtime can connect directly to the Azure Postgres `DATABASE_URL`.
- `neo4j` remains compatibility-only and is not the Azure-native target graph lane.

## Runtime Deployment

| Item | Value |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Active revision | `ca-abarva-web-lab-eastus--0000004` |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-parallel-run-20260515-r1` |
| Image digest | `sha256:9631a180cccd03f6af403d423aa79118ef38de5446376705138067426d7e0065` |
| Deployment | `azlab20-app-parallel-run-env-20260515121421` |
| FQDN | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` |

The deployment required public runtime env values (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to be loaded into the deployment process. They are not committed into the parameter file; the lab parameter file reads them with `readEnvironmentVariable()`.

## Key Vault Projection

`DATABASE_URL` now maps to the Azure Postgres control database secret:

| App env var | Container App secret | Key Vault secret |
|---|---|---|
| `DATABASE_URL` | `azure-postgres-control-database-url` | `azure-postgres-control-database-url` |

System logs confirmed Key Vault synchronization succeeded for the active Container App revision before the smoke.

## Smoke Results

| Check | Result | Interpretation |
|---|---|---|
| `GET /` | HTTP `200` | The Next.js runtime serves public traffic from Azure Container Apps. |
| `GET /api/health` | HTTP `503` | Aggregate health remains false because the legacy Neo4j check fails. |
| `checks.postgres` | `true` | Existing Supabase server-client compatibility path is reachable. |
| `checks.direct_postgres` | `true` | Azure Container App can reach Azure Postgres through Key Vault-projected `DATABASE_URL`. |
| `checks.neo4j` | `false` | Expected for the Azure-native target path; Neo4j is not the strategic graph provider. |

Captured response shape:

```json
{
  "ok": false,
  "checks": {
    "postgres": true,
    "direct_postgres": true,
    "neo4j": false,
    "neo4j_error": "error"
  }
}
```

## What This Proves

- The real AbarVa image builds in ACR.
- The Azure Container App can roll to a real Next.js app revision.
- Managed identity can pull from ACR.
- Key Vault secret projection works for app runtime secrets.
- Public runtime env must be present during the deployment.
- Direct Azure Postgres connectivity works from the app runtime.
- The lab can now support a true parallel-run phase: Supabase compatibility side by side with Azure Postgres direct connectivity.

## What This Does Not Yet Prove

- It does not prove every app page reads from Azure Postgres. Several code paths still use Supabase REST clients.
- It does not prove authenticated tenant flows in the browser.
- It does not prove model, retrieval, graph, or Source artifact generation parity.
- It does not close the graph-provider migration; Neo4j remains a compatibility dependency in code until the broker-level graph adapter is introduced.

## Next Close Path

1. Add a data-access adapter boundary for routes that currently use Supabase REST directly.
2. Run authenticated tenant browser smoke against Azure Container Apps.
3. Run the SEC-P0 cross-tenant probe suite against the Azure FQDN.
4. Split `/api/health` into clearer provider buckets: `runtime`, `auth`, `supabase_compat`, `direct_postgres`, `graph_provider`, `model_provider`, and `retrieval_provider`.
5. Introduce the Azure-native graph provider path backed by Cosmos DB for Apache Gremlin.
