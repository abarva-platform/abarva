using '../../../../infra/azure/client-tenant-foundation.bicep'

param environmentName = 'pilot'
param clientKey = 'healthcare-demo-new'
param location = 'eastus'
param databaseLocation = 'eastus2'
param uniqueSuffix = 'hcdn001'
param actionGroupEmailAddress = 'admin@abarva.ai'

param webImageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160'
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
    name: 'ABARVA_CLIENT_KEY'
    value: 'healthcare-demo-new'
  }
  {
    name: 'ABARVA_TENANT_KEY'
    value: 'healthcare-demo-new'
  }
  {
    name: 'ABARVA_SOURCE_RELEASE_ID'
    value: 'healthcare-demo-new-source-corpus-v1.0.0'
  }
  {
    name: 'ABARVA_APPROVAL_MANIFEST_SHA'
    value: '06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd'
  }
  {
    name: 'ABARVA_DATA_PLANE_MODE'
    value: 'azure-private'
  }
]

param keyVaultSecretRefs = []
