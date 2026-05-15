using '../ingestion-worker-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param ingestionWorkerJobName = 'job-a24-search-backfill-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-search-backfill-20260515-r2'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = 'npx tsx src/scripts/azure-ai-search-backfill.ts apply'

param plainRuntimeEnv = [
  {
    name: 'AZURE_SEARCH_SERVICE_NAME'
    value: 'srch-abarva-context-lab-eastus'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: '3b6e0c9d-2265-499f-af46-965e0ad78b95'
  }
  {
    name: 'AZURE_SEARCH_BACKFILL_BATCH_SIZE'
    value: '500'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
  {
    envName: 'AZURE_SEARCH_ADMIN_KEY'
    containerAppSecretName: 'azure-ai-search-admin-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-ai-search-admin-key'
  }
]
