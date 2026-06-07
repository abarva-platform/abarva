# Azure Container Apps Cutover - Operator Checkpoint

Date: 2026-06-07
Status: CHECKPOINT RECORDED - runtime deployment may proceed
Operator branch: `cursor/supabase-sunset-proof-96c4`

## Guardrails

- Do not print secrets.
- Do not delete Supabase.
- Do not pause Supabase without explicit approval.
- Do not change DNS until Azure app passes smoke and signed-in QA.
- Do not remove Vercel production until Azure has passed soak.
- Do not use local `DATABASE_URL` for Azure proof.
- Azure DB proof must run from Azure Container Apps jobs or Azure runtime.
- Every destructive or irreversible action requires a written checkpoint first.

## Current Azure state before this checkpoint

Captured with Azure CLI using service-principal operator credentials. Secret
values were not printed.

| Area                                   | Evidence                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Subscription                           | `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)                                                                                        |
| Resource group                         | `rg-abarva-controlplane-lab-eastus`                                                                                                              |
| Container app                          | `ca-abarva-web-lab-eastus`                                                                                                                       |
| Active revision                        | `ca-abarva-web-lab-eastus--0000048`                                                                                                              |
| Traffic                                | 100% to revision `0000048`                                                                                                                       |
| Image                                  | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1`                                                                     |
| FQDN                                   | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`                                                                  |
| Runtime `DATABASE_URL`                 | Present as Key Vault-backed env var `DATABASE_URL` using Container Apps secret `azure-postgres-control-database-url`                             |
| Supabase runtime env vars              | No `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` env names are projected into the active container |
| Stale Supabase Container Apps secret   | Secret name `supabase-service-role-key` exists in app configuration but is not projected as an environment variable                              |
| Existing Azure Search rebuild evidence | `job-a24-search-canon-eus-ac5kk3z` succeeded on 2026-06-07T00:35:35Z                                                                             |
| Existing Azure-only smoke evidence     | `job-a24-azure-soak-eus-nmvq83t` succeeded on 2026-06-07T00:44:56Z                                                                               |

## Runtime environment names before redeploy

The active app env-name list did not include Supabase runtime env names:

```text
NODE_ENV
NEXT_TELEMETRY_DISABLED
PORT
HOSTNAME
NEXT_PUBLIC_DEMO_MODE
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXUS_COMPOSER_MODEL
CLERK_SECRET_KEY
DATABASE_URL
ANTHROPIC_API_KEY
OPENAI_API_KEY
DEMO_LOGIN_PASSWORD
AZURE_SEARCH_SERVICE_NAME
ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS
AZURE_CONNECTIVITY_HEALTH_TOKEN
INGESTION_SMOKE_STORAGE_ACCOUNT_NAME
INGESTION_SMOKE_CONTAINER_NAME
SERVICE_BUS_NAMESPACE
SERVICE_BUS_QUEUE_NAME
AZURE_KEY_VAULT_NAME
AZURE_CONNECTIVITY_KEY_VAULT_SECRET_NAME
AZURE_CONNECTIVITY_SEARCH_INDEX_NAME
AZURE_CLIENT_ID
PARALLEL_RUN_INVARIANT_TOKEN
ABARVA_DATA_PLANE
AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME
APPLICATIONINSIGHTS_CONNECTION_STRING
GAMMA_API_KEY
```

## Planned action after this checkpoint

1. Add and build a production boot guard that blocks Supabase runtime env vars
   and Supabase-hosted `DATABASE_URL` when `ABARVA_DATA_PLANE=azure-postgres`.
2. Build a fresh ACR image from this branch using Azure Container Registry
   remote build; no secrets are baked into the image.
3. Deploy the image to `ca-abarva-web-lab-eastus` with `DATABASE_URL` still
   projected from Key Vault secret `azure-postgres-control-database-url`.
4. Re-run smoke and QA from Azure runtime/jobs.

## Explicit non-actions

- No Supabase pause.
- No Supabase delete.
- No DNS change.
- No Vercel production removal.
- No local database proof using local `DATABASE_URL`.
