# AZFOUND1 - Control Plane Runbook

Resource Group: `rg-abarva-controlplane-lab-eastus`
Subscription: `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)
Region: `eastus`

## Resource Inventory (What Lives in This RG)
- App hosting primitives for the application plane:
  - App Service plan
  - App Service web app with managed identity
- API gateway surface:
  - Azure API Management (Developer SKU in lab)
- Optional global ingress if enabled:
  - Front Door profile/endpoint resources (not enabled by default in this starter)
- Control-plane identities:
  - User-assigned managed identity used by app components
- No Key Vault resource is created here; only Key Vault references are consumed from the shared security RG.

## Identity Model (Managed Identities, RBAC Bindings to Other RGs)
- Primary workload identity is a user-assigned managed identity in this RG.
- This identity receives least-privilege read access to specific Key Vault secret surfaces in `rg-abarva-shared-security-lab-eastus`.
- Access is provisioned through Azure RBAC (not vault access policies) for consistency with subscription-wide governance.
- Avoid direct credential distribution to apps; use managed identity + Key Vault references.

## Network Position (Which VNet/Subnet, Ingress Paths)
- Control plane resources are internet-facing only through approved ingress layers.
- App Service/APIM can be attached to dedicated subnets when private ingress is required.
- Ingress path baseline:
  - Client -> Front Door (if enabled) -> API gateway -> app hosting
- East US is the single lab region; multi-region failover is deferred.

## Tagging Strategy
Required tags on all control-plane resources:
- `environment=lab`
- `costCenter=<team-or-budget-code>`
- `dataClassification=synthetic`
- `owner=<primary-owner-alias>`
- `project=abarva`

## Day-1 Hardening Checklist (Locks, Diagnostic Settings, Defender)
- [ ] Apply `CanNotDelete` lock for stable shared control-plane assets after first validation cycle.
- [ ] Route diagnostic settings for App Service/APIM/Front Door to observability Log Analytics workspace.
- [ ] Turn on Defender recommendations review cadence (weekly for lab).
- [ ] Restrict public ingress paths to explicitly approved endpoints only.
- [ ] Verify managed identity has only required RBAC assignments.

## Bicep Template Path
- `infra/azure/control-plane.bicep`

## Pre-Deployment Checklist
- [ ] Subscription context set to `701a8554-a166-46e9-bf13-743bc50e3b20`.
- [ ] `rg-abarva-controlplane-lab-eastus` exists or will be created by IaC.
- [ ] Shared Key Vault exists: `kv-abarva-lab-001`.
- [ ] Tag values are confirmed for this deployment.
- [ ] API Management naming is globally unique in the subscription context.

## Post-Deployment Validation (Smoke Tests)
- [ ] Managed identity exists and has expected RBAC assignment on Key Vault scope.
- [ ] Web app deploys and reports healthy state.
- [ ] API gateway instance is provisioned and reachable on management plane.
- [ ] Key Vault reference app setting resolves without embedding secret values in template/params.

## Rollback Procedure
1. Disable external ingress routing first (Front Door/APIM routing rules) to stop new traffic.
2. Roll back app configuration or deployment package to last known-good revision.
3. If infra rollback is required, redeploy previous `control-plane.bicep` revision.
4. Remove only resources introduced in failed change set; preserve shared identities if still referenced.
5. Confirm diagnostic stream continuity after rollback.
