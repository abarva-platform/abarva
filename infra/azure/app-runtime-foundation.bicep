targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Existing shared security resource group name containing the lab Key Vault.')
param sharedSecurityResourceGroupName string

@description('Existing Key Vault name containing runtime secrets.')
param keyVaultName string

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

@description('Minimum replicas. Keep 0 for lab cost control; HTTP ingress scales from zero for smoke tests.')
param webMinReplicas int = 0

@description('Maximum replicas for lab runtime.')
param webMaxReplicas int = 2

@description('Non-secret runtime environment variables projected directly into the container. Do not put credentials here.')
param plainRuntimeEnv array = []

@description('Key Vault-backed secret references projected into the container as environment variables. Each object requires envName, containerAppSecretName, and keyVaultSecretUri.')
param keyVaultSecretRefs array = []

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: controlPlaneResourceGroupName
}

resource sharedSecurityRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: sharedSecurityResourceGroupName
}

resource scaleRuntimeIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: scaleRuntimeManagedIdentityName
  scope: controlPlaneRg
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
  scope: sharedSecurityRg
}

module keyVaultRuntimeAccess './key-vault-rbac.bicep' = {
  name: 'azfound-web-runtime-key-vault-access'
  scope: sharedSecurityRg
  params: {
    keyVaultName: keyVault.name
    principalId: scaleRuntimeIdentity.properties.principalId
  }
}

module webRuntime './app-runtime.bicep' = {
  name: 'azfound-abarva-web-runtime'
  scope: controlPlaneRg
  dependsOn: [
    keyVaultRuntimeAccess
  ]
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
    plainRuntimeEnv: plainRuntimeEnv
    keyVaultSecretRefs: keyVaultSecretRefs
  }
}

output webContainerAppName string = webRuntime.outputs.containerAppName
output webContainerAppFqdn string = webRuntime.outputs.containerAppFqdn
output webImageName string = webRuntime.outputs.imageName
output keyVaultName string = keyVault.name
