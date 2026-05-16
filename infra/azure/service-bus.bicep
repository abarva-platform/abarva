targetScope = 'resourceGroup'

param location string
param tags object

@description('Service Bus namespace name.')
param namespaceName string

@description('Service Bus SKU for the lab.')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param skuName string = 'Standard'

@description('Queue names to create for the ingestion/orchestration backbone.')
param queueNames array = [
  'q-context-ingestion-events'
  'q-agent-work-items'
  'q-connectivity-smoke'
]

@description('Principal IDs allowed to send messages.')
param dataSenderPrincipalIds array = []

@description('Principal IDs allowed to receive messages.')
param dataReceiverPrincipalIds array = []

@description('Principal IDs allowed to manage Service Bus data plane.')
param dataOwnerPrincipalIds array = []

var senderRoleDefinitionId = '69a216fc-b8fb-44d8-bc22-1f3c2cd27a39'
var receiverRoleDefinitionId = '4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0'
var ownerRoleDefinitionId = '090c5cfd-751d-490a-894a-3ce6f1109419'

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuName
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
  }
}

resource queues 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = [for queueName in queueNames: {
  parent: serviceBusNamespace
  name: queueName
  properties: {
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    enableBatchedOperations: true
    lockDuration: 'PT1M'
    maxDeliveryCount: 10
    requiresDuplicateDetection: false
    requiresSession: false
  }
}]

resource senderAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in dataSenderPrincipalIds: {
  name: guid(serviceBusNamespace.id, principalId, senderRoleDefinitionId)
  scope: serviceBusNamespace
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', senderRoleDefinitionId)
  }
}]

resource receiverAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in dataReceiverPrincipalIds: {
  name: guid(serviceBusNamespace.id, principalId, receiverRoleDefinitionId)
  scope: serviceBusNamespace
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', receiverRoleDefinitionId)
  }
}]

resource ownerAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in dataOwnerPrincipalIds: {
  name: guid(serviceBusNamespace.id, principalId, ownerRoleDefinitionId)
  scope: serviceBusNamespace
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', ownerRoleDefinitionId)
  }
}]

output namespaceResourceId string = serviceBusNamespace.id
output namespaceName string = serviceBusNamespace.name
output queueResourceIds array = [for (queueName, index) in queueNames: queues[index].id]
output queueNames array = queueNames
