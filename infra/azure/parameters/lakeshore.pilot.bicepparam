using '../client-tenant-foundation.bicep'

param environmentName = 'pilot'
param clientKey = 'lakeshore'
param location = 'eastus'
param databaseLocation = 'eastus2'
param uniqueSuffix = 'lsh001'
param actionGroupEmailAddress = 'alerts@abarva.ai'

param webImageName = 'acrabarvalab001.azurecr.io/abarva/web:replace-with-git-sha'
param registryServer = 'acrabarvalab001.azurecr.io'

param postgresAdministratorLogin = 'abarvaadmin'
param postgresAdministratorLoginPassword = readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')

param serviceBusDataOwnerPrincipalIds = []
param auditLogRetentionDays = 365
param enableDefenderStorageMalwareScanning = true
param defenderStorageScanCapGbPerMonth = 1000
param deployAppRuntime = false

param plainRuntimeEnv = [
  {
    name: 'NEXT_PUBLIC_DEMO_MODE'
    value: 'false'
  }
  {
    name: 'ABARVA_CLIENT_KEY'
    value: 'lakeshore'
  }
  {
    name: 'ABARVA_DATA_PLANE_MODE'
    value: 'azure-private'
  }
  {
    name: 'ABARVA_CLIENT_DISPLAY_NAME'
    value: 'Lakeshore Holdings'
  }
]

param keyVaultSecretRefs = []
