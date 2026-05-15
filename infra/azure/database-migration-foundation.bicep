targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Existing shared security resource group name containing the lab Key Vault.')
param sharedSecurityResourceGroupName string

@description('Existing Key Vault name containing migration secrets.')
param keyVaultName string

@description('Existing Container Apps managed environment name.')
param containerAppsEnvironmentName string

@description('Existing user-assigned managed identity name.')
param scaleRuntimeManagedIdentityName string

@description('Container Apps Job name for Azure Postgres schema migration.')
param migrationJobName string

@description('Full AbarVa web image name. The job reuses the app image because it contains migrations and scripts.')
param imageName string

@description('ACR login server.')
param registryServer string

@description('Key Vault-backed secret references projected into the migration job.')
param keyVaultSecretRefs array

@description('Command run by the migration container.')
param migrationCommand string = 'npx tsx src/scripts/bootstrap-azure-postgres-compat.ts && npx tsx src/scripts/run-migrations.ts --ci --allow-destructive'

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
  name: 'azfound-db-migration-key-vault-access'
  scope: sharedSecurityRg
  params: {
    keyVaultName: keyVault.name
    principalId: scaleRuntimeIdentity.properties.principalId
  }
}

module migrationJob './database-migration-job.bicep' = {
  name: 'azfound-abarva-db-migration-job'
  scope: controlPlaneRg
  dependsOn: [
    keyVaultRuntimeAccess
  ]
  params: {
    location: location
    tags: tags
    containerAppsEnvironmentName: containerAppsEnvironmentName
    managedIdentityName: scaleRuntimeManagedIdentityName
    migrationJobName: migrationJobName
    imageName: imageName
    registryServer: registryServer
    keyVaultSecretRefs: keyVaultSecretRefs
    migrationCommand: migrationCommand
  }
}

output migrationJobName string = migrationJob.outputs.migrationJobName
output imageName string = migrationJob.outputs.imageName
