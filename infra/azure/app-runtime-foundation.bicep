targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Existing Container Apps managed environment name.')
param containerAppsEnvironmentName string

@description('Existing user-assigned managed identity name.')
param scaleRuntimeManagedIdentityName string

@description('Container App name for the AbarVa web runtime.')
param webContainerAppName string

@description('Full AbarVa web image name.')
param webImageName string

@description('ACR login server.')
param registryServer string

@description('Minimum replicas. Keep 0 until real secrets and health checks are wired.')
param webMinReplicas int = 0

@description('Maximum replicas for lab runtime.')
param webMaxReplicas int = 2

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: controlPlaneResourceGroupName
}

module webRuntime './app-runtime.bicep' = {
  name: 'azfound-abarva-web-runtime'
  scope: controlPlaneRg
  params: {
    location: location
    tags: tags
    containerAppsEnvironmentName: containerAppsEnvironmentName
    managedIdentityName: scaleRuntimeManagedIdentityName
    containerAppName: webContainerAppName
    imageName: webImageName
    registryServer: registryServer
    minReplicas: webMinReplicas
    maxReplicas: webMaxReplicas
  }
}

output webContainerAppName string = webRuntime.outputs.containerAppName
output webContainerAppFqdn string = webRuntime.outputs.containerAppFqdn
output webImageName string = webRuntime.outputs.imageName
