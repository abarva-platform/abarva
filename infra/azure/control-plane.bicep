targetScope = 'resourceGroup'

param location string
param keyVaultName string
param managedIdentityName string
param appServicePlanName string
param webAppName string
param apiManagementName string
param apiManagementPublisherEmail string
param apiManagementPublisherName string
param deployApiManagement bool = true
param tags object

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: tags
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    capacity: 1
  }
  kind: 'app'
  properties: {
    reserved: false
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: union(tags, {
    plane: 'control'
  })
  kind: 'app'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'LAB_DATA_POLICY'
          value: 'synthetic-only'
        }
        {
          name: 'DEMO_PLACEHOLDER_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=demo-placeholder-openai-key)'
        }
      ]
    }
  }
}

resource apiManagement 'Microsoft.ApiManagement/service@2022-08-01' = if (deployApiManagement) {
  name: apiManagementName
  location: location
  tags: tags
  sku: {
    name: 'Developer'
    capacity: 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: apiManagementPublisherEmail
    publisherName: apiManagementPublisherName
    publicNetworkAccess: 'Enabled'
    virtualNetworkType: 'None'
  }
}

output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output managedIdentityResourceId string = managedIdentity.id
output webAppHostName string = webApp.properties.defaultHostName
