targetScope = 'subscription'

@description('Primary Postgres region. eastus is currently offer-restricted for this subscription, so the lab database lane uses eastus2.')
param location string = 'eastus2'

@description('Standard tags applied to all resources.')
param tags object

@description('Private dataplane resource group name for the existing scale-test VNet.')
param privateDataplaneResourceGroupName string

@description('Database resource group name.')
param databaseResourceGroupName string

@description('Shared security resource group name.')
param sharedSecurityResourceGroupName string

@description('Observability resource group name.')
param observabilityResourceGroupName string

@description('Shared Key Vault name.')
param keyVaultName string

@description('Existing private dataplane VNet name.')
param privateDataplaneVnetName string

@description('Database VNet name.')
param databaseVnetName string

@description('Database VNet CIDR.')
param databaseVnetCidr string = '10.43.0.0/16'

@description('Dedicated delegated subnet for Azure Database for PostgreSQL Flexible Server.')
param postgresSubnetName string = 'snet-postgres'

@description('CIDR for the delegated Postgres subnet.')
param postgresSubnetCidr string = '10.43.1.0/24'

@description('Private DNS zone for Azure Database for PostgreSQL Flexible Server private access.')
param postgresPrivateDnsZoneName string = 'privatelink.postgres.database.azure.com'

@description('Azure Database for PostgreSQL Flexible Server name.')
param postgresServerName string

@description('Postgres administrator login. Stored in Key Vault by this deployment.')
param postgresAdministratorLogin string

@secure()
@description('Postgres administrator password. Stored in Key Vault by this deployment.')
param postgresAdministratorLoginPassword string

@description('Postgres SKU name.')
param postgresSkuName string = 'Standard_B1ms'

@description('Postgres SKU tier.')
param postgresSkuTier string = 'Burstable'

@description('Postgres major version.')
param postgresVersion string = '16'

@description('Storage size in GB.')
param postgresStorageSizeGb int = 32

@description('Backup retention in days.')
param postgresBackupRetentionDays int = 7

@description('Geo-redundant backup setting.')
param postgresGeoRedundantBackup string = 'Disabled'

@description('Initial databases to create.')
param postgresDatabaseNames array = [
  'abarva_control'
  'abarva_context'
  'abarva_audit'
]

@description('Azure Postgres allow-listed extensions needed by the current Azure/Postgres context schema.')
param postgresAllowedExtensions string = 'PGCRYPTO,UUID-OSSP,VECTOR'

@description('Log Analytics workspace name.')
param logAnalyticsWorkspaceName string

@description('Key Vault secret name for Postgres administrator login.')
param postgresAdminLoginSecretName string = 'postgres-context-admin-login'

@description('Key Vault secret name for Postgres administrator password.')
param postgresAdminPasswordSecretName string = 'postgres-context-admin-password'

@description('Key Vault secret name for Postgres server name.')
param postgresServerNameSecretName string = 'postgres-context-server-name'

@description('Key Vault secret name for Postgres FQDN.')
param postgresFqdnSecretName string = 'postgres-context-fqdn'

resource privateDataplaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: privateDataplaneResourceGroupName
}

resource databaseRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: databaseResourceGroupName
  location: location
  tags: tags
}

resource sharedSecurityRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: sharedSecurityResourceGroupName
}

resource observabilityRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: observabilityResourceGroupName
}

resource privateDataplaneVnet 'Microsoft.Network/virtualNetworks@2023-11-01' existing = {
  scope: privateDataplaneRg
  name: privateDataplaneVnetName
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  scope: observabilityRg
  name: logAnalyticsWorkspaceName
}

module postgresPrivate './postgres-regional-private.bicep' = {
  name: 'azfound-postgres-private'
  scope: databaseRg
  params: {
    location: location
    tags: tags
    vnetName: databaseVnetName
    vnetCidr: databaseVnetCidr
    postgresSubnetName: postgresSubnetName
    postgresSubnetCidr: postgresSubnetCidr
    postgresPrivateDnsZoneName: postgresPrivateDnsZoneName
    remotePrivateDataplaneVnetResourceId: privateDataplaneVnet.id
    serverName: postgresServerName
    administratorLogin: postgresAdministratorLogin
    administratorLoginPassword: postgresAdministratorLoginPassword
    skuName: postgresSkuName
    skuTier: postgresSkuTier
    version: postgresVersion
    storageSizeGb: postgresStorageSizeGb
    backupRetentionDays: postgresBackupRetentionDays
    geoRedundantBackup: postgresGeoRedundantBackup
    databaseNames: postgresDatabaseNames
    allowedExtensions: postgresAllowedExtensions
    logAnalyticsWorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

module privateToDatabasePeering './vnet-peering.bicep' = {
  name: 'azfound-private-to-database-peering'
  scope: privateDataplaneRg
  params: {
    localVnetName: privateDataplaneVnetName
    remoteVnetResourceId: postgresPrivate.outputs.vnetResourceId
    peeringName: 'peer-to-${databaseVnetName}'
  }
}

module databaseToPrivatePeering './vnet-peering.bicep' = {
  name: 'azfound-database-to-private-peering'
  scope: databaseRg
  dependsOn: [
    postgresPrivate
  ]
  params: {
    localVnetName: databaseVnetName
    remoteVnetResourceId: privateDataplaneVnet.id
    peeringName: 'peer-to-${privateDataplaneVnetName}'
  }
}

module keyVaultPostgresSecrets './keyvault-postgres-secrets.bicep' = {
  name: 'azfound-postgres-keyvault-secrets'
  scope: sharedSecurityRg
  params: {
    keyVaultName: keyVaultName
    postgresAdminLoginSecretName: postgresAdminLoginSecretName
    postgresAdminPasswordSecretName: postgresAdminPasswordSecretName
    postgresServerNameSecretName: postgresServerNameSecretName
    postgresFqdnSecretName: postgresFqdnSecretName
    administratorLogin: postgresAdministratorLogin
    administratorLoginPassword: postgresAdministratorLoginPassword
    serverName: postgresPrivate.outputs.serverName
    fullyQualifiedDomainName: postgresPrivate.outputs.fullyQualifiedDomainName
  }
}

output databaseVnetResourceId string = postgresPrivate.outputs.vnetResourceId
output postgresServerResourceId string = postgresPrivate.outputs.serverResourceId
output postgresServerName string = postgresPrivate.outputs.serverName
output postgresFullyQualifiedDomainName string = postgresPrivate.outputs.fullyQualifiedDomainName
output postgresSubnetResourceId string = postgresPrivate.outputs.postgresSubnetResourceId
output postgresPrivateDnsZoneResourceId string = postgresPrivate.outputs.postgresPrivateDnsZoneResourceId
