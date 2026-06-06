using '../database-migration-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'client-data'
  purpose: 'supabase-to-azure-drain-dry-run'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param migrationJobName = 'job-abarva-supabase-drain-dry-run-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1'
param registryServer = 'acrabarvalab001.azurecr.io'

param keyVaultSecretRefs = [
  {
    envName: 'TARGET_DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
  {
    envName: 'SOURCE_DATABASE_URL'
    containerAppSecretName: 'source-postgres-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/source-postgres-database-url'
  }
]

param migrationCommand = 'npx tsx scripts/data-plane/drain-supabase-to-azure.ts'
