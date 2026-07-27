# Airline Phase 1 Apply Attempt — 2026-07-27

Status: **blocked / not certified**

## What happened

The zero-data infrastructure apply was attempted using the clean what-if package. Azure created several non-data resources, but PostgreSQL Flexible Server failed in eastus for this subscription. The in-progress deployment was canceled after evidence capture.

## Blocking error

`Subscriptions are restricted from provisioning in location 'eastus'. Try again in a different location. For exceptions to this rule, see how to request a quota increase in https://aka.ms/postgres-request-quota-increase.`

## Current boundary

- PostgreSQL server present: **no**
- PostgreSQL migrations/RLS run: **no**
- Source landing run: **no**
- Parser jobs run: **no**
- Publication jobs run: **no**
- Product consumption proof run: **no**

## Resources observed

- Microsoft.ManagedIdentity/userAssignedIdentities: mi-airdn-review-lab-001
- Microsoft.ManagedIdentity/userAssignedIdentities: mi-airdn-ingest-lab-001
- Microsoft.ManagedIdentity/userAssignedIdentities: mi-airdn-publish-lab-001
- Microsoft.ManagedIdentity/userAssignedIdentities: mi-airdn-evaluator-lab-001
- Microsoft.Storage/storageAccounts: stabairdnlabeus001
- Microsoft.Storage/storageAccounts: stabairdnevallab001
- Microsoft.Network/privateDnsZones: privatelink.postgres.database.azure.com
- Microsoft.OperationalInsights/workspaces: law-abarva-airdn-lab-eus-001
- Microsoft.ManagedIdentity/userAssignedIdentities: mi-airdn-admin-lab-001
- Microsoft.ManagedIdentity/userAssignedIdentities: mi-airdn-read-lab-001
- Microsoft.Network/virtualNetworks: vnet-abarva-airdn-lab-eus-001
- Microsoft.Network/privateDnsZones: privatelink.blob.core.windows.net
- Microsoft.Network/privateDnsZones: privatelink.vaultcore.azure.net
- Microsoft.KeyVault/vaults: kv-abarva-airdn-lab-001
- Microsoft.Network/privateEndpoints: pe-stabairdnevallab001-blob
- Microsoft.App/managedEnvironments: cae-abarva-airdn-lab-eus-001
- Microsoft.Network/privateEndpoints: pe-kv-abarva-airdn-lab-001-vault
- Microsoft.Network/privateEndpoints: pe-stabairdnlabeus001-blob
- Microsoft.Network/privateDnsZones/virtualNetworkLinks: privatelink.vaultcore.azure.net/airdn-vault-link
- Microsoft.Network/privateDnsZones/virtualNetworkLinks: privatelink.blob.core.windows.net/airdn-blob-link
- Microsoft.Network/privateDnsZones/virtualNetworkLinks: privatelink.postgres.database.azure.com/airdn-postgres-link
- Microsoft.Network/networkInterfaces: pe-stabairdnevallab001-blob.nic.acafe6d1-a7c3-44f4-b9bf-4f5497399521
- Microsoft.Network/networkInterfaces: pe-kv-abarva-airdn-lab-001-vault.nic.2e70e65b-c2cb-441c-b855-0574a41637f0
- Microsoft.Network/networkInterfaces: pe-stabairdnlabeus001-blob.nic.cf4c1288-0d4b-4d8f-8031-ee6707fe6ca1

## Required next step

Choose an approved Postgres-capable region or obtain eastus quota, rerun what-if, then retry the empty-infrastructure apply. Do not run migrations, land source files, process parser waves, publish a baseline, or wire product consumption until the empty infrastructure apply and zero-data certification pass.
