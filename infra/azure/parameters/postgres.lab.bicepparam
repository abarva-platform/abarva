using '../postgres-foundation.bicep'

param location = 'eastus2'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-data-foundation'
  costControl: 'founder-review'
}

param privateDataplaneResourceGroupName = 'rg-abarva-private-dataplane-lab-eastus'
param databaseResourceGroupName = 'rg-abarva-database-lab-eastus2'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param observabilityResourceGroupName = 'rg-abarva-observability-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param privateDataplaneVnetName = 'vnet-abarva-private-dataplane-lab-eastus'
param databaseVnetName = 'vnet-abarva-database-lab-eastus2'
param databaseVnetCidr = '10.43.0.0/16'
param postgresSubnetName = 'snet-postgres'
param postgresSubnetCidr = '10.43.1.0/24'
param postgresPrivateDnsZoneName = 'privatelink.postgres.database.azure.com'

param postgresServerName = 'pg-abarva-context-lab-001'
param postgresAdministratorLogin = 'abarvaadmin'
param postgresAdministratorLoginPassword = readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')
param postgresSkuName = 'Standard_B1ms'
param postgresSkuTier = 'Burstable'
param postgresVersion = '16'
param postgresStorageSizeGb = 32
param postgresBackupRetentionDays = 7
param postgresGeoRedundantBackup = 'Disabled'
param postgresDatabaseNames = [
  'abarva_control'
  'abarva_context'
  'abarva_audit'
]

param logAnalyticsWorkspaceName = 'log-abarva-observability-lab-eastus'
param postgresAdminLoginSecretName = 'postgres-context-admin-login'
param postgresAdminPasswordSecretName = 'postgres-context-admin-password'
param postgresServerNameSecretName = 'postgres-context-server-name'
param postgresFqdnSecretName = 'postgres-context-fqdn'
