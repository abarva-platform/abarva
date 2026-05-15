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

param ingestionWorkerJobName = 'job-a2b-smoke-verify-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-eventgrid-normalizer-20260515-r1'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = 'npx tsx src/scripts/azure-ingestion-e2e-smoke.ts'

param plainRuntimeEnv = [
  {
    name: 'INGESTION_SMOKE_MODE'
    value: 'verify'
  }
  {
    name: 'INGESTION_SMOKE_RUN_ID'
    value: 'azlab22-replace-before-run'
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
]
