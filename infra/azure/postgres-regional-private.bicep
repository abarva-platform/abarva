targetScope = 'resourceGroup'

param location string
param tags object
param vnetName string
param vnetCidr string
param postgresSubnetName string
param postgresSubnetCidr string
param postgresPrivateDnsZoneName string = 'privatelink.postgres.database.azure.com'
param remotePrivateDataplaneVnetResourceId string = ''
param serverName string
param administratorLogin string
@secure()
param administratorLoginPassword string
param skuName string = 'Standard_B1ms'
param skuTier string = 'Burstable'
param version string = '16'
param storageSizeGb int = 32
param backupRetentionDays int = 7
param geoRedundantBackup string = 'Disabled'
param databaseNames array = []
param logAnalyticsWorkspaceResourceId string
param allowedExtensions string = 'PGCRYPTO,UUID-OSSP'

resource databaseVnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetCidr
      ]
    }
    subnets: [
      {
        name: postgresSubnetName
        properties: {
          addressPrefix: postgresSubnetCidr
          delegations: [
            {
              name: 'postgres-flexible-server'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
    ]
  }
}

resource postgresSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: databaseVnet
  name: postgresSubnetName
}

resource postgresPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: postgresPrivateDnsZoneName
  location: 'global'
  tags: tags
}

resource postgresPrivateDnsZoneDatabaseVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: postgresPrivateDnsZone
  name: '${vnetName}-postgres-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: databaseVnet.id
    }
  }
}

resource postgresPrivateDnsZoneRemoteVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (!empty(remotePrivateDataplaneVnetResourceId)) {
  parent: postgresPrivateDnsZone
  name: 'remote-private-dataplane-postgres-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: remotePrivateDataplaneVnetResourceId
    }
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: serverName
  location: location
  tags: union(tags, {
    dataPlane: 'tenant-context-metadata'
  })
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: storageSizeGb
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup
    }
    network: {
      delegatedSubnetResourceId: postgresSubnet.id
      privateDnsZoneArmResourceId: postgresPrivateDnsZone.id
      publicNetworkAccess: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
  dependsOn: [
    postgresPrivateDnsZoneDatabaseVnetLink
    postgresPrivateDnsZoneRemoteVnetLink
  ]
}

resource postgresDatabases 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = [for databaseName in databaseNames: {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}]

resource postgresAllowedExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: postgresServer
  name: 'azure.extensions'
  properties: {
    value: allowedExtensions
    source: 'user-override'
  }
}

resource postgresDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${serverName}'
  scope: postgresServer
  properties: {
    workspaceId: logAnalyticsWorkspaceResourceId
    logAnalyticsDestinationType: 'AzureDiagnostics'
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
      {
        categoryGroup: 'audit'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output vnetResourceId string = databaseVnet.id
output serverResourceId string = postgresServer.id
output serverName string = postgresServer.name
output fullyQualifiedDomainName string = postgresServer.properties.fullyQualifiedDomainName
output postgresSubnetResourceId string = postgresSubnet.id
output postgresPrivateDnsZoneResourceId string = postgresPrivateDnsZone.id
