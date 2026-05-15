# AbarVa Azure Lab Image Supply Chain And Cost Guardrails

Status: deployed to `abarva-lab-sub` on 2026-05-14  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Primary region: `eastus`  
Data posture: synthetic/no-client-data only

## Purpose

This stage adds the first real deployment-control layer on top of the Container Apps foundation:

- Azure Container Registry for AbarVa images
- RBAC-only push/pull permissions
- ACR admin user disabled
- Container Apps runtime identity authorized to pull images
- lab service principal authorized to push images
- subscription monthly budget alerts

This is the bridge from "Azure can host a placeholder app" to "Azure can host controlled AbarVa images."

## Live Resources

| Capability | Resource | Design |
|---|---|---|
| Image registry | `acrabarvalab001` | Basic SKU for lab, admin disabled, public network access enabled only until private build agent path exists. Advanced retention/trust policies are deferred until Premium is justified. |
| Image push | `sp-abarva-codex-lab` | `AcrPush` scoped only to the registry. |
| Image pull | `id-abarva-scale-runtime-lab-eastus` | `AcrPull` scoped only to the registry for Container Apps. |
| Cost guardrail | `budget-abarva-lab-monthly` | Monthly budget with 50%, 80%, 100%, and forecasted 100% alerts. |

## Live Verification

Verified after deployment:

- Deployment state: `Succeeded`
- Registry login server: `acrabarvalab001.azurecr.io`
- Registry SKU: `Basic`
- Registry public network access: `Enabled`
- Registry admin user: `false`
- `sp-abarva-codex-lab` principal `f311efce-bf6b-43fd-8f4d-a4b8c5adba74` has `AcrPush`
- `id-abarva-scale-runtime-lab-eastus` principal `42f131d5-a0da-4d66-83f9-fe3769acc017` has `AcrPull`
- Budget amount: `250`
- Budget period: `2026-05-01` to `2027-05-01`
- Budget notifications: actual 50%, actual 80%, actual 100%, forecasted 100%
- ACR token issuance through Azure CLI succeeded for `acrabarvalab001.azurecr.io`

## Why Public ACR Access Is Acceptable For Lab

The registry is not a data store for client data. It stores deployable images. For the lab:

- admin user is disabled
- pushes use Azure RBAC
- pulls use managed identity
- no production secrets are baked into images
- no client data is stored in images

Public network access stays enabled only because the lab currently builds from a local/Codex operator machine rather than a private Azure build agent. For a client private lane, the target design is:

1. private endpoint for ACR
2. private build agent or GitHub Actions OIDC path approved by the client
3. public network access disabled
4. image signing/scanning gate before release

## Cost Guardrail

The monthly budget is deliberately modest because the lab is still founder-operated. It is not meant to throttle product ambition; it is meant to keep Azure burn visible as we add services.

| Threshold | Purpose |
|---:|---|
| 50% actual | Early warning that baseline services are accumulating cost. |
| 80% actual | Decision point before adding new paid services or running scale tests. |
| 100% actual | Founder intervention. |
| 100% forecast | Prevents month-end surprises. |

## Validation Plan

After deployment:

1. Confirm ACR exists and admin user is disabled.
2. Confirm `sp-abarva-codex-lab` has `AcrPush`.
3. Confirm `id-abarva-scale-runtime-lab-eastus` has `AcrPull`.
4. Confirm the monthly budget exists.
5. Confirm the registry login server is available for the future app image.

## Next Step After This Stage

Build and push the first real AbarVa image to ACR, then add a second Container App for the app runtime. The existing placeholder app should stay as a simple infrastructure smoke test until the real app has its own health endpoint, secrets, and database connectivity validated.
