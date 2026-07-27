targetScope = 'subscription'

param location string = 'eastus'
param postgresLocation string = 'eastus2'
param subscriptionId string
param tenantId string
param resourceGroupName string
param tags object

@secure()
param postgresAdministratorLoginPassword string

module lab './airdn-lab-foundation.bicep' = {
  name: 'airdn-lab-foundation-plan'
  scope: resourceGroup(resourceGroupName)
  dependsOn: [
    rg
  ]
  params: {
    location: location
    postgresLocation: postgresLocation
    tenantId: tenantId
    subscriptionId: subscriptionId
    tags: tags
    postgresAdministratorLoginPassword: postgresAdministratorLoginPassword
  }
}

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}
