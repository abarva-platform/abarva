targetScope = 'resourceGroup'

param location string
param tenantId string
param subscriptionId string
param tags object
@secure()
param postgresAdministratorLoginPassword string

var tenantKey = 'airline-demo-new'
var registryServer = 'acrabarvalab001.azurecr.io'
var imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160'
var postgresAdminLogin = 'airdn_admin'
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
var jobs = [
  { name: 'job-airdn-backfill-lab', process: 'airline-demo-new-knowledge-backfill-v1', identityKey: 'ingest', stage: '15_backfill_replay' }
  { name: 'job-airdn-baseline-publish-lab', process: 'airline-demo-new-baseline-publish-v1', identityKey: 'publish', stage: '12_publish_baseline' }
  { name: 'job-airdn-domain-publish-lab', process: 'airline-demo-new-domain-publish-v1', identityKey: 'publish', stage: '11_publish_domain' }
  { name: 'job-airdn-entity-resolve-lab', process: 'airline-demo-new-entity-resolve-v1', identityKey: 'ingest', stage: '06_resolve_identity' }
  { name: 'job-airdn-evidence-extract-lab', process: 'airline-demo-new-evidence-extract-v1', identityKey: 'ingest', stage: '04_extract_evidence' }
  { name: 'job-airdn-home-readmodel-lab', process: 'airline-demo-new-home-readmodel-v1', identityKey: 'publish', stage: '14_refresh_home_readmodel' }
  { name: 'job-airdn-normalize-lab', process: 'airline-demo-new-knowledge-normalize-v1', identityKey: 'ingest', stage: '05_normalize_values' }
  { name: 'job-airdn-projection-build-lab', process: 'airline-demo-new-projection-build-v1', identityKey: 'publish', stage: '13_build_module_projections' }
  { name: 'job-airdn-reconcile-audit-lab', process: 'airline-demo-new-reconciliation-audit-v1', identityKey: 'evaluator', stage: '16_reconciliation_audit' }
  { name: 'job-airdn-review-apply-lab', process: 'airline-demo-new-knowledge-review-v1', identityKey: 'review', stage: '09_route_review_quarantine' }
  { name: 'job-airdn-source-parse-lab', process: 'airline-demo-new-source-parse-v1', identityKey: 'ingest', stage: '03_parse_source' }
  { name: 'job-airdn-source-register-lab', process: 'airline-demo-new-source-register-v1', identityKey: 'ingest', stage: '01_register_source' }
  { name: 'job-airdn-validate-lab', process: 'airline-demo-new-knowledge-validate-v1', identityKey: 'ingest', stage: '07_validate_semantics' }
]

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-abarva-airdn-lab-eus-001'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: 'vnet-abarva-airdn-lab-eus-001'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: [ '10.75.0.0/22' ] }
    subnets: [
      {
        name: 'snet-aca-airdn-lab-eus-001'
        properties: {
          addressPrefix: '10.75.0.0/23'
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
        name: 'snet-pg-airdn-lab-eus-001'
        properties: {
          addressPrefix: '10.75.2.0/27'
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
        name: 'snet-pe-airdn-lab-eus-001'
        properties: {
          addressPrefix: '10.75.2.32/27'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

resource acaSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-aca-airdn-lab-eus-001'
}

resource pgSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pg-airdn-lab-eus-001'
}

resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pe-airdn-lab-eus-001'
}

resource ingestIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-airdn-ingest-lab-001', location: location, tags: tags }
resource reviewIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-airdn-review-lab-001', location: location, tags: tags }
resource publishIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-airdn-publish-lab-001', location: location, tags: tags }
resource readIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-airdn-read-lab-001', location: location, tags: tags }
resource evaluatorIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-airdn-evaluator-lab-001', location: location, tags: tags }
resource adminIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-airdn-admin-lab-001', location: location, tags: tags }

var identityIds = {
  ingest: ingestIdentity.id
  review: reviewIdentity.id
  publish: publishIdentity.id
  read: readIdentity.id
  evaluator: evaluatorIdentity.id
  admin: adminIdentity.id
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stabairdnlabeus001'
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
}

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for containerName in storageContainers: {
  parent: blobService
  name: containerName
  properties: { publicAccess: 'None' }
}]

resource evaluatorStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stabairdnevallab001'
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
    deleteRetentionPolicy: { enabled: true, days: 30 }
    containerDeleteRetentionPolicy: { enabled: true, days: 30 }
  }
}

resource evaluatorContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for containerName in evaluatorStorageContainers: {
  parent: evaluatorBlobService
  name: containerName
  properties: { publicAccess: 'None' }
}]

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-abarva-airdn-lab-001'
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
  name: 'airdn-blob-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource vaultDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: vaultDns
  name: 'airdn-vault-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource pgDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: pgDns
  name: 'airdn-postgres-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: 'pg-abarva-airdn-lab-eus-001'
  location: location
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
  name: 'abarva_airline_demo_new_knowledge_lab'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-abarva-airdn-lab-eus-001'
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

resource acaJobs 'Microsoft.App/jobs@2024-03-01' = [for job in jobs: {
  name: job.name
  location: location
  tags: union(tags, { process: job.process, tenantKey: tenantKey })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityIds[job.identityKey]}': {}
    }
  }
  properties: {
    environmentId: cae.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 3600
      replicaRetryLimit: 1
      manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
      registries: [
        { server: registryServer, identity: identityIds[job.identityKey] }
      ]
    }
    template: {
      containers: [
        {
          name: 'airdn-job'
          image: imageName
          command: [ '/bin/sh' ]
          args: [ '-lc', 'node scripts/knowledge/hcdn-job-runner.mjs --tenant airline-demo-new --process ${job.process}' ]
          env: [
            { name: 'ABARVA_TENANT_KEY', value: tenantKey }
            { name: 'ABARVA_AIRDN_PROCESS', value: job.process }
            { name: 'ABARVA_AIRDN_STAGE', value: job.stage }
            { name: 'ABARVA_AIRDN_DATABASE', value: 'abarva_airline_demo_new_knowledge_lab' }
            { name: 'ABARVA_AIRDN_STORAGE_ACCOUNT', value: 'stabairdnlabeus001' }
            { name: 'ABARVA_AIRDN_EVALUATOR_STORAGE_ACCOUNT', value: 'stabairdnevallab001' }
          ]
          resources: { cpu: json('0.5'), memory: '1Gi' }
        }
      ]
    }
  }
}]

resource storagePe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-stabairdnlabeus001-blob'
  location: location
  tags: tags
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'blob', properties: { privateLinkServiceId: storage.id, groupIds: [ 'blob' ] } }
    ]
  }
}

resource evaluatorStoragePe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-stabairdnevallab001-blob'
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
  name: 'pe-kv-abarva-airdn-lab-001-vault'
  location: location
  tags: tags
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'vault', properties: { privateLinkServiceId: keyVault.id, groupIds: [ 'vault' ] } }
    ]
  }
}
