using '../search-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param searchServiceName = 'srch-abarva-context-lab-eastus'
param searchSkuName = 'basic'
param replicaCount = 1
param partitionCount = 1
param publicNetworkAccess = 'enabled'
