targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing private dataplane resource group name.')
param privateDataplaneResourceGroupName string

@description('Existing private data plane VNet name.')
param privateDataplaneVnetName string

@description('Existing private endpoint subnet name.')
param privateEndpointSubnetName string = 'snet-private-endpoints'

@description('Cosmos DB account name for the Azure-native operational graph provider.')
param cosmosGremlinAccountName string

@description('Gremlin database name.')
param gremlinDatabaseName string = 'abarva-context-graph'

@description('Gremlin graph name.')
param gremlinGraphName string = 'tenant-context'

resource privateDataplaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: privateDataplaneResourceGroupName
}

module graph './cosmos-gremlin-graph.bicep' = {
  name: 'azfound-cosmos-gremlin-graph'
  scope: privateDataplaneRg
  params: {
    location: location
    tags: tags
    cosmosAccountName: cosmosGremlinAccountName
    gremlinDatabaseName: gremlinDatabaseName
    gremlinGraphName: gremlinGraphName
    vnetName: privateDataplaneVnetName
    privateEndpointSubnetName: privateEndpointSubnetName
  }
}

output cosmosGremlinAccountName string = graph.outputs.cosmosAccountName
output gremlinDatabaseName string = graph.outputs.gremlinDatabaseName
output gremlinGraphName string = graph.outputs.gremlinGraphName
output gremlinEndpoint string = graph.outputs.gremlinEndpoint
output privateEndpointName string = graph.outputs.privateEndpointName
