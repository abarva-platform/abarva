using '../database-migration-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-database-migration'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param migrationJobName = 'job-abarva-db-migrate-lab-eastus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-db-migrate-20260515-r7'
param registryServer = 'acrabarvalab001.azurecr.io'

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
]

param migrationCommand = 'npx tsx src/scripts/bootstrap-azure-postgres-compat.ts && npx tsx src/scripts/run-migrations.ts --ci --allow-destructive'
