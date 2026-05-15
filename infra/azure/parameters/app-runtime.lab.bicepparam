using '../app-runtime-foundation.bicep'

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
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param webContainerAppName = 'ca-abarva-web-lab-eastus'
param webImageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-ebe449ae-r3'
param registryServer = 'acrabarvalab001.azurecr.io'
param webMinReplicas = 0
param webMaxReplicas = 2
