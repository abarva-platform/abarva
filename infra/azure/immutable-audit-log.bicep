@description('Existing private data-plane storage account that stores the client audit ledger.')
param storageAccountName string

@description('Blob container name for append-only audit ledger objects.')
@minLength(3)
@maxLength(63)
param auditLogContainerName string = 'audit-ledger'

@description('Retention period for immutable audit blobs. Use 365-730 days for pilot lanes unless a customer contract requires longer.')
@minValue(365)
@maxValue(2555)
param auditLogRetentionDays int = 730

@description('Azure Blob soft-delete retention is capped at 365 days; WORM immutability carries the longer audit retention.')
@minValue(1)
@maxValue(365)
param auditLogSoftDeleteRetentionDays int = 365

@description('Allow append blobs to receive new blocks while the existing ledger remains WORM-protected.')
param allowProtectedAppendWrites bool = true

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  name: 'default'
  parent: storage
  properties: {
    isVersioningEnabled: true
    changeFeed: {
      enabled: true
      retentionInDays: auditLogRetentionDays
    }
    deleteRetentionPolicy: {
      enabled: true
      days: auditLogSoftDeleteRetentionDays
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: auditLogSoftDeleteRetentionDays
    }
  }
}

resource auditLogContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: auditLogContainerName
  parent: blobService
  properties: {
    publicAccess: 'None'
    immutableStorageWithVersioning: {
      enabled: true
    }
    metadata: {
      artifact_class: 'immutable-audit-log'
      client_isolation: 'single-client'
      retention_days: string(auditLogRetentionDays)
      owner_packet: 't041'
    }
  }
}

resource auditLogImmutabilityPolicy 'Microsoft.Storage/storageAccounts/blobServices/containers/immutabilityPolicies@2023-05-01' = {
  name: 'default'
  parent: auditLogContainer
  properties: {
    allowProtectedAppendWrites: allowProtectedAppendWrites
    immutabilityPeriodSinceCreationInDays: auditLogRetentionDays
  }
}

resource lifecycle 'Microsoft.Storage/storageAccounts/managementPolicies@2023-05-01' = {
  name: 'default'
  parent: storage
  properties: {
    policy: {
      rules: [
        {
          name: 'immutable-audit-ledger-cool-tier'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                '${auditLogContainerName}/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 30
                }
              }
              version: {
                tierToCool: {
                  daysAfterCreationGreaterThan: 30
                }
              }
            }
          }
        }
      ]
    }
  }
}

output auditLogContainerName string = auditLogContainer.name
output auditLogRetentionDays int = auditLogRetentionDays
output auditLogSoftDeleteRetentionDays int = auditLogSoftDeleteRetentionDays
output auditLogImmutabilityPolicyResourceId string = auditLogImmutabilityPolicy.id
