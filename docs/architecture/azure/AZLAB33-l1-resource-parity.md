# AZLAB33 - L1 Resource Parity Gate

Date: 2026-05-15  
Status: wired, live local audit run  
Layer: L1 infrastructure / IaC

## Why This Exists

The lab has grown past a small handful of resources. L1 needs a machine-readable manifest that answers two questions:

1. Are the expected Azure lab resources actually present?
2. Did any unexpected resources appear in the tracked resource groups?

This does not replace Bicep `what-if`. It complements it with a live-state parity check that is easy to run after manual portal work, PR merges, or subscription cleanup.

## Artifacts

| Artifact | Purpose |
|---|---|
| `scripts/azure/verify-resource-parity.mjs` | Azure CLI audit against the lab subscription and tracked resource groups. |
| `npm run azure:resource:parity` | Local/manual command. Fails missing resources; advisory on unexpected resources by default. |
| `.github/workflows/azure-l1-resource-parity.yml` | Manual GitHub Actions gate using Azure OIDC. |

## Resource Groups In Scope

| Resource group | Lane |
|---|---|
| `rg-abarva-controlplane-lab-eastus` | Runtime, ACR, Service Bus, Search, jobs. |
| `rg-abarva-private-dataplane-lab-eastus` | Private storage, private endpoints, Cosmos graph, private VNet. |
| `rg-abarva-database-lab-eastus2` | Azure Postgres and database VNet. |
| `rg-abarva-shared-security-lab-eastus` | Key Vault. |
| `rg-abarva-observability-lab-eastus` | Log Analytics, Application Insights, action group, activity-log alert. |

## Expected Resource Families

| Family | Examples |
|---|---|
| Runtime | Container Apps environment, web app, scale smoke app, migration/copy/ingestion/smoke jobs. |
| Supply chain | ACR. |
| Private data | Storage, private endpoint, private VNet. |
| Database | Postgres Flexible Server, database VNet. |
| Eventing/retrieval | Service Bus, Azure AI Search. |
| Graph | Cosmos DB for Gremlin. |
| Security | Key Vault. |
| Observability | Log Analytics, Application Insights, action group, activity-log alert. |

## How To Run

Local:

```bash
npm run azure:resource:parity
npm run azure:resource:parity -- --strict
```

GitHub Actions:

```bash
gh workflow run azure-l1-resource-parity.yml
gh workflow run azure-l1-resource-parity.yml -f strict=true
```

Required workflow secrets:

| Secret | Purpose |
|---|---|
| `AZURE_LAB_CLIENT_ID` | Federated service principal / managed app used by GitHub Actions. |
| `AZURE_LAB_TENANT_ID` | Entra tenant for the lab subscription. |

## Live Audit Result - 2026-05-15

Local command:

```bash
npm run azure:resource:parity
```

Result:

| Status | Count |
|---|---:|
| Pass | 37 |
| Attention | 0 |
| Fail | 0 |

Expected resources: 37  
Scoped resources observed: 42

The five scoped-but-ignored resources are Azure-created dependencies that should not be hand-managed in the manifest: private endpoint NICs, the Event Grid system topic generated for the storage account, and the Application Insights Smart Detection action group.

Missing expected resources are hard failures. Unexpected resources are advisory by default and strict-failable with `--strict`.

## Next L1 Control

Add a Bicep `what-if` workflow against a clean ephemeral resource group. That is the IaC-plan side of L1; this AZLAB33 gate is the live-state side.
