# Azure Container Apps Cutover - Runtime Deploy

Date: 2026-06-07  
Status: PENDING DEPLOYMENT  
Container app: `ca-abarva-web-lab-eastus`

## Target

Deploy a fresh web image that includes the Supabase production boot guard and
continues to resolve `DATABASE_URL` through the Azure Key Vault-backed Container
Apps secret `azure-postgres-control-database-url`.

## Deployment record

| Field | Value |
| --- | --- |
| ACR image tag | `PENDING` |
| Build command | `PENDING` |
| Deployment command | `PENDING` |
| Deployment result | `PENDING` |
| New revision | `PENDING` |
| Active traffic | `PENDING` |
| FQDN | `PENDING` |
| Supabase env names present after deploy | `PENDING` |
| Boot guard log event | `PENDING` |

## Acceptance

- New revision is active.
- `DATABASE_URL` remains Key Vault-backed and is not printed.
- No Supabase env vars are projected.
- App starts successfully with `supabase_boot_guard_passed` in logs.
- No DNS change is made from this deployment step.
