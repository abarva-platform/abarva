targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Azure AI Search service name.')
param searchServiceName string

@description('Azure AI Search SKU for the lab.')
@allowed([
  'free'
  'basic'
  'standard'
])
param searchSkuName string = 'basic'

@description('Replica count for the lab search service.')
param replicaCount int = 1

@description('Partition count for the lab search service.')
param partitionCount int = 1

@description('Public network access for the lab search service. Disable for customer private lanes once private endpoint and private worker path exist.')
@allowed([
  'enabled'
  'disabled'
])
param publicNetworkAccess string = 'enabled'

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: controlPlaneResourceGroupName
}

module searchService './search-service.bicep' = {
  name: 'azfound-search-service'
  scope: controlPlaneRg
  params: {
    location: location
    tags: tags
    searchServiceName: searchServiceName
    searchSkuName: searchSkuName
    replicaCount: replicaCount
    partitionCount: partitionCount
    publicNetworkAccess: publicNetworkAccess
  }
}

output searchServiceName string = searchService.outputs.searchServiceName
output searchServiceResourceId string = searchService.outputs.searchServiceResourceId
output searchEndpoint string = searchService.outputs.searchEndpoint
