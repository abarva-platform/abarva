using '../graph-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param privateDataplaneResourceGroupName = 'rg-abarva-private-dataplane-lab-eastus'
param privateDataplaneVnetName = 'vnet-abarva-private-dataplane-lab-eastus'
param privateEndpointSubnetName = 'snet-private-endpoints'

param cosmosGremlinAccountName = 'cos-abarva-graph-lab-001'
param gremlinDatabaseName = 'abarva-context-graph'
param gremlinGraphName = 'tenant-context'
