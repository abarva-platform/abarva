// AbarVa Azure Lab — Control Plane Resources
// Slice ID: AZLAB6
// Status: STUB ONLY — not deployable without Azure credentials
// Authored: 2026-04-26
//
// Deploys into: rg-abarva-lab-control
// Provisions: Postgres, Key Vault, Blob Storage, Azure AI Search, Azure OpenAI

targetScope = 'resourceGroup'

// --- Parameters ---

@description('Deployment environment.')
@allowed(['lab', 'staging', 'prod'])
param env string = 'lab'

@description('Azure region.')
param location string = 'eastus2'

@description('Project name token.')
param project string = 'abarva'

@description('Log Analytics Workspace resource ID (from observability module).')
param logAnalyticsWorkspaceId string = '' // TODO: wire from observability module output

// Derived naming tokens
var regionShort = 'ea' // East US 2 abbreviation for storage accounts
var plane = 'ctrl'

// --- Key Vault ---
// Stores: Postgres connection string, Azure OpenAI key, Anthropic API key, boundary JWT signing key

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${project}-${env}-${plane}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true   // Use RBAC not access policies
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    // TODO: networkAcls — restrict to VNet in production
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'control'
    costCentre: 'rd-lab'
  }
}

// --- Blob Storage — Control Plane ---
// Stores: tenant manifests, audit event archives (no raw client data)

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${project}${env}${regionShort}${plane}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS' // LRS for lab; ZRS for production
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    // TODO: networkAcls — restrict to VNet in production
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'control'
    costCentre: 'rd-lab'
  }
}

// --- Postgres Flexible Server — Control Plane ---
// Stores: tenant registry, evidence manifests, audit rows, routing policies

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: '${project}-${env}-pg-${plane}-${location}'
  location: location
  sku: {
    name: 'Standard_B2ms'  // Burstable for lab; Standard_D4ds_v5 for production
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled' // Enable for production
    }
    highAvailability: {
      mode: 'Disabled' // Enable ZoneRedundant for production
    }
    // TODO: administratorLogin and administratorLoginPassword — store in Key Vault, not here
    // administratorLogin: 'abarvaadmin'
    // administratorLoginPassword: keyVaultRef — fetch at deploy time via secure param
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'control'
    costCentre: 'rd-lab'
  }
}

// --- Azure AI Search ---
// Provides vector retrieval and semantic ranking for the Intelligence layer

resource aiSearch 'Microsoft.Search/searchServices@2023-11-01' = {
  name: 'srch-${project}-${env}-${location}'
  location: location
  sku: {
    name: 'standard' // S1 for lab; downgrade to 'basic' if budget constrained
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'enabled' // TODO: set to 'disabled' for production + private endpoint
    semanticSearch: 'standard'
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'control'
    costCentre: 'rd-lab'
  }
}

// --- Azure OpenAI ---
// Hosts: gpt-4o for inference, text-embedding-3-small for embeddings

resource azureOpenAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: '${project}-${env}-aoai-${location}'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: '${project}-${env}-aoai'
    publicNetworkAccess: 'Enabled' // TODO: set to 'Disabled' for production + private endpoint
    // TODO: networkAcls — restrict to app subnet in production
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'control'
    costCentre: 'rd-lab'
  }
}

// GPT-4o deployment
// resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
//   parent: azureOpenAI
//   name: 'gpt-4o'
//   sku: {
//     name: 'Standard'
//     capacity: 10  // TPM x 1000; 10 = 10K TPM
//   }
//   properties: {
//     model: {
//       format: 'OpenAI'
//       name: 'gpt-4o'
//       version: '2024-11-20'  // TODO: verify latest stable version
//     }
//   }
// }

// text-embedding-3-small deployment
// resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
//   parent: azureOpenAI
//   name: 'text-embedding-3-small'
//   sku: {
//     name: 'Standard'
//     capacity: 50  // TPM x 1000
//   }
//   properties: {
//     model: {
//       format: 'OpenAI'
//       name: 'text-embedding-3-small'
//       version: '1'
//     }
//   }
// }

// --- Outputs ---

output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output postgresName string = postgres.name
output postgresHostname string = postgres.properties.fullyQualifiedDomainName
output storageAccountName string = storageAccount.name
output aiSearchName string = aiSearch.name
output aiSearchEndpoint string = 'https://${aiSearch.name}.search.windows.net'
output azureOpenAIName string = azureOpenAI.name
output azureOpenAIEndpoint string = azureOpenAI.properties.endpoint
