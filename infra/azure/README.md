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
- `control-plane.bicep` - control plane RG baseline
- `private-dataplane.bicep` - tenant-isolated private dataplane baseline
- `observability.bicep` - monitoring workspace/app insights/alerts baseline
- `shared-security.bicep` - key vault + policy/defender baseline
- `parameters/lab.bicepparam` - lab parameterization

## Deployment

```bash
az account set --subscription 701a8554-a166-46e9-bf13-743bc50e3b20

az deployment sub create \
  --name azfound-bootstrap-lab \
  --location eastus \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/lab.bicepparam
```

## Validation

```bash
bicep build infra/azure/main.bicep
bicep build infra/azure/control-plane.bicep
bicep build infra/azure/private-dataplane.bicep
bicep build infra/azure/observability.bicep
bicep build infra/azure/shared-security.bicep
```

## Safety Constraints
- Synthetic/demo data only.
- No client data.
- No Accenture data.
- No production secrets.
- No real model keys.
