# Azure Foundation (AZFOUND1-4) IaC Starter

This directory contains the Day-0 Azure foundation starter aligned to:
- Subscription: `abarva-lab-sub`
- Region: `eastus`
- Resource groups:
  - `rg-abarva-controlplane-lab-eastus`
  - `rg-abarva-private-dataplane-lab-eastus`
  - `rg-abarva-observability-lab-eastus`
  - `rg-abarva-shared-security-lab-eastus`

## Files
- `main.bicep` - subscription-scoped orchestrator
- `foundation.bicep` - subscription-scoped scale-test foundation that avoids VM/App Service quota
- `control-plane.bicep` - control plane RG baseline
- `private-dataplane.bicep` - tenant-isolated private dataplane baseline
- `scale-runtime.bicep` - Container Apps scale-test runtime lane
- `storage-rbac.bicep` - cross-resource-group storage role assignment helper
- `observability.bicep` - monitoring workspace/app insights/alerts baseline
- `shared-security.bicep` - key vault + policy/defender baseline
- `parameters/lab.bicepparam` - lab parameterization
- `parameters/foundation.lab.bicepparam` - current lab foundation parameters

## Recommended Deployment Path

For the current lab, deploy `foundation.bicep` first. It establishes the scalable Azure lane without requiring App Service VM quota:

- four resource groups: control plane, private data plane, observability, shared security
- shared Key Vault with RBAC, soft delete, and purge protection
- private data plane VNet with separate app, data, and private endpoint subnets
- private Blob Storage with public access disabled and network default deny
- Blob and Key Vault private endpoints with private DNS zone groups
- Log Analytics, Application Insights, action group, and deployment-failure alert
- Container Apps managed environment in the VNet
- placeholder Container App for scale-smoke testing, configured for HTTP concurrency autoscale
- managed identity + storage RBAC for the runtime lane

```bash
az account set --subscription 701a8554-a166-46e9-bf13-743bc50e3b20

az deployment sub what-if \
  --name azfound-scale-foundation-whatif \
  --location eastus \
  --template-file infra/azure/foundation.bicep \
  --parameters infra/azure/parameters/foundation.lab.bicepparam

az deployment sub create \
  --name azfound-scale-foundation-lab \
  --location eastus \
  --template-file infra/azure/foundation.bicep \
  --parameters infra/azure/parameters/foundation.lab.bicepparam
```

## Full Control Plane Deployment

```bash
az account set --subscription 701a8554-a166-46e9-bf13-743bc50e3b20

az deployment sub create \
  --name azfound-bootstrap-lab \
  --location eastus \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/lab.bicepparam
```

The full `main.bicep` path includes the older App Service / API Management control plane. In the current lab subscription, App Service Plan deployment is blocked until the regional Total VMs quota is raised above 0. Prefer `foundation.bicep` for immediate scale testing and use a later PR to either:

- migrate the real AbarVa app runtime to Container Apps, or
- request quota and keep the App Service lane for comparison.

## Validation

```bash
az bicep build --file infra/azure/foundation.bicep
az bicep build --file infra/azure/main.bicep
az bicep build --file infra/azure/control-plane.bicep
az bicep build --file infra/azure/private-dataplane.bicep
az bicep build --file infra/azure/scale-runtime.bicep
az bicep build --file infra/azure/storage-rbac.bicep
az bicep build --file infra/azure/observability.bicep
az bicep build --file infra/azure/shared-security.bicep
```

## Safety Constraints
- Synthetic/demo data only.
- No client data.
- No Accenture data.
- No production secrets.
- No real model keys.
- Private data plane storage keeps public network access disabled.
- Private data plane storage network bypass is `None`.
- Key Vault currently keeps public network access enabled for founder-lab manageability, but has RBAC, purge protection, and a private endpoint. Production/private-client lanes should disable public data-plane access once a private operator path exists.
