targetScope = 'resourceGroup'

param location string
param tags object

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

resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchServiceName
  location: location
  tags: tags
  sku: {
    name: searchSkuName
  }
  properties: {
    disableLocalAuth: false
    hostingMode: 'default'
    partitionCount: partitionCount
    publicNetworkAccess: publicNetworkAccess
    replicaCount: replicaCount
  }
}

output searchServiceName string = searchService.name
output searchServiceResourceId string = searchService.id
output searchEndpoint string = 'https://${searchService.name}.search.windows.net'
