targetScope = 'subscription'

@description('Azure environment label. Use preview for rehearsal lanes and prod only after customer approval.')
@allowed([
  'preview'
  'pilot'
  'prod'
])
param environmentName string = 'preview'

@description('Canonical client key. One client tenant deployment must use exactly one client key.')
@minLength(3)
@maxLength(24)
param clientKey string

@description('Primary runtime/private-data-plane region.')
param location string = 'eastus'

@description('Database region. Keep separate when Postgres regional offer restrictions require it.')
param databaseLocation string = 'eastus2'

@description('Short globally unique suffix for resources with global names.')
@minLength(3)
@maxLength(8)
param uniqueSuffix string

@description('Alert notification email for the client tenant lane.')
param actionGroupEmailAddress string

@description('Container image to run in the client preview/pilot app runtime.')
param webImageName string

@description('ACR login server for the web image.')
param registryServer string

@description('Postgres administrator login. Stored in Key Vault by the Postgres foundation deployment.')
param postgresAdministratorLogin string = 'abarvaadmin'

@secure()
@description('Postgres administrator password. Read from POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD in the matching bicepparam file.')
param postgresAdministratorLoginPassword string

@description('Non-secret runtime environment variables projected directly into the app container.')
param plainRuntimeEnv array = []

@description('Key Vault-backed secret references projected into the app container.')
param keyVaultSecretRefs array = []

@description('Optional Service Bus data-owner object IDs for break-glass operations.')
param serviceBusDataOwnerPrincipalIds array = []

@description('Immutable audit-log retention period. Preview/pilot must be at least 12 months; production defaults to 24 months.')
@minValue(365)
@maxValue(2555)
param auditLogRetentionDays int = environmentName == 'prod' ? 730 : 365

@description('Enable Defender for Storage on-upload malware scanning for the private data-plane storage account.')
param enableDefenderStorageMalwareScanning bool = true

@description('Monthly Defender malware scan cap per private data-plane storage account. Use -1 for uncapped.')
@minValue(-1)
param defenderStorageScanCapGbPerMonth int = environmentName == 'prod' ? 10000 : 1000

@description('Set true to deploy the app runtime after foundation, database, ingestion, and search are in place.')
param deployAppRuntime bool = true

var normalizedClientKey = toLower(replace(clientKey, '_', '-'))
var stem = 'abarva-${normalizedClientKey}-${environmentName}'
var tags = {
  app: 'AbarVa'
  clientKey: normalizedClientKey
  clientIsolation: 'single-client'
  environment: environmentName
  dataClassification: environmentName == 'prod' ? 'client-confidential' : 'synthetic-or-client-approved'
  owner: 'platform-team'
  purpose: 'reproducible-client-tenant'
  managedBy: 'bicep'
}

var controlPlaneResourceGroupName = 'rg-${stem}-control-${location}'
var privateDataplaneResourceGroupName = 'rg-${stem}-data-${location}'
var observabilityResourceGroupName = 'rg-${stem}-obs-${location}'
var sharedSecurityResourceGroupName = 'rg-${stem}-security-${location}'
var databaseResourceGroupName = 'rg-${stem}-db-${databaseLocation}'

var keyVaultName = take(replace('kv-${normalizedClientKey}-${environmentName}-${uniqueSuffix}', '-', ''), 24)
var privateDataplaneVnetName = 'vnet-${stem}-data-${location}'
var privateDataplaneNsgName = 'nsg-${stem}-data-${location}'
var privateDataplaneStorageAccountName = take(replace('st${normalizedClientKey}${environmentName}${uniqueSuffix}', '-', ''), 24)
var auditLogContainerName = 'audit-ledger'
var logAnalyticsWorkspaceName = 'log-${stem}-${location}'
var applicationInsightsName = 'appi-${stem}-${location}'
var actionGroupName = 'ag-${stem}-${location}'
var containerAppsEnvironmentName = 'cae-${stem}-${location}'
var scaleRuntimeManagedIdentityName = 'id-${stem}-runtime-${location}'
var placeholderContainerAppName = 'ca-${normalizedClientKey}-${environmentName}-smoke'
var webContainerAppName = 'ca-${normalizedClientKey}-${environmentName}-web'
var databaseVnetName = 'vnet-${stem}-db-${databaseLocation}'
var postgresServerName = take(replace('pg-${normalizedClientKey}-${environmentName}-${uniqueSuffix}', '-', ''), 63)
var serviceBusNamespaceName = take(replace('sb-${normalizedClientKey}-${environmentName}-${uniqueSuffix}', '-', ''), 50)
var searchServiceName = take(replace('srch-${normalizedClientKey}-${environmentName}-${uniqueSuffix}', '-', ''), 60)

module foundation './foundation.bicep' = {
  name: 'client-tenant-foundation-${normalizedClientKey}'
  params: {
    location: location
    tags: tags
    controlPlaneResourceGroupName: controlPlaneResourceGroupName
    privateDataplaneResourceGroupName: privateDataplaneResourceGroupName
    observabilityResourceGroupName: observabilityResourceGroupName
    sharedSecurityResourceGroupName: sharedSecurityResourceGroupName
    keyVaultName: keyVaultName
    keyVaultEnablePurgeProtection: true
    privateDataplaneVnetName: privateDataplaneVnetName
    privateDataplaneNsgName: privateDataplaneNsgName
    privateDataplaneAppSubnetName: 'snet-app'
    privateDataplaneDataSubnetName: 'snet-data'
    privateDataplanePeSubnetName: 'snet-private-endpoints'
    privateDataplaneVnetCidr: '10.72.0.0/16'
    privateDataplaneAppSubnetCidr: '10.72.4.0/23'
    privateDataplaneDataSubnetCidr: '10.72.1.0/24'
    privateDataplanePeSubnetCidr: '10.72.2.0/24'
    privateDataplaneStorageAccountName: privateDataplaneStorageAccountName
    privateDataplaneStorageNetworkBypass: 'AzureServices'
    deployStoragePrivateEndpoint: true
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    applicationInsightsName: applicationInsightsName
    actionGroupName: actionGroupName
    actionGroupShortName: take('ab${uniqueSuffix}', 12)
    actionGroupEmailAddress: actionGroupEmailAddress
    logAnalyticsRetentionInDays: environmentName == 'prod' ? 90 : 30
    logAnalyticsDailyQuotaGb: environmentName == 'prod' ? 5 : 1
    containerAppsEnvironmentName: containerAppsEnvironmentName
    scaleRuntimeManagedIdentityName: scaleRuntimeManagedIdentityName
    placeholderContainerAppName: placeholderContainerAppName
    deployPlaceholderContainerApp: true
    scaleTestMinReplicas: 0
    scaleTestMaxReplicas: environmentName == 'prod' ? 20 : 10
    defenderPricingTier: enableDefenderStorageMalwareScanning || environmentName == 'prod' ? 'Standard' : 'Free'
  }
}

module postgres './postgres-foundation.bicep' = {
  name: 'client-tenant-postgres-${normalizedClientKey}'
  dependsOn: [
    foundation
  ]
  params: {
    location: databaseLocation
    tags: tags
    privateDataplaneResourceGroupName: privateDataplaneResourceGroupName
    databaseResourceGroupName: databaseResourceGroupName
    sharedSecurityResourceGroupName: sharedSecurityResourceGroupName
    observabilityResourceGroupName: observabilityResourceGroupName
    keyVaultName: keyVaultName
    privateDataplaneVnetName: privateDataplaneVnetName
    databaseVnetName: databaseVnetName
    databaseVnetCidr: '10.73.0.0/16'
    postgresSubnetName: 'snet-postgres'
    postgresSubnetCidr: '10.73.1.0/24'
    postgresServerName: postgresServerName
    postgresAdministratorLogin: postgresAdministratorLogin
    postgresAdministratorLoginPassword: postgresAdministratorLoginPassword
    postgresSkuName: environmentName == 'prod' ? 'Standard_D2ds_v5' : 'Standard_B1ms'
    postgresSkuTier: environmentName == 'prod' ? 'GeneralPurpose' : 'Burstable'
    postgresVersion: '16'
    postgresStorageSizeGb: environmentName == 'prod' ? 128 : 32
    postgresBackupRetentionDays: environmentName == 'prod' ? 14 : 7
    postgresGeoRedundantBackup: environmentName == 'prod' ? 'Enabled' : 'Disabled'
    postgresDatabaseNames: [
      'abarva_control'
      'abarva_context'
      'abarva_audit'
    ]
    postgresAllowedExtensions: 'PGCRYPTO,UUID-OSSP,VECTOR'
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    postgresAdminLoginSecretName: 'postgres-${normalizedClientKey}-admin-login'
    postgresAdminPasswordSecretName: 'postgres-${normalizedClientKey}-admin-password'
    postgresServerNameSecretName: 'postgres-${normalizedClientKey}-server-name'
    postgresFqdnSecretName: 'postgres-${normalizedClientKey}-fqdn'
  }
}

module eventIngestion './event-ingestion-foundation.bicep' = {
  name: 'client-tenant-ingestion-${normalizedClientKey}'
  dependsOn: [
    foundation
  ]
  params: {
    location: location
    tags: tags
    controlPlaneResourceGroupName: controlPlaneResourceGroupName
    privateDataplaneResourceGroupName: privateDataplaneResourceGroupName
    privateDataplaneStorageAccountName: privateDataplaneStorageAccountName
    scaleRuntimeManagedIdentityName: scaleRuntimeManagedIdentityName
    serviceBusNamespaceName: serviceBusNamespaceName
    serviceBusSkuName: environmentName == 'prod' ? 'Premium' : 'Standard'
    contextIngestionQueueName: 'q-${normalizedClientKey}-context-ingestion'
    agentWorkQueueName: 'q-${normalizedClientKey}-agent-work'
    contextDropsContainerName: 'context-drops'
    contextProcessedContainerName: 'context-processed'
    storageBlobCreatedEventSubscriptionName: 'egsub-${normalizedClientKey}-context-drop-created'
    serviceBusDataOwnerPrincipalIds: serviceBusDataOwnerPrincipalIds
  }
}

module search './search-foundation.bicep' = {
  name: 'client-tenant-search-${normalizedClientKey}'
  dependsOn: [
    foundation
  ]
  params: {
    location: location
    tags: tags
    controlPlaneResourceGroupName: controlPlaneResourceGroupName
    searchServiceName: searchServiceName
    searchSkuName: environmentName == 'prod' ? 'standard' : 'basic'
    replicaCount: environmentName == 'prod' ? 2 : 1
    partitionCount: 1
    publicNetworkAccess: environmentName == 'prod' ? 'disabled' : 'enabled'
  }
}

module immutableAuditLog './immutable-audit-log.bicep' = {
  name: 'client-tenant-immutable-audit-log-${normalizedClientKey}'
  scope: resourceGroup(privateDataplaneResourceGroupName)
  dependsOn: [
    foundation
  ]
  params: {
    storageAccountName: privateDataplaneStorageAccountName
    auditLogContainerName: auditLogContainerName
    auditLogRetentionDays: auditLogRetentionDays
    auditLogSoftDeleteRetentionDays: 365
    allowProtectedAppendWrites: true
  }
}

module defenderStorageMalware './defender-storage-malware.bicep' = if (enableDefenderStorageMalwareScanning) {
  name: 'client-tenant-defender-storage-malware-${normalizedClientKey}'
  scope: resourceGroup(privateDataplaneResourceGroupName)
  dependsOn: [
    foundation
  ]
  params: {
    storageAccountName: privateDataplaneStorageAccountName
    scanCapGbPerMonth: defenderStorageScanCapGbPerMonth
    automatedResponse: 'BlobSoftDelete'
    blobScanResultsOptions: 'BlobIndexTags'
  }
}

module appRuntime './app-runtime-foundation.bicep' = if (deployAppRuntime) {
  name: 'client-tenant-app-runtime-${normalizedClientKey}'
  dependsOn: [
    foundation
    postgres
    eventIngestion
    search
    immutableAuditLog
    defenderStorageMalware
  ]
  params: {
    location: location
    tags: tags
    controlPlaneResourceGroupName: controlPlaneResourceGroupName
    sharedSecurityResourceGroupName: sharedSecurityResourceGroupName
    keyVaultName: keyVaultName
    containerAppsEnvironmentName: containerAppsEnvironmentName
    scaleRuntimeManagedIdentityName: scaleRuntimeManagedIdentityName
    webContainerAppName: webContainerAppName
    webImageName: webImageName
    registryServer: registryServer
    webMinReplicas: 0
    webMaxReplicas: environmentName == 'prod' ? 4 : 2
    plainRuntimeEnv: plainRuntimeEnv
    keyVaultSecretRefs: keyVaultSecretRefs
  }
}

output clientKey string = normalizedClientKey
output controlPlaneResourceGroupName string = controlPlaneResourceGroupName
output privateDataplaneResourceGroupName string = privateDataplaneResourceGroupName
output databaseResourceGroupName string = databaseResourceGroupName
output keyVaultName string = keyVaultName
output privateDataplaneStorageAccountName string = privateDataplaneStorageAccountName
output postgresServerName string = postgres.outputs.postgresServerName
output searchServiceName string = search.outputs.searchServiceName
output serviceBusNamespaceName string = eventIngestion.outputs.serviceBusNamespaceName
output auditLogContainerName string = immutableAuditLog.outputs.auditLogContainerName
output auditLogRetentionDays int = immutableAuditLog.outputs.auditLogRetentionDays
output defenderStorageMalwareScanEnabled bool = enableDefenderStorageMalwareScanning
