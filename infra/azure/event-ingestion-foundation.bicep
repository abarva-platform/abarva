targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Existing private dataplane resource group name.')
param privateDataplaneResourceGroupName string

@description('Existing storage account that receives context-layer drops.')
param privateDataplaneStorageAccountName string

@description('Existing Container Apps runtime managed identity name.')
param scaleRuntimeManagedIdentityName string

@description('Service Bus namespace name.')
param serviceBusNamespaceName string

@description('Service Bus SKU for lab.')
param serviceBusSkuName string = 'Standard'

@description('Context ingestion queue name.')
param contextIngestionQueueName string = 'q-context-ingestion-events'

@description('Agent work queue name.')
param agentWorkQueueName string = 'q-agent-work-items'

@description('Blob container used for new context-layer file drops.')
param contextDropsContainerName string = 'context-drops'

@description('Blob container used for processed context-layer files and receipts.')
param contextProcessedContainerName string = 'context-processed'

@description('Event Grid subscription name on the storage account.')
param storageBlobCreatedEventSubscriptionName string = 'egsub-context-drop-created'

@description('Service principal object IDs with Service Bus data-owner rights for lab operations.')
param serviceBusDataOwnerPrincipalIds array = []

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: controlPlaneResourceGroupName
}

resource privateDataplaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: privateDataplaneResourceGroupName
}

resource scaleRuntimeIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  scope: controlPlaneRg
  name: scaleRuntimeManagedIdentityName
}

module serviceBus './service-bus.bicep' = {
  name: 'azfound-service-bus'
  scope: controlPlaneRg
  params: {
    location: location
    tags: tags
    namespaceName: serviceBusNamespaceName
    skuName: serviceBusSkuName
    queueNames: [
      contextIngestionQueueName
      agentWorkQueueName
    ]
    dataSenderPrincipalIds: [
      scaleRuntimeIdentity.properties.principalId
    ]
    dataReceiverPrincipalIds: [
      scaleRuntimeIdentity.properties.principalId
    ]
    dataOwnerPrincipalIds: serviceBusDataOwnerPrincipalIds
  }
}

module storageEventIngestion './storage-event-ingestion.bicep' = {
  name: 'azfound-storage-event-ingestion'
  scope: privateDataplaneRg
  params: {
    storageAccountName: privateDataplaneStorageAccountName
    contextDropsContainerName: contextDropsContainerName
    contextProcessedContainerName: contextProcessedContainerName
    storageBlobCreatedEventSubscriptionName: storageBlobCreatedEventSubscriptionName
    serviceBusQueueResourceId: serviceBus.outputs.queueResourceIds[0]
  }
}

output serviceBusNamespaceName string = serviceBus.outputs.namespaceName
output serviceBusNamespaceResourceId string = serviceBus.outputs.namespaceResourceId
output contextIngestionQueueResourceId string = serviceBus.outputs.queueResourceIds[0]
output agentWorkQueueResourceId string = serviceBus.outputs.queueResourceIds[1]
output contextDropsContainerName string = storageEventIngestion.outputs.contextDropsContainerName
output contextProcessedContainerName string = storageEventIngestion.outputs.contextProcessedContainerName
output eventSubscriptionName string = storageEventIngestion.outputs.eventSubscriptionName
