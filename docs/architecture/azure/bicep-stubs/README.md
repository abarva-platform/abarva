# AbarVa Azure Lab — Bicep Scaffold Stubs

Slice ID: AZLAB6
Status: code_complete (stubs only — no deployment)
Authored: 2026-04-26
Author: Code (sole)
Type: IaC scaffold stubs — commented, not deployable without Azure subscription credentials.

---

## Purpose

These Bicep files are scaffold stubs for the AbarVa Azure lab. They define the resource structure,
naming, SKUs, and tags for all Wave 24 resources.

**These stubs are NOT deployable as-is.** They require:
1. An active Azure subscription (see ADR-001)
2. Subscription ID in Key Vault (not in these files)
3. `az login` with Contributor role on the target subscription
4. Review and adjustment of any placeholder values marked with `// TODO:`

---

## Stub inventory

| File | Purpose |
|---|---|
| `main.bicep` | Top-level deployment entry point |
| `resource-groups.bicep` | Creates all three resource groups with tags |
| `control-plane.bicep` | Postgres, Search, Blob, Key Vault, OpenAI for Control Plane |
| `private-data-plane.bicep` | Container App, Postgres, Blob, Key Vault for Private Data Plane |
| `observability.bicep` | Application Insights, Log Analytics Workspace |
| `budget-alert.bicep` | Cost Management budget at $150/$200 thresholds |
| `policy-tags.bicep` | Azure Policy assignment to enforce required tags |

---

## Deploy order (when ready)

1. `resource-groups.bicep` — must deploy first; creates the RGs
2. `observability.bicep` — Log Analytics needed by other resources
3. `control-plane.bicep` and `private-data-plane.bicep` — can deploy in parallel
4. `budget-alert.bicep` — deploy after resource groups exist
5. `policy-tags.bicep` — deploy at subscription scope

---

## Commands (when credentials available)

```bash
# Login
az login

# Set subscription
az account set --subscription <subscription-id>

# Deploy resource groups
az deployment sub create \
  --location eastus2 \
  --template-file docs/architecture/azure/bicep-stubs/resource-groups.bicep \
  --parameters env=lab

# Deploy control plane
az deployment group create \
  --resource-group rg-abarva-lab-control \
  --template-file docs/architecture/azure/bicep-stubs/control-plane.bicep \
  --parameters env=lab region=eastus2

# Deploy private data plane
az deployment group create \
  --resource-group rg-abarva-lab-private-dp \
  --template-file docs/architecture/azure/bicep-stubs/private-data-plane.bicep \
  --parameters env=lab region=eastus2
```
