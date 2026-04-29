targetScope = 'resourceGroup'

param location string
param keyVaultName string
param tags object
param enablePurgeProtection bool = false
param keyVaultReaderPrincipalId string = ''

var keyVaultSecretsUserRoleDefinitionId = '4633458b-17de-408a-b874-0445c86b69e6'

resource sharedKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableSoftDelete: true
    enablePurgeProtection: enablePurgeProtection
    enableRbacAuthorization: true
    enabledForTemplateDeployment: false
    enabledForDeployment: false
    enabledForDiskEncryption: false
    publicNetworkAccess: 'Enabled'
    softDeleteRetentionInDays: 90
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource keyVaultSecretsReaderAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(keyVaultReaderPrincipalId)) {
  name: guid(resourceGroup().id, keyVaultName, 'kv-secrets-user-assignment')
  scope: sharedKeyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleDefinitionId)
    principalId: keyVaultReaderPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output keyVaultUri string = sharedKeyVault.properties.vaultUri
output keyVaultResourceId string = sharedKeyVault.id
