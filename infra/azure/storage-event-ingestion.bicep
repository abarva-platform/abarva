targetScope = 'resourceGroup'

@description('Existing storage account that receives context-layer drops.')
param storageAccountName string

@description('Blob container used for new context-layer file drops.')
param contextDropsContainerName string = 'context-drops'

@description('Blob container used for processed context-layer files and receipts.')
param contextProcessedContainerName string = 'context-processed'

@description('Event Grid subscription name on the storage account.')
param storageBlobCreatedEventSubscriptionName string = 'egsub-context-drop-created'

@description('Destination Service Bus queue resource ID for BlobCreated events.')
param serviceBusQueueResourceId string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

resource contextDropsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/${contextDropsContainerName}'
  properties: {
    publicAccess: 'None'
  }
}

resource contextProcessedContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/${contextProcessedContainerName}'
  properties: {
    publicAccess: 'None'
  }
}

resource storageBlobCreatedEventSubscription 'Microsoft.EventGrid/eventSubscriptions@2022-06-15' = {
  name: storageBlobCreatedEventSubscriptionName
  scope: storageAccount
  properties: {
    destination: {
      endpointType: 'ServiceBusQueue'
      properties: {
        resourceId: serviceBusQueueResourceId
      }
    }
    eventDeliverySchema: 'EventGridSchema'
    filter: {
      includedEventTypes: [
        'Microsoft.Storage.BlobCreated'
      ]
      subjectBeginsWith: '/blobServices/default/containers/${contextDropsContainerName}/'
    }
    labels: [
      'abarva-context-ingestion'
    ]
    retryPolicy: {
      maxDeliveryAttempts: 10
      eventTimeToLiveInMinutes: 1440
    }
  }
  dependsOn: [
    contextDropsContainer
  ]
}

output contextDropsContainerName string = contextDropsContainer.name
output contextProcessedContainerName string = contextProcessedContainer.name
output eventSubscriptionName string = storageBlobCreatedEventSubscription.name
