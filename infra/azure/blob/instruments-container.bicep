@description('Name of the storage account that will hold downloadable discovery instruments.')
param storageAccountName string

@description('Blob container name for instrument templates and rendered artifacts.')
param containerName string = 'instruments'

@description('Number of days to retain older blob versions before lifecycle cleanup.')
@minValue(1)
param previousVersionRetentionDays int = 180

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  name: 'default'
  parent: storage
  properties: {
    isVersioningEnabled: true
    deleteRetentionPolicy: {
      enabled: true
      days: previousVersionRetentionDays
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: previousVersionRetentionDays
    }
  }
}

resource instrumentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: containerName
  parent: blobService
  properties: {
    publicAccess: 'None'
    metadata: {
      artifact_class: 'discovery-instruments'
      owner_packet: 'p4'
    }
  }
}

resource lifecycle 'Microsoft.Storage/storageAccounts/managementPolicies@2023-05-01' = {
  name: 'default'
  parent: storage
  properties: {
    policy: {
      rules: [
        {
          name: 'instrument-version-lifecycle'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                '${containerName}/'
              ]
            }
            actions: {
              version: {
                delete: {
                  daysAfterCreationGreaterThan: previousVersionRetentionDays
                }
              }
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 30
                }
              }
            }
          }
        }
      ]
    }
  }
}

output instrumentsContainerName string = instrumentsContainer.name
