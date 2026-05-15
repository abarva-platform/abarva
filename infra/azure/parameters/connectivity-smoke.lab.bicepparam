using '../ingestion-worker-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'synthetic-smoke-only'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param ingestionWorkerJobName = 'job-azure-connectivity-smoke-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-connectivity-smoke-20260515-r1'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = 'npx tsx src/scripts/azure-connectivity-smoke.ts'

param plainRuntimeEnv = [
  {
    name: 'AZURE_CONNECTIVITY_RUN_ID'
    value: 'azconn-replace-before-run'
  }
  {
    name: 'INGESTION_SMOKE_STORAGE_ACCOUNT_NAME'
    value: 'stabarvaprivatedplab001'
  }
  {
    name: 'INGESTION_SMOKE_CONTAINER_NAME'
    value: 'context-drops'
  }
  {
    name: 'SERVICE_BUS_NAMESPACE'
    value: 'sb-abarva-lab-eastus'
  }
  {
    name: 'SERVICE_BUS_QUEUE_NAME'
    value: 'q-context-ingestion-events'
  }
  {
    name: 'AZURE_KEY_VAULT_NAME'
    value: 'kv-abarva-lab-001'
  }
  {
    name: 'AZURE_CONNECTIVITY_KEY_VAULT_SECRET_NAME'
    value: 'azure-connectivity-smoke-secret'
  }
  {
    name: 'AZURE_SEARCH_SERVICE_NAME'
    value: 'srch-abarva-context-lab-eastus'
  }
  {
    name: 'AZURE_CONNECTIVITY_SEARCH_INDEX_NAME'
    value: 'tenant-context-v1'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: '3b6e0c9d-2265-499f-af46-965e0ad78b95'
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
