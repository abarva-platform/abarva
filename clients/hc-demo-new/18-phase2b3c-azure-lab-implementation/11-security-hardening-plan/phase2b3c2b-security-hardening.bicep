targetScope = 'resourceGroup'

param location string = 'eastus'
param tags object = {}

var tenantKey = 'hc-demo-new'
var blobContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
var blobReaderRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')
var keyVaultSecretsUserRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var jobs = [
  { name: 'job-hcdn-source-register-lab', process: 'hc-demo-new-source-register-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '01_register_source' }
  { name: 'job-hcdn-source-parse-lab', process: 'hc-demo-new-source-parse-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '03_parse_source' }
  { name: 'job-hcdn-evidence-extract-lab', process: 'hc-demo-new-evidence-extract-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '04_extract_evidence' }
  { name: 'job-hcdn-normalize-lab', process: 'hc-demo-new-knowledge-normalize-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '05_normalize_values' }
  { name: 'job-hcdn-entity-resolve-lab', process: 'hc-demo-new-entity-resolve-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '06_resolve_identity' }
  { name: 'job-hcdn-validate-lab', process: 'hc-demo-new-knowledge-validate-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '07_validate_semantics' }
  { name: 'job-hcdn-review-apply-lab', process: 'hc-demo-new-knowledge-review-v1', identityName: 'mi-hcdn-review-lab-001', stage: '09_route_review_quarantine' }
  { name: 'job-hcdn-domain-publish-lab', process: 'hc-demo-new-domain-publish-v1', identityName: 'mi-hcdn-publish-lab-001', stage: '11_publish_domain' }
  { name: 'job-hcdn-baseline-publish-lab', process: 'hc-demo-new-baseline-publish-v1', identityName: 'mi-hcdn-publish-lab-001', stage: '12_publish_baseline' }
  { name: 'job-hcdn-projection-build-lab', process: 'hc-demo-new-projection-build-v1', identityName: 'mi-hcdn-publish-lab-001', stage: '13_build_module_projections' }
  { name: 'job-hcdn-home-readmodel-lab', process: 'hc-demo-new-home-readmodel-v1', identityName: 'mi-hcdn-publish-lab-001', stage: '14_refresh_home_readmodel' }
  { name: 'job-hcdn-backfill-lab', process: 'hc-demo-new-knowledge-backfill-v1', identityName: 'mi-hcdn-ingest-lab-001', stage: '15_backfill_replay' }
  { name: 'job-hcdn-reconcile-audit-lab', process: 'hc-demo-new-reconciliation-audit-v1', identityName: 'mi-hcdn-evaluator-lab-001', stage: '16_reconciliation_audit' }
  { name: 'job-hcdn-metric-parity-lab', process: 'hc-demo-new-metric-parity-v1', identityName: 'mi-hcdn-evaluator-lab-001', stage: '17_cube_metric_parity' }
]

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' existing = {
  name: 'vnet-abarva-hcdn-lab-eus-001'
}

resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pe-hcdn-lab-eus-001'
}

resource law 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: 'law-abarva-hcdn-lab-eus-001'
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'kv-abarva-hcdn-lab-001'
}

resource operationalStorage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: 'stabhcdemonewlab001'
}

resource operationalBlobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' existing = {
  parent: operationalStorage
  name: 'default'
}

resource rawContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  parent: operationalBlobService
  name: 'raw'
}

resource publishedContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  parent: operationalBlobService
  name: 'published'
}

resource auditContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  parent: operationalBlobService
  name: 'audit'
}

resource evaluatorStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stabhcdemonewevallab001'
  location: location
  tags: union(tags, { tenantKey: tenantKey, boundary: 'restricted-evaluator' })
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
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

resource evaluatorHiddenTruth 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: evaluatorBlobService
  name: 'hidden-truth'
  properties: { publicAccess: 'None' }
}

resource evaluatorReconstruction 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: evaluatorBlobService
  name: 'reconstruction-proof'
  properties: { publicAccess: 'None' }
}

resource evaluatorAudit 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: evaluatorBlobService
  name: 'audit'
  properties: { publicAccess: 'None' }
}

resource ingestIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: 'mi-hcdn-ingest-lab-001' }
resource reviewIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: 'mi-hcdn-review-lab-001' }
resource publishIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: 'mi-hcdn-publish-lab-001' }
resource readIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: 'mi-hcdn-read-lab-001' }
resource evaluatorIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: 'mi-hcdn-evaluator-lab-001' }

resource rawIngestWrite 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: rawContainer
  name: guid(rawContainer.id, 'mi-hcdn-ingest-lab-001', blobContributorRole, tenantKey)
  properties: {
    principalId: ingestIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobContributorRole
  }
}

resource publishedPublishRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: publishedContainer
  name: guid(publishedContainer.id, 'mi-hcdn-publish-lab-001', blobReaderRole, tenantKey)
  properties: {
    principalId: publishIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource publishedRuntimeRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: publishedContainer
  name: guid(publishedContainer.id, 'mi-hcdn-read-lab-001', blobReaderRole, tenantKey)
  properties: {
    principalId: readIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource publishedEvaluatorRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: publishedContainer
  name: guid(publishedContainer.id, 'mi-hcdn-evaluator-lab-001', blobReaderRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource auditEvaluatorWrite 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: auditContainer
  name: guid(auditContainer.id, 'mi-hcdn-evaluator-lab-001', blobContributorRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobContributorRole
  }
}

resource evaluatorTruthAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: evaluatorHiddenTruth
  name: guid(evaluatorHiddenTruth.id, 'mi-hcdn-evaluator-lab-001', blobReaderRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource evaluatorProofAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: evaluatorReconstruction
  name: guid(evaluatorReconstruction.id, 'mi-hcdn-evaluator-lab-001', blobContributorRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobContributorRole
  }
}

resource keyVaultIngestSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, 'mi-hcdn-ingest-lab-001', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: ingestIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource keyVaultReviewSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, 'mi-hcdn-review-lab-001', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: reviewIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource keyVaultPublishSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, 'mi-hcdn-publish-lab-001', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: publishIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource keyVaultEvaluatorSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, 'mi-hcdn-evaluator-lab-001', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource evaluatorBlobPe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-stabhcdemonewevallab001-blob'
  location: location
  tags: union(tags, { tenantKey: tenantKey, boundary: 'restricted-evaluator' })
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      {
        name: 'blob'
        properties: {
          privateLinkServiceId: evaluatorStorage.id
          groupIds: [ 'blob' ]
        }
      }
    ]
  }
}

resource blobDns 'Microsoft.Network/privateDnsZones@2020-06-01' existing = {
  name: 'privatelink.blob.core.windows.net'
}

resource evaluatorBlobZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: evaluatorBlobPe
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'blob'
        properties: { privateDnsZoneId: blobDns.id }
      }
    ]
  }
}

resource operationalStorageDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: operationalStorage
  name: 'hcdn-storage-diag'
  properties: {
    workspaceId: law.id
    logs: [ { categoryGroup: 'audit', enabled: true } ]
    metrics: [ { category: 'Transaction', enabled: true } ]
  }
}

resource evaluatorStorageDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: evaluatorStorage
  name: 'hcdn-eval-storage-diag'
  properties: {
    workspaceId: law.id
    logs: [ { categoryGroup: 'audit', enabled: true } ]
    metrics: [ { category: 'Transaction', enabled: true } ]
  }
}

resource keyVaultDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: keyVault
  name: 'hcdn-kv-diag'
  properties: {
    workspaceId: law.id
    logs: [ { categoryGroup: 'audit', enabled: true } ]
    metrics: [ { category: 'AllMetrics', enabled: true } ]
  }
}

output protectedStorage string = operationalStorage.name
output evaluatorStorageBoundary string = evaluatorStorage.name
output guardedJobs array = jobs
