using '../ingestion-worker-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'synthetic-smoke-only'
  purpose: 'azure-only-runtime-retrieval-soak'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param ingestionWorkerJobName = 'job-a24-azure-soak-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:8a3533af71b5fd4a81f919245fc9026b946023c34b6a479a12d113d0e7afaa74'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = '''
npx tsx src/scripts/azure-cutover-runtime-smoke.ts --tenant-key meridian-health
npx tsx src/scripts/azure-search-retriever-smoke.ts --require-results --tenant meridian-health --tenant skyharbor-air "vendor contract renewal exposure"
'''

param plainRuntimeEnv = [
  {
    name: 'AZURE_SEARCH_SERVICE_NAME'
    value: 'srch-abarva-context-lab-eastus'
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
