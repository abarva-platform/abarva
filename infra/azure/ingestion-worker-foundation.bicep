targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Existing shared security resource group name containing the lab Key Vault.')
param sharedSecurityResourceGroupName string

@description('Existing Key Vault name containing worker secrets.')
param keyVaultName string

@description('Existing Container Apps managed environment name.')
param containerAppsEnvironmentName string

@description('Existing user-assigned managed identity name.')
param scaleRuntimeManagedIdentityName string

@description('Container Apps Job name for the context ingestion worker.')
param ingestionWorkerJobName string

@description('Full AbarVa image name. The job reuses the app image because it contains scripts and dependencies.')
param imageName string

@description('ACR login server.')
param registryServer string

@description('Non-secret runtime environment variables projected directly into the worker.')
param plainRuntimeEnv array = []

@description('Key Vault-backed secret references projected into the worker.')
param keyVaultSecretRefs array = []

@description('Command run by the worker container.')
param workerCommand string = 'npx tsx src/scripts/azure-context-ingestion-worker.ts'

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
  name: 'azfound-ingestion-worker-key-vault-access'
  scope: sharedSecurityRg
  params: {
    keyVaultName: keyVault.name
    principalId: scaleRuntimeIdentity.properties.principalId
  }
}

module ingestionWorkerJob './ingestion-worker-job.bicep' = {
  name: 'azfound-context-ingestion-worker-job'
  scope: controlPlaneRg
  dependsOn: [
    keyVaultRuntimeAccess
  ]
  params: {
    location: location
    tags: tags
    containerAppsEnvironmentName: containerAppsEnvironmentName
    managedIdentityName: scaleRuntimeManagedIdentityName
    ingestionWorkerJobName: ingestionWorkerJobName
    imageName: imageName
    registryServer: registryServer
    plainRuntimeEnv: plainRuntimeEnv
    keyVaultSecretRefs: keyVaultSecretRefs
    workerCommand: workerCommand
  }
}

output ingestionWorkerJobName string = ingestionWorkerJob.outputs.ingestionWorkerJobName
output imageName string = ingestionWorkerJob.outputs.imageName
