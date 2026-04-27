// AbarVa Azure Lab — Private Data Plane Resources
// Slice ID: AZLAB6
// Status: STUB ONLY — not deployable without Azure credentials
// Authored: 2026-04-26
//
// Deploys into: rg-abarva-lab-private-dp
// Provisions: Container App Environment, Container App (Boundary API), Postgres, Blob Storage, Key Vault
//
// In production, these resources would be in the CUSTOMER'S Azure subscription and tenant,
// not in the AbarVa subscription. The lab simulates both planes in one subscription.

targetScope = 'resourceGroup'

// --- Parameters ---

@description('Deployment environment.')
@allowed(['lab', 'staging', 'prod'])
param env string = 'lab'

@description('Azure region.')
param location string = 'eastus2'

@description('Project name token.')
param project string = 'abarva'

@description('Log Analytics Workspace resource ID.')
param logAnalyticsWorkspaceId string = '' // TODO: wire from observability module output

// Derived naming tokens
var regionShort = 'ea'
var plane = 'pdp'

// --- Key Vault — Private Data Plane ---
// Stores: PDP Postgres connection string, boundary JWT verification key
// NOTE: In production, this Key Vault is in the customer's subscription — they control it.

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${project}-${env}-${plane}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'private-dp'
    costCentre: 'rd-lab'
  }
}

// --- Blob Storage — Private Data Plane ---
// Stores: synthetic raw datasets (in lab); real client data (in production)
// Raw bytes NEVER cross the boundary — this storage is accessed only by the PDP Container App.

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${project}${env}${regionShort}${plane}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false  // Raw data must never be publicly accessible
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'private-dp'
    costCentre: 'rd-lab'
  }
}

// --- Postgres Flexible Server — Private Data Plane ---
// Stores: dataset metadata, artifact records, evidence manifest definitions
// Row content NEVER crosses the boundary.

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: '${project}-${env}-pg-${plane}-${location}'
  location: location
  sku: {
    name: 'Standard_B2ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    // TODO: administratorLogin and administratorLoginPassword — store in Key Vault
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'private-dp'
    costCentre: 'rd-lab'
  }
}

// --- Container App Environment ---

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-11-02-preview' = {
  name: 'cae-${project}-${env}-${location}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: !empty(logAnalyticsWorkspaceId)
          ? reference(logAnalyticsWorkspaceId, '2022-10-01').customerId
          : '' // TODO: provide workspace ID
        sharedKey: '' // TODO: fetch from Key Vault at deploy time
      }
    }
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'private-dp'
    costCentre: 'rd-lab'
  }
}

// --- Container App — Boundary API Server ---
// This is the Private Data Plane boundary service.
// Exposes: POST /boundary/evidence-request
// Validates: JWT (RS256, 15-minute TTL) from Control Plane
// Returns: Evidence manifest JSON (no raw data)
// Strips: Any raw-data fields before response leaves the container

resource boundaryApiApp 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: 'ca-${project}-${env}-${plane}-${location}'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true   // TODO: set to false in production; use private endpoint only
        targetPort: 3001
        transport: 'http'
        allowInsecure: false
      }
      secrets: [
        // TODO: Reference Key Vault secrets for Postgres connection string
        // {
        //   name: 'pg-connection-string'
        //   keyVaultUrl: '${keyVault.properties.vaultUri}secrets/pdp-pg-connection-string'
        //   identity: 'system'
        // }
      ]
    }
    template: {
      containers: [
        {
          name: 'boundary-api'
          // TODO: Replace with actual container image from Azure Container Registry
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: env
            }
            {
              name: 'BOUNDARY_JWT_PUBLIC_KEY_SECRET_NAME'
              value: 'boundary-jwt-public-key'
            }
            // TODO: Add PG_CONNECTION_STRING ref from secrets array
          ]
        }
      ]
      scale: {
        minReplicas: 0  // Scales to 0 when idle — cost saving for lab
        maxReplicas: 3
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'private-dp'
    costCentre: 'rd-lab'
  }
}

// --- Outputs ---

output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output postgresName string = postgres.name
output postgresHostname string = postgres.properties.fullyQualifiedDomainName
output storageAccountName string = storageAccount.name
output containerAppName string = boundaryApiApp.name
output boundaryApiUrl string = 'https://${boundaryApiApp.properties.configuration.ingress.fqdn}'
