using '../client-tenant-foundation.bicep'

param environmentName = 'preview'
param clientKey = 'example-client'
param location = 'eastus'
param databaseLocation = 'eastus2'
param uniqueSuffix = 'ex001'
param actionGroupEmailAddress = 'alerts@abarva.ai'

param webImageName = 'acrabarvalab001.azurecr.io/abarva/web:replace-with-git-sha'
param registryServer = 'acrabarvalab001.azurecr.io'

param postgresAdministratorLogin = 'abarvaadmin'
param postgresAdministratorLoginPassword = readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')

param serviceBusDataOwnerPrincipalIds = []
param auditLogRetentionDays = 365
param enableDefenderStorageMalwareScanning = true
param defenderStorageScanCapGbPerMonth = 1000

param plainRuntimeEnv = [
  {
    name: 'NEXT_PUBLIC_DEMO_MODE'
    value: 'false'
  }
  {
    name: 'ABARVA_CLIENT_KEY'
    value: 'example-client'
  }
  {
    name: 'ABARVA_DATA_PLANE_MODE'
    value: 'azure-private'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'CLERK_SECRET_KEY'
    containerAppSecretName: 'clerk-secret-key'
    keyVaultSecretUri: 'https://replace-with-client-keyvault.vault.azure.net/secrets/clerk-secret-key'
  }
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'database-url'
    keyVaultSecretUri: 'https://replace-with-client-keyvault.vault.azure.net/secrets/database-url'
  }
  {
    envName: 'ANTHROPIC_API_KEY'
    containerAppSecretName: 'anthropic-api-key'
    keyVaultSecretUri: 'https://replace-with-client-keyvault.vault.azure.net/secrets/anthropic-api-key'
  }
]
