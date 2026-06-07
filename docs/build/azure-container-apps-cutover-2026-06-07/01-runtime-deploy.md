# Azure Container Apps Cutover - Runtime Deploy

Date: 2026-06-07
Status: PARTIAL - guarded revision deployed, signed-in QA blocked
Container app: `ca-abarva-web-lab-eastus`

## Target

Deploy a fresh web image that includes the Supabase production boot guard and
continues to resolve `DATABASE_URL` through the Azure Key Vault-backed Container
Apps secret `azure-postgres-control-database-url`.

## Deployment record

| Field                                   | Value                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACR image tag                           | Existing image retained: `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1`                                                                                                                                                                                                                                        |
| Build command                           | Attempted `az acr build --registry acrabarvalab001 --image abarva/web:cutover-supabase-guard-20260607-4d52928de --file Dockerfile .`                                                                                                                                                                                                         |
| Build result                            | BLOCKED: operator identity lacks `Microsoft.ContainerRegistry/registries/listBuildSourceUploadUrl/action`                                                                                                                                                                                                                                    |
| Deployment command                      | ARM PATCH to set Container Apps command guard: `command=["/bin/sh"]`, `args=["-c", "<supabase guard> && npm run start"]`                                                                                                                                                                                                                     |
| Deployment result                       | PASS for revision deployment                                                                                                                                                                                                                                                                                                                 |
| New revision                            | `ca-abarva-web-lab-eastus--0000049`                                                                                                                                                                                                                                                                                                          |
| Active traffic                          | 100% to `0000049`; previous `0000048` at 0%                                                                                                                                                                                                                                                                                                  |
| FQDN                                    | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`                                                                                                                                                                                                                                                              |
| Supabase env names present after deploy | PASS: no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` env names projected                                                                                                                                                                                                                     |
| Boot guard log event                    | PASS: `{"event":"supabase_boot_guard_passed","dataPlane":"azure-postgres"}` at 2026-06-07T02:40:34Z                                                                                                                                                                                                                                          |
| Public home smoke                       | PASS: `GET /` returned HTTP 200, 29,730 bytes                                                                                                                                                                                                                                                                                                |
| Health endpoint                         | FAIL: `GET /api/health` returned HTTP 503 with `postgres:false`, `direct_postgres:true`                                                                                                                                                                                                                                                      |
| Azure-runtime Postgres proof            | PASS: runtime connected to `abarva_control` as `abarvaadmin` at `10.43.1.4/32`; counts included `clients=9`, `enterprise_context_records=3503`, `enterprise_context_facts=38640`, `enterprise_context_chunks=21967`, `corpus_patterns=9026`, `genome_patterns=43436`, `intelligence_graph_edges=93743`, `source_events=42`, `engagements=53` |

## Acceptance

- New revision is active.
- `DATABASE_URL` remains Key Vault-backed and is not printed.
- No Supabase env vars are projected.
- App starts successfully with `supabase_boot_guard_passed` in logs.
- No DNS change is made from this deployment step.

## Deployment blocker

The active image is still the prior cutover image because this operator identity
cannot build/push a fresh ACR image. Runtime logs during signed-in QA show the
image still contains bundled code that throws `Missing NEXT_PUBLIC_SUPABASE_URL /
SUPABASE_SERVICE_ROLE_KEY` in several authenticated surfaces after Supabase envs
were removed. DNS cutover is blocked until a fresh image containing the
Postgres-compatible `src/lib/supabase-server.ts` path and boot guard source is
built and deployed.
