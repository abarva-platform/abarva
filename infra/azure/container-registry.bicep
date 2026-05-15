targetScope = 'resourceGroup'

param location string
param tags object

@description('Globally unique Azure Container Registry name. Lowercase alphanumeric only.')
param registryName string

@description('ACR SKU for the lab. Basic keeps the supply-chain lane inexpensive until geo-replication/private-link requirements are validated.')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param registrySku string = 'Basic'

@description('Enable ACR admin user. Keep false; image pushes and pulls should use Azure RBAC.')
param adminUserEnabled bool = false

@description('Public network access for the lab registry. Keep enabled until a private build agent path exists; disable for customer private lanes.')
@allowed([
  'Enabled'
  'Disabled'
])
param publicNetworkAccess string = 'Enabled'

@description('Principal IDs that can pull images from the registry.')
param acrPullPrincipalIds array = []

@description('Principal IDs that can push images to the registry.')
param acrPushPrincipalIds array = []

var acrPullRoleDefinitionId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var acrPushRoleDefinitionId = '8311e382-0749-4cb8-b61a-304f252e45ec'

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: registrySku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: publicNetworkAccess
  }
}

resource acrPullAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in acrPullPrincipalIds: {
  name: guid(registry.id, principalId, acrPullRoleDefinitionId)
  scope: registry
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleDefinitionId)
  }
}]

resource acrPushAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in acrPushPrincipalIds: {
  name: guid(registry.id, principalId, acrPushRoleDefinitionId)
  scope: registry
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPushRoleDefinitionId)
  }
}]

output registryResourceId string = registry.id
output registryLoginServer string = registry.properties.loginServer
output registryName string = registry.name
