# Runtime Dependency Proof - Supabase Retirement Readiness

Date: 2026-06-07

Status: Gate 1 PASS for the current Azure Container Apps runtime. This proof
does not make Supabase shutdown safe because later data, backup, search, and QA
gates remain blocked.

## Current runtime truth

| Check | Result |
| --- | --- |
| Production runtime target | Azure Container Apps |
| Container App | `ca-abarva-web-lab-eastus` |
| Resource group | `rg-abarva-controlplane-lab-eastus` |
| Latest ready revision | `ca-abarva-web-lab-eastus--0000052` |
| Traffic | `0000052` at 100 percent |
| Image | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-70c4f98bf` |
| `ABARVA_DATA_PLANE` | `azure-postgres` |
| `DATABASE_URL` binding | secret ref `azure-postgres-control-database-url` |
| Supabase env names on Container App | 0 |
| Supabase secret names on Container App | 0 |

The Container App metadata was read through Azure Resource Manager with a
service-principal token. Only env/secret names and secret references were
printed; secret values were not read or emitted.

## Runtime env names inspected

The active Container App template exposes these env names:

```text
ABARVA_DATA_PLANE
ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS
ANTHROPIC_API_KEY
APPLICATIONINSIGHTS_CONNECTION_STRING
AZURE_CLIENT_ID
AZURE_CONNECTIVITY_HEALTH_TOKEN
AZURE_CONNECTIVITY_KEY_VAULT_SECRET_NAME
AZURE_CONNECTIVITY_SEARCH_INDEX_NAME
AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME
AZURE_KEY_VAULT_NAME
AZURE_SEARCH_SERVICE_NAME
CLERK_SECRET_KEY
DATABASE_URL
DEMO_LOGIN_PASSWORD
GAMMA_API_KEY
HOSTNAME
INGESTION_SMOKE_CONTAINER_NAME
INGESTION_SMOKE_STORAGE_ACCOUNT_NAME
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_DEMO_MODE
NEXT_TELEMETRY_DISABLED
NEXUS_COMPOSER_MODEL
NODE_ENV
OPENAI_API_KEY
PARALLEL_RUN_INVARIANT_TOKEN
PORT
SERVICE_BUS_NAMESPACE
SERVICE_BUS_QUEUE_NAME
```

`grep -i supabase` over these env names returns no matches. The Container App
secret-name list also contains no Supabase-named secret.

## Live health proof

Both live health endpoints returned HTTP 200:

| URL | HTTP | Body |
| --- | ---: | --- |
| `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io/api/health` | 200 | `{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }` |
| `https://app.abarva.ai/api/health` | 200 | `{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }` |

This confirms `/api/health` is Azure/Postgres-backed for the current runtime.

## Source-code/runtime dependency scan

The repo contains compatibility-era Supabase names, adapters, tests, migrations,
and operator scripts. The active runtime path is guarded:

- `src/lib/runtime/supabaseBootGuard.ts` rejects Supabase env projection or a
  Supabase-hosted `DATABASE_URL` when `ABARVA_DATA_PLANE=azure-postgres`.
- `src/instrumentation.ts` loads the boot guard during production startup.
- `src/app/api/health/route.ts` checks Postgres through Azure read adapters and
  direct `pg` connectivity; it does not use a Supabase client.
- `scripts/audit/runtime-supabase-import-census.mjs` and
  `scripts/audit/runtime-supabase-import-allowlist.json` enforce the remaining
  runtime import boundary.
- The current Azure runtime parameter file projects `DATABASE_URL` from
  `azure-postgres-control-database-url` and does not project
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or
  `SUPABASE_SERVICE_ROLE_KEY`.

## Gate 1 verdict

Gate 1 is green for the current Azure Container Apps runtime:

- Runtime is Azure Container Apps.
- Runtime data plane is Azure/Postgres.
- No Supabase env names or Supabase secret names are projected.
- `DATABASE_URL` is bound to the Azure Postgres secret reference.
- `/api/health` is Azure/Postgres-backed and healthy.
- No active runtime proof in this run points the app back to Supabase.

This is not a deletion approval. Data parity, backup/restore, search/retrieval,
signed-in QA, and final shutdown approval are separate gates and are not all
green.
