# Azure Container Apps Cutover - Runtime Deploy

Date: 2026-06-07
Status: HISTORICAL - candidate run superseded by merged-main runtime proof
Container app: `ca-abarva-web-lab-eastus`

## Target

Deploy a fresh web image that includes the Supabase production boot guard and
continues to resolve `DATABASE_URL` through the Azure Key Vault-backed Container
Apps secret `azure-postgres-control-database-url`.

## Deployment record

| Field                                   | Value                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACR image tag                           | Candidate image: `acrabarvalab001.azurecr.io/abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix`                                                                                                                                                                                                                                        |
| Build command                           | `az acr build --registry acrabarvalab001 --image abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix --file Dockerfile .` from PR #3240 head plus Docker context manifest exception                                                                                                                                                      |
| Build result                            | PASS after ACR roles were refreshed and `.dockerignore` allowed required enterprise-context manifest files                                                                                                                                                                                                                                   |
| Deployment command                      | ARM PATCH to set Container Apps command guard: `command=["/bin/sh"]`, `args=["-c", "<supabase guard> && npm run start"]`                                                                                                                                                                                                                     |
| Deployment result                       | PASS for revision deployment                                                                                                                                                                                                                                                                                                                 |
| New revision                            | `ca-abarva-web-lab-eastus--0000050`                                                                                                                                                                                                                                                                                                          |
| Active traffic                          | 100% to `0000050`; previous `0000049` at 0%                                                                                                                                                                                                                                                                                                  |
| FQDN                                    | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`                                                                                                                                                                                                                                                              |
| Supabase env names present after deploy | PASS: no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` env names projected                                                                                                                                                                                                                     |
| Boot guard log event                    | PASS: `{"event":"supabase_boot_guard_passed","dataPlane":"azure-postgres"}` on candidate revision                                                                                                                                                                                                                                            |
| Public home smoke                       | PASS: `GET /` returned HTTP 200                                                                                                                                                                                                                                                                                                              |
| Health endpoint                         | PASS: `GET /api/health` returned HTTP 200 with `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`                                                                                                                                                                                                                    |
| Azure-runtime Postgres proof            | PASS: runtime connected to `abarva_control` as `abarvaadmin` at `10.43.1.4/32`; counts included `clients=9`, `enterprise_context_records=3503`, `enterprise_context_facts=38640`, `enterprise_context_chunks=21967`, `corpus_patterns=9026`, `genome_patterns=43436`, `intelligence_graph_edges=93743`, `source_events=42`, `engagements=53` |

## Superseding merged-main evidence

This candidate-image checkpoint is superseded by the merged-main run captured in
`06-merged-main-runtime-proof.md`. The reproducible merged-main image was
`acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41`, deployed
as revision `ca-abarva-web-lab-eastus--0000051`.

## Acceptance

- New revision is active.
- `DATABASE_URL` remains Key Vault-backed and is not printed.
- No Supabase env vars are projected.
- App starts successfully with `supabase_boot_guard_passed` in logs.
- No DNS change is made from this deployment step.

## Historical blocker

The first guarded revision (`0000049`) used the prior cutover image because ACR
build was initially blocked by missing role assignments. That old image threw
`Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY` on several
authenticated surfaces. After roles were refreshed, the candidate PR #3240 image
was built and deployed as revision `0000050`; the old-image failures no longer
reproduce on candidate smoke.

## Remaining blocker

Do not change DNS or remove Vercel until the required 24-72 hour soak is
complete and approved.
