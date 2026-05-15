targetScope = 'resourceGroup'

param location string
param vnetName string
param nsgName string
param appSubnetName string = 'snet-app'
param dataSubnetName string
param privateEndpointSubnetName string
param vnetCidr string
param appSubnetCidr string = ''
param dataSubnetCidr string
param privateEndpointSubnetCidr string
param storageAccountName string
param keyVaultResourceId string
param postgresResourceId string = ''
param controlPlanePrincipalIds array = []
param deployContainerAppsSubnet bool = false
param deployStoragePrivateEndpoint bool = true
param tags object

var storageBlobDataContributorRoleDefinitionId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var blobPrivateDnsZoneName = 'privatelink.blob.${environment().suffixes.storage}'
var keyVaultPrivateDnsZoneName = 'privatelink.vaultcore.azure.net'
var postgresPrivateDnsZoneName = 'privatelink.postgres.database.azure.com'
var appSubnet = deployContainerAppsSubnet ? [
  {
    name: appSubnetName
    properties: {
      addressPrefix: appSubnetCidr
      delegations: [
        {
          name: 'container-apps-environment'
          properties: {
            serviceName: 'Microsoft.App/environments'
          }
        }
      ]
      privateEndpointNetworkPolicies: 'Enabled'
      privateLinkServiceNetworkPolicies: 'Enabled'
    }
  }
] : []
var dataPlaneSubnets = [
  {
    name: dataSubnetName
    properties: {
      addressPrefix: dataSubnetCidr
      networkSecurityGroup: {
        id: dataNsg.id
      }
      privateEndpointNetworkPolicies: 'Enabled'
      privateLinkServiceNetworkPolicies: 'Enabled'
    }
  }
  {
    name: privateEndpointSubnetName
    properties: {
      addressPrefix: privateEndpointSubnetCidr
      privateEndpointNetworkPolicies: 'Disabled'
      privateLinkServiceNetworkPolicies: 'Enabled'
    }
  }
]

resource dataNsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: nsgName
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'Deny-Internet-Inbound'
        properties: {
          priority: 4000
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

resource dataVnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetCidr
      ]
    }
    subnets: concat(appSubnet, dataPlaneSubnets)
  }
}

resource appSubnetRef 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = if (deployContainerAppsSubnet) {
  parent: dataVnet
  name: appSubnetName
}

resource privateEndpointSubnetRef 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: dataVnet
  name: privateEndpointSubnetName
}

resource blobPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: blobPrivateDnsZoneName
  location: 'global'
  tags: tags
}

resource keyVaultPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: keyVaultPrivateDnsZoneName
  location: 'global'
  tags: tags
}

resource postgresPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = if (!empty(postgresResourceId)) {
  name: postgresPrivateDnsZoneName
  location: 'global'
  tags: tags
}

resource blobPrivateDnsZoneVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: blobPrivateDnsZone
  name: '${vnetName}-blob-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: dataVnet.id
    }
  }
}

resource keyVaultPrivateDnsZoneVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: keyVaultPrivateDnsZone
  name: '${vnetName}-vault-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: dataVnet.id
    }
  }
}

resource postgresPrivateDnsZoneVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (!empty(postgresResourceId)) {
  parent: postgresPrivateDnsZone
  name: '${vnetName}-postgres-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: dataVnet.id
    }
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: union(tags, {
    dataPlane: 'tenant-isolated'
  })
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Disabled'
    encryption: {
      keySource: 'Microsoft.Storage'
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
    }
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'None'
    }
  }
}

resource storagePrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = if (deployStoragePrivateEndpoint) {
  name: 'pe-${storageAccountName}-blob'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetRef.id
    }
    privateLinkServiceConnections: [
      {
        name: 'storage-blob-pls'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: [
            'blob'
          ]
        }
      }
    ]
  }
}

resource storagePrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = if (deployStoragePrivateEndpoint) {
  parent: storagePrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'blob'
        properties: {
          privateDnsZoneId: blobPrivateDnsZone.id
        }
      }
    ]
  }
}

resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-kv-shared'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetRef.id
    }
    privateLinkServiceConnections: [
      {
        name: 'keyvault-pls'
        properties: {
          privateLinkServiceId: keyVaultResourceId
          groupIds: [
            'vault'
          ]
        }
      }
    ]
  }
}

resource keyVaultPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: keyVaultPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'vault'
        properties: {
          privateDnsZoneId: keyVaultPrivateDnsZone.id
        }
      }
    ]
  }
}

resource postgresPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = if (!empty(postgresResourceId)) {
  name: 'pe-postgres-flex'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetRef.id
    }
    privateLinkServiceConnections: [
      {
        name: 'postgres-pls'
        properties: {
          privateLinkServiceId: postgresResourceId
          groupIds: [
            'postgresqlServer'
          ]
        }
      }
    ]
  }
}

resource postgresPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = if (!empty(postgresResourceId)) {
  parent: postgresPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'postgres'
        properties: {
          privateDnsZoneId: postgresPrivateDnsZone.id
        }
      }
    ]
  }
}

resource storageRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in controlPlanePrincipalIds: {
  name: guid(subscription().subscriptionId, storageAccount.id, principalId, storageBlobDataContributorRoleDefinitionId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleDefinitionId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]

output vnetResourceId string = dataVnet.id
output appSubnetResourceId string = deployContainerAppsSubnet ? appSubnetRef.id : ''
output storageAccountResourceId string = storageAccount.id
output keyVaultPrivateEndpointId string = keyVaultPrivateEndpoint.id
