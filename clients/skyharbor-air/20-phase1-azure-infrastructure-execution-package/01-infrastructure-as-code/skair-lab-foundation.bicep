targetScope = 'resourceGroup'

param location string
param postgresLocation string
param tenantId string
param tags object
@secure()
param postgresAdministratorLoginPassword string

var tenantKey = 'skyharbor-air'
var postgresAdminLogin = 'skair_admin'
var operationalStorageAccountName = 'stabskairlabeus2001'
var evaluatorStorageAccountName = 'stabskairevaleus2001'
var storageContainers = [
  'raw'
  'source-manifests'
  'parsed'
  'working'
  'quarantine'
  'published'
  'projections'
  'exports'
  'audit'
]
var evaluatorStorageContainers = [
  'hidden-truth'
  'source-to-truth-crosswalk'
  'expected-reconstruction'
  'evaluation-results'
  'audit'
]
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-abarva-skair-lab-eus2-001'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: 'vnet-abarva-skair-lab-eus2-001'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: [ '10.76.0.0/22' ] }
    subnets: [
      {
        name: 'snet-aca-skair-lab-eus2-001'
        properties: {
          addressPrefix: '10.76.0.0/23'
          delegations: [
            {
              name: 'container-apps-environment'
              properties: { serviceName: 'Microsoft.App/environments' }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
        }
      }
      {
        name: 'snet-pg-skair-lab-eus2-001'
        properties: {
          addressPrefix: '10.76.2.0/27'
          delegations: [
            {
              name: 'postgres-flexible-server'
              properties: { serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers' }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
        }
      }
      {
        name: 'snet-pe-skair-lab-eus2-001'
        properties: {
          addressPrefix: '10.76.2.32/27'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

resource acaSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-aca-skair-lab-eus2-001'
}

resource pgSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pg-skair-lab-eus2-001'
}

resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pe-skair-lab-eus2-001'
}

resource ingestIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-skair-ingest-lab-001', location: location, tags: tags }
resource reviewIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-skair-review-lab-001', location: location, tags: tags }
resource publishIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-skair-publish-lab-001', location: location, tags: tags }
resource readIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-skair-read-lab-001', location: location, tags: tags }
resource evaluatorIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-skair-evaluator-lab-001', location: location, tags: tags }
resource adminIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-skair-admin-lab-001', location: location, tags: tags }

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: operationalStorageAccountName
  location: location
  tags: union(tags, { tenantKey: tenantKey })
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    supportsHttpsTrafficOnly: true
    networkAcls: { defaultAction: 'Deny', bypass: 'None' }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: false
      allowPermanentDelete: false
    }
  }
}

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for containerName in storageContainers: {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
  }
}]

resource evaluatorStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: evaluatorStorageAccountName
  location: location
  tags: union(tags, { tenantKey: tenantKey, boundary: 'restricted-evaluator' })
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    supportsHttpsTrafficOnly: true
    networkAcls: { defaultAction: 'Deny', bypass: 'None' }
  }
}

resource evaluatorBlobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: evaluatorStorage
  name: 'default'
  properties: {
    isVersioningEnabled: true
    changeFeed: { enabled: true }
    deleteRetentionPolicy: { enabled: true, days: 30, allowPermanentDelete: false }
    containerDeleteRetentionPolicy: { enabled: true, days: 30 }
  }
}

resource evaluatorContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for containerName in evaluatorStorageContainers: {
  parent: evaluatorBlobService
  name: containerName
  properties: {
    publicAccess: 'None'
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
  }
}]

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-abarva-skair-lab-eus2'
  location: location
  tags: tags
  properties: {
    tenantId: tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    publicNetworkAccess: 'Disabled'
    networkAcls: { defaultAction: 'Deny', bypass: 'None' }
  }
}

resource blobDns 'Microsoft.Network/privateDnsZones@2020-06-01' = { name: 'privatelink.blob.core.windows.net', location: 'global', tags: tags }
resource vaultDns 'Microsoft.Network/privateDnsZones@2020-06-01' = { name: 'privatelink.vaultcore.azure.net', location: 'global', tags: tags }
resource pgDns 'Microsoft.Network/privateDnsZones@2020-06-01' = { name: 'privatelink.postgres.database.azure.com', location: 'global', tags: tags }

resource blobDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: blobDns
  name: 'skair-blob-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource vaultDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: vaultDns
  name: 'skair-vault-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource pgDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: pgDns
  name: 'skair-postgres-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: 'pg-abarva-skair-lab-eus2-001'
  location: postgresLocation
  tags: tags
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdministratorLoginPassword
    storage: { storageSizeGB: 128 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    network: {
      delegatedSubnetResourceId: pgSubnet.id
      privateDnsZoneArmResourceId: pgDns.id
      publicNetworkAccess: 'Disabled'
    }
    highAvailability: { mode: 'Disabled' }
  }
  dependsOn: [ pgDnsLink ]
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: 'abarva_skyharbor_air_knowledge_lab'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-abarva-skair-lab-eus2-001'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalytics.id, '2022-10-01').customerId
        sharedKey: listKeys(logAnalytics.id, '2022-10-01').primarySharedKey
      }
    }
    peerAuthentication: {
      mtls: {
        enabled: false
      }
    }
    peerTrafficConfiguration: {
      encryption: {
        enabled: false
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: acaSubnet.id
      internal: true
    }
    workloadProfiles: [
      { name: 'Consumption', workloadProfileType: 'Consumption' }
    ]
    zoneRedundant: false
  }
}

resource storagePe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-stabskairlabeus2001-blob'
  location: location
  tags: tags
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'blob', properties: { privateLinkServiceId: storage.id, groupIds: [ 'blob' ] } }
    ]
  }
}

output containerAppsEnvironmentId string = cae.id
output operationalStorageAccountName string = operationalStorageAccountName
output evaluatorStorageAccountName string = evaluatorStorageAccountName
output ingestIdentityId string = ingestIdentity.id
output reviewIdentityId string = reviewIdentity.id
output publishIdentityId string = publishIdentity.id
output readIdentityId string = readIdentity.id
output evaluatorIdentityId string = evaluatorIdentity.id
output adminIdentityId string = adminIdentity.id
output ingestClientId string = ingestIdentity.properties.clientId
output reviewClientId string = reviewIdentity.properties.clientId
output publishClientId string = publishIdentity.properties.clientId
output readClientId string = readIdentity.properties.clientId
output evaluatorClientId string = evaluatorIdentity.properties.clientId
output adminClientId string = adminIdentity.properties.clientId
output ingestPrincipalId string = ingestIdentity.properties.principalId
output reviewPrincipalId string = reviewIdentity.properties.principalId
output publishPrincipalId string = publishIdentity.properties.principalId
output readPrincipalId string = readIdentity.properties.principalId
output evaluatorPrincipalId string = evaluatorIdentity.properties.principalId
output adminPrincipalId string = adminIdentity.properties.principalId

resource evaluatorStoragePe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-stabskairevaleus2001-blob'
  location: location
  tags: union(tags, { boundary: 'restricted-evaluator' })
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'blob', properties: { privateLinkServiceId: evaluatorStorage.id, groupIds: [ 'blob' ] } }
    ]
  }
}

resource keyVaultPe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-kv-abarva-skair-lab-eus2-vault'
  location: location
  tags: tags
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'vault', properties: { privateLinkServiceId: keyVault.id, groupIds: [ 'vault' ] } }
    ]
  }
}
