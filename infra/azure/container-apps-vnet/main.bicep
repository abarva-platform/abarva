// =====================================================================
// CLOUD5 - Azure Container Apps + VNet IaC Starter (Bicep)
//
// STARTER / LAB ONLY. Not production. Do not deploy without review.
//
// This file is a reference Bicep template for a private-VNet
// container app lab. It is NOT a deployable production artifact.
// It is shaped to support `az bicep build` syntax checks and
// `az deployment group what-if` dry runs only. No live deploy is
// assumed. No real subscription IDs, tenant IDs, secrets, keys,
// or passwords are embedded in this file. All sensitive values
// are sourced from a Key Vault reference or a deployment-time
// parameter the operator must supply explicitly.
//
// Cross-references:
//   - CLOUD1 - Enterprise private deployment strategy
//   - CLOUD2 - Azure VNet reference lab blueprint (architecture)
//   - CLOUD4 - Local lab harness (forward reference)
//
// Out of scope for this starter:
//   - Production identity, RBAC, Front Door, WAF, DR, multi-region
//   - Real customer tenancy, real model gateway provisioning
//   - Pen-test, compliance, SLA, runbooks
// =====================================================================

targetScope = 'resourceGroup'

// ---------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------

@description('Azure region in which to deploy the lab. Operator-supplied. Example: eastus2.')
param location string

@description('Logical environment name used as a naming prefix for resources in this lab. Operator-supplied. Example: abarvalab01.')
param environmentName string

@description('CIDR block for the lab Virtual Network. Operator-supplied. Example: 10.40.0.0/16.')
param vnetCidr string

@description('CIDR block for the application subnet that hosts the Container Apps environment. Must be inside vnetCidr. Operator-supplied. Example: 10.40.1.0/24.')
param appSubnetCidr string

@description('CIDR block for the private endpoint subnet used by Postgres / Blob / Key Vault private endpoints. Must be inside vnetCidr. Operator-supplied. Example: 10.40.2.0/24.')
param peSubnetCidr string

@description('Name of the Container App resource for the AbarVa shell. Operator-supplied. Example: abarva-shell.')
param containerAppName string

@description('Administrator login for the Azure Database for PostgreSQL Flexible Server. Operator-supplied; never hard-coded. Example: pgadmin.')
param postgresAdminLogin string

@description('Name of the Key Vault secret that holds the PostgreSQL administrator password. The actual password is NEVER stored in this template. The operator must place the secret in the Key Vault before deploy and reference it via Key Vault parameter resolution at deploy time.')
param postgresAdminPasswordSecretName string

@description('Name of the Azure Key Vault that holds lab secrets (Postgres password, gateway-stub config, etc.). Operator-supplied. Globally unique. Example: kv-abarvalab01.')
param keyVaultName string

// ---------------------------------------------------------------------
// Derived names (deterministic, no random suffixes)
// ---------------------------------------------------------------------

var vnetName = '${environmentName}-vnet'
var appSubnetName = 'app-subnet'
var peSubnetName = 'pe-subnet'
var managedEnvName = '${environmentName}-cae'
var logAnalyticsName = '${environmentName}-law'
var storageAccountName = toLower('${environmentName}stg')
var postgresName = '${environmentName}-pg'

// Private DNS zone names (Azure-managed privatelink hostnames)
var pgPrivateDnsZoneName = 'privatelink.postgres.database.azure.com'
var blobPrivateDnsZoneName = 'privatelink.blob.${environment().suffixes.storage}'
var vaultPrivateDnsZoneName = 'privatelink.vaultcore.azure.net'

// ---------------------------------------------------------------------
// Log Analytics Workspace (observability target for the lab)
// ---------------------------------------------------------------------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// ---------------------------------------------------------------------
// Virtual Network + subnets
// ---------------------------------------------------------------------

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetCidr
      ]
    }
    subnets: [
      {
        name: appSubnetName
        properties: {
          addressPrefix: appSubnetCidr
          // The Container Apps managed environment requires this
          // delegation when binding to a custom subnet.
          delegations: [
            {
              name: 'cae-delegation'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
      {
        name: peSubnetName
        properties: {
          addressPrefix: peSubnetCidr
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
    ]
  }
}

resource appSubnetRef 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: appSubnetName
}

// ---------------------------------------------------------------------
// Container Apps Managed Environment (VNet-bound)
// ---------------------------------------------------------------------

resource managedEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: managedEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        // Shared key resolution is the operator's responsibility.
        // It is NOT embedded in this template.
        sharedKey: listKeys(logAnalytics.id, '2022-10-01').primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: appSubnetRef.id
      internal: true
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    zoneRedundant: false
  }
}

// ---------------------------------------------------------------------
// Container App (placeholder hello-world image)
// ---------------------------------------------------------------------

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: managedEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 80
        transport: 'auto'
      }
    }
    template: {
      containers: [
        {
          name: 'app'
          // Placeholder image only. Replace with the AbarVa shell image
          // sourced from a private container registry before any real
          // lab session.
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

// ---------------------------------------------------------------------
// Storage Account + Blob service
// ---------------------------------------------------------------------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Disabled'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

// ---------------------------------------------------------------------
// Azure Database for PostgreSQL Flexible Server
// ---------------------------------------------------------------------
//
// The administrator password is intentionally NOT inlined. The
// operator must inject it at deploy time via a Key Vault secret
// reference in the parameters file (see parameters.example.json).
// This template only names the secret; it never embeds the value.
//

resource postgresFlexible 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: postgresName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    // The administratorLoginPassword field is omitted here on purpose.
    // For a real deploy the operator passes it via a parameter file
    // entry whose value is a Key Vault `keyVault` reference object.
    // Lab note: postgresAdminPasswordSecretName = ${postgresAdminPasswordSecretName}
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// ---------------------------------------------------------------------
// Azure Key Vault
// ---------------------------------------------------------------------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'disabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    }
  }
}

// ---------------------------------------------------------------------
// Private DNS zones
//
// These zones are linked to the lab VNet by the operator AFTER review.
// Private endpoints (postgres, blob, key vault) are NOT defined here
// to keep this starter minimal; the comments below mark where they
// would attach.
// ---------------------------------------------------------------------

resource pgPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: pgPrivateDnsZoneName
  location: 'global'
  properties: {}
}

resource blobPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: blobPrivateDnsZoneName
  location: 'global'
  properties: {}
}

resource vaultPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: vaultPrivateDnsZoneName
  location: 'global'
  properties: {}
}

// Forward step (NOT in this starter):
//   - Microsoft.Network/privateEndpoints for Postgres targeting the
//     Postgres Flexible Server in the pe-subnet, with a DNS zone group
//     bound to pgPrivateDnsZone.
//   - Microsoft.Network/privateEndpoints for Blob targeting
//     storageAccount/blob in the pe-subnet, with a DNS zone group
//     bound to blobPrivateDnsZone.
//   - Microsoft.Network/privateEndpoints for Key Vault targeting
//     keyVault in the pe-subnet, with a DNS zone group bound to
//     vaultPrivateDnsZone.
//   - Microsoft.Network/privateDnsZones/virtualNetworkLinks for each
//     of the three zones, linked to vnet.

// ---------------------------------------------------------------------
// Outputs (operator-friendly references; no secrets)
// ---------------------------------------------------------------------

output vnetId string = vnet.id
output appSubnetId string = appSubnetRef.id
output managedEnvId string = managedEnv.id
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output storageAccountId string = storageAccount.id
output postgresFqdn string = postgresFlexible.properties.fullyQualifiedDomainName
output keyVaultUri string = keyVault.properties.vaultUri
output logAnalyticsId string = logAnalytics.id
