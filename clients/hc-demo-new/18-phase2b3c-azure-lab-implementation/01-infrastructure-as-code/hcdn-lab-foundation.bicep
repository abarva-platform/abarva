targetScope = 'resourceGroup'

param location string
param tenantId string
param subscriptionId string
param tags object
@secure()
param postgresAdministratorLoginPassword string

var tenantKey = 'hc-demo-new'
var registryServer = 'acrabarvalab001.azurecr.io'
var imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:74e8051d40d33ec2ea242e4061001aa33da5363ad8826207bb871598079e4cf8'
var postgresAdminLogin = 'hcdn_admin'
var storageContainers = [
  'raw'
  'parsed'
  'working'
  'quarantine'
  'published'
  'projections'
  'exports'
  'audit'
]
var jobs = [
  { name: 'job-hcdn-backfill-lab', process: 'hc-demo-new-knowledge-backfill-v1', identityKey: 'ingest', stage: '15_backfill_replay' }
  { name: 'job-hcdn-baseline-publish-lab', process: 'hc-demo-new-baseline-publish-v1', identityKey: 'publish', stage: '12_publish_baseline' }
  { name: 'job-hcdn-domain-publish-lab', process: 'hc-demo-new-domain-publish-v1', identityKey: 'publish', stage: '11_publish_domain' }
  { name: 'job-hcdn-entity-resolve-lab', process: 'hc-demo-new-entity-resolve-v1', identityKey: 'ingest', stage: '06_resolve_identity' }
  { name: 'job-hcdn-evidence-extract-lab', process: 'hc-demo-new-evidence-extract-v1', identityKey: 'ingest', stage: '04_extract_evidence' }
  { name: 'job-hcdn-home-readmodel-lab', process: 'hc-demo-new-home-readmodel-v1', identityKey: 'publish', stage: '14_refresh_home_readmodel' }
  { name: 'job-hcdn-normalize-lab', process: 'hc-demo-new-knowledge-normalize-v1', identityKey: 'ingest', stage: '05_normalize_values' }
  { name: 'job-hcdn-projection-build-lab', process: 'hc-demo-new-projection-build-v1', identityKey: 'publish', stage: '13_build_module_projections' }
  { name: 'job-hcdn-reconcile-audit-lab', process: 'hc-demo-new-reconciliation-audit-v1', identityKey: 'evaluator', stage: '16_reconciliation_audit' }
  { name: 'job-hcdn-metric-parity-lab', process: 'hc-demo-new-metric-parity-v1', identityKey: 'evaluator', stage: '17_cube_metric_parity' }
  { name: 'job-hcdn-review-apply-lab', process: 'hc-demo-new-knowledge-review-v1', identityKey: 'review', stage: '09_route_review_quarantine' }
  { name: 'job-hcdn-source-parse-lab', process: 'hc-demo-new-source-parse-v1', identityKey: 'ingest', stage: '03_parse_source' }
  { name: 'job-hcdn-source-register-lab', process: 'hc-demo-new-source-register-v1', identityKey: 'ingest', stage: '01_register_source' }
  { name: 'job-hcdn-validate-lab', process: 'hc-demo-new-knowledge-validate-v1', identityKey: 'ingest', stage: '07_validate_semantics' }
]

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-abarva-hcdn-lab-eus-001'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: 'vnet-abarva-hcdn-lab-eus-001'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: [ '10.74.0.0/22' ] }
    subnets: [
      {
        name: 'snet-aca-hcdn-lab-eus-001'
        properties: {
          addressPrefix: '10.74.0.0/23'
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
        name: 'snet-pg-hcdn-lab-eus-001'
        properties: {
          addressPrefix: '10.74.2.0/27'
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
        name: 'snet-pe-hcdn-lab-eus-001'
        properties: {
          addressPrefix: '10.74.2.32/27'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

resource acaSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-aca-hcdn-lab-eus-001'
}

resource pgSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pg-hcdn-lab-eus-001'
}

resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pe-hcdn-lab-eus-001'
}

resource ingestIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-hcdn-ingest-lab-001', location: location, tags: tags }
resource reviewIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-hcdn-review-lab-001', location: location, tags: tags }
resource publishIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-hcdn-publish-lab-001', location: location, tags: tags }
resource readIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-hcdn-read-lab-001', location: location, tags: tags }
resource evaluatorIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-hcdn-evaluator-lab-001', location: location, tags: tags }
resource adminIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: 'mi-hcdn-admin-lab-001', location: location, tags: tags }

var identityIds = {
  ingest: ingestIdentity.id
  review: reviewIdentity.id
  publish: publishIdentity.id
  read: readIdentity.id
  evaluator: evaluatorIdentity.id
  admin: adminIdentity.id
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stabhcdemonewlab001'
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

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-abarva-hcdn-lab-001'
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
  name: 'hcdn-blob-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource vaultDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: vaultDns
  name: 'hcdn-vault-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource pgDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: pgDns
  name: 'hcdn-postgres-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: 'pg-abarva-hc-demo-new-lab-eus-001'
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
  name: 'abarva_hc_demo_new_knowledge_lab'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-abarva-hcdn-lab-eus-001'
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
          name: 'hcdn-job'
          image: imageName
          command: [ '/bin/sh' ]
          args: [ '-lc', 'node scripts/knowledge/hcdn-job-runner.mjs --tenant hc-demo-new --process ${job.process}' ]
          env: [
            { name: 'ABARVA_TENANT_KEY', value: tenantKey }
            { name: 'ABARVA_HCDN_PROCESS', value: job.process }
            { name: 'ABARVA_HCDN_STAGE', value: job.stage }
            { name: 'ABARVA_HCDN_DATABASE', value: 'abarva_hc_demo_new_knowledge_lab' }
            { name: 'ABARVA_HCDN_STORAGE_ACCOUNT', value: 'stabhcdemonewlab001' }
          ]
          resources: { cpu: json('0.5'), memory: '1Gi' }
        }
      ]
    }
  }
}]

resource storagePe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-stabhcdemonewlab001-blob'
  location: location
  tags: tags
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'blob', properties: { privateLinkServiceId: storage.id, groupIds: [ 'blob' ] } }
    ]
  }
}

resource keyVaultPe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-kv-abarva-hcdn-lab-001-vault'
  location: location
  tags: tags
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      { name: 'vault', properties: { privateLinkServiceId: keyVault.id, groupIds: [ 'vault' ] } }
    ]
  }
}
