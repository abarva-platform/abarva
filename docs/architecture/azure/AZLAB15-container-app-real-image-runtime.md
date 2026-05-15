# AbarVa Azure Lab Container App Real Image Runtime

Status: deployed to `abarva-lab-sub` on 2026-05-14  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Data posture: synthetic/no-client-data only

## Purpose

This stage deploys a second Container App that references the real AbarVa image built in AZLAB14:

`acrabarvalab001.azurecr.io/abarva/web:lab-ebe449ae-r3`

The intent is to prove the runtime lane can pull the real image through managed identity. It is not yet the final live app deployment because production-equivalent app secrets are not wired into Azure.

## Runtime Design

| Capability | Resource | State |
|---|---|---|
| Container App | `ca-abarva-web-lab-eastus` | Real AbarVa image, separate from placeholder smoke app. |
| Managed environment | `cae-abarva-scale-lab-eastus` | Existing Container Apps environment. |
| Identity | `id-abarva-scale-runtime-lab-eastus` | Existing identity with `AcrPull`. |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-ebe449ae-r3` | Built and pushed in AZLAB14. |
| Scale | min `0`, max `2` | Kept at zero until app secrets and health checks are wired. |
| Ingress | external, target port `3000` | For future app smoke once env is complete. |

## Live Verification

Verified after deployment:

- Deployment state: `Succeeded`
- Container App: `ca-abarva-web-lab-eastus`
- Latest revision: `ca-abarva-web-lab-eastus--670wmv2`
- FQDN: `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
- Image: `acrabarvalab001.azurecr.io/abarva/web:lab-ebe449ae-r3`
- Scale: min `0`, max `2`
- Public endpoint was not smoke-tested because app secrets are intentionally not wired yet.

## Why Min Replicas Stay At Zero

The image is real, but the runtime environment is intentionally incomplete. We should not put production Clerk, Supabase, model, or provider secrets into Azure until Key Vault projection and secret ownership are designed.

This stage proves:

- Container Apps can reference ACR
- managed identity can pull the app image
- the app runtime object can be deployed repeatably
- no secrets are baked into the image

The next stage should prove:

- Key Vault-backed secret injection
- non-production Clerk/Supabase/Postgres config
- `/api/health` and one authenticated route smoke
- logs in App Insights/Log Analytics
