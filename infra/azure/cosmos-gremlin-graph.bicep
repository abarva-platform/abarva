targetScope = 'resourceGroup'

param location string
param tags object

@description('Cosmos DB account name for the Azure-native operational graph provider.')
param cosmosAccountName string

@description('Gremlin database name.')
param gremlinDatabaseName string = 'abarva-context-graph'

@description('Gremlin graph name.')
param gremlinGraphName string = 'tenant-context'

@description('Existing private data plane VNet name.')
param vnetName string

@description('Existing private endpoint subnet name.')
param privateEndpointSubnetName string = 'snet-private-endpoints'

var gremlinPrivateDnsZoneName = 'privatelink.gremlin.cosmos.azure.com'

resource privateDataplaneVnet 'Microsoft.Network/virtualNetworks@2023-11-01' existing = {
  name: vnetName
}

resource privateEndpointSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: privateDataplaneVnet
  name: privateEndpointSubnetName
}

resource gremlinAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  tags: union(tags, {
    purpose: 'azure-native-context-graph'
    graphProvider: 'cosmos-gremlin'
  })
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    publicNetworkAccess: 'Disabled'
    disableLocalAuth: false
    enableAutomaticFailover: false
    enableFreeTier: false
    enableMultipleWriteLocations: false
    isVirtualNetworkFilterEnabled: false
    minimalTlsVersion: 'Tls12'
    capabilities: [
      {
        name: 'EnableGremlin'
      }
      {
        name: 'EnableServerless'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
      }
    }
  }
}

resource gremlinDatabase 'Microsoft.DocumentDB/databaseAccounts/gremlinDatabases@2024-05-15' = {
  parent: gremlinAccount
  name: gremlinDatabaseName
  properties: {
    resource: {
      id: gremlinDatabaseName
    }
  }
}

resource tenantContextGraph 'Microsoft.DocumentDB/databaseAccounts/gremlinDatabases/graphs@2024-05-15' = {
  parent: gremlinDatabase
  name: gremlinGraphName
  properties: {
    resource: {
      id: gremlinGraphName
      partitionKey: {
        kind: 'Hash'
        paths: [
          '/tenantKey'
        ]
      }
    }
  }
}

resource gremlinPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: gremlinPrivateDnsZoneName
  location: 'global'
  tags: tags
}

resource gremlinPrivateDnsZoneVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: gremlinPrivateDnsZone
  name: '${vnetName}-gremlin-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: privateDataplaneVnet.id
    }
  }
}

resource gremlinPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-${cosmosAccountName}-gremlin'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: '${cosmosAccountName}-gremlin-connection'
        properties: {
          privateLinkServiceId: gremlinAccount.id
          groupIds: [
            'Gremlin'
          ]
        }
      }
    ]
  }
}

resource gremlinPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: gremlinPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'gremlin'
        properties: {
          privateDnsZoneId: gremlinPrivateDnsZone.id
        }
      }
    ]
  }
}

output cosmosAccountName string = gremlinAccount.name
output gremlinDatabaseName string = gremlinDatabase.name
output gremlinGraphName string = tenantContextGraph.name
output gremlinEndpoint string = 'wss://${gremlinAccount.name}.gremlin.cosmos.azure.com:443/'
output privateEndpointName string = gremlinPrivateEndpoint.name
