targetScope = 'resourceGroup'

param principalIds array

var acrPullRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: 'acrabarvalab001'
}

resource acrPullRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (principalId, index) in principalIds: {
  name: guid(acr.id, 'AcrPull', string(index), principalId)
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleDefinitionId
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]
